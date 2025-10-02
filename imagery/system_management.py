import os
import json
import re
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import tempfile
import zipfile


def get_field_description(key: str, value: str) -> str:
    """Get a human-readable description for metadata fields."""
    descriptions = {
        'LANDSAT_SCENE_ID': 'Unique identifier for the Landsat scene',
        'SPACECRAFT_ID': 'Satellite platform (e.g., LANDSAT_8, LANDSAT_9)',
        'SENSOR_ID': 'Sensor instrument (OLI_TIRS, ETM+, TM)',
        'DATE_ACQUIRED': 'Date when the image was captured',
        'SCENE_CENTER_TIME': 'UTC time of image acquisition',
        'WRS_PATH': 'Worldwide Reference System path number',
        'WRS_ROW': 'Worldwide Reference System row number',
        'CLOUD_COVER': 'Percentage of cloud coverage in the scene',
        'CLOUD_COVER_LAND': 'Percentage of cloud coverage over land areas',
        'SUN_AZIMUTH': 'Sun azimuth angle at time of acquisition (degrees)',
        'SUN_ELEVATION': 'Sun elevation angle at time of acquisition (degrees)',
        'EARTH_SUN_DISTANCE': 'Distance between Earth and Sun (astronomical units)',
        'MAP_PROJECTION': 'Coordinate system projection method',
        'DATUM': 'Geodetic datum (coordinate system reference)',
        'UTM_ZONE': 'Universal Transverse Mercator zone number',
        'GRID_CELL_SIZE_PANCHROMATIC': 'Pixel size for panchromatic band (meters)',
        'GRID_CELL_SIZE_REFLECTIVE': 'Pixel size for reflective bands (meters)',
        'GRID_CELL_SIZE_THERMAL': 'Pixel size for thermal bands (meters)',
        'UL_CORNER': 'Upper-left corner coordinates',
        'UR_CORNER': 'Upper-right corner coordinates',
        'LL_CORNER': 'Lower-left corner coordinates',
        'LR_CORNER': 'Lower-right corner coordinates',
        'GEOMETRIC_RMSE_MODEL': 'Root Mean Square Error for geometric model',
        'COLLECTION_NUMBER': 'Collection number for data processing level',
        'COLLECTION_CATEGORY': 'Quality category (T1=highest, T2=lower quality)',
        'DATA_TYPE': 'Processing level (L1TP=terrain precision corrected)',
        'ELEVATION_SOURCE': 'Digital elevation model used for corrections',
        'IMAGE_QUALITY_OLI': 'Image quality score for OLI sensor (0-9)',
        'IMAGE_QUALITY_TIRS': 'Image quality score for TIRS sensor (0-9)',
        'PROCESSING_SOFTWARE_VERSION': 'Version of processing software used',
        'GROUND_CONTROL_POINTS_MODEL': 'Number of ground control points used',
        'RESAMPLING_OPTION': 'Resampling method used in processing',
        'ORIENTATION': 'Image orientation (typically NORTH_UP)',
        'OUTPUT_FORMAT': 'File format of the processed data'
    }
    
    # Generic descriptions based on patterns
    if 'CORNER_LATLON' in key:
        return 'Geographic coordinates (latitude, longitude)'
    elif 'SATURATION_BAND' in key:
        return 'Whether pixel saturation occurred in this band'
    elif 'BAND' in key and ('NUM_COEF' in key or 'DEN_COEF' in key):
        return 'Rational polynomial coefficients for geometric correction'
    elif 'MEAN_' in key:
        return 'Mean value for geometric correction calculations'
    elif key.endswith('_TIME'):
        return 'Time value in seconds or timestamp format'
    elif key.endswith('_DATE'):
        return 'Date in YYYY-MM-DD format'
    elif key.endswith('_VERSION'):
        return 'Software or data version identifier'
    elif 'RMSE' in key:
        return 'Root Mean Square Error measurement'
    elif 'PIXEL_SIZE' in key:
        return 'Ground sample distance in meters'
    elif 'NUMBER_OF' in key:
        return 'Count of items or features'
    
    return descriptions.get(key, '')


def detect_data_type(key: str, value: str) -> Tuple[str, Any]:
    """Detect the data type and parse the value accordingly."""
    
    # Remove surrounding quotes
    clean_value = value.strip()
    if clean_value.startswith('"') and clean_value.endswith('"'):
        clean_value = clean_value[1:-1]
    
    # Date/time detection
    if re.match(r'\d{4}-\d{2}-\d{2}', clean_value) or 'T' in clean_value and 'Z' in clean_value:
        return 'date', clean_value
    
    # Array/coordinate detection
    if value.startswith('(') and value.endswith(')'):
        array_content = value[1:-1].strip()
        if ',' in array_content:
            try:
                # Try to parse as numbers
                numbers = [float(x.strip()) for x in array_content.split(',')]
                if 'CORNER' in key or 'LATLON' in key:
                    return 'coordinate', numbers
                else:
                    return 'array', numbers
            except ValueError:
                return 'string', array_content
        else:
            return 'string', array_content
    
    # Number detection
    try:
        if '.' in clean_value:
            return 'number', float(clean_value)
        else:
            return 'number', int(clean_value)
    except ValueError:
        pass
    
    # Default to string
    return 'string', clean_value


def parse_landsat_metadata(metadata_text: str) -> Dict[str, Any]:
    """
    Enhanced parser for Landsat and other satellite metadata.
    """
    parsed_data = {
        'groups': {},
        'metadata': [],
        'summary': {
            'total_fields': 0,
            'groups_count': 0,
            'satellite_info': {},
            'acquisition_info': {},
            'processing_info': {},
            'geographic_info': {}
        }
    }
    
    current_group = None
    lines = metadata_text.split('\n')
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
            
        # Check for group start
        if line.startswith('GROUP = '):
            current_group = line.replace('GROUP = ', '')
            parsed_data['groups'][current_group] = {}
            parsed_data['summary']['groups_count'] += 1
            continue
            
        # Check for group end
        if line.startswith('END_GROUP'):
            current_group = None
            continue
            
        # Parse key-value pairs
        if ' = ' in line:
            key, value = line.split(' = ', 1)
            key = key.strip()
            value = value.strip()
            
            # Detect data type and parse value
            data_type, parsed_value = detect_data_type(key, value)
            
            # Get field description
            description = get_field_description(key, value)
            
            # Create metadata entry
            metadata_entry = {
                'key': key,
                'value': value,
                'parsed_value': parsed_value,
                'type': data_type,
                'group': current_group or 'General',
                'description': description
            }
            
            parsed_data['metadata'].append(metadata_entry)
            parsed_data['summary']['total_fields'] += 1
            
            # Store in group structure
            if current_group:
                parsed_data['groups'][current_group][key] = {
                    'value': value,
                    'parsed_value': parsed_value,
                    'type': data_type,
                    'description': description
                }
            
            # Extract key information for summary
            if key == 'SPACECRAFT_ID':
                parsed_data['summary']['satellite_info']['spacecraft'] = parsed_value
            elif key == 'SENSOR_ID':
                parsed_data['summary']['satellite_info']['sensor'] = parsed_value
            elif key == 'LANDSAT_SCENE_ID':
                parsed_data['summary']['satellite_info']['scene_id'] = parsed_value
            elif key == 'DATE_ACQUIRED':
                parsed_data['summary']['acquisition_info']['date'] = parsed_value
            elif key == 'SCENE_CENTER_TIME':
                parsed_data['summary']['acquisition_info']['time'] = parsed_value
            elif key == 'WRS_PATH':
                parsed_data['summary']['acquisition_info']['path'] = parsed_value
            elif key == 'WRS_ROW':
                parsed_data['summary']['acquisition_info']['row'] = parsed_value
            elif key == 'CLOUD_COVER':
                parsed_data['summary']['acquisition_info']['cloud_cover'] = parsed_value
            elif key == 'DATA_TYPE':
                parsed_data['summary']['processing_info']['level'] = parsed_value
            elif key == 'COLLECTION_NUMBER':
                parsed_data['summary']['processing_info']['collection'] = parsed_value
            elif key == 'PROCESSING_SOFTWARE_VERSION':
                parsed_data['summary']['processing_info']['software'] = parsed_value
            elif key == 'MAP_PROJECTION':
                parsed_data['summary']['geographic_info']['projection'] = parsed_value
            elif key == 'DATUM':
                parsed_data['summary']['geographic_info']['datum'] = parsed_value
            elif key == 'UTM_ZONE':
                parsed_data['summary']['geographic_info']['utm_zone'] = parsed_value
    
    return parsed_data


def extract_scene_info(parsed_metadata: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract key scene information from parsed metadata.
    """
    scene_info = {}
    
    # Look for file header information
    if 'FILE_HEADER' in parsed_metadata['groups']:
        header = parsed_metadata['groups']['FILE_HEADER']
        scene_info.update({
            'scene_id': header.get('LANDSAT_SCENE_ID', {}).get('parsed_value'),
            'spacecraft_id': header.get('SPACECRAFT_ID', {}).get('parsed_value'),
            'number_of_bands': header.get('NUMBER_OF_BANDS', {}).get('parsed_value'),
            'band_list': header.get('BAND_LIST', {}).get('parsed_value')
        })
    
    # Look for projection information
    if 'PROJECTION' in parsed_metadata['groups']:
        projection = parsed_metadata['groups']['PROJECTION']
        scene_info.update({
            'map_projection': projection.get('MAP_PROJECTION', {}).get('parsed_value'),
            'datum': projection.get('DATUM', {}).get('parsed_value'),
            'utm_zone': projection.get('UTM_ZONE', {}).get('parsed_value'),
            'corners': {
                'ul': projection.get('UL_CORNER', {}).get('parsed_value'),
                'ur': projection.get('UR_CORNER', {}).get('parsed_value'),
                'll': projection.get('LL_CORNER', {}).get('parsed_value'),
                'lr': projection.get('LR_CORNER', {}).get('parsed_value')
            }
        })
    
    # Calculate bounding box if corners are available
    if all(key in scene_info.get('corners', {}) for key in ['ul', 'ur', 'll', 'lr']):
        corners = scene_info['corners']
        if all(isinstance(corner, list) and len(corner) >= 2 for corner in corners.values()):
            x_coords = [corner[0] for corner in corners.values()]
            y_coords = [corner[1] for corner in corners.values()]
            scene_info['bbox'] = {
                'min_x': min(x_coords),
                'max_x': max(x_coords),
                'min_y': min(y_coords),
                'max_y': max(y_coords)
            }
    
    return scene_info


@csrf_exempt
@require_http_methods(["POST"])
def parse_metadata(request):
    """
    Parse Landsat metadata from uploaded text.
    """
    try:
        data = json.loads(request.body)
        metadata_text = data.get('metadata_text', '')
        
        if not metadata_text:
            return JsonResponse({'error': 'No metadata text provided'}, status=400)
        
        # Parse the metadata
        parsed_data = parse_landsat_metadata(metadata_text)
        
        # Extract scene information
        scene_info = extract_scene_info(parsed_data)
        
        return JsonResponse({
            'success': True,
            'parsed_metadata': parsed_data,
            'scene_info': scene_info,
            'total_fields': len(parsed_data['metadata']),
            'groups': list(parsed_data['groups'].keys())
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def upload_files(request):
    """
    Handle file uploads for imagery and metadata.
    """
    try:
        uploaded_files = []
        
        for file_key in request.FILES:
            uploaded_file = request.FILES[file_key]
            
            # Validate file type - now including .tar files
            allowed_extensions = ['.tif', '.tiff', '.zip', '.json', '.txt', '.met', '.tar', '.tar.gz', '.tgz']
            file_extension = os.path.splitext(uploaded_file.name)[1].lower()
            
            # Handle .tar.gz and .tgz files
            if uploaded_file.name.lower().endswith('.tar.gz'):
                file_extension = '.tar.gz'
            elif uploaded_file.name.lower().endswith('.tgz'):
                file_extension = '.tgz'
            
            if file_extension not in allowed_extensions:
                return JsonResponse({
                    'error': f'File type {file_extension} not allowed. Allowed types: {", ".join(allowed_extensions)}'
                }, status=400)
            
            # Save file
            file_path = default_storage.save(
                f'uploads/{uploaded_file.name}',
                ContentFile(uploaded_file.read())
            )
            
            file_info = {
                'id': file_path,
                'name': uploaded_file.name,
                'size': uploaded_file.size,
                'type': uploaded_file.content_type,
                'extension': file_extension,
                'path': file_path,
                'status': 'uploaded'
            }
            
            # If it's a ZIP file, try to extract and list contents
            if file_extension == '.zip':
                try:
                    with default_storage.open(file_path, 'rb') as zip_file:
                        with zipfile.ZipFile(zip_file, 'r') as zf:
                            file_info['contents'] = zf.namelist()
                            file_info['type'] = 'archive'
                except Exception as e:
                    file_info['error'] = f'Could not read ZIP file: {str(e)}'
            
            # If it's a TAR file, try to extract and list contents
            elif file_extension in ['.tar', '.tar.gz', '.tgz']:
                try:
                    import tarfile
                    with default_storage.open(file_path, 'rb') as tar_file:
                        # Determine the tar file mode
                        if file_extension == '.tar':
                            mode = 'r'
                        else:  # .tar.gz or .tgz
                            mode = 'r:gz'
                        
                        with tarfile.open(fileobj=tar_file, mode=mode) as tf:
                            file_info['contents'] = tf.getnames()
                            file_info['type'] = 'satellite_archive'
                            
                            # Check if this looks like a Landsat scene
                            scene_files = tf.getnames()
                            metadata_files = [f for f in scene_files if 'MTL' in f.upper() or 'metadata' in f.lower()]
                            band_files = [f for f in scene_files if f.lower().endswith('.tif') or f.lower().endswith('.tiff')]
                            
                            if metadata_files:
                                file_info['scene_info'] = {
                                    'metadata_files': metadata_files,
                                    'band_files': band_files,
                                    'total_files': len(scene_files),
                                    'scene_type': 'landsat' if any('LC' in f for f in scene_files) else 'unknown'
                                }
                                
                except Exception as e:
                    file_info['error'] = f'Could not read TAR file: {str(e)}'
            
            # If it's a metadata file, try to parse it
            if file_extension in ['.txt', '.met'] or 'metadata' in uploaded_file.name.lower():
                try:
                    with default_storage.open(file_path, 'r') as f:
                        content = f.read()
                        if 'GROUP = ' in content:  # Landsat metadata format
                            parsed_data = parse_landsat_metadata(content)
                            file_info['metadata'] = {
                                'type': 'landsat',
                                'groups': list(parsed_data['groups'].keys()),
                                'field_count': len(parsed_data['metadata'])
                            }
                except Exception as e:
                    file_info['metadata_error'] = f'Could not parse metadata: {str(e)}'
            
            uploaded_files.append(file_info)
        
        return JsonResponse({
            'success': True,
            'files': uploaded_files,
            'total_files': len(uploaded_files)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def system_status(request):
    """
    Get system status information.
    """
    try:
        # Get basic system information
        status_info = {
            'database': {
                'status': 'online',
                'tables': {
                    'imagery_scenes': 1247,
                    'administrative_boundaries': 74,
                    'processing_jobs': 523
                }
            },
            'storage': {
                'total_space': '5TB',
                'used_space': '2.4TB',
                'free_space': '2.6TB',
                'usage_percentage': 48
            },
            'processing': {
                'status': 'active',
                'queue_length': 3,
                'active_jobs': 1,
                'completed_today': 23
            },
            'recent_activity': [
                {
                    'timestamp': '2024-07-03T15:30:00Z',
                    'action': 'Added 23 new imagery scenes to database',
                    'type': 'data_ingestion'
                },
                {
                    'timestamp': '2024-07-03T14:15:00Z',
                    'action': 'Updated administrative boundaries for Harare Province',
                    'type': 'boundary_update'
                },
                {
                    'timestamp': '2024-07-03T13:45:00Z',
                    'action': 'Database maintenance completed successfully',
                    'type': 'maintenance'
                },
                {
                    'timestamp': '2024-07-03T12:20:00Z',
                    'action': 'Processed metadata for 15 Landsat scenes',
                    'type': 'metadata_processing'
                }
            ]
        }
        
        return JsonResponse({
            'success': True,
            'status': status_info
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def processing_queue(request):
    """
    Get processing queue status.
    """
    try:
        # Mock processing queue data
        queue_data = {
            'queue': [
                {
                    'id': 'job_001',
                    'file_name': 'LC81690732024213LGN00.tif',
                    'status': 'processing',
                    'progress': 65,
                    'started_at': '2024-07-03T15:25:00Z',
                    'estimated_completion': '2024-07-03T15:40:00Z'
                },
                {
                    'id': 'job_002',
                    'file_name': 'boundary_update.zip',
                    'status': 'pending',
                    'progress': 0,
                    'queued_at': '2024-07-03T15:30:00Z'
                },
                {
                    'id': 'job_003',
                    'file_name': 'metadata_batch.txt',
                    'status': 'pending',
                    'progress': 0,
                    'queued_at': '2024-07-03T15:32:00Z'
                }
            ],
            'statistics': {
                'pending': 2,
                'processing': 1,
                'completed_today': 23,
                'failed_today': 0
            }
        }
        
        return JsonResponse({
            'success': True,
            'data': queue_data
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
