"""
Local provider registry and parsers for non-LASAC satellite datasets.

Extends the LASAC tar.gz pipeline to Sentinel, Landsat, MODIS, SAR, etc.
"""

from __future__ import annotations

import io
import os
import re
import tarfile
import xml.etree.ElementTree as ET
import zipfile
from datetime import datetime
from typing import Any

# Maps frontend dataset IDs → satellite ID prefixes / patterns for search & ingest
DATASET_PROVIDER_MAP: dict[str, dict[str, Any]] = {
    'zimsat2': {
        'satellites': ['ZIMSAT2', 'ZIMSAT-2', 'ZIMSAT'],
        'patterns': ['zimsat', 'zimsat2'],
        'provider': 'CUSTOM',
        'resolution': '4 m',
        'sensor': 'Multispectral',
    },
    'sentinel2_msi': {
        'satellites': ['S2A', 'S2B'],
        'patterns': ['s2a_msi', 's2b_msi', 'msil1c', 'msil2a', '_s2a_', '_s2b_'],
        'provider': 'SENTINEL2',
        'resolution': '10-60 m',
        'sensor': 'MSI',
    },
    'sentinel1_sar': {
        'satellites': ['S1A', 'S1B'],
        'patterns': ['s1a_', 's1b_', 'sentinel-1', 'grdh', 'grdm'],
        'provider': 'SENTINEL1',
        'resolution': '5-40 m',
        'sensor': 'SAR',
    },
    'sentinel3_olci': {
        'satellites': ['S3A', 'S3B'],
        'patterns': ['s3a_', 's3b_', 'olci'],
        'provider': 'CUSTOM',
        'resolution': '300 m',
        'sensor': 'OLCI',
    },
    'sentinel5p': {
        'satellites': ['S5P'],
        'patterns': ['s5p_', 'sentinel-5p'],
        'provider': 'CUSTOM',
        'resolution': '7 km',
        'sensor': 'TROPOMI',
    },
    'landsat9': {
        'satellites': ['LC09'],
        'patterns': ['lc09', 'landsat9'],
        'provider': 'LANDSAT9',
        'resolution': '15-100 m',
        'sensor': 'OLI-2/TIRS-2',
    },
    'landsat8': {
        'satellites': ['LC08'],
        'patterns': ['lc08', 'landsat8'],
        'provider': 'LANDSAT8',
        'resolution': '15-100 m',
        'sensor': 'OLI/TIRS',
    },
    'landsat7': {
        'satellites': ['LE07'],
        'patterns': ['le07', 'landsat7'],
        'provider': 'CUSTOM',
        'resolution': '15-60 m',
        'sensor': 'ETM+',
    },
    'landsat5': {
        'satellites': ['LT05'],
        'patterns': ['lt05', 'landsat5'],
        'provider': 'CUSTOM',
        'resolution': '30-120 m',
        'sensor': 'TM',
    },
    'modis_fire': {
        'satellites': ['MOD', 'MYD', 'TERRA', 'AQUA'],
        'patterns': ['mod09', 'myd09', 'modis', 'mod_', 'myd_'],
        'provider': 'MODIS',
        'resolution': '250-1000 m',
        'sensor': 'MODIS',
    },
    'gaofen1': {
        'satellites': ['GF1', 'GF1A', 'GF1B', 'GF1C', 'GF1D', 'GF1E'],
        'patterns': ['gf1', 'gaofen1', 'gaofen-1'],
        'provider': 'CUSTOM',
        'resolution': '2-16 m',
        'sensor': 'PMS/WFV',
    },
    'gaofen2': {
        'satellites': ['GF2'],
        'patterns': ['gf2', 'gaofen2'],
        'provider': 'CUSTOM',
        'resolution': '0.8-3.2 m',
        'sensor': 'PMS',
    },
    'gf3_sar': {
        'satellites': ['GF3'],
        'patterns': ['gf3', 'gaofen3'],
        'provider': 'CUSTOM',
        'resolution': '1-500 m',
        'sensor': 'SAR',
    },
    'alos2_palsar': {
        'satellites': ['ALOS2', 'PALSAR-2'],
        'patterns': ['alos2', 'palsar'],
        'provider': 'CUSTOM',
        'resolution': '3-100 m',
        'sensor': 'PALSAR-2',
    },
    'worldview3': {
        'satellites': ['WV03', 'WORLDVIEW-3'],
        'patterns': ['wv03', 'worldview3'],
        'provider': 'CUSTOM',
        'resolution': '0.31 m',
        'sensor': 'Multispectral',
    },
    'worldview2': {
        'satellites': ['WV02', 'WORLDVIEW-2'],
        'patterns': ['wv02', 'worldview2'],
        'provider': 'CUSTOM',
        'resolution': '0.46 m',
        'sensor': 'Multispectral',
    },
    'pleiades': {
        'satellites': ['PLEIADES', 'PHR'],
        'patterns': ['pleiades', 'phr1a', 'phr1b'],
        'provider': 'CUSTOM',
        'resolution': '0.5 m',
        'sensor': 'Multispectral',
    },
    'spot6_7': {
        'satellites': ['SPOT6', 'SPOT7'],
        'patterns': ['spot6', 'spot7'],
        'provider': 'CUSTOM',
        'resolution': '1.5 m',
        'sensor': 'Multispectral',
    },
    'planetscope': {
        'satellites': ['PLANET', 'PSS'],
        'patterns': ['planet', 'psscene', 'psb'],
        'provider': 'PLANET',
        'resolution': '3-5 m',
        'sensor': 'PlanetScope',
    },
    'uav_multispectral': {
        'satellites': ['UAV', 'DRONE'],
        'patterns': ['uav', 'drone', 'dji', 'phantom', 'mavic'],
        'provider': 'CUSTOM',
        'resolution': 'cm-level',
        'sensor': 'UAV Multispectral',
    },
    'uav_rgb': {
        'satellites': ['UAV', 'DRONE'],
        'patterns': ['uav', 'drone', 'dji', 'rgb'],
        'provider': 'CUSTOM',
        'resolution': 'cm-level',
        'sensor': 'UAV RGB',
    },
}

