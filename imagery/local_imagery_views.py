"""
Local imagery API — mirrors server/backend/index.js for localhost testing.
"""

import json
import logging
import mimetypes
import os
import shutil

from django.conf import settings
from django.http import FileResponse, Http404
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .local_imagery import (
    LASAC_SATELLITE_CATALOG,
    LASAC_SATELLITE_IDS,
    LOCAL_INDEX_SOURCES,
    get_imagery_root,
    get_local_base_url,
    get_thumbnail_root,
    read_watcher_status,
    scan_and_ingest,
    search_local_imagery,
)
from .local_providers import get_all_provider_catalog, resolve_satellites_from_datasets
from .models import SatelliteImage

logger = logging.getLogger(__name__)

ZIMBABWE_BBOX = {
    'min_lon': 25.2, 'min_lat': -22.4,
    'max_lon': 33.1, 'max_lat': -15.6,
}


def _parse_search_params(request):
    params = request.query_params if hasattr(request, 'query_params') else request.GET
    data = request.data if hasattr(request, 'data') and request.method == 'POST' else {}

    def pick(*keys):
        for key in keys:
            val = params.get(key) or data.get(key)
            if val is not None and val != '':
                return val
        return None

    bbox = data.get('bbox') or {}
    geometry = data.get('geometry')

    min_lon = pick('min_lon', 'minLon') or bbox.get('min_lon')
    min_lat = pick('min_lat', 'minLat') or bbox.get('min_lat')
    max_lon = pick('max_lon', 'maxLon') or bbox.get('max_lon')
    max_lat = pick('max_lat', 'maxLat') or bbox.get('max_lat')

    if geometry and not min_lon:
        try:
            geom = geometry if isinstance(geometry, dict) else json.loads(geometry)
            if geom.get('type') == 'Polygon':
                coords = geom['coordinates'][0]
            elif geom.get('type') == 'Feature' and geom.get('geometry', {}).get('type') == 'Polygon':
                coords = geom['geometry']['coordinates'][0]
            else:
                coords = None
            if coords:
                lons = [c[0] for c in coords]
                lats = [c[1] for c in coords]
                min_lon, max_lon = min(lons), max(lons)
                min_lat, max_lat = min(lats), max(lats)
        except (TypeError, KeyError, json.JSONDecodeError):
            pass

    if min_lon is None:
        min_lon = ZIMBABWE_BBOX['min_lon']
        min_lat = ZIMBABWE_BBOX['min_lat']
        max_lon = ZIMBABWE_BBOX['max_lon']
        max_lat = ZIMBABWE_BBOX['max_lat']

    satellites = pick('satellites')
    if satellites and isinstance(satellites, str):
        satellites = [s.strip() for s in satellites.split(',') if s.strip()]

    dataset_ids = data.get('providers') or data.get('datasets') or pick('dataset_ids')
    if isinstance(dataset_ids, str):
        dataset_ids = [s.strip() for s in dataset_ids.split(',') if s.strip()]

    if not satellites and dataset_ids:
        satellites = resolve_satellites_from_datasets(dataset_ids)

    return {
        'min_lon': min_lon,
        'min_lat': min_lat,
        'max_lon': max_lon,
        'max_lat': max_lat,
        'start_date': pick('start_date', 'startDate'),
        'end_date': pick('end_date', 'endDate'),
        'max_cloud': pick('max_cloud', 'max_cloud_cover', 'maxCloud'),
        'satellites': satellites,
        'dataset_ids': dataset_ids,
    }


def _feature_to_result(feature: dict) -> dict:
    props = feature.get('properties', {})
    geom = feature.get('geometry') or {}
    coords = geom.get('coordinates', [[]])[0] if geom else []
    bounds = None
    if coords:
        lons = [c[0] for c in coords]
        lats = [c[1] for c in coords]
        bounds = [min(lats), min(lons), max(lats), max(lons)]

    resolution = props.get('resolution', '')
    file_mb = props.get('file_size_mb') or 0

    return {
        'id': props.get('id'),
        'tile_id': props.get('tile_id'),
        'provider': props.get('satellite'),
        'satellite': props.get('satellite'),
        'sensor': props.get('sensor'),
        'payload_type': props.get('payload_type', props.get('sensor')),
        'sensed_at': props.get('acquisition_date'),
        'cloud_cover': props.get('cloud_cover'),
        'bounds': bounds,
        'file_size_mb': file_mb,
        'file_size_bytes': props.get('file_size_bytes'),
        'thumbnail_url': props.get('thumbnail_url'),
        'preview': props.get('thumbnail_url'),
        'downloadUrl': props.get('download_url'),
        'download_url': props.get('download_url'),
        'geometry': geom,
        'dataset': props.get('satellite'),
        'title': f"{props.get('satellite', '')} {props.get('sensor', '')}".strip(),
        'date': props.get('acquisition_date'),
        'cloudCover': props.get('cloud_cover'),
        'resolution': resolution or 'N/A',
        'format': 'tar.gz',
        'size': f"{file_mb:.1f} MB" if file_mb else 'N/A',
        'metadata': props,
    }


@api_view(['GET'])
@permission_classes([AllowAny])
def local_imagery_search(request):
    """GeoJSON search — same contract as server GET /api/search."""
    params = _parse_search_params(request)
    collection = search_local_imagery(**params)
    return Response(collection)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def imagery_search(request):
    """
    Frontend-compatible search — returns {count, results} from local archive.
    Falls back to empty results when no local data is indexed.
    """
    params = _parse_search_params(request)
    collection = search_local_imagery(**params)
    results = [_feature_to_result(f) for f in collection['features']]
    return Response({
        'count': len(results),
        'results': results,
        'source': 'local_archive',
        'search_parameters': params,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def local_imagery_download(request, image_id):
    """Stream original archive from disk — same as server GET /api/download/:id."""
    try:
        image = SatelliteImage.objects.get(pk=image_id, meta__source__in=LOCAL_INDEX_SOURCES)
    except SatelliteImage.DoesNotExist:
        raise Http404('Scene not found')

    file_path = image.file_path
    if not file_path or not os.path.exists(file_path):
        raise Http404('File not found on disk')

    content_type = mimetypes.guess_type(file_path)[0] or 'application/gzip'
    response = FileResponse(open(file_path, 'rb'), content_type=content_type)
    response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
    return response


@api_view(['GET'])
@permission_classes([AllowAny])
def watcher_status(request):
    """Watcher heartbeat — same as server GET /api/watcher/status."""
    return Response(read_watcher_status())


@api_view(['POST'])
@permission_classes([AllowAny])
def trigger_ingest(request):
    """Manually scan data/ and ingest new archives."""
    count = scan_and_ingest()
    return Response({'ingested': count, 'message': f'Ingested {count} new archive(s).'})


@api_view(['GET'])
@permission_classes([AllowAny])
def lasac_catalog(request):
    """Return LASAC + all other local provider dataset catalog."""
    return Response(get_all_provider_catalog())


@api_view(['POST'])
@permission_classes([AllowAny])
def selection_storage_summary(request):
    """
    Calculate total storage for selected scenes and compare with available disk space.
    """
    ids = request.data.get('ids', [])
    if not ids:
        return Response({
            'scene_count': 0,
            'total_size_mb': 0,
            'total_size_gb': 0,
            'total_size_bytes': 0,
            'by_satellite': {},
            'by_payload': {},
            'disk_free_gb': 0,
            'disk_total_gb': 0,
            'fits_on_disk': True,
        })

    images = SatelliteImage.objects.filter(
        id__in=ids, meta__source__in=LOCAL_INDEX_SOURCES, is_available=True,
    )

    total_mb = 0.0
    total_bytes = 0
    by_satellite = {}
    by_payload = {}

    for image in images:
        meta = image.meta or {}
        mb = image.file_size_mb or 0
        bytes_size = meta.get('file_size_bytes') or int(mb * 1024 * 1024)
        total_mb += mb
        total_bytes += bytes_size

        sat = meta.get('satellite', 'Unknown')
        payload = meta.get('payload_type') or meta.get('sensor', 'Unknown')
        by_satellite[sat] = by_satellite.get(sat, 0) + mb
        by_payload[payload] = by_payload.get(payload, 0) + mb

    try:
        disk = shutil.disk_usage(get_imagery_root())
        disk_free_gb = round(disk.free / (1024 ** 3), 2)
        disk_total_gb = round(disk.total / (1024 ** 3), 2)
        fits_on_disk = total_bytes <= disk.free
    except OSError:
        disk_free_gb = 0
        disk_total_gb = 0
        fits_on_disk = True

    return Response({
        'scene_count': images.count(),
        'total_size_mb': round(total_mb, 2),
        'total_size_gb': round(total_mb / 1024, 3) if total_mb else 0,
        'total_size_bytes': total_bytes,
        'by_satellite_mb': {k: round(v, 2) for k, v in by_satellite.items()},
        'by_payload_mb': {k: round(v, 2) for k, v in by_payload.items()},
        'disk_free_gb': disk_free_gb,
        'disk_total_gb': disk_total_gb,
        'disk_used_gb': round(disk_total_gb - disk_free_gb, 2) if disk_total_gb else 0,
        'fits_on_disk': fits_on_disk,
        'storage_warning': None if fits_on_disk else (
            f'Selected scenes need {round(total_mb / 1024, 2)} GB but only {disk_free_gb} GB free on disk.'
        ),
    })


@require_http_methods(['GET'])
def serve_thumbnail(request, path):
    """Serve extracted thumbnails at /thumbnails/<path>."""
    thumb_root = get_thumbnail_root()
    safe_path = os.path.normpath(path)
    if safe_path.startswith('..') or os.path.isabs(safe_path):
        raise Http404('Invalid path')

    full_path = os.path.join(thumb_root, safe_path)
    if not os.path.isfile(full_path):
        raise Http404('Thumbnail not found')

    content_type = mimetypes.guess_type(full_path)[0] or 'image/jpeg'
    return FileResponse(open(full_path, 'rb'), content_type=content_type)
