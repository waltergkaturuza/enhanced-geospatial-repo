"""
Enhanced File Upload Handler for Geospatial System
Handles upload of various satellite imagery formats and UAV data
"""
import os
import shutil
import json
import tempfile
import zipfile
import tarfile
from pathlib import Path
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

# Configuration
MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB
UPLOAD_BASE_PATH = Path(settings.BASE_DIR) / 'data'

# Supported satellite providers and their file patterns
SATELLITE_PROVIDERS = {
    'landsat': {
        'name': 'Landsat Program',
        'satellites': ['Landsat 5', 'Landsat 7', 'Landsat 8', 'Landsat 9'],
        'patterns': ['LC08', 'LC09', 'LE07', 'LT05', 'landsat'],
        'formats': ['.tif', '.tiff', '.tar.gz', '.zip'],
        'storage_path': 'imagery/landsat'
    },
    'sentinel': {
        'name': 'Sentinel Program',
        'satellites': ['Sentinel-1A', 'Sentinel-1B', 'Sentinel-2A', 'Sentinel-2B'],
        'patterns': ['S1A', 'S1B', 'S2A', 'S2B', 'sentinel'],
        'formats': ['.zip', '.SAFE', '.jp2', '.tiff'],
        'storage_path': 'imagery/sentinel'
    },
    'gaofen': {
        'name': 'GaoFen Series',
        'satellites': ['GaoFen-1', 'GaoFen-2', 'GaoFen-3'],
        'patterns': ['GF1', 'GF2', 'GF3', 'gaofen'],
        'formats': ['.tiff', '.img', '.zip'],
        'storage_path': 'imagery/gaofen'
    },
    'spot': {
        'name': 'SPOT Series',
        'satellites': ['SPOT-6', 'SPOT-7'],
        'patterns': ['SPOT6', 'SPOT7', 'spot'],
        'formats': ['.tiff', '.jp2', '.zip'],
        'storage_path': 'imagery/spot'
    },
    'worldview': {
        'name': 'WorldView Series',
        'satellites': ['WorldView-1', 'WorldView-2', 'WorldView-3', 'WorldView-4'],
        'patterns': ['WV01', 'WV02', 'WV03', 'WV04', 'worldview'],
        'formats': ['.tiff', '.ntf', '.zip'],
        'storage_path': 'imagery/worldview'
    },
    'quickbird': {
        'name': 'QuickBird',
        'satellites': ['QuickBird-2'],
        'patterns': ['QB02', 'quickbird'],
        'formats': ['.tiff', '.ntf'],
        'storage_path': 'imagery/quickbird'
    },
    'ikonos': {
        'name': 'IKONOS',
        'satellites': ['IKONOS-2'],
        'patterns': ['IK01', 'ikonos'],
        'formats': ['.tiff', '.ntf'],
        'storage_path': 'imagery/ikonos'
    },
    'uav': {
        'name': 'UAV/Drone',
        'satellites': ['DJI Series', 'Fixed-wing UAV', 'Custom Drone'],
        'patterns': ['dji', 'drone', 'uav', 'phantom', 'mavic'],
        'formats': ['.jpg', '.jpeg', '.tiff', '.raw', '.dng'],
        'storage_path': 'imagery/uav'
    },
    'modis': {
        'name': 'MODIS',
        'satellites': ['Terra MODIS', 'Aqua MODIS'],
        'patterns': ['MOD', 'MYD', 'modis'],
        'formats': ['.hdf', '.tiff', '.nc'],
        'storage_path': 'imagery/modis'
    },
    'viirs': {
        'name': 'VIIRS',
        'satellites': ['Suomi NPP', 'NOAA-20', 'NOAA-21'],
        'patterns': ['VNP', 'VJ1', 'viirs'],
        'formats': ['.h5', '.nc', '.tiff'],
        'storage_path': 'imagery/viirs'
    }
}

def detect_satellite_provider(filename):
    """Detect satellite provider from filename"""
    filename_lower = filename.lower()
    
    for provider_key, provider_info in SATELLITE_PROVIDERS.items():
        for pattern in provider_info['patterns']:
            if pattern.lower() in filename_lower:
                return provider_key, provider_info
    
    return 'unknown', {
        'name': 'Unknown Provider',
        'satellites': ['Unknown'],
        'storage_path': 'imagery/unknown'
    }

def validate_file(file, provider_info):
    """Validate uploaded file"""
    errors = []
    
    # Check file size
    if file.size > MAX_FILE_SIZE:
        errors.append(f"File too large. Maximum size is {MAX_FILE_SIZE / (1024**3):.1f}GB")
    
    # Check file format
    file_ext = Path(file.name).suffix.lower()
    if file_ext not in provider_info.get('formats', []):
        expected_formats = ', '.join(provider_info.get('formats', []))
        errors.append(f"Unsupported format {file_ext}. Expected: {expected_formats}")
    
    return errors

def extract_metadata(file_path, provider_key):
    """Extract basic metadata from the file"""
    file_path = Path(file_path)
    
    metadata = {
        'filename': file_path.name,
        'size_bytes': file_path.stat().st_size,
        'provider': provider_key,
        'format': file_path.suffix.lower(),
        'upload_timestamp': None,  # Will be set when saving to database
    }
    
    # Provider-specific metadata extraction
    if provider_key == 'landsat':
        # Extract Landsat metadata from filename
        # Example: LC08_L1TP_168074_20230101_20230101_02_T1.tif
        parts = file_path.stem.split('_')
        if len(parts) >= 6:
            metadata.update({
                'satellite': parts[0],
                'processing_level': parts[1],
                'path_row': parts[2],
                'acquisition_date': parts[3],
                'processing_date': parts[4],
                'collection': parts[5]
            })
    
    elif provider_key == 'sentinel':
        # Extract Sentinel metadata from filename
        # Example: S2A_MSIL2A_20230101T103421_N0509_R008_T33UVP_20230101T123456.zip
        parts = file_path.stem.split('_')
        if len(parts) >= 4:
            metadata.update({
                'satellite': parts[0],
                'product_level': parts[1],
                'sensing_time': parts[2],
                'processing_baseline': parts[3] if len(parts) > 3 else None
            })
    
    # Add more provider-specific metadata extraction as needed
    
    return metadata

def save_file_to_storage(file, provider_info, filename):
    """Save file to appropriate storage location"""
    storage_path = UPLOAD_BASE_PATH / provider_info['storage_path']
    storage_path.mkdir(parents=True, exist_ok=True)
    
    file_path = storage_path / filename
    
    # Save the file
    with open(file_path, 'wb') as destination:
        for chunk in file.chunks():
            destination.write(chunk)
    
    return str(file_path)

def process_archive(file_path, provider_info):
    """Process archive files (ZIP, TAR.GZ)"""
    file_path = Path(file_path)
    extracted_files = []
    
    extract_dir = file_path.parent / f"{file_path.stem}_extracted"
    extract_dir.mkdir(exist_ok=True)
    
    try:
        if file_path.suffix.lower() == '.zip':
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
        elif file_path.suffixes[-2:] == ['.tar', '.gz']:
            with tarfile.open(file_path, 'r:gz') as tar_ref:
                tar_ref.extractall(extract_dir)
        
        # List extracted files
        for extracted_file in extract_dir.rglob('*'):
            if extracted_file.is_file():
                extracted_files.append(str(extracted_file))
        
        return extracted_files, str(extract_dir)
    
    except Exception as e:
        logger.error(f"Error extracting archive {file_path}: {e}")
        return [], None

@csrf_exempt
@require_http_methods(["POST"])
def upload_satellite_imagery(request):
    """Enhanced endpoint for uploading satellite imagery and UAV data"""
    try:
        uploaded_files = request.FILES.getlist('files')
        if not uploaded_files:
            return JsonResponse({
                'success': False,
                'message': 'No files provided'
            }, status=400)
        
        results = []
        total_size = 0
        
        for file in uploaded_files:
            try:
                # Detect satellite provider
                provider_key, provider_info = detect_satellite_provider(file.name)
                
                # Validate file
                validation_errors = validate_file(file, provider_info)
                if validation_errors:
                    results.append({
                        'filename': file.name,
                        'status': 'error',
                        'errors': validation_errors,
                        'provider': provider_key
                    })
                    continue
                
                # Save file to storage
                saved_path = save_file_to_storage(file, provider_info, file.name)
                
                # Extract metadata
                metadata = extract_metadata(saved_path, provider_key)
                
                # Process archives if necessary
                extracted_files = []
                if Path(file.name).suffix.lower() in ['.zip', '.gz']:
                    extracted, extract_dir = process_archive(saved_path, provider_info)
                    extracted_files = extracted
                
                total_size += file.size
                
                results.append({
                    'filename': file.name,
                    'status': 'success',
                    'provider': provider_key,
                    'provider_name': provider_info['name'],
                    'size_bytes': file.size,
                    'size_mb': round(file.size / (1024 * 1024), 2),
                    'saved_path': saved_path,
                    'metadata': metadata,
                    'extracted_files': extracted_files,
                    'message': f'Successfully uploaded {file.name}'
                })
                
                logger.info(f"Successfully uploaded {file.name} ({provider_key})")
                
            except Exception as e:
                logger.error(f"Error processing file {file.name}: {e}")
                results.append({
                    'filename': file.name,
                    'status': 'error',
                    'errors': [f'Processing error: {str(e)}'],
                    'provider': 'unknown'
                })
        
        # Summary
        successful_uploads = [r for r in results if r['status'] == 'success']
        failed_uploads = [r for r in results if r['status'] == 'error']
        
        return JsonResponse({
            'success': True,
            'message': f'Processed {len(uploaded_files)} files. {len(successful_uploads)} successful, {len(failed_uploads)} failed.',
            'summary': {
                'total_files': len(uploaded_files),
                'successful': len(successful_uploads),
                'failed': len(failed_uploads),
                'total_size_bytes': total_size,
                'total_size_mb': round(total_size / (1024 * 1024), 2)
            },
            'results': results,
            'supported_providers': list(SATELLITE_PROVIDERS.keys())
        })
        
    except Exception as e:
        logger.error(f"Error in upload_satellite_imagery: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Upload processing error: {str(e)}'
        }, status=500)

@require_http_methods(["GET"])
def get_upload_status(request):
    """Get information about uploaded files and storage status"""
    try:
        storage_info = {}
        total_size = 0
        total_files = 0
        
        for provider_key, provider_info in SATELLITE_PROVIDERS.items():
            provider_path = UPLOAD_BASE_PATH / provider_info['storage_path']
            if provider_path.exists():
                files = list(provider_path.rglob('*'))
                file_count = len([f for f in files if f.is_file()])
                provider_size = sum(f.stat().st_size for f in files if f.is_file())
                
                storage_info[provider_key] = {
                    'name': provider_info['name'],
                    'file_count': file_count,
                    'size_bytes': provider_size,
                    'size_mb': round(provider_size / (1024 * 1024), 2),
                    'path': str(provider_path)
                }
                
                total_size += provider_size
                total_files += file_count
            else:
                storage_info[provider_key] = {
                    'name': provider_info['name'],
                    'file_count': 0,
                    'size_bytes': 0,
                    'size_mb': 0,
                    'path': str(provider_path)
                }
        
        return JsonResponse({
            'success': True,
            'storage_summary': {
                'total_files': total_files,
                'total_size_bytes': total_size,
                'total_size_gb': round(total_size / (1024**3), 2),
                'max_file_size_gb': round(MAX_FILE_SIZE / (1024**3), 1)
            },
            'providers': storage_info,
            'upload_paths': {
                'base_path': str(UPLOAD_BASE_PATH),
                'uploads': str(UPLOAD_BASE_PATH / 'uploads'),
                'raw': str(UPLOAD_BASE_PATH / 'raw'),
                'processed': str(UPLOAD_BASE_PATH / 'processed')
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting upload status: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Error retrieving upload status: {str(e)}'
        }, status=500)

@require_http_methods(["GET"])
def get_supported_formats(request):
    """Get information about supported satellite providers and formats"""
    return JsonResponse({
        'success': True,
        'providers': SATELLITE_PROVIDERS,
        'max_file_size_gb': round(MAX_FILE_SIZE / (1024**3), 1),
        'message': 'Supported satellite imagery providers and formats'
    })