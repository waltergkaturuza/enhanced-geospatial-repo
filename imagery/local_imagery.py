"""
Local satellite imagery ingestion — ported from server/watcher.py.

Scans data/ for .tar.gz archives, extracts XML metadata + thumbnails,
and indexes records in SatelliteImage for localhost browsing.
"""

from __future__ import annotations

import glob
import json
import logging
import os
import tarfile
import traceback
import xml.etree.ElementTree as ET
from datetime import datetime, timezone as dt_timezone
from typing import Any

from django.conf import settings
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from .models import SatelliteImage
from .local_providers import (
    LOCAL_INDEX_SOURCES,
    DATASET_PROVIDER_MAP,
    parse_provider_archive,
    resolve_satellites_from_datasets,
)

logger = logging.getLogger(__name__)

POLL_INTERVAL = 30

# All LASAC payload types supported by server/ prototype
LASAC_SATELLITE_IDS = [
    'GF1A', 'GF1B', 'GF1C', 'GF1D', 'GF1E', 'GF2', 'GF3', 'GF6', 'GF7',
    'ZY1C', 'ZY1E', 'ZY1F', 'ZY3-1', 'ZY3-2', 'ZY3-3',
]

LASAC_SATELLITE_CATALOG = {
    'GF1A': {'label': 'GaoFen-1A', 'sensor': 'WFV', 'resolution': '16 m'},
    'GF1B': {'label': 'GaoFen-1B', 'sensor': 'PMS', 'resolution': '2 m / 8 m'},
    'GF1C': {'label': 'GaoFen-1C', 'sensor': 'PMS', 'resolution': '2 m / 8 m'},
    'GF1D': {'label': 'GaoFen-1D', 'sensor': 'PMS', 'resolution': '2 m / 8 m'},
    'GF1E': {'label': 'GaoFen-1E', 'sensor': 'PMS', 'resolution': '2 m / 8 m'},
    'GF2': {'label': 'GaoFen-2', 'sensor': 'PMS', 'resolution': '0.8 m / 3.2 m'},
    'GF3': {'label': 'GaoFen-3', 'sensor': 'SAR', 'resolution': '1–500 m'},
    'GF6': {'label': 'GaoFen-6', 'sensor': 'PMS/WFV', 'resolution': '2 m / 16 m'},
    'GF7': {'label': 'GaoFen-7', 'sensor': 'BWD/TLC', 'resolution': '0.65 m'},
    'ZY1C': {'label': 'ZiYuan-1C', 'sensor': 'PMS', 'resolution': '2.3 m'},
    'ZY1E': {'label': 'ZiYuan-1E', 'sensor': 'AHSI', 'resolution': '30 m'},
    'ZY1F': {'label': 'ZiYuan-1F', 'sensor': 'VNIC', 'resolution': '10 m'},
    'ZY3-1': {'label': 'ZiYuan-3 01', 'sensor': 'NAD/TLC', 'resolution': '2.1 m'},
    'ZY3-2': {'label': 'ZiYuan-3 02', 'sensor': 'MUX', 'resolution': '5.8 m'},
    'ZY3-3': {'label': 'ZiYuan-3 03', 'sensor': 'NAD', 'resolution': '2.1 m'},
}


def get_imagery_root() -> str:
    return settings.GEOSPATIAL_SETTINGS.get(
        'LOCAL_IMAGERY_ROOT',
        os.path.join(settings.BASE_DIR, 'data'),
    )


def get_thumbnail_root() -> str:
    return settings.GEOSPATIAL_SETTINGS.get(
        'LOCAL_THUMBNAIL_ROOT',
        os.path.join(settings.BASE_DIR, 'data', 'thumbnails'),
    )


def get_watcher_status_path() -> str:
    return settings.GEOSPATIAL_SETTINGS.get(
        'LOCAL_IMAGERY_WATCHER_STATUS',
        os.path.join(settings.BASE_DIR, 'data', 'watcher_status.json'),
    )


def get_local_base_url() -> str:
    return settings.GEOSPATIAL_SETTINGS.get(
        'LOCAL_IMAGERY_BASE_URL',
        'http://localhost:8000',
    )


# ---------------------------------------------------------------------------
# XML selection & parsing (from server/watcher.py)
# ---------------------------------------------------------------------------

