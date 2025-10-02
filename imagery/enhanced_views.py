"""
Enhanced Django views for comprehensive geospatial data processing
Supports drone imagery, shapefiles, vector data, CRS detection, and AI analysis
"""

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.conf import settings
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Import enhanced geospatial extractor
try:
    from .enhanced_geospatial_extractor import (
        EnhancedGeospatialMetadataExtractor, 
        get_enhanced_metadata_extraction_status
    )
    HAS_ENHANCED_EXTRACTOR = True
except ImportError:
    HAS_ENHANCED_EXTRACTOR = False
    
# Import enhanced models
try:
    from .enhanced_models import (
        EnhancedGeospatialFile,
        GeospatialDataProvider, 
        CoordinateReferenceSystem,
        SpatialExtent,
        GeospatialProcessingJob
    )
    HAS_ENHANCED_MODELS = True
except ImportError:
    HAS_ENHANCED_MODELS = False
    # Fallback to original models
    from .models import AOI, Download, ProcessingJob

logger = logging.getLogger(__name__)

@api_view(['GET'])
def enhanced_geospatial_status(request):
    """Get the status of enhanced geospatial capabilities"""
    try:
        status_info = {
            'enhanced_extractor_available': HAS_ENHANCED_EXTRACTOR,
            'enhanced_models_available': HAS_ENHANCED_MODELS,
            'server_time': datetime.now().isoformat(),
            'processing_capabilities': {
                'crs_detection': HAS_ENHANCED_EXTRACTOR,
                'spatial_extent_calculation': HAS_ENHANCED_EXTRACTOR,
                'ai_metadata_extraction': HAS_ENHANCED_EXTRACTOR,
                'multi_format_support': HAS_ENHANCED_EXTRACTOR,
                'vector_processing': HAS_ENHANCED_EXTRACTOR,
                'point_cloud_support': HAS_ENHANCED_EXTRACTOR,
                'project_file_analysis': HAS_ENHANCED_EXTRACTOR
            }
        }
        
        if HAS_ENHANCED_EXTRACTOR:
            extractor_status = get_enhanced_metadata_extraction_status()
            status_info.update(extractor_status)
            
        return Response(status_info, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting enhanced geospatial status: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def enhanced_geospatial_upload(request):
    """Enhanced upload endpoint for comprehensive geospatial data"""
    try:
        files = request.FILES.getlist('files')
        if not files:
            return Response(
                {'error': 'No files provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse metadata
        batch_metadata_str = request.POST.get('batch_metadata', '{}')
        file_metadata_str = request.POST.get('file_metadata', '[]')
        
        try:
            batch_metadata = json.loads(batch_metadata_str)
            file_metadata = json.loads(file_metadata_str)
        except json.JSONDecodeError as e:
            return Response(
                {'error': f'Invalid metadata JSON: {e}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize enhanced extractor if available
        extractor = None
        if HAS_ENHANCED_EXTRACTOR:
            extractor = EnhancedGeospatialMetadataExtractor()
            extractor.initialize_models()
        
        # Process files
        processed_files = []
        processing_errors = []
        
        for i, file in enumerate(files):
            try:
                # Get file-specific metadata
                file_meta = file_metadata[i] if i < len(file_metadata) else {}
                
                # Process individual file
                result = process_enhanced_geospatial_file(
                    file, 
                    batch_metadata, 
                    file_meta, 
                    extractor,
                    request.user
                )
                
                if result.get('success'):
                    processed_files.append(result)
                else:
                    processing_errors.append({
                        'filename': file.name,
                        'error': result.get('error', 'Unknown error')
                    })
                    
            except Exception as e:
                logger.error(f"Error processing file {file.name}: {e}")
                processing_errors.append({
                    'filename': file.name,
                    'error': str(e)
                })
        
        # Prepare response (simplified without enhanced models for now)
        response_data = {
            'success': len(processed_files) > 0,
            'processed_files': processed_files,
            'processed_count': len(processed_files),
            'error_count': len(processing_errors),
            'errors': processing_errors,
            'timestamp': datetime.now().isoformat()
        }
        
        if processing_errors:
            response_data['warnings'] = [f"Failed to process {len(processing_errors)} files"]
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in enhanced geospatial upload: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

def process_enhanced_geospatial_file(
    file, 
    batch_metadata: Dict[str, Any], 
    file_metadata: Dict[str, Any], 
    extractor: Optional[Any],
    user
) -> Dict[str, Any]:
    """Process a single geospatial file with enhanced capabilities"""
    try:
        # Save file temporarily for processing
        temp_path = default_storage.save(
            f'temp/{file.name}', 
            file
        )
        full_temp_path = os.path.join(settings.MEDIA_ROOT, temp_path)
        
        # Extract comprehensive metadata
        extracted_metadata = {}
        if extractor:
            try:
                extracted_metadata = extractor.extract_comprehensive_metadata(full_temp_path)
            except Exception as e:
                logger.warning(f"Enhanced metadata extraction failed for {file.name}: {e}")
                extracted_metadata = {'extraction_error': str(e)}
        
        # Determine final storage path based on metadata and file type
        file_type_info = extracted_metadata.get('file_type', {})
        storage_path = determine_storage_path(
            file.name,
            batch_metadata,
            file_type_info
        )
        
        # Move file to final location
        final_path = default_storage.save(storage_path, file)
        
        # Clean up temp file
        try:
            os.remove(full_temp_path)
        except:
            pass
        
        # Simple response when enhanced models not available
        return {
            'success': True,
            'filename': file.name,
            'storage_path': final_path,
            'metadata': extracted_metadata
        }
            
    except Exception as e:
        logger.error(f"Error processing enhanced geospatial file {file.name}: {e}")
        return {'success': False, 'error': str(e)}

def determine_storage_path(
    filename: str, 
    batch_metadata: Dict[str, Any], 
    file_type_info: Dict[str, Any]
) -> str:
    """Determine storage path based on file type and metadata"""
    try:
        # Base organization structure
        provider = batch_metadata.get('provider', 'unknown')
        province = batch_metadata.get('province', 'unknown')
        district = batch_metadata.get('district', 'unknown')
        
        # Date organization
        acq_date = batch_metadata.get('acquisition_date')
        if acq_date:
            try:
                date_obj = datetime.fromisoformat(acq_date)
                date_folder = date_obj.strftime('%Y/%m')
            except:
                date_folder = datetime.now().strftime('%Y/%m')
        else:
            date_folder = datetime.now().strftime('%Y/%m')
        
        # File type organization
        data_type = file_type_info.get('data_type', 'other')
        category = file_type_info.get('category', 'unknown')
        
        # Build hierarchical path
        path_parts = [
            'enhanced_geospatial',
            provider,
            province,
            district,
            date_folder,
            data_type,
            category,
            filename
        ]
        
        return '/'.join(path_parts)
        
    except Exception as e:
        logger.warning(f"Error determining storage path: {e}")
        # Fallback path
        return f'enhanced_geospatial/other/{datetime.now().strftime("%Y/%m")}/{filename}'

@api_view(['GET'])
def enhanced_file_tree(request):
    """Get enhanced file tree with geospatial organization"""
    try:
        # Simplified response when enhanced models not available
        return Response({
            'success': True,
            'data': [],
            'message': 'Enhanced models not available - using fallback',
            'total_providers': 0,
            'total_files': 0,
            'total_size_mb': 0,
            'timestamp': datetime.now().isoformat()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting enhanced file tree: {e}")
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )