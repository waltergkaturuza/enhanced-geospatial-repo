"""
Enhanced Geospatial Metadata Extractor
Supports comprehensive geospatial data analysis including:
- Coordinate Reference Systems (CRS) detection and validation
- Drone imagery, satellite data, vector formats
- Spatial extent and projection analysis
- Multi-format geospatial data support
"""

import os
import logging
import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Union
from pathlib import Path

# Check for enhanced geospatial libraries
try:
    from osgeo import gdal, ogr, osr
    import fiona
    import shapely
    from shapely.geometry import shape, box
    import pyproj
    from pyproj import CRS, Transformer
    import geopandas as gpd
    import rasterio
    from rasterio.crs import CRS as RioCRS
    from rasterio.warp import calculate_default_transform, transform_bounds
    import xarray as xr
    import h5py
    import netCDF4
    from geopy.distance import geodesic
    import imageio
    HAS_ENHANCED_GEOSPATIAL = True
except ImportError as e:
    print(f"Enhanced geospatial libraries not available: {e}")
    HAS_ENHANCED_GEOSPATIAL = False
    # Create dummy CRS class for type hints when libraries aren't available
    class CRS:
        pass

# Original AI libraries
try:
    from transformers import pipeline, BlipProcessor, BlipForConditionalGeneration
    import torch
    import cv2
    from PIL import Image
    import numpy as np
    HAS_AI_LIBS = True
except ImportError:
    HAS_AI_LIBS = False

logger = logging.getLogger(__name__)

