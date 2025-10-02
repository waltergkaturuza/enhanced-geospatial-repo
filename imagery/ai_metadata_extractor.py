"""
AI-powered Metadata Extraction for Satellite Imagery
Uses computer vision and machine learning to extract metadata from uploaded files
"""

import os
import json
import tempfile
from pathlib import Path
from datetime import datetime
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.conf import settings

try:
    import rasterio
    import numpy as np
    from PIL import Image, ExifTags
    import cv2
    HAS_CV_LIBS = True
except ImportError:
    HAS_CV_LIBS = False

try:
    from transformers import pipeline, BlipProcessor, BlipForConditionalGeneration
    import torch
    HAS_AI_LIBS = True
except ImportError:
    HAS_AI_LIBS = False

logger = logging.getLogger(__name__)

class AIMetadataExtractor:
    def __init__(self):
        self.image_captioning_model = None
        self.object_detection_model = None
        self.initialized = False
        
    def initialize_models(self):
        """Initialize AI models for metadata extraction"""
        if not HAS_AI_LIBS:
            logger.warning("AI libraries not available. Install transformers and torch for AI features.")
            return False
            
        try:
            # Initialize image captioning model for scene description
            self.image_captioning_model = pipeline(
                "image-to-text", 
                model="Salesforce/blip-image-captioning-base"
            )
            
            # Initialize object detection for feature identification
            self.object_detection_model = pipeline(
                "object-detection",
                model="facebook/detr-resnet-50"
            )
            
            self.initialized = True
            logger.info("AI models initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize AI models: {e}")
            return False
    
    def extract_geotiff_metadata(self, file_path):
        """Extract metadata from GeoTIFF files using rasterio"""
        if not HAS_CV_LIBS:
            return {}
            
        try:
            with rasterio.open(file_path) as dataset:
                metadata = {
                    'width': dataset.width,
                    'height': dataset.height,
                    'bands': list(range(1, dataset.count + 1)),
                    'crs': str(dataset.crs) if dataset.crs else None,
                    'transform': list(dataset.transform)[:6],
                    'bounds': list(dataset.bounds),
                    'resolution': (abs(dataset.transform[0]), abs(dataset.transform[4])),
                    'dtype': str(dataset.dtypes[0]) if dataset.dtypes else None,
                    'nodata': dataset.nodata
                }
                
                # Calculate geographic center
                if dataset.bounds:
                    center_lon = (dataset.bounds[0] + dataset.bounds[2]) / 2
                    center_lat = (dataset.bounds[1] + dataset.bounds[3]) / 2
                    metadata['center'] = [center_lon, center_lat]
                
                # Extract additional tags
                if hasattr(dataset, 'tags'):
                    tags = dataset.tags()
                    if tags:
                        metadata['tags'] = tags
                        
                        # Look for acquisition date in tags
                        for key in ['ACQUISITION_DATE', 'DATE_ACQUIRED', 'SENSING_TIME']:
                            if key in tags:
                                metadata['acquisition_date'] = tags[key]
                                break
                
                return metadata
                
        except Exception as e:
            logger.error(f"Error extracting GeoTIFF metadata: {e}")
            return {}
    
    def extract_exif_metadata(self, file_path):
        """Extract EXIF metadata from image files"""
        try:
            with Image.open(file_path) as image:
                exif_data = image.getexif()
                metadata = {}
                
                if exif_data:
                    for tag_id, value in exif_data.items():
                        tag_name = ExifTags.TAGS.get(tag_id, tag_id)
                        metadata[str(tag_name)] = str(value)
                
                # Extract basic image properties
                metadata.update({
                    'width': image.width,
                    'height': image.height,
                    'format': image.format,
                    'mode': image.mode
                })
                
                return metadata
                
        except Exception as e:
            logger.error(f"Error extracting EXIF metadata: {e}")
            return {}
    
    def analyze_image_content(self, file_path):
        """Use AI to analyze image content and extract features"""
        if not self.initialized:
            if not self.initialize_models():
                return {}
        
        try:
            # Load and preprocess image
            image = Image.open(file_path).convert('RGB')
            
            # Resize for processing if too large
            if image.width > 1024 or image.height > 1024:
                image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
            
            analysis = {}
            
            # Generate image caption/description
            try:
                caption_result = self.image_captioning_model(image)
                if caption_result:
                    analysis['scene_description'] = caption_result[0]['generated_text']
            except Exception as e:
                logger.error(f"Image captioning failed: {e}")
            
            # Object detection for features
            try:
                objects = self.object_detection_model(image)
                if objects:
                    detected_features = []
                    for obj in objects:
                        if obj['score'] > 0.5:  # Only high-confidence detections
                            detected_features.append({
                                'label': obj['label'],
                                'confidence': obj['score'],
                                'bbox': obj['box']
                            })
                    
                    if detected_features:
                        analysis['detected_features'] = detected_features
                        
                        # Classify land cover based on detected objects
                        land_cover_indicators = {
                            'urban': ['building', 'car', 'truck', 'road'],
                            'water': ['boat', 'surfboard'],
                            'vegetation': ['tree', 'plant'],
                            'agricultural': ['cow', 'horse', 'sheep']
                        }
                        
                        land_cover = {}
                        for category, indicators in land_cover_indicators.items():
                            count = sum(1 for feat in detected_features 
                                      if any(indicator in feat['label'].lower() 
                                           for indicator in indicators))
                            if count > 0:
                                land_cover[category] = count
                        
                        if land_cover:
                            analysis['estimated_land_cover'] = land_cover
                            
            except Exception as e:
                logger.error(f"Object detection failed: {e}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"Error analyzing image content: {e}")
            return {}
    
    def estimate_cloud_cover(self, file_path):
        """Estimate cloud cover percentage using computer vision"""
        if not HAS_CV_LIBS:
            return None
            
        try:
            # Load image
            image = cv2.imread(file_path)
            if image is None:
                return None
            
            # Convert to RGB
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Convert to HSV for better cloud detection
            hsv = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2HSV)
            
            # Define range for white/gray colors (clouds)
            lower_cloud = np.array([0, 0, 180])  # Lower bound for clouds
            upper_cloud = np.array([180, 30, 255])  # Upper bound for clouds
            
            # Create mask for cloud pixels
            cloud_mask = cv2.inRange(hsv, lower_cloud, upper_cloud)
            
            # Calculate cloud cover percentage
            total_pixels = image.shape[0] * image.shape[1]
            cloud_pixels = np.sum(cloud_mask > 0)
            cloud_cover_percentage = (cloud_pixels / total_pixels) * 100
            
            return min(cloud_cover_percentage, 100.0)  # Cap at 100%
            
        except Exception as e:
            logger.error(f"Error estimating cloud cover: {e}")
            return None
    
    def detect_satellite_provider(self, filename, metadata):
        """Enhanced satellite provider detection using filename and metadata"""
        filename_lower = filename.lower()
        
        # Define provider patterns with confidence scores
        provider_patterns = {
            'landsat': {
                'patterns': ['lc08', 'lc09', 'le07', 'lt05', 'landsat'],
                'metadata_indicators': ['OLI', 'TIRS', 'ETM+', 'TM'],
                'name': 'Landsat Program'
            },
            'sentinel': {
                'patterns': ['s1a', 's1b', 's2a', 's2b', 'sentinel'],
                'metadata_indicators': ['MSI', 'SAR'],
                'name': 'Sentinel Program'
            },
            'gaofen': {
                'patterns': ['gf1', 'gf2', 'gf3', 'gf4', 'gaofen'],
                'metadata_indicators': ['GaoFen', 'CRESDA'],
                'name': 'GaoFen Series'
            },
            'spot': {
                'patterns': ['spot6', 'spot7', 'spot'],
                'metadata_indicators': ['SPOT'],
                'name': 'SPOT Series'
            },
            'worldview': {
                'patterns': ['wv01', 'wv02', 'wv03', 'wv04', 'worldview'],
                'metadata_indicators': ['WorldView', 'DigitalGlobe'],
                'name': 'WorldView Series'
            }
        }
        
        detection_results = {}
        
        for provider_key, provider_info in provider_patterns.items():
            confidence = 0.0
            
            # Check filename patterns
            for pattern in provider_info['patterns']:
                if pattern in filename_lower:
                    confidence += 0.6
                    break
            
            # Check metadata indicators
            metadata_str = str(metadata).lower()
            for indicator in provider_info['metadata_indicators']:
                if indicator.lower() in metadata_str:
                    confidence += 0.4
                    break
            
            if confidence > 0:
                detection_results[provider_key] = {
                    'name': provider_info['name'],
                    'confidence': min(confidence, 1.0)
                }
        
        # Return the provider with highest confidence
        if detection_results:
            best_provider = max(detection_results.items(), key=lambda x: x[1]['confidence'])
            return best_provider[1]['name'], best_provider[1]['confidence']
        
        return None, 0.0
    
    def estimate_location(self, metadata, filename):
        """Estimate geographic location from metadata and filename"""
        location = {}
        
        # Check for coordinate information in metadata
        if 'bounds' in metadata and metadata['bounds']:
            bounds = metadata['bounds']
            if len(bounds) >= 4:
                # Calculate center point
                center_lon = (bounds[0] + bounds[2]) / 2
                center_lat = (bounds[1] + bounds[3]) / 2
                
                # Simple geographic region detection for Zimbabwe
                if 25 <= center_lat <= 22 and 25 <= center_lon <= 33:  # Rough Zimbabwe bounds
                    location['country'] = 'Zimbabwe'
                    location['confidence'] = 0.8
                    
                    # Rough province estimation based on coordinates
                    province_mapping = {
                        'harare': {'lat_range': (17.6, 18.0), 'lon_range': (30.8, 31.3)},
                        'bulawayo': {'lat_range': (20.1, 20.3), 'lon_range': (28.5, 28.7)},
                        'manicaland': {'lat_range': (18.0, 20.0), 'lon_range': (32.0, 33.0)},
                    }
                    
                    for province, coords in province_mapping.items():
                        if (coords['lat_range'][0] <= center_lat <= coords['lat_range'][1] and
                            coords['lon_range'][0] <= center_lon <= coords['lon_range'][1]):
                            location['province'] = province.title()
                            location['confidence'] = min(location['confidence'] + 0.1, 1.0)
                            break
        
        # Check filename for location indicators
        filename_lower = filename.lower()
        zimbabwe_indicators = ['zimbabwe', 'zim', 'harare', 'bulawayo', 'masvingo']
        for indicator in zimbabwe_indicators:
            if indicator in filename_lower:
                location['country'] = 'Zimbabwe'
                location['confidence'] = location.get('confidence', 0.0) + 0.3
                break
        
        return location if location else None