LOCAL_INDEX_SOURCES = ('local_archive', 'local_provider')


def detect_dataset_id(filename: str) -> str | None:
    name = filename.lower()
    for dataset_id, info in DATASET_PROVIDER_MAP.items():
        for pattern in info['patterns']:
            if pattern in name:
                return dataset_id
    return None


def resolve_satellites_from_datasets(dataset_ids: list[str]) -> list[str]:
    """Convert frontend dataset checkbox IDs to satellite ID filters."""
    from .local_imagery import LASAC_SATELLITE_IDS

    satellites: list[str] = []
    for dataset_id in dataset_ids:
        if dataset_id in LASAC_SATELLITE_IDS:
            satellites.append(dataset_id)
        elif dataset_id in DATASET_PROVIDER_MAP:
            satellites.extend(DATASET_PROVIDER_MAP[dataset_id]['satellites'])
    return list(dict.fromkeys(satellites))


def footprint_from_corners(tl_lat, tl_lon, tr_lat, tr_lon, br_lat, br_lon, bl_lat, bl_lon) -> dict:
    return {
        'type': 'Polygon',
        'coordinates': [[
            [tl_lon, tl_lat], [tr_lon, tr_lat], [br_lon, br_lat],
            [bl_lon, bl_lat], [tl_lon, tl_lat],
        ]],
    }


def bbox_from_footprint(footprint: dict) -> dict:
    coords = footprint['coordinates'][0]
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    return {
        'min_lon': min(lons), 'max_lon': max(lons),
        'min_lat': min(lats), 'max_lat': max(lats),
    }