def _is_valid_metadata_xml(xml_bytes: bytes) -> bool:
    try:
        root = ET.fromstring(xml_bytes)
        return root.tag in ('ProductMetaData', 'GroupProductCheckData', 'sensor_corrected_metadata')
    except ET.ParseError:
        return False


def find_xml_member(tar: tarfile.TarFile):
    def excluded(name: str) -> bool:
        return (
            'Check' in name
            or name.endswith('.tiff.aux.xml')
            or os.path.basename(name) == 'order.xml'
            or '_origin' in name
            or '_zywx' in name
        )

    candidates = [m for m in tar.getmembers() if m.name.endswith('.xml') and not excluded(m.name)]

    mux = next((m for m in candidates if '-MUX' in m.name), None)
    if mux:
        raw = tar.extractfile(mux).read()
        if _is_valid_metadata_xml(raw):
            return mux, raw

    for member in candidates:
        raw = tar.extractfile(member).read()
        if _is_valid_metadata_xml(raw):
            return member, raw

    return None, None


def parse_metadata(xml_bytes: bytes) -> dict[str, Any]:
    root = ET.fromstring(xml_bytes)

    if root.tag == 'GroupProductCheckData':
        nested = root.find('.//ProductMetaData')
        if nested is not None:
            root = nested

    if root.tag == 'sensor_corrected_metadata':
        satellite = root.findtext('productInfo/SatelliteID')
        sensor = root.findtext('productInfo/SensorID')
        receive_time = root.findtext('productInfo/TimeStamp/StartTime')
        cloud_str = root.findtext('productInfo/CloudPercent')
        cloud = float(cloud_str) if cloud_str else 0.0
        geo = root.find('productInfo/ProductGeographicRange')

        def _pt(name: str):
            pt = geo.find(name) if geo is not None else None
            if pt is None:
                return 0.0, 0.0
            lat = float(pt.findtext('Latitude') or 0)
            lon = float(pt.findtext('Longtitude') or pt.findtext('Longitude') or 0)
            return lat, lon

        tl_lat, tl_lon = _pt('LeftTopPoint')
        tr_lat, tr_lon = _pt('RightTopPoint')
        br_lat, br_lon = _pt('RightBottomPoint')
        bl_lat, bl_lon = _pt('LeftBottomPoint')
    else:
        satellite = root.findtext('.//SatelliteID')
        sensor = root.findtext('.//SensorID')
        receive_time = root.findtext('.//ReceiveTime') or root.findtext('.//StartTime')
        cloud_str = root.findtext('.//CloudPercent')
        cloud = float(cloud_str) if cloud_str else 0.0
        tl_lat = float(root.findtext('.//TopLeftLatitude', 0))
        tl_lon = float(root.findtext('.//TopLeftLongitude', 0))
        tr_lat = float(root.findtext('.//TopRightLatitude', 0))
        tr_lon = float(root.findtext('.//TopRightLongitude', 0))
        br_lat = float(root.findtext('.//BottomRightLatitude', 0))
        br_lon = float(root.findtext('.//BottomRightLongitude', 0))
        bl_lat = float(root.findtext('.//BottomLeftLatitude', 0))
        bl_lon = float(root.findtext('.//BottomLeftLongitude', 0))

    if not satellite or not sensor or not receive_time:
        missing = [k for k, v in {
            'satellite': satellite, 'sensor': sensor, 'receive_time': receive_time,
        }.items() if not v]
        raise ValueError(f'Missing required metadata fields: {missing}')

    footprint = {
        'type': 'Polygon',
        'coordinates': [[
            [tl_lon, tl_lat], [tr_lon, tr_lat], [br_lon, br_lat],
            [bl_lon, bl_lat], [tl_lon, tl_lat],
        ]],
    }
    bbox = {
        'min_lon': min(tl_lon, tr_lon, br_lon, bl_lon),
        'max_lon': max(tl_lon, tr_lon, br_lon, bl_lon),
        'min_lat': min(tl_lat, tr_lat, br_lat, bl_lat),
        'max_lat': max(tl_lat, tr_lat, br_lat, bl_lat),
    }

    return {
        'satellite': satellite,
        'sensor': sensor,
        'receive_time': receive_time,
        'cloud_percent': cloud,
        'footprint': footprint,
        'bbox': bbox,
    }