# Initialize global extractor instance
ai_extractor = AIMetadataExtractor()

@csrf_exempt
@require_http_methods(["POST"])
def extract_metadata_ai(request):
    """AI-powered metadata extraction endpoint"""
    try:
        if 'file' not in request.FILES:
            return JsonResponse({
                'success': False,
                'message': 'No file provided'
            }, status=400)
        
        uploaded_file = request.FILES['file']
        
        # Save file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(uploaded_file.name).suffix) as temp_file:
            for chunk in uploaded_file.chunks():
                temp_file.write(chunk)
            temp_file_path = temp_file.name
        
        try:
            metadata = {}
            
            # Extract basic file metadata
            metadata['filename'] = uploaded_file.name
            metadata['file_size'] = uploaded_file.size
            metadata['content_type'] = uploaded_file.content_type
            
            # Extract format-specific metadata
            file_extension = Path(uploaded_file.name).suffix.lower()
            
            if file_extension in ['.tif', '.tiff']:
                geotiff_metadata = ai_extractor.extract_geotiff_metadata(temp_file_path)
                metadata.update(geotiff_metadata)
            elif file_extension in ['.jpg', '.jpeg', '.png']:
                exif_metadata = ai_extractor.extract_exif_metadata(temp_file_path)
                metadata.update(exif_metadata)
            
            # AI-powered content analysis
            if file_extension in ['.jpg', '.jpeg', '.png', '.tif', '.tiff']:
                content_analysis = ai_extractor.analyze_image_content(temp_file_path)
                if content_analysis:
                    metadata['ai_analysis'] = content_analysis
                
                # Estimate cloud cover
                cloud_cover = ai_extractor.estimate_cloud_cover(temp_file_path)
                if cloud_cover is not None:
                    metadata['estimated_cloud_cover'] = cloud_cover
            
            # Detect satellite provider
            provider_name, provider_confidence = ai_extractor.detect_satellite_provider(
                uploaded_file.name, metadata
            )
            if provider_name:
                metadata['detected_provider'] = {
                    'name': provider_name,
                    'confidence': provider_confidence
                }
            
            # Estimate location
            location = ai_extractor.estimate_location(metadata, uploaded_file.name)
            if location:
                metadata['estimated_location'] = location
            
            # Format response
            response_metadata = {
                'provider': metadata.get('detected_provider', {}).get('name'),
                'resolution': f"{metadata.get('resolution', ['Unknown', 'Unknown'])[0]}m" if 'resolution' in metadata else None,
                'bands': [f"Band {b}" for b in metadata.get('bands', [])] if 'bands' in metadata else None,
                'crs': metadata.get('crs'),
                'cloudCover': metadata.get('estimated_cloud_cover'),
                'estimatedLocation': metadata.get('estimated_location'),
                'fileFormat': file_extension.replace('.', ''),
                'geographicBounds': {
                    'north': metadata.get('bounds', [None] * 4)[3],
                    'south': metadata.get('bounds', [None] * 4)[1], 
                    'east': metadata.get('bounds', [None] * 4)[2],
                    'west': metadata.get('bounds', [None] * 4)[0]
                } if 'bounds' in metadata else None,
                'acquisitionDate': metadata.get('acquisition_date'),
                'sceneDescription': metadata.get('ai_analysis', {}).get('scene_description'),
                'detectedFeatures': metadata.get('ai_analysis', {}).get('detected_features'),
                'estimatedLandCover': metadata.get('ai_analysis', {}).get('estimated_land_cover')
            }
            
            # Clean None values
            response_metadata = {k: v for k, v in response_metadata.items() if v is not None}
            
            return JsonResponse({
                'success': True,
                'metadata': response_metadata,
                'raw_metadata': metadata,
                'ai_features_available': HAS_AI_LIBS and ai_extractor.initialized
            })
            
        finally:
            # Clean up temporary file
            try:
                os.unlink(temp_file_path)
            except OSError:
                pass
                
    except Exception as e:
        logger.error(f"Error in AI metadata extraction: {e}")
        return JsonResponse({
            'success': False,
            'message': f'Metadata extraction failed: {str(e)}'
        }, status=500)