class EnhancedGeospatialMetadataExtractor:
    """Enhanced geospatial metadata extractor with comprehensive CRS and format support"""
    
    # Supported geospatial file formats
    RASTER_FORMATS = {
        '.tif', '.tiff', '.geotiff', '.gtiff',  # GeoTIFF
        '.jp2', '.j2k',  # JPEG 2000
        '.ecw',  # Enhanced Compression Wavelet
        '.sid',  # MrSID
        '.img',  # ERDAS Imagine
        '.nc', '.netcdf',  # NetCDF
        '.hdf', '.h5', '.hdf5',  # HDF
        '.grib', '.grb',  # GRIB
        '.asc', '.txt',  # ASCII Grid
        '.dem',  # Digital Elevation Model
        '.bil', '.bip', '.bsq',  # ENVI formats
        '.png', '.jpg', '.jpeg'  # Standard image formats (may have geospatial data)
    }
    
    VECTOR_FORMATS = {
        '.shp',  # Shapefile
        '.kml', '.kmz',  # Keyhole Markup Language
        '.geojson', '.json',  # GeoJSON
        '.gpx',  # GPS Exchange Format
        '.gml',  # Geography Markup Language
        '.tab',  # MapInfo TAB
        '.dgn',  # MicroStation DGN
        '.dxf',  # AutoCAD DXF
        '.osm',  # OpenStreetMap
        '.pbf'   # Protocol Buffer Format
    }
    
    PROJECT_FORMATS = {
        '.mxd',  # ArcMap Document
        '.aprx',  # ArcGIS Pro Project
        '.qgs', '.qgz',  # QGIS Project
        '.map'   # MapServer Map File
    }
    
    def __init__(self):
        """Initialize the enhanced geospatial metadata extractor"""
        self.initialized = False
        self.ai_initialized = False
        self.geospatial_initialized = False
        
        # Enable GDAL exceptions
        if HAS_ENHANCED_GEOSPATIAL:
            gdal.UseExceptions()
            
    def initialize_models(self):
        """Initialize AI models and geospatial capabilities"""
        success = True
        
        # Initialize AI models
        if HAS_AI_LIBS:
            try:
                # Initialize image captioning model for scene description
                self.image_captioning_model = pipeline(
                    "image-to-text",
                    model="Salesforce/blip-image-captioning-large",
                    device=-1  # Use CPU
                )
                
                # Initialize object detection model
                self.object_detection_model = pipeline(
                    "object-detection",
                    model="facebook/detr-resnet-50",
                    device=-1
                )
                
                self.ai_initialized = True
                logger.info("AI models initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize AI models: {e}")
                self.ai_initialized = False
                success = False
        
        # Initialize geospatial capabilities
        if HAS_ENHANCED_GEOSPATIAL:
            try:
                # Test GDAL drivers
                gdal_driver_count = gdal.GetDriverCount()
                ogr_driver_count = ogr.GetDriverCount()
                
                logger.info(f"GDAL initialized with {gdal_driver_count} raster drivers")
                logger.info(f"OGR initialized with {ogr_driver_count} vector drivers")
                
                self.geospatial_initialized = True
            except Exception as e:
                logger.error(f"Failed to initialize geospatial capabilities: {e}")
                self.geospatial_initialized = False
                success = False
        
        self.initialized = self.ai_initialized or self.geospatial_initialized
        return success
    
    def detect_file_type(self, file_path: str) -> Dict[str, Any]:
        """Detect the type and format of a geospatial file"""
        file_path = Path(file_path)
        extension = file_path.suffix.lower()
        
        file_type_info = {
            'file_extension': extension,
            'file_size_mb': file_path.stat().st_size / (1024 * 1024) if file_path.exists() else 0,
            'is_geospatial': False,
            'data_type': 'unknown',
            'format_category': 'unknown',
            'gdal_driver': None,
            'ogr_driver': None
        }
        
        # Determine file category
        if extension in self.RASTER_FORMATS:
            file_type_info['format_category'] = 'raster'
            file_type_info['data_type'] = 'raster'
            file_type_info['is_geospatial'] = True
        elif extension in self.VECTOR_FORMATS:
            file_type_info['format_category'] = 'vector'
            file_type_info['data_type'] = 'vector'
            file_type_info['is_geospatial'] = True
        elif extension in self.PROJECT_FORMATS:
            file_type_info['format_category'] = 'project'
            file_type_info['data_type'] = 'project'
            file_type_info['is_geospatial'] = True
        
        # Test with GDAL/OGR if available
        if HAS_ENHANCED_GEOSPATIAL and file_path.exists():
            try:
                # Try opening as raster
                ds = gdal.Open(str(file_path))
                if ds:
                    driver = ds.GetDriver()
                    file_type_info['gdal_driver'] = driver.GetDescription()
                    file_type_info['is_geospatial'] = True
                    file_type_info['data_type'] = 'raster'
                    ds = None
                else:
                    # Try opening as vector
                    ds = ogr.Open(str(file_path))
                    if ds:
                        driver = ds.GetDriver()
                        file_type_info['ogr_driver'] = driver.GetName()
                        file_type_info['is_geospatial'] = True
                        file_type_info['data_type'] = 'vector'
                        ds = None
            except Exception as e:
                logger.warning(f"Error detecting file type with GDAL/OGR: {e}")
        
        return file_type_info
    
    def extract_crs_information(self, file_path: str) -> Dict[str, Any]:
        """Extract comprehensive coordinate reference system information"""
        crs_info = {
            'has_crs': False,
            'epsg_code': None,
            'proj4_string': None,
            'wkt': None,
            'authority': None,
            'datum': None,
            'ellipsoid': None,
            'projection_name': None,
            'units': None,
            'is_geographic': False,
            'is_projected': False,
            'central_meridian': None,
            'false_easting': None,
            'false_northing': None,
            'standard_parallels': None
        }
        
        if not HAS_ENHANCED_GEOSPATIAL:
            return crs_info
        
        try:
            # Try raster first
            with rasterio.open(file_path) as src:
                if src.crs:
                    crs_info['has_crs'] = True
                    crs_info['epsg_code'] = src.crs.to_epsg()
                    crs_info['proj4_string'] = src.crs.to_proj4()
                    crs_info['wkt'] = src.crs.to_wkt()
                    
                    # Get additional CRS details using pyproj
                    pyproj_crs = CRS.from_wkt(src.crs.to_wkt())
                    crs_info.update(self._extract_pyproj_details(pyproj_crs))
                    
                return crs_info
                
        except Exception:
            pass
        
        try:
            # Try vector
            with fiona.open(file_path) as src:
                if src.crs:
                    crs_info['has_crs'] = True
                    crs_dict = src.crs
                    
                    # Extract EPSG if available
                    if 'init' in crs_dict:
                        epsg_string = crs_dict['init']
                        if epsg_string.startswith('epsg:'):
                            crs_info['epsg_code'] = int(epsg_string.split(':')[1])
                    
                    # Create pyproj CRS for detailed analysis
                    pyproj_crs = CRS.from_dict(crs_dict)
                    crs_info['proj4_string'] = pyproj_crs.to_proj4()
                    crs_info['wkt'] = pyproj_crs.to_wkt()
                    crs_info.update(self._extract_pyproj_details(pyproj_crs))
                    
        except Exception as e:
            logger.warning(f"Error extracting CRS information: {e}")
        
        return crs_info
    
    def _extract_pyproj_details(self, crs: CRS) -> Dict[str, Any]:
        """Extract detailed CRS information using pyproj"""
        details = {}
        
        if not HAS_ENHANCED_GEOSPATIAL:
            return details
        
        try:
            details['authority'] = crs.to_authority()
            details['datum'] = crs.datum.name if crs.datum else None
            details['ellipsoid'] = crs.ellipsoid.name if crs.ellipsoid else None
            details['projection_name'] = crs.coordinate_system.name if crs.coordinate_system else None
            details['units'] = crs.axis_info[0].unit_name if crs.axis_info else None
            details['is_geographic'] = crs.is_geographic
            details['is_projected'] = crs.is_projected
            
            # Extract projection parameters
            if crs.is_projected:
                params = crs.to_dict()
                details['central_meridian'] = params.get('lon_0')
                details['false_easting'] = params.get('x_0')
                details['false_northing'] = params.get('y_0')
                details['standard_parallels'] = [
                    params.get('lat_1'), params.get('lat_2')
                ] if params.get('lat_1') else None
                
        except Exception as e:
            logger.warning(f"Error extracting detailed CRS information: {e}")
        
        return details
    
    def calculate_spatial_extent(self, file_path: str) -> Dict[str, Any]:
        """Calculate spatial extent and bounding box information"""
        extent_info = {
            'has_spatial_extent': False,
            'bbox_native': None,  # [minx, miny, maxx, maxy] in native CRS
            'bbox_wgs84': None,   # [minx, miny, maxx, maxy] in WGS84
            'centroid_native': None,
            'centroid_wgs84': None,
            'area_sq_meters': None,
            'area_sq_km': None,
            'perimeter_meters': None,
            'width_meters': None,
            'height_meters': None
        }
        
        if not HAS_ENHANCED_GEOSPATIAL:
            return extent_info
        
        try:
            # Try raster
            with rasterio.open(file_path) as src:
                extent_info['has_spatial_extent'] = True
                bounds = src.bounds
                extent_info['bbox_native'] = [bounds.left, bounds.bottom, bounds.right, bounds.top]
                
                # Calculate centroid
                centroid_x = (bounds.left + bounds.right) / 2
                centroid_y = (bounds.bottom + bounds.top) / 2
                extent_info['centroid_native'] = [centroid_x, centroid_y]
                
                # Transform to WGS84 if needed
                if src.crs and src.crs != CRS.from_epsg(4326):
                    extent_info['bbox_wgs84'] = list(transform_bounds(
                        src.crs, CRS.from_epsg(4326), *bounds
                    ))
                    
                    # Transform centroid
                    transformer = Transformer.from_crs(src.crs, CRS.from_epsg(4326))
                    cent_lon, cent_lat = transformer.transform(centroid_x, centroid_y)
                    extent_info['centroid_wgs84'] = [cent_lon, cent_lat]
                else:
                    extent_info['bbox_wgs84'] = extent_info['bbox_native']
                    extent_info['centroid_wgs84'] = extent_info['centroid_native']
                
                # Calculate area and dimensions
                self._calculate_geometric_properties(extent_info, src.crs)
                
                return extent_info
                
        except Exception:
            pass
        
        try:
            # Try vector
            gdf = gpd.read_file(file_path)
            if not gdf.empty:
                extent_info['has_spatial_extent'] = True
                bounds = gdf.total_bounds  # [minx, miny, maxx, maxy]
                extent_info['bbox_native'] = bounds.tolist()
                
                # Calculate centroid
                centroid = gdf.geometry.centroid.iloc[0]
                extent_info['centroid_native'] = [centroid.x, centroid.y]
                
                # Transform to WGS84 if needed
                if gdf.crs and gdf.crs != 'EPSG:4326':
                    gdf_wgs84 = gdf.to_crs('EPSG:4326')
                    bounds_wgs84 = gdf_wgs84.total_bounds
                    extent_info['bbox_wgs84'] = bounds_wgs84.tolist()
                    
                    centroid_wgs84 = gdf_wgs84.geometry.centroid.iloc[0]
                    extent_info['centroid_wgs84'] = [centroid_wgs84.x, centroid_wgs84.y]
                else:
                    extent_info['bbox_wgs84'] = extent_info['bbox_native']
                    extent_info['centroid_wgs84'] = extent_info['centroid_native']
                
                # Calculate area and dimensions
                self._calculate_geometric_properties(extent_info, gdf.crs)
                
        except Exception as e:
            logger.warning(f"Error calculating spatial extent: {e}")
        
        return extent_info
    
    def _calculate_geometric_properties(self, extent_info: Dict, crs):
        """Calculate geometric properties like area and dimensions"""
        try:
            if extent_info['bbox_wgs84']:
                minx, miny, maxx, maxy = extent_info['bbox_wgs84']
                
                # Calculate dimensions using geodesic distance
                width_meters = geodesic((miny, minx), (miny, maxx)).meters
                height_meters = geodesic((miny, minx), (maxy, minx)).meters
                
                extent_info['width_meters'] = width_meters
                extent_info['height_meters'] = height_meters
                
                # Approximate area (rectangular)
                area_sq_meters = width_meters * height_meters
                extent_info['area_sq_meters'] = area_sq_meters
                extent_info['area_sq_km'] = area_sq_meters / 1_000_000
                
                # Approximate perimeter
                extent_info['perimeter_meters'] = 2 * (width_meters + height_meters)
                
        except Exception as e:
            logger.warning(f"Error calculating geometric properties: {e}")
    
    def analyze_raster_properties(self, file_path: str) -> Dict[str, Any]:
        """Analyze raster-specific properties"""
        raster_info = {
            'is_raster': False,
            'width': None,
            'height': None,
            'band_count': None,
            'data_types': None,
            'nodata_values': None,
            'pixel_size_x': None,
            'pixel_size_y': None,
            'rotation': None,
            'colormap': None,
            'statistics': None
        }
        
        if not HAS_ENHANCED_GEOSPATIAL:
            return raster_info
        
        try:
            with rasterio.open(file_path) as src:
                raster_info['is_raster'] = True
                raster_info['width'] = src.width
                raster_info['height'] = src.height
                raster_info['band_count'] = src.count
                raster_info['data_types'] = [src.dtypes[i] for i in range(src.count)]
                raster_info['nodata_values'] = [src.nodatavals[i] for i in range(src.count)]
                
                # Get pixel size
                transform = src.transform
                raster_info['pixel_size_x'] = abs(transform.a)
                raster_info['pixel_size_y'] = abs(transform.e)
                raster_info['rotation'] = transform.b != 0 or transform.d != 0
                
                # Get statistics for first band
                try:
                    band_data = src.read(1, masked=True)
                    raster_info['statistics'] = {
                        'min': float(band_data.min()),
                        'max': float(band_data.max()),
                        'mean': float(band_data.mean()),
                        'std': float(band_data.std())
                    }
                except Exception:
                    pass
                
                # Check for colormap
                if src.colormap(1):
                    raster_info['colormap'] = True
                    
        except Exception as e:
            logger.warning(f"Error analyzing raster properties: {e}")
        
        return raster_info
    
    def analyze_vector_properties(self, file_path: str) -> Dict[str, Any]:
        """Analyze vector-specific properties"""
        vector_info = {
            'is_vector': False,
            'layer_count': None,
            'geometry_types': None,
            'feature_count': None,
            'field_names': None,
            'field_types': None
        }
        
        if not HAS_ENHANCED_GEOSPATIAL:
            return vector_info
        
        try:
            with fiona.open(file_path) as src:
                vector_info['is_vector'] = True
                vector_info['feature_count'] = len(src)
                vector_info['geometry_types'] = [src.schema['geometry']]
                vector_info['field_names'] = list(src.schema['properties'].keys())
                vector_info['field_types'] = list(src.schema['properties'].values())
                
        except Exception:
            pass
        
        try:
            # Additional analysis with geopandas
            gdf = gpd.read_file(file_path)
            if not gdf.empty:
                vector_info['is_vector'] = True
                vector_info['feature_count'] = len(gdf)
                vector_info['geometry_types'] = gdf.geometry.geom_type.unique().tolist()
                vector_info['field_names'] = gdf.columns.tolist()
                vector_info['field_types'] = gdf.dtypes.astype(str).tolist()
                
        except Exception as e:
            logger.warning(f"Error analyzing vector properties: {e}")
        
        return vector_info
    
    def extract_comprehensive_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract comprehensive metadata for any geospatial file"""
        if not self.initialized:
            self.initialize_models()
        
        metadata = {
            'timestamp': datetime.now().isoformat(),
            'file_path': str(file_path),
            'extraction_success': True,
            'errors': []
        }
        
        try:
            # Basic file type detection
            metadata['file_type'] = self.detect_file_type(file_path)
            
            # CRS information
            metadata['coordinate_system'] = self.extract_crs_information(file_path)
            
            # Spatial extent
            metadata['spatial_extent'] = self.calculate_spatial_extent(file_path)
            
            # Format-specific analysis
            if metadata['file_type']['data_type'] == 'raster':
                metadata['raster_properties'] = self.analyze_raster_properties(file_path)
            elif metadata['file_type']['data_type'] == 'vector':
                metadata['vector_properties'] = self.analyze_vector_properties(file_path)
            
            # AI analysis for image files
            if (self.ai_initialized and 
                metadata['file_type']['format_category'] == 'raster' and
                metadata['file_type']['file_extension'] in {'.tif', '.tiff', '.jpg', '.jpeg', '.png'}):
                try:
                    ai_metadata = self._extract_ai_metadata(file_path)
                    metadata['ai_analysis'] = ai_metadata
                except Exception as e:
                    metadata['errors'].append(f"AI analysis failed: {str(e)}")
            
        except Exception as e:
            metadata['extraction_success'] = False
            metadata['errors'].append(str(e))
            logger.error(f"Error extracting metadata from {file_path}: {e}")
        
        return metadata
    
    def _extract_ai_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extract AI-powered metadata for image files"""
        ai_metadata = {
            'scene_description': None,
            'detected_objects': [],
            'confidence_scores': {},
            'land_cover_analysis': None
        }
        
        try:
            # Load and preprocess image
            image = Image.open(file_path).convert('RGB')
            
            # Generate scene description
            if hasattr(self, 'image_captioning_model'):
                caption_result = self.image_captioning_model(image)
                if caption_result:
                    ai_metadata['scene_description'] = caption_result[0]['generated_text']
                    ai_metadata['confidence_scores']['scene_description'] = caption_result[0].get('score', 0.0)
            
            # Object detection
            if hasattr(self, 'object_detection_model'):
                objects = self.object_detection_model(image)
                ai_metadata['detected_objects'] = [
                    {
                        'label': obj['label'],
                        'confidence': obj['score'],
                        'bbox': obj['box']
                    }
                    for obj in objects if obj['score'] > 0.5
                ]
            
        except Exception as e:
            logger.warning(f"AI metadata extraction failed: {e}")
        
        return ai_metadata


def get_enhanced_metadata_extraction_status():
    """Get the status of enhanced geospatial capabilities"""
    return {
        'enhanced_geospatial_available': HAS_ENHANCED_GEOSPATIAL,
        'ai_features_available': HAS_AI_LIBS,
        'gdal_version': gdal.__version__ if HAS_ENHANCED_GEOSPATIAL else None,
        'supported_raster_formats': list(EnhancedGeospatialMetadataExtractor.RASTER_FORMATS),
        'supported_vector_formats': list(EnhancedGeospatialMetadataExtractor.VECTOR_FORMATS),
        'supported_project_formats': list(EnhancedGeospatialMetadataExtractor.PROJECT_FORMATS)
    }