def _parse_landsat_mtl(content: str, filename: str) -> dict[str, Any] | None:
    corners = {}
    for key, pattern in {
        'tl_lat': r'CORNER_UL_LAT_PRODUCT\s*=\s*([-\d.]+)',
        'tl_lon': r'CORNER_UL_LON_PRODUCT\s*=\s*([-\d.]+)',
        'tr_lat': r'CORNER_UR_LAT_PRODUCT\s*=\s*([-\d.]+)',
        'tr_lon': r'CORNER_UR_LON_PRODUCT\s*=\s*([-\d.]+)',
        'br_lat': r'CORNER_LR_LAT_PRODUCT\s*=\s*([-\d.]+)',
        'br_lon': r'CORNER_LR_LON_PRODUCT\s*=\s*([-\d.]+)',
        'bl_lat': r'CORNER_LL_LAT_PRODUCT\s*=\s*([-\d.]+)',
        'bl_lon': r'CORNER_LL_LON_PRODUCT\s*=\s*([-\d.]+)',
    }.items():
        m = re.search(pattern, content)
        if m:
            corners[key] = float(m.group(1))

    if len(corners) < 8:
        return None

    cloud_m = re.search(r'CLOUD_COVER(?:_LAND)?\s*=\s*([-\d.]+)', content)
    cloud = float(cloud_m.group(1)) if cloud_m else 0.0
    date_m = re.search(r'DATE_ACQUIRED\s*=\s*(\d{4}-\d{2}-\d{2})', content)
    receive_time = date_m.group(1) if date_m else None

    stem = os.path.splitext(os.path.basename(filename))[0]
    parts = stem.split('_')
    satellite = parts[0].upper() if parts else 'LANDSAT'
    dataset_id = detect_dataset_id(filename) or detect_dataset_id(satellite.lower())
    info = DATASET_PROVIDER_MAP.get(dataset_id or '', {})

    footprint = footprint_from_corners(
        corners['tl_lat'], corners['tl_lon'], corners['tr_lat'], corners['tr_lon'],
        corners['br_lat'], corners['br_lon'], corners['bl_lat'], corners['bl_lon'],
    )

    return {
        'satellite': satellite,
        'sensor': info.get('sensor', 'OLI/TIRS'),
        'receive_time': receive_time or datetime.utcnow().isoformat(),
        'cloud_percent': max(0.0, min(cloud, 100.0)),
        'footprint': footprint,
        'bbox': bbox_from_footprint(footprint),
        'dataset_id': dataset_id,
        'provider': info.get('provider', 'CUSTOM'),
        'resolution': info.get('resolution', ''),
        'payload_type': info.get('sensor', 'OLI/TIRS'),
    }


def _parse_sentinel_manifest(xml_bytes: bytes, filename: str) -> dict[str, Any] | None:
    try:
        root = ET.fromstring(xml_bytes)
    except ET.ParseError:
        return None

    ns = {'n': root.tag.split('}')[0].strip('{')} if '}' in root.tag else {}
    tag = lambda path: root.find(path, ns) if ns else root.find(path)

    sat = (tag('.//n:satellite') or tag('.//satellite'))
    satellite = sat.text if sat is not None else ''
    if not satellite:
        m = re.search(r'(S[125][AB])', filename.upper())
        satellite = m.group(1) if m else 'SENTINEL'

    start = tag('.//n:startTime') or tag('.//startTime')
    receive_time = start.text if start is not None else datetime.utcnow().isoformat()

    cloud = 0.0
    cloud_el = tag('.//n:cloudCoverPercentage') or tag('.//cloudCoverPercentage')
    if cloud_el is not None and cloud_el.text:
        cloud = float(cloud_el.text)

    coords = []
    for corner in root.iter():
        if corner.tag.endswith('coordinates') and corner.text:
            for pair in corner.text.strip().split():
                lon, lat = pair.split(',')[:2]
                coords.append([float(lon), float(lat)])
            break

    if len(coords) < 4:
        return None
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    footprint = {'type': 'Polygon', 'coordinates': [coords]}

    dataset_id = detect_dataset_id(filename) or 'sentinel2_msi'
    info = DATASET_PROVIDER_MAP.get(dataset_id, DATASET_PROVIDER_MAP['sentinel2_msi'])

    return {
        'satellite': satellite.upper()[:3] if satellite.startswith('Sentinel') else satellite.upper(),
        'sensor': info.get('sensor', 'MSI'),
        'receive_time': receive_time,
        'cloud_percent': cloud,
        'footprint': footprint,
        'bbox': bbox_from_footprint(footprint),
        'dataset_id': dataset_id,
        'provider': info.get('provider', 'SENTINEL2'),
        'resolution': info.get('resolution', '10-60 m'),
        'payload_type': info.get('sensor', 'MSI'),
    }


def _parse_from_filename(filename: str) -> dict[str, Any] | None:
    """Fallback metadata from standard naming conventions."""
    basename = os.path.basename(filename)
    stem = os.path.splitext(basename)[0]
    dataset_id = detect_dataset_id(basename)
    if not dataset_id:
        return None

    info = DATASET_PROVIDER_MAP[dataset_id]
    satellite = info['satellites'][0]
    receive_time = datetime.utcnow().isoformat()
    cloud = 0.0

    if dataset_id.startswith('landsat'):
        parts = stem.split('_')
        if len(parts) >= 4:
            satellite = parts[0].upper()
            receive_time = parts[3] if re.match(r'\d{8}', parts[3]) else receive_time
    elif dataset_id == 'sentinel2_msi':
        parts = stem.split('_')
        if len(parts) >= 3:
            satellite = parts[0].upper()
            receive_time = parts[2][:15] if 'T' in parts[2] else receive_time

    # Zimbabwe-wide placeholder bbox when corners unavailable
    footprint = footprint_from_corners(-15.6, 25.2, -15.6, 33.1, -22.4, 33.1, -22.4, 25.2)
    return {
        'satellite': satellite,
        'sensor': info['sensor'],
        'receive_time': receive_time,
        'cloud_percent': cloud,
        'footprint': footprint,
        'bbox': bbox_from_footprint(footprint),
        'dataset_id': dataset_id,
        'provider': info['provider'],
        'resolution': info['resolution'],
        'payload_type': info['sensor'],
        'approximate_bounds': True,
    }


def _read_zip_member(zip_path: str, predicate) -> bytes | None:
    with zipfile.ZipFile(zip_path, 'r') as zf:
        for name in zf.namelist():
            if predicate(name):
                return zf.read(name)
    return None


def _read_tar_member(tar_path: str, predicate, gz=True) -> bytes | None:
    mode = 'r:gz' if gz else 'r'
    with tarfile.open(tar_path, mode) as tf:
        for member in tf.getmembers():
            if member.isfile() and predicate(member.name):
                return tf.extractfile(member).read()
    return None


def parse_provider_archive(file_path: str) -> dict[str, Any] | None:
    """Parse Landsat/Sentinel/other archives for local indexing."""
    basename = os.path.basename(file_path)
    lower = basename.lower()

    if lower.endswith('.zip'):
        mtl = _read_zip_member(file_path, lambda n: 'mtl' in n.lower() and n.lower().endswith('.txt'))
        if mtl:
            result = _parse_landsat_mtl(mtl.decode('utf-8', errors='ignore'), basename)
            if result:
                return result

        manifest = _read_zip_member(file_path, lambda n: n.lower().endswith('manifest.safe'))
        if manifest:
            result = _parse_sentinel_manifest(manifest, basename)
            if result:
                return result

    elif lower.endswith('.tar.gz') or lower.endswith('.tgz'):
        mtl = _read_tar_member(file_path, lambda n: 'mtl' in n.lower() and n.lower().endswith('.txt'))
        if mtl:
            result = _parse_landsat_mtl(mtl.decode('utf-8', errors='ignore'), basename)
            if result:
                return result

    elif lower.endswith('.safe') or os.path.isdir(file_path):
        safe_dir = file_path if os.path.isdir(file_path) else file_path
        manifest_path = os.path.join(safe_dir, 'manifest.safe')
        if os.path.isfile(manifest_path):
            with open(manifest_path, 'rb') as f:
                result = _parse_sentinel_manifest(f.read(), basename)
                if result:
                    return result

    return _parse_from_filename(basename)


def get_all_provider_catalog() -> dict:
    """Return combined catalog for API."""
    from .local_imagery import LASAC_SATELLITE_CATALOG, LASAC_SATELLITE_IDS

    return {
        'lasac_satellite_ids': LASAC_SATELLITE_IDS,
        'lasac_catalog': LASAC_SATELLITE_CATALOG,
        'provider_datasets': {
            k: {
                'satellites': v['satellites'],
                'resolution': v['resolution'],
                'sensor': v['sensor'],
                'provider': v['provider'],
            }
            for k, v in DATASET_PROVIDER_MAP.items()
        },
    }