@require_http_methods(["GET"])
def ai_capabilities(request):
    """Get information about available AI capabilities"""
    return JsonResponse({
        'computer_vision_available': HAS_CV_LIBS,
        'ai_models_available': HAS_AI_LIBS,
        'models_initialized': ai_extractor.initialized,
        'supported_formats': ['.tif', '.tiff', '.jpg', '.jpeg', '.png', '.hdf', '.h5', '.nc'],
        'features': {
            'metadata_extraction': True,
            'image_captioning': HAS_AI_LIBS,
            'object_detection': HAS_AI_LIBS,
            'cloud_cover_estimation': HAS_CV_LIBS,
            'provider_detection': True,
            'location_estimation': True
        }
    })

@csrf_exempt
@require_http_methods(["POST"])
def advanced_upload_satellite_imagery(request):
    """Enhanced upload endpoint with AI metadata integration"""
    try:
        uploaded_files = request.FILES.getlist('files')
        if not uploaded_files:
            return JsonResponse({
                'success': False,
                'message': 'No files provided'
            }, status=400)
        
        results = []
        
        for i, file in enumerate(uploaded_files):
            try:
                # Get user-provided metadata
                metadata_key = f'metadata_{i}'
                user_metadata = {}
                if metadata_key in request.POST:
                    user_metadata = json.loads(request.POST[metadata_key])
                
                # Save file with enhanced organization
                from .upload_handler import save_file_to_storage, detect_satellite_provider
                
                provider_key, provider_info = detect_satellite_provider(file.name)
                saved_path = save_file_to_storage(file, provider_info, file.name)
                
                # Combine AI-extracted and user-provided metadata
                combined_metadata = {
                    'filename': file.name,
                    'saved_path': str(saved_path),
                    'provider': provider_key,
                    'upload_timestamp': datetime.now().isoformat(),
                    'user_metadata': user_metadata,
                    'file_size': file.size
                }
                
                results.append({
                    'filename': file.name,
                    'status': 'success',
                    'metadata': combined_metadata,
                    'saved_path': str(saved_path)
                })
                
            except Exception as e:
                logger.error(f"Error processing file {file.name}: {e}")
                results.append({
                    'filename': file.name,
                    'status': 'error',
                    'error': str(e)
                })
        
        success_count = sum(1 for r in results if r['status'] == 'success')
        
        return JsonResponse({
            'success': True,
            'message': f'Successfully uploaded {success_count} of {len(uploaded_files)} files',
            'results': results,
            'total_files': len(uploaded_files),
            'successful_uploads': success_count
        })
        
    except Exception as e:
        logger.error(f"Error in advanced upload: {e}")
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)