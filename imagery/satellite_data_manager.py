#!/usr/bin/env python3
"""
Satellite Data Manager for handling various satellite data formats.
Supports Landsat data downloads including .tar files, metadata parsing, and file organization.
"""

import os
import tarfile
import zipfile
import shutil
import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from datetime import datetime
import logging

# Django integration functions
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class SatelliteScene:
    """Represents a satellite scene with metadata and file information."""
    scene_id: str
    satellite: str
    sensor: str
    date_acquired: str
    path: int
    row: int
    cloud_cover: float
    processing_level: str
    collection: str
    files: List[str]
    metadata_file: Optional[str] = None
    bounds: Optional[Tuple[float, float, float, float]] = None  # (min_lon, min_lat, max_lon, max_lat)

class SatelliteDataManager:
    """Manages satellite data downloads, extraction, and organization."""
    
    def __init__(self, base_data_dir: str = "data"):
        """
        Initialize the satellite data manager.
        
        Args:
            base_data_dir: Base directory for storing satellite data
        """
        self.base_data_dir = Path(base_data_dir)
        self.raw_dir = self.base_data_dir / "raw"
        self.processed_dir = self.base_data_dir / "processed"
        self.metadata_dir = self.base_data_dir / "metadata"
        self.extracted_dir = self.base_data_dir / "extracted"
        
        # Create directory structure
        for directory in [self.raw_dir, self.processed_dir, self.metadata_dir, self.extracted_dir]:
            directory.mkdir(parents=True, exist_ok=True)
            
        logger.info(f"Initialized SatelliteDataManager with base directory: {self.base_data_dir}")
    
    def extract_archive(self, archive_path: str, extract_to: Optional[str] = None) -> str:
        """
        Extract tar or zip archive to specified directory.
        
        Args:
            archive_path: Path to the archive file
            extract_to: Directory to extract to (optional)
            
        Returns:
            Path to the extracted directory
        """
        archive_path = Path(archive_path)
        
        if extract_to is None:
            extract_to = self.extracted_dir / archive_path.stem
        else:
            extract_to = Path(extract_to)
        
        extract_to.mkdir(parents=True, exist_ok=True)
        
        try:
            if archive_path.suffix.lower() == '.tar':
                with tarfile.open(archive_path, 'r') as tar:
                    tar.extractall(path=extract_to)
                    extracted_files = tar.getnames()
            elif archive_path.suffix.lower() in ['.zip']:
                with zipfile.ZipFile(archive_path, 'r') as zip_ref:
                    zip_ref.extractall(extract_to)
                    extracted_files = zip_ref.namelist()
            elif archive_path.suffix.lower() in ['.tar.gz', '.tgz']:
                with tarfile.open(archive_path, 'r:gz') as tar:
                    tar.extractall(path=extract_to)
                    extracted_files = tar.getnames()
            else:
                raise ValueError(f"Unsupported archive format: {archive_path.suffix}")
            
            logger.info(f"Extracted {len(extracted_files)} files from {archive_path} to {extract_to}")
            return str(extract_to)
            
        except Exception as e:
            logger.error(f"Failed to extract {archive_path}: {e}")
            raise
    
    def find_metadata_file(self, directory: str) -> Optional[str]:
        """
        Find the metadata file in a directory.
        
        Args:
            directory: Directory to search in
            
        Returns:
            Path to metadata file if found, None otherwise
        """
        directory = Path(directory)
        
        # Common metadata file patterns
        metadata_patterns = [
            '*_MTL.txt',      # Landsat metadata
            '*_MTL.TXT',      
            '*_metadata.txt',
            '*_metadata.TXT',
            '*MTL*',
            '*.xml',          # Sentinel metadata
            '*.json',         # STAC metadata
        ]
        
        for pattern in metadata_patterns:
            files = list(directory.glob(pattern))
            if files:
                logger.info(f"Found metadata file: {files[0]}")
                return str(files[0])
        
        # Recursive search in subdirectories
        for subdir in directory.iterdir():
            if subdir.is_dir():
                metadata_file = self.find_metadata_file(str(subdir))
                if metadata_file:
                    return metadata_file
        
        logger.warning(f"No metadata file found in {directory}")
        return None
    
    def parse_landsat_scene_id(self, scene_id: str) -> Dict[str, Any]:
        """
        Parse Landsat scene ID to extract components.
        
        Example: LC08_L1TP_169073_20240731_20240807_02_T1
        
        Args:
            scene_id: Landsat scene identifier
            
        Returns:
            Dictionary with parsed components
        """
        # Handle both old and new format scene IDs
        if len(scene_id) == 21:  # Old format: LC81690732024213LGN00
            pattern = r'([A-Z]{2})(\d{1})(\d{3})(\d{3})(\d{4})(\d{3})([A-Z]{3})(\d{2})'
            match = re.match(pattern, scene_id)
            if match:
                sensor, satellite, path, row, year, doy, station, version = match.groups()
                date_obj = datetime.strptime(f"{year}{doy}", "%Y%j")
                return {
                    'sensor': sensor,
                    'satellite': int(satellite),
                    'path': int(path),
                    'row': int(row),
                    'date': date_obj.strftime("%Y-%m-%d"),
                    'station': station,
                    'version': version
                }
        else:  # New format: LC08_L1TP_169073_20240731_20240807_02_T1
            parts = scene_id.split('_')
            if len(parts) >= 7:
                return {
                    'sensor': parts[0][:2],
                    'satellite': int(parts[0][2:]),
                    'processing_level': parts[1],
                    'path': int(parts[2][:3]),
                    'row': int(parts[2][3:]),
                    'acquisition_date': parts[3],
                    'processing_date': parts[4],
                    'collection': parts[5],
                    'category': parts[6]
                }
        
        logger.warning(f"Could not parse scene ID: {scene_id}")
        return {}
    
    def extract_bounds_from_metadata(self, metadata_content: str) -> Optional[Tuple[float, float, float, float]]:
        """
        Extract geographic bounds from metadata content.
        
        Args:
            metadata_content: Content of metadata file
            
        Returns:
            Tuple of (min_lon, min_lat, max_lon, max_lat) or None
        """
        try:
            # Look for corner coordinates in Landsat metadata
            corner_patterns = {
                'ul_lat': r'CORNER_UL_LAT_PRODUCT\s*=\s*([-\d.]+)',
                'ul_lon': r'CORNER_UL_LON_PRODUCT\s*=\s*([-\d.]+)',
                'ur_lat': r'CORNER_UR_LAT_PRODUCT\s*=\s*([-\d.]+)',
                'ur_lon': r'CORNER_UR_LON_PRODUCT\s*=\s*([-\d.]+)',
                'll_lat': r'CORNER_LL_LAT_PRODUCT\s*=\s*([-\d.]+)',
                'll_lon': r'CORNER_LL_LON_PRODUCT\s*=\s*([-\d.]+)',
                'lr_lat': r'CORNER_LR_LAT_PRODUCT\s*=\s*([-\d.]+)',
                'lr_lon': r'CORNER_LR_LON_PRODUCT\s*=\s*([-\d.]+)',
            }
            
            coords = {}
            for key, pattern in corner_patterns.items():
                match = re.search(pattern, metadata_content)
                if match:
                    coords[key] = float(match.group(1))
            
            if len(coords) == 8:  # All corner coordinates found
                lats = [coords['ul_lat'], coords['ur_lat'], coords['ll_lat'], coords['lr_lat']]
                lons = [coords['ul_lon'], coords['ur_lon'], coords['ll_lon'], coords['lr_lon']]
                
                return (min(lons), min(lats), max(lons), max(lats))
            
        except Exception as e:
            logger.error(f"Error extracting bounds from metadata: {e}")
        
        return None
    
    def process_satellite_archive(self, archive_path: str) -> SatelliteScene:
        """
        Process a satellite data archive (tar, zip) and extract scene information.
        
        Args:
            archive_path: Path to the satellite data archive
            
        Returns:
            SatelliteScene object with extracted information
        """
        archive_path = Path(archive_path)
        logger.info(f"Processing satellite archive: {archive_path}")
        
        # Extract the archive
        extract_dir = self.extract_archive(str(archive_path))
        
        # Find metadata file
        metadata_file = self.find_metadata_file(extract_dir)
        
        # Parse scene ID from filename or directory name
        scene_id = archive_path.stem
        if '_' in scene_id:
            # Try to extract scene ID from filename
            parts = scene_id.split('_')
            if len(parts) >= 3:
                scene_id = '_'.join(parts[:3])  # Take first 3 parts as scene ID base
        
        # Parse scene information
        scene_info = self.parse_landsat_scene_id(scene_id)
        
        # Get list of extracted files
        extracted_files = []
        for root, dirs, files in os.walk(extract_dir):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, extract_dir)
                extracted_files.append(rel_path)
        
        # Parse metadata if available
        bounds = None
        cloud_cover = 0.0
        processing_level = scene_info.get('processing_level', 'Unknown')
        
        if metadata_file:
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata_content = f.read()
                
                # Extract bounds
                bounds = self.extract_bounds_from_metadata(metadata_content)
                
                # Extract cloud cover
                cloud_match = re.search(r'CLOUD_COVER\s*=\s*([\d.]+)', metadata_content)
                if cloud_match:
                    cloud_cover = float(cloud_match.group(1))
                
            except Exception as e:
                logger.error(f"Error parsing metadata file {metadata_file}: {e}")
        
        # Create SatelliteScene object
        scene = SatelliteScene(
            scene_id=scene_id,
            satellite=f"LANDSAT_{scene_info.get('satellite', 'UNKNOWN')}",
            sensor=scene_info.get('sensor', 'UNKNOWN'),
            date_acquired=scene_info.get('date', scene_info.get('acquisition_date', 'UNKNOWN')),
            path=scene_info.get('path', 0),
            row=scene_info.get('row', 0),
            cloud_cover=cloud_cover,
            processing_level=processing_level,
            collection=scene_info.get('collection', scene_info.get('category', 'UNKNOWN')),
            files=extracted_files,
            metadata_file=metadata_file,
            bounds=bounds
        )
        
        # Save scene information
        self.save_scene_info(scene, extract_dir)
        
        logger.info(f"Successfully processed scene: {scene.scene_id}")
        return scene
    
    def save_scene_info(self, scene: SatelliteScene, extract_dir: str):
        """
        Save scene information to JSON file.
        
        Args:
            scene: SatelliteScene object
            extract_dir: Directory where files were extracted
        """
        scene_info_file = self.metadata_dir / f"{scene.scene_id}_info.json"
        
        scene_data = {
            'scene_id': scene.scene_id,
            'satellite': scene.satellite,
            'sensor': scene.sensor,
            'date_acquired': scene.date_acquired,
            'path': scene.path,
            'row': scene.row,
            'cloud_cover': scene.cloud_cover,
            'processing_level': scene.processing_level,
            'collection': scene.collection,
            'files': scene.files,
            'metadata_file': scene.metadata_file,
            'bounds': scene.bounds,
            'extract_directory': extract_dir,
            'processed_at': datetime.now().isoformat()
        }
        
        with open(scene_info_file, 'w') as f:
            json.dump(scene_data, f, indent=2)
        
        logger.info(f"Saved scene info to: {scene_info_file}")
    
    def list_processed_scenes(self) -> List[Dict[str, Any]]:
        """
        List all processed scenes.
        
        Returns:
            List of scene information dictionaries
        """
        scenes = []
        for info_file in self.metadata_dir.glob("*_info.json"):
            try:
                with open(info_file, 'r') as f:
                    scene_data = json.load(f)
                scenes.append(scene_data)
            except Exception as e:
                logger.error(f"Error reading scene info file {info_file}: {e}")
        
        return sorted(scenes, key=lambda x: x.get('date_acquired', ''))
    
    def get_scene_files_by_type(self, scene_id: str) -> Dict[str, List[str]]:
        """
        Get files for a scene organized by type.
        
        Args:
            scene_id: Scene identifier
            
        Returns:
            Dictionary with file types as keys and file lists as values
        """
        # Load scene info
        scene_info_file = self.metadata_dir / f"{scene_id}_info.json"
        if not scene_info_file.exists():
            logger.error(f"Scene info file not found: {scene_info_file}")
            return {}
        
        with open(scene_info_file, 'r') as f:
            scene_data = json.load(f)
        
        files_by_type = {
            'metadata': [],
            'imagery': [],
            'quality': [],
            'other': []
        }
        
        for file_path in scene_data.get('files', []):
            file_lower = file_path.lower()
            if any(x in file_lower for x in ['mtl', 'metadata', '.xml', '.json']):
                files_by_type['metadata'].append(file_path)
            elif any(x in file_lower for x in ['.tif', '.tiff', 'sr_b', 'st_b']):
                files_by_type['imagery'].append(file_path)
            elif any(x in file_lower for x in ['qa', 'quality', 'bqa']):
                files_by_type['quality'].append(file_path)
            else:
                files_by_type['other'].append(file_path)
        
        return files_by_type

# Django view functions
@csrf_exempt
@require_http_methods(["POST"])
def upload_satellite_data(request):
    """
    Django view to handle satellite data archive uploads.
    """
    try:
        if 'file' not in request.FILES:
            return JsonResponse({'error': 'No file provided'}, status=400)
        
        uploaded_file = request.FILES['file']
        
        # Validate file type
        allowed_extensions = ['.tar', '.tar.gz', '.tgz', '.zip']
        file_name = uploaded_file.name.lower()
        
        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            return JsonResponse({
                'error': f'File type not supported. Allowed: {", ".join(allowed_extensions)}'
            }, status=400)
        
        # Save the uploaded file
        file_path = default_storage.save(
            f'satellite_archives/{uploaded_file.name}',
            ContentFile(uploaded_file.read())
        )
        
        # Process the archive
        manager = SatelliteDataManager()
        full_path = default_storage.path(file_path)
        
        try:
            scene = manager.process_satellite_archive(full_path)
            
            return JsonResponse({
                'success': True,
                'scene_id': scene.scene_id,
                'satellite': scene.satellite,
                'sensor': scene.sensor,
                'date_acquired': scene.date_acquired,
                'cloud_cover': scene.cloud_cover,
                'files_extracted': len(scene.files),
                'bounds': scene.bounds,
                'message': f'Successfully processed {scene.scene_id}'
            })
            
        except Exception as e:
            logger.error(f"Error processing satellite archive: {e}")
            return JsonResponse({
                'error': f'Failed to process archive: {str(e)}'
            }, status=500)
    
    except Exception as e:
        logger.error(f"Error in upload_satellite_data: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def list_satellite_data(request):
    """
    Django view to list processed satellite scenes.
    """
    try:
        manager = SatelliteDataManager()
        scenes = manager.list_processed_scenes()
        
        # Apply filters if provided
        satellite_filter = request.GET.get('satellite')
        date_from = request.GET.get('date_from')
        date_to = request.GET.get('date_to')
        max_cloud_cover = request.GET.get('max_cloud_cover')
        
        if satellite_filter:
            scenes = [s for s in scenes if satellite_filter.upper() in s.get('satellite', '').upper()]
        
        if date_from:
            scenes = [s for s in scenes if s.get('date_acquired', '') >= date_from]
        
        if date_to:
            scenes = [s for s in scenes if s.get('date_acquired', '') <= date_to]
        
        if max_cloud_cover:
            try:
                max_cloud = float(max_cloud_cover)
                scenes = [s for s in scenes if s.get('cloud_cover', 100) <= max_cloud]
            except ValueError:
                pass
        
        return JsonResponse({
            'success': True,
            'scenes': scenes,
            'total_count': len(scenes)
        })
    
    except Exception as e:
        logger.error(f"Error in list_satellite_data: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def satellite_ai_analysis(request):
    """
    Placeholder for AI analysis of satellite data.
    """
    scene_id = request.GET.get('scene_id')
    if not scene_id:
        return JsonResponse({'error': 'scene_id parameter required'}, status=400)
    
    try:
        manager = SatelliteDataManager()
        files_by_type = manager.get_scene_files_by_type(scene_id)
        
        # Mock AI analysis results
        analysis_results = {
            'scene_id': scene_id,
            'analysis_type': 'basic_statistics',
            'vegetation_index': {
                'ndvi_mean': 0.45,
                'ndvi_std': 0.23,
                'vegetation_coverage': '67%'
            },
            'land_cover': {
                'urban': '15%',
                'forest': '45%',
                'agriculture': '30%',
                'water': '5%',
                'other': '5%'
            },
            'quality_metrics': {
                'cloud_coverage': '< 1%',
                'image_quality': 'Excellent',
                'geometric_accuracy': 'High'
            },
            'available_bands': len(files_by_type.get('imagery', [])),
            'processing_timestamp': datetime.now().isoformat()
        }
        
        return JsonResponse({
            'success': True,
            'analysis': analysis_results
        })
    
    except Exception as e:
        logger.error(f"Error in satellite_ai_analysis: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
def process_satellite_archive(request):
    """
    Django view to process an already uploaded satellite archive.
    """
    try:
        import json
        data = json.loads(request.body)
        archive_path = data.get('archive_path')
        
        if not archive_path:
            return JsonResponse({'error': 'archive_path required'}, status=400)
        
        manager = SatelliteDataManager()
        scene = manager.process_satellite_archive(archive_path)
        
        return JsonResponse({
            'success': True,
            'scene': {
                'scene_id': scene.scene_id,
                'satellite': scene.satellite,
                'sensor': scene.sensor,
                'date_acquired': scene.date_acquired,
                'path': scene.path,
                'row': scene.row,
                'cloud_cover': scene.cloud_cover,
                'processing_level': scene.processing_level,
                'collection': scene.collection,
                'files_count': len(scene.files),
                'bounds': scene.bounds
            }
        })
    
    except Exception as e:
        logger.error(f"Error in process_satellite_archive: {e}")
        return JsonResponse({'error': str(e)}, status=500)

def main():
    """Example usage of the SatelliteDataManager."""
    manager = SatelliteDataManager("data")
    
    print("🛰️  Satellite Data Manager - Example Usage")
    print("=" * 50)
    
    # List processed scenes
    scenes = manager.list_processed_scenes()
    print(f"Found {len(scenes)} processed scenes:")
    
    for scene in scenes[:5]:  # Show first 5 scenes
        print(f"  • {scene['scene_id']} - {scene['date_acquired']} - {scene['cloud_cover']}% cloud")
    
    if scenes:
        # Show file types for first scene
        first_scene = scenes[0]
        files_by_type = manager.get_scene_files_by_type(first_scene['scene_id'])
        print(f"\nFile types for {first_scene['scene_id']}:")
        for file_type, files in files_by_type.items():
            print(f"  {file_type}: {len(files)} files")

if __name__ == "__main__":
    main()