def find_thumbnail_member(tar: tarfile.TarFile):
    members = tar.getmembers()
    mux_thumb = next(
        (m for m in members if m.name.endswith('_thumb.jpg') and '-MUX' in m.name), None
    )
    if mux_thumb:
        return mux_thumb
    any_thumb = next((m for m in members if m.name.endswith('_thumb.jpg')), None)
    if any_thumb:
        return any_thumb
    return next(
        (m for m in members if m.name.endswith('.jpg') and not m.name.endswith('_ico.jpg')), None
    )


def extract_thumbnail(tar: tarfile.TarFile, thumb_member, tar_path: str) -> str:
    thumb_dir = get_thumbnail_root()
    os.makedirs(thumb_dir, exist_ok=True)

    base = os.path.basename(tar_path)
    stem = os.path.splitext(os.path.splitext(base)[0])[0]
    dest = os.path.join(thumb_dir, stem + '_thumb.jpg')
    rel = f'thumbnails/{stem}_thumb.jpg'

    if not os.path.exists(dest):
        data = tar.extractfile(thumb_member).read()
        with open(dest, 'wb') as f:
            f.write(data)
        logger.info('Thumbnail extracted: %s', os.path.basename(dest))

    return rel


def parse_sensed_at(receive_time: str) -> datetime:
    dt = parse_datetime(receive_time)
    if dt is None:
        for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d'):
            try:
                dt = datetime.strptime(receive_time[:19], fmt)
                break
            except ValueError:
                continue
    if dt is None:
        dt = datetime.utcnow()
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, dt_timezone.utc)
    return dt


def get_ingested_paths() -> set[str]:
    paths = set()
    for path in SatelliteImage.objects.filter(
        meta__source__in=LOCAL_INDEX_SOURCES
    ).values_list('file_path', flat=True):
        paths.add(path)
    return paths


def _save_indexed_scene(
    file_path: str,
    metadata: dict[str, Any],
    *,
    source: str = 'local_archive',
    thumbnail_rel: str | None = None,
) -> bool:
    basename = os.path.basename(file_path)
    stem = os.path.splitext(basename)[0]
    if stem.endswith('.tar'):
        stem = os.path.splitext(stem)[0]

    sensed_at = parse_sensed_at(str(metadata['receive_time']))
    file_size_bytes = os.path.getsize(file_path)
    file_size_mb = file_size_bytes / (1024 * 1024)
    base_url = get_local_base_url()
    thumbnail_url = f'{base_url}/{thumbnail_rel}' if thumbnail_rel else ''

    sat = metadata['satellite']
    catalog = LASAC_SATELLITE_CATALOG.get(sat, {})
    dataset_id = metadata.get('dataset_id')

    defaults = {
        'provider': metadata.get('provider', 'CUSTOM'),
        'scene_id': f"{sat}_{metadata.get('sensor', '')}",
        'cloud_cover': metadata['cloud_percent'],
        'bounds': json.dumps(metadata['footprint']),
        'file_path': file_path,
        'file_size_mb': round(file_size_mb, 2),
        'thumbnail_url': thumbnail_url,
        'is_available': True,
        'archive_status': 'online',
        'meta': {
            'source': source,
            'satellite': sat,
            'sensor': metadata.get('sensor', catalog.get('sensor', '')),
            'footprint': metadata['footprint'],
            'bbox': metadata['bbox'],
            'thumbnail_path': thumbnail_rel,
            'file_size_bytes': file_size_bytes,
            'resolution': metadata.get('resolution') or catalog.get('resolution', ''),
            'payload_type': metadata.get('payload_type', metadata.get('sensor', '')),
            'dataset_id': dataset_id,
            'approximate_bounds': metadata.get('approximate_bounds', False),
        },
    }

    obj, created = SatelliteImage.objects.update_or_create(
        file_path=file_path,
        defaults={**defaults, 'tile_id': stem, 'sensed_at': sensed_at},
    )
    action = 'created' if created else 'updated'
    logger.info(
        '  OK (%s) [%s] — %s/%s date=%s cloud=%s%%',
        action, source, sat, metadata.get('sensor', ''),
        sensed_at.date(), metadata['cloud_percent'],
    )
    return True


