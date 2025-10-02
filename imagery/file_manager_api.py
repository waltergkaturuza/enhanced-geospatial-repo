"""
File Management API for the Geospatial Repository
Provides endpoints for browsing, managing, and organizing uploaded imagery files
"""

import os
import json
from pathlib import Path
from datetime import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings

# GIS is disabled for now - using dummy class
HAS_GIS = False
class GEOSGeometry:
    def __init__(self, *args, **kwargs):
        pass

from .upload_handler import SATELLITE_PROVIDERS, detect_satellite_provider, extract_metadata
import logging

logger = logging.getLogger(__name__)

# Configuration
DATA_ROOT = Path(settings.BASE_DIR) / 'data'

def get_file_size(file_path):
    """Get file size in bytes"""
    try:
        return os.path.getsize(file_path)
    except OSError:
        return 0

def get_file_metadata(file_path):
    """Extract metadata from file"""
    try:
        provider_key, provider_info = detect_satellite_provider(Path(file_path).name)
        metadata = extract_metadata(file_path, provider_key)
        return metadata
    except Exception as e:
        logger.error(f"Error extracting metadata from {file_path}: {e}")
        return {}

def build_tree_structure():
    """Build hierarchical tree structure of uploaded files"""
    tree_data = []
    
    # Iterate through each provider
    for provider_key, provider_info in SATELLITE_PROVIDERS.items():
        provider_path = DATA_ROOT / provider_info['storage_path']
        
        if not provider_path.exists():
            continue
            
        provider_node = {
            'id': provider_key,
            'name': provider_info['name'],
            'type': 'provider',
            'children': [],
            'count': 0
        }
        
        # Get all files for this provider
        files = list(provider_path.rglob('*'))
        image_files = [f for f in files if f.is_file() and f.suffix.lower() in ['.tif', '.tiff', '.jpg', '.jpeg', '.png', '.hdf', '.h5', '.nc', '.jp2']]
        
        if not image_files:
            continue
            
        # Group files by location (province/district)
        location_groups = {}
        
        for file_path in image_files:
            # Try to extract location from metadata or file path
            metadata = get_file_metadata(file_path)
            
            # Default location if not detected
            province = "Unknown Province"
            district = "Unknown District"
            
            # Try to extract location from metadata
            if metadata and 'location' in metadata:
                location = metadata['location']
                if isinstance(location, dict):
                    province = location.get('province', province)
                    district = location.get('district', district)
            
            # Try to extract from file path structure
            path_parts = file_path.parts
            if 'provinces' in path_parts:
                try:
                    province_idx = path_parts.index('provinces')
                    if province_idx + 1 < len(path_parts):
                        province = path_parts[province_idx + 1].title()
                    if province_idx + 2 < len(path_parts):
                        district = path_parts[province_idx + 2].title()
                except (ValueError, IndexError):
                    pass
            
            # Group by province and district
            if province not in location_groups:
                location_groups[province] = {}
            if district not in location_groups[province]:
                location_groups[province][district] = []
            
            location_groups[province][district].append(file_path)
        
        # Build province nodes
        for province, districts in location_groups.items():
            province_node = {
                'id': f"{provider_key}-{province.lower().replace(' ', '-')}",
                'name': province,
                'type': 'province',
                'children': [],
                'count': sum(len(files) for files in districts.values())
            }
            
            # Build district nodes
            for district, files in districts.items():
                district_node = {
                    'id': f"{provider_key}-{province.lower().replace(' ', '-')}-{district.lower().replace(' ', '-')}",
                    'name': district,
                    'type': 'district',
                    'children': [],
                    'count': len(files)
                }
                
                # Group files by date
                date_groups = {}
                for file_path in files:
                    # Extract date from filename or file modification time
                    file_date = None
                    metadata = get_file_metadata(file_path)
                    
                    if metadata and 'acquisition_date' in metadata:
                        file_date = metadata['acquisition_date']
                    else:
                        # Use file modification time as fallback
                        file_stat = file_path.stat()
                        file_date = datetime.fromtimestamp(file_stat.st_mtime).strftime('%Y-%m')
                    
                    if file_date not in date_groups:
                        date_groups[file_date] = []
                    date_groups[file_date].append(file_path)
                
                # Build date nodes
                for date, date_files in date_groups.items():
                    date_node = {
                        'id': f"{district_node['id']}-{date}",
                        'name': date,
                        'type': 'date',
                        'children': [],
                        'count': len(date_files)
                    }
                    
                    # Group files by format
                    format_groups = {}
                    for file_path in date_files:
                        file_format = file_path.suffix.lower()
                        format_name = {
                            '.tif': 'GeoTIFF',
                            '.tiff': 'GeoTIFF', 
                            '.jpg': 'JPEG',
                            '.jpeg': 'JPEG',
                            '.png': 'PNG',
                            '.hdf': 'HDF',
                            '.h5': 'HDF5',
                            '.nc': 'NetCDF',
                            '.jp2': 'JPEG 2000'
                        }.get(file_format, file_format.upper().replace('.', ''))
                        
                        if format_name not in format_groups:
                            format_groups[format_name] = []
                        format_groups[format_name].append(file_path)
                    
                    # Build format nodes
                    for format_name, format_files in format_groups.items():
                        format_node = {
                            'id': f"{date_node['id']}-{format_name.lower().replace(' ', '-')}",
                            'name': format_name,
                            'type': 'format',
                            'count': len(format_files),
                            'files': []
                        }
                        
                        # Build file objects
                        for file_path in format_files:
                            file_stat = file_path.stat()
                            metadata = get_file_metadata(file_path)
                            
                            file_obj = {
                                'id': str(file_path).replace('\\', '/'),
                                'name': file_path.name,
                                'size': file_stat.st_size,
                                'format': file_path.suffix.lower().replace('.', ''),
                                'uploadDate': datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                                'captureDate': metadata.get('acquisition_date', datetime.fromtimestamp(file_stat.st_mtime).isoformat()),
                                'fullUrl': f'/api/files/download/{file_path.name}',
                                'metadata': {
                                    'resolution': metadata.get('resolution', 'Unknown'),
                                    'bands': metadata.get('bands', []),
                                    'projection': metadata.get('crs', 'Unknown'),
                                    'cloudCover': metadata.get('cloud_cover')
                                }
                            }
                            
                            format_node['files'].append(file_obj)
                        
                        date_node['children'].append(format_node)
                    
                    district_node['children'].append(date_node)
                
                province_node['children'].append(district_node)
            
            provider_node['children'].append(province_node)
            provider_node['count'] += province_node['count']
        
        if provider_node['children']:
            tree_data.append(provider_node)
    
    return tree_data

@require_http_methods(["GET"])
def get_file_tree(request):
    """Get hierarchical file tree structure"""
    try:
        tree_data = build_tree_structure()
        
        return JsonResponse({
            'success': True,
            'data': tree_data,
            'total_providers': len(tree_data),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error building file tree: {e}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@require_http_methods(["GET"])
def search_files(request):
    """Search files by name, provider, location, or date"""
    try:
        search_term = request.GET.get('q', '').lower()
        provider_filter = request.GET.get('provider', '')
        date_filter = request.GET.get('date', '')
        
        if not search_term:
            return JsonResponse({
                'success': False,
                'message': 'Search term required'
            }, status=400)
        
        results = []
        
        # Search through all provider directories
        for provider_key, provider_info in SATELLITE_PROVIDERS.items():
            if provider_filter and provider_filter != provider_key:
                continue
                
            provider_path = DATA_ROOT / provider_info['storage_path']
            
            if not provider_path.exists():
                continue
            
            # Find matching files
            files = list(provider_path.rglob('*'))
            for file_path in files:
                if file_path.is_file():
                    # Check if filename matches search term
                    if (search_term in file_path.name.lower() or 
                        search_term in provider_info['name'].lower()):
                        
                        file_stat = file_path.stat()
                        metadata = get_file_metadata(file_path)
                        
                        # Apply date filter
                        if date_filter:
                            file_date = metadata.get('acquisition_date', 
                                                   datetime.fromtimestamp(file_stat.st_mtime).strftime('%Y-%m'))
                            if date_filter not in file_date:
                                continue
                        
                        results.append({
                            'id': str(file_path),
                            'name': file_path.name,
                            'provider': provider_info['name'],
                            'size': file_stat.st_size,
                            'uploadDate': datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                            'captureDate': metadata.get('acquisition_date', 
                                                      datetime.fromtimestamp(file_stat.st_mtime).isoformat()),
                            'path': str(file_path.relative_to(DATA_ROOT)),
                            'metadata': metadata
                        })
        
        return JsonResponse({
            'success': True,
            'results': results,
            'count': len(results),
            'search_term': search_term
        })
        
    except Exception as e:
        logger.error(f"Error searching files: {e}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@require_http_methods(["DELETE"])
def delete_file(request, file_id):
    """Delete a specific file"""
    try:
        # Decode file path
        file_path = Path(file_id)
        
        # Security check - ensure file is within data directory
        if not str(file_path).startswith(str(DATA_ROOT)):
            return JsonResponse({
                'success': False,
                'message': 'Invalid file path'
            }, status=400)
        
        if file_path.exists() and file_path.is_file():
            file_path.unlink()
            return JsonResponse({
                'success': True,
                'message': f'File {file_path.name} deleted successfully'
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'File not found'
            }, status=404)
            
    except Exception as e:
        logger.error(f"Error deleting file {file_id}: {e}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@require_http_methods(["GET"])
def get_file_stats(request):
    """Get overall file statistics"""
    try:
        stats = {
            'total_files': 0,
            'total_size': 0,
            'providers': {},
            'file_formats': {},
            'upload_timeline': {}
        }
        
        for provider_key, provider_info in SATELLITE_PROVIDERS.items():
            provider_path = DATA_ROOT / provider_info['storage_path']
            
            if not provider_path.exists():
                continue
            
            provider_stats = {
                'files': 0,
                'size': 0,
                'formats': {}
            }
            
            files = list(provider_path.rglob('*'))
            for file_path in files:
                if file_path.is_file():
                    file_size = get_file_size(file_path)
                    file_format = file_path.suffix.lower()
                    
                    provider_stats['files'] += 1
                    provider_stats['size'] += file_size
                    
                    # Track formats
                    if file_format not in provider_stats['formats']:
                        provider_stats['formats'][file_format] = 0
                    provider_stats['formats'][file_format] += 1
                    
                    # Global stats
                    stats['total_files'] += 1
                    stats['total_size'] += file_size
                    
                    if file_format not in stats['file_formats']:
                        stats['file_formats'][file_format] = 0
                    stats['file_formats'][file_format] += 1
                    
                    # Upload timeline (by month)
                    file_stat = file_path.stat()
                    upload_month = datetime.fromtimestamp(file_stat.st_ctime).strftime('%Y-%m')
                    if upload_month not in stats['upload_timeline']:
                        stats['upload_timeline'][upload_month] = 0
                    stats['upload_timeline'][upload_month] += 1
            
            if provider_stats['files'] > 0:
                stats['providers'][provider_key] = {
                    'name': provider_info['name'],
                    **provider_stats
                }
        
        return JsonResponse({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting file stats: {e}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)