def ingest_lasac_tar(tar_path: str) -> bool:
    basename = os.path.basename(tar_path)
    logger.info('Ingesting: %s', basename)
    try:
        with tarfile.open(tar_path, 'r:gz') as tar:
            xml_member, xml_bytes = find_xml_member(tar)
            if xml_member is None:
                raise ValueError(f'No valid ProductMetaData XML found in {basename}')

            metadata = parse_metadata(xml_bytes)
            thumb_member = find_thumbnail_member(tar)
            thumbnail_rel = None
            if thumb_member:
                thumbnail_rel = extract_thumbnail(tar, thumb_member, tar_path)
            else:
                logger.warning('No thumbnail found in %s', basename)

        catalog = LASAC_SATELLITE_CATALOG.get(metadata['satellite'], {})
        metadata.setdefault('provider', 'CUSTOM')
        metadata.setdefault('resolution', catalog.get('resolution', ''))
        metadata.setdefault('payload_type', catalog.get('sensor', metadata['sensor']))
        metadata['dataset_id'] = metadata['satellite']

        return _save_indexed_scene(tar_path, metadata, source='local_archive', thumbnail_rel=thumbnail_rel)

    except Exception as e:
        logger.error('  FAILED to ingest LASAC %s: %s', basename, e)
        logger.debug(traceback.format_exc())
        return False


def ingest_provider_file(file_path: str) -> bool:
    """Ingest Sentinel, Landsat, MODIS, UAV, and other local provider archives."""
    basename = os.path.basename(file_path)
    logger.info('Ingesting provider archive: %s', basename)
    try:
        metadata = parse_provider_archive(file_path)
        if not metadata:
            logger.warning('  No parser matched %s', basename)
            return False
        return _save_indexed_scene(file_path, metadata, source='local_provider')
    except Exception as e:
        logger.error('  FAILED to ingest provider %s: %s', basename, e)
        logger.debug(traceback.format_exc())
        return False


# Backward-compatible alias
ingest_file = ingest_lasac_tar


def _is_lasac_tar(path: str) -> bool:
    name = os.path.basename(path).lower()
    if not name.endswith('.tar.gz'):
        return False
    # LASAC Chinese archives use GF/ZY prefixes in XML; skip if clearly Landsat/Sentinel
    upper = name.upper()
    if upper.startswith(('LC', 'LE', 'LT', 'S1', 'S2', 'S3', 'S5', 'MOD', 'MYD')):
        return False
    return True


def scan_and_ingest() -> int:
    image_dir = get_imagery_root()
    if not os.path.isdir(image_dir):
        logger.warning('Imagery root does not exist: %s', image_dir)
        return 0

    candidates: list[str] = []
    candidates.extend(glob.glob(os.path.join(image_dir, '**', '*.tar.gz'), recursive=True))
    candidates.extend(glob.glob(os.path.join(image_dir, '**', '*.zip'), recursive=True))
    candidates.extend(glob.glob(os.path.join(image_dir, '**', '*.tgz'), recursive=True))

    for root, dirs, _ in os.walk(image_dir):
        for d in dirs:
            if d.upper().endswith('.SAFE'):
                candidates.append(os.path.join(root, d))

    known = get_ingested_paths()
    ingested = 0

    for path in sorted(set(candidates)):
        if path in known:
            continue
        if _is_lasac_tar(path):
            ok = ingest_lasac_tar(path)
        else:
            ok = ingest_provider_file(path)
        if ok:
            ingested += 1
            known.add(path)

    return ingested


def write_watcher_status(running: bool, last_scan: str | None = None,
                         processed_count: int = 0, last_error: str | None = None,
                         started_at: str | None = None):
    status_path = get_watcher_status_path()
    os.makedirs(os.path.dirname(status_path), exist_ok=True)
    status = {
        'running': running,
        'pid': os.getpid() if running else None,
        'started_at': started_at,
        'last_scan': last_scan,
        'processed_count': processed_count,
        'last_error': last_error,
    }
    tmp = status_path + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(status, f, indent=2)
    os.replace(tmp, status_path)


def read_watcher_status() -> dict:
    status_path = get_watcher_status_path()
    try:
        with open(status_path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {'running': False, 'last_scan': None, 'processed_count': 0}


# ---------------------------------------------------------------------------
# Search helpers
# ---------------------------------------------------------------------------

def bboxes_intersect(
    a_min_lon, a_min_lat, a_max_lon, a_max_lat,
    b_min_lon, b_min_lat, b_max_lon, b_max_lat,
) -> bool:
    return not (
        a_max_lon < b_min_lon or a_min_lon > b_max_lon
        or a_max_lat < b_min_lat or a_min_lat > b_max_lat
    )


def image_intersects_bbox(image: SatelliteImage, min_lon, min_lat, max_lon, max_lat) -> bool:
    meta = image.meta or {}
    bbox = meta.get('bbox')
    if not bbox:
        try:
            footprint = json.loads(image.bounds) if isinstance(image.bounds, str) else image.bounds
            coords = footprint['coordinates'][0]
            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]
            bbox = {
                'min_lon': min(lons), 'max_lon': max(lons),
                'min_lat': min(lats), 'max_lat': max(lats),
            }
        except (TypeError, KeyError, json.JSONDecodeError, IndexError):
            return True
    return bboxes_intersect(
        bbox['min_lon'], bbox['min_lat'], bbox['max_lon'], bbox['max_lat'],
        min_lon, min_lat, max_lon, max_lat,
    )


def footprint_geometry(image: SatelliteImage) -> dict | None:
    meta = image.meta or {}
    if meta.get('footprint'):
        return meta['footprint']
    try:
        return json.loads(image.bounds) if isinstance(image.bounds, str) else image.bounds
    except (TypeError, json.JSONDecodeError):
        return None


def satellite_image_to_feature(image: SatelliteImage) -> dict:
    meta = image.meta or {}
    base_url = get_local_base_url()
    thumb_path = meta.get('thumbnail_path')
    sat = meta.get('satellite', image.provider)
    catalog = LASAC_SATELLITE_CATALOG.get(sat, {})
    prov = DATASET_PROVIDER_MAP.get(meta.get('dataset_id', ''), {})
    return {
        'type': 'Feature',
        'geometry': footprint_geometry(image),
        'properties': {
            'id': image.id,
            'satellite': sat,
            'sensor': meta.get('sensor', catalog.get('sensor', '')),
            'acquisition_date': image.sensed_at.isoformat(),
            'cloud_cover': image.cloud_cover,
            'tile_id': image.tile_id,
            'file_size_mb': image.file_size_mb,
            'file_size_bytes': meta.get('file_size_bytes') or int((image.file_size_mb or 0) * 1024 * 1024),
            'resolution': meta.get('resolution') or catalog.get('resolution') or prov.get('resolution', ''),
            'payload_type': meta.get('payload_type', meta.get('sensor', prov.get('sensor', ''))),
            'dataset_id': meta.get('dataset_id'),
            'thumbnail_url': image.thumbnail_url or (f'{base_url}/{thumb_path}' if thumb_path else None),
            'download_url': f'{base_url}/api/local-imagery/download/{image.id}/',
        },
    }


def search_local_imagery(
    min_lon=None, min_lat=None, max_lon=None, max_lat=None,
    start_date=None, end_date=None, max_cloud=None,
    satellites=None, dataset_ids=None,
) -> dict:
    qs = SatelliteImage.objects.filter(meta__source__in=LOCAL_INDEX_SOURCES, is_available=True)

    if start_date:
        qs = qs.filter(sensed_at__gte=start_date)
    if end_date:
        qs = qs.filter(sensed_at__lte=end_date)
    if max_cloud is not None:
        qs = qs.filter(cloud_cover__lte=float(max_cloud))

    qs = qs.order_by('-sensed_at')

    if dataset_ids and not satellites:
        satellites = resolve_satellites_from_datasets(dataset_ids)

    features = []
    for image in qs:
        if min_lon is not None and min_lat is not None and max_lon is not None and max_lat is not None:
            if not image_intersects_bbox(image, float(min_lon), float(min_lat), float(max_lon), float(max_lat)):
                continue

        meta = image.meta or {}
        sat = meta.get('satellite', '')
        img_dataset = meta.get('dataset_id')

        if dataset_ids:
            matched = (
                (img_dataset and img_dataset in dataset_ids)
                or (sat and sat in (satellites or []))
                or any(
                    sat in DATASET_PROVIDER_MAP.get(did, {}).get('satellites', [])
                    for did in dataset_ids
                )
            )
            if not matched:
                continue
        elif satellites and sat and sat not in satellites:
            # Prefix match for Landsat/Sentinel families (LC08 matches LC08_*)
            if not any(sat.startswith(s) or s.startswith(sat) for s in satellites):
                continue

        geom = footprint_geometry(image)
        if geom:
            features.append(satellite_image_to_feature(image))

    return {'type': 'FeatureCollection', 'features': features}
