"""
Advanced geospatial services for satellite data management and processing.
"""
import os
import json
import logging
import zipfile
import tarfile
import tempfile
import shutil
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from pathlib import Path

import requests
import pandas as pd
from django.conf import settings
from django.contrib.gis.geos import GEOSGeometry, Polygon, MultiPolygon
from django.utils import timezone
from django.core.files.storage import default_storage
from django.db.models import Q
import rasterio
from rasterio.mask import mask
from rasterio.warp import transform_bounds
import numpy as np
import fiona
import geopandas as gpd

from .models import (
    AOI, SatelliteImage, Download, IndexResult, 
    ProcessingJob, AOISatelliteImage, UserProfile,
    AdministrativeBoundarySet, AdministrativeBoundary
)

logger = logging.getLogger('geospatial_repo')

@dataclass
class SatelliteSearchResult:
    """Data class for satellite search results"""
    provider: str
    tile_id: str
    scene_id: str
    sensing_date: datetime
    cloud_cover: float
    bounds: Tuple[float, float, float, float]  # (minx, miny, maxx, maxy)
    download_url: str
    metadata: Dict
    
class SatelliteDataService:
    """Service for searching and managing satellite data from various providers"""
    
    def __init__(self):
        self.providers = settings.GEOSPATIAL_SETTINGS.get('SATELLITE_PROVIDERS', {})
        
    def search_imagery(
        self, 
        aoi: AOI, 
        start_date: datetime, 
        end_date: datetime,
        providers: List[str] = None,
        max_cloud_cover: float = 30.0,
        max_results: int = 100
    ) -> List[SatelliteSearchResult]:
        """
        Search for satellite imagery intersecting with AOI in date range.
        
        Args:
            aoi: Area of Interest to search
            start_date: Start of date range
            end_date: End of date range  
            providers: List of providers to search (default: all)
            max_cloud_cover: Maximum cloud cover percentage
            max_results: Maximum number of results
            
        Returns:
            List of satellite search results
        """
        results = []
        
        if not providers:
            providers = list(self.providers.keys())
            
        for provider in providers:
            try:
                provider_results = self._search_provider(
                    provider, aoi, start_date, end_date, max_cloud_cover, max_results
                )
                results.extend(provider_results)
                logger.info(f"Found {len(provider_results)} results from {provider}")
            except Exception as e:
                logger.error(f"Error searching {provider}: {e}")
                
        # Sort by sensing date (newest first) and cloud cover
        results.sort(key=lambda x: (x.sensing_date, x.cloud_cover), reverse=True)
        
        return results[:max_results]
    
    def _search_provider(
        self, 
        provider: str, 
        aoi: AOI, 
        start_date: datetime, 
        end_date: datetime,
        max_cloud_cover: float,
        max_results: int
    ) -> List[SatelliteSearchResult]:
        """Search specific provider for imagery"""
        
        if provider.lower() == 'sentinel2':
            return self._search_sentinel2(aoi, start_date, end_date, max_cloud_cover, max_results)
        elif provider.lower() == 'landsat8':
            return self._search_landsat8(aoi, start_date, end_date, max_cloud_cover, max_results)
        else:
            logger.warning(f"Provider {provider} not implemented yet")
            return []
    
    def _search_sentinel2(
        self, 
        aoi: AOI, 
        start_date: datetime, 
        end_date: datetime,
        max_cloud_cover: float,
        max_results: int
    ) -> List[SatelliteSearchResult]:
        """Search Copernicus Data Space for Sentinel-2 data"""
        
        # Get AOI bounds
        bounds = aoi.geometry.extent  # (minx, miny, maxx, maxy)
        
        # Construct OData query for Copernicus Data Space
        base_url = self.providers['sentinel2']['api_endpoint']
        
        # Build OData filter
        filter_params = [
            f"ContentDate/Start ge {start_date.strftime('%Y-%m-%dT%H:%M:%S.%fZ')}",
            f"ContentDate/Start le {end_date.strftime('%Y-%m-%dT%H:%M:%S.%fZ')}",
            f"contains(Name,'S2')",
            f"CloudCover le {max_cloud_cover}",
            f"OData.CSC.Intersects(area=geography'SRID=4326;POLYGON(({bounds[0]} {bounds[1]},{bounds[2]} {bounds[1]},{bounds[2]} {bounds[3]},{bounds[0]} {bounds[3]},{bounds[0]} {bounds[1]}))')"
        ]
        
        query_params = {
            '$filter': ' and '.join(filter_params),
            '$orderby': 'ContentDate/Start desc',
            '$top': max_results,
            '$select': 'Id,Name,ContentDate,CloudCover,ContentGeometry,Properties'
        }
        
        try:
            response = requests.get(f"{base_url}/Products", params=query_params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            for item in data.get('value', []):
                # Parse geometry
                geom_wkt = item.get('ContentGeometry', {}).get('coordinates', [[]])
                if geom_wkt:
                    # Convert coordinates to bounds
                    coords = geom_wkt[0] if geom_wkt else []
                    if coords:
                        lons, lats = zip(*coords)
                        bounds = (min(lons), min(lats), max(lons), max(lats))
                    else:
                        continue
                else:
                    continue
                
                result = SatelliteSearchResult(
                    provider='SENTINEL2',
                    tile_id=item.get('Name', ''),
                    scene_id=item.get('Id', ''),
                    sensing_date=datetime.fromisoformat(item.get('ContentDate', {}).get('Start', '').replace('Z', '+00:00')),
                    cloud_cover=float(item.get('CloudCover', 0)),
                    bounds=bounds,
                    download_url=f"{base_url}/Products({item.get('Id')})/Download",
                    metadata=item
                )
                results.append(result)
                
            return results
            
        except Exception as e:
            logger.error(f"Error searching Sentinel-2: {e}")
            return []
    
    def _search_landsat8(
        self, 
        aoi: AOI, 
        start_date: datetime, 
        end_date: datetime,
        max_cloud_cover: float,
        max_results: int
    ) -> List[SatelliteSearchResult]:
        """Search USGS for Landsat 8 data"""
        # Placeholder for Landsat 8 search implementation
        # This would integrate with USGS M2M API
        logger.info("Landsat 8 search not yet implemented")
        return []
    
    def download_imagery(self, search_result: SatelliteSearchResult, aoi: AOI = None) -> Optional[SatelliteImage]:
        """
        Download satellite imagery and create database record.
        
        Args:
            search_result: Search result to download
            aoi: Optional AOI to associate with image
            
        Returns:
            Created SatelliteImage object or None if failed
        """
        try:
            # Create unique filename
            timestamp = search_result.sensing_date.strftime('%Y%m%d_%H%M%S')
            filename = f"{search_result.provider}_{search_result.tile_id}_{timestamp}.zip"
            
            # Download to imagery directory
            imagery_dir = Path(settings.GEOSPATIAL_SETTINGS['IMAGERY_ROOT'])
            imagery_dir.mkdir(exist_ok=True)
            file_path = imagery_dir / filename
            
            # Download the file
            logger.info(f"Downloading {search_result.download_url} to {file_path}")
            response = requests.get(search_result.download_url, stream=True, timeout=300)
            response.raise_for_status()
            
            with open(file_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            
            # Get file size
            file_size_mb = file_path.stat().st_size / (1024 * 1024)
            
            # Create geometry from bounds
            minx, miny, maxx, maxy = search_result.bounds
            bounds_geom = Polygon.from_bbox((minx, miny, maxx, maxy))
            
            # Create or update SatelliteImage record
            satellite_image, created = SatelliteImage.objects.get_or_create(
                provider=search_result.provider,
                tile_id=search_result.tile_id,
                sensed_at=search_result.sensing_date,
                defaults={
                    'scene_id': search_result.scene_id,
                    'cloud_cover': search_result.cloud_cover,
                    'bounds': bounds_geom,
                    'file_path': str(file_path),
                    'file_size_mb': file_size_mb,
                    'meta': search_result.metadata,
                    'is_available': True,
                    'download_url': search_result.download_url,
                }
            )
            
            # Associate with AOI if provided
            if aoi and created:
                aoi.satellite_images.add(satellite_image)
                
            logger.info(f"{'Created' if created else 'Updated'} SatelliteImage {satellite_image.id}")
            return satellite_image
            
        except Exception as e:
            logger.error(f"Error downloading imagery: {e}")
            return None


class ImageProcessingService:
    """Service for processing satellite imagery (clipping, index calculation)"""
    
    def __init__(self):
        self.processing_dir = Path(settings.GEOSPATIAL_SETTINGS['PROCESSED_ROOT'])
        self.processing_dir.mkdir(exist_ok=True)
    
    def clip_image_to_aoi(
        self, 
        satellite_image: SatelliteImage, 
        aoi: AOI,
        output_format: str = 'geotiff'
    ) -> Optional[str]:
        """
        Clip satellite image to AOI boundaries.
        
        Args:
            satellite_image: Image to clip
            aoi: Area of Interest for clipping
            output_format: Output format (geotiff, cog, netcdf)
            
        Returns:
            Path to clipped file or None if failed
        """
        try:
            # Generate output filename
            timestamp = satellite_image.sensed_at.strftime('%Y%m%d_%H%M%S')
            output_filename = f"{satellite_image.provider}_{satellite_image.tile_id}_{aoi.id}_{timestamp}_clipped.tif"
            output_path = self.processing_dir / output_filename
            
            # Open the satellite image
            with rasterio.open(satellite_image.file_path) as src:
                # Convert AOI geometry to rasterio format
                aoi_geom = json.loads(aoi.geometry.geojson)
                
                # Clip the image
                out_image, out_transform = mask(src, [aoi_geom], crop=True)
                out_meta = src.meta.copy()
                
                # Update metadata
                out_meta.update({
                    "driver": "GTiff",
                    "height": out_image.shape[1],
                    "width": out_image.shape[2],
                    "transform": out_transform,
                    "compress": "lzw"
                })
                
                # Write clipped image
                with rasterio.open(output_path, "w", **out_meta) as dest:
                    dest.write(out_image)
            
            logger.info(f"Clipped image saved to {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error clipping image: {e}")
            return None
    
    def calculate_index(
        self, 
        satellite_image: SatelliteImage, 
        aoi: AOI,
        index_type: str,
        custom_formula: str = None
    ) -> Optional[IndexResult]:
        """
        Calculate vegetation/spectral index for AOI.
        
        Args:
            satellite_image: Source satellite image
            aoi: Area of Interest
            index_type: Type of index (NDVI, NDWI, EVI, etc.)
            custom_formula: Custom formula for custom indices
            
        Returns:
            IndexResult object or None if failed
        """
        try:
            # First clip the image to AOI
            clipped_path = self.clip_image_to_aoi(satellite_image, aoi)
            if not clipped_path:
                return None
            
            # Load supported indices configuration
            indices_config = settings.GEOSPATIAL_SETTINGS.get('SUPPORTED_INDICES', {})
            
            if index_type not in indices_config and not custom_formula:
                logger.error(f"Unknown index type: {index_type}")
                return None
            
            # Calculate the index
            with rasterio.open(clipped_path) as src:
                # This is a simplified implementation
                # In practice, you'd need band mapping logic based on provider
                bands = src.read()
                
                if index_type == 'NDVI':
                    # Assuming bands are in order: Blue, Green, Red, NIR
                    red = bands[2].astype(float)
                    nir = bands[3].astype(float)
                    
                    # Calculate NDVI
                    ndvi = np.divide(nir - red, nir + red, 
                                   out=np.zeros_like(nir), where=(nir + red) != 0)
                    index_data = ndvi
                    
                elif index_type == 'NDWI':
                    green = bands[1].astype(float)
                    nir = bands[3].astype(float)
                    
                    # Calculate NDWI
                    ndwi = np.divide(green - nir, green + nir,
                                   out=np.zeros_like(green), where=(green + nir) != 0)
                    index_data = ndwi
                    
                else:
                    logger.error(f"Index calculation for {index_type} not implemented")
                    return None
                
                # Calculate statistics
                valid_data = index_data[~np.isnan(index_data)]
                if len(valid_data) == 0:
                    logger.warning("No valid data for index calculation")
                    return None
                
                stats = {
                    'mean_value': float(np.mean(valid_data)),
                    'median_value': float(np.median(valid_data)),
                    'std_deviation': float(np.std(valid_data)),
                    'min_value': float(np.min(valid_data)),
                    'max_value': float(np.max(valid_data))
                }
                
                # Save index raster
                timestamp = satellite_image.sensed_at.strftime('%Y%m%d_%H%M%S')
                index_filename = f"{index_type}_{satellite_image.provider}_{satellite_image.tile_id}_{aoi.id}_{timestamp}.tif"
                index_path = self.processing_dir / index_filename
                
                # Copy metadata and update for single band
                out_meta = src.meta.copy()
                out_meta.update({
                    'count': 1,
                    'dtype': 'float32'
                })
                
                with rasterio.open(index_path, 'w', **out_meta) as dest:
                    dest.write(index_data.astype(np.float32), 1)
            
            # Create IndexResult record
            index_result = IndexResult.objects.create(
                aoi=aoi,
                satellite_image=satellite_image,
                index_type=index_type,
                custom_formula=custom_formula,
                raster_file_path=str(index_path),
                **stats
            )
            
            logger.info(f"Created index result {index_result.id}")
            return index_result
            
        except Exception as e:
            logger.error(f"Error calculating index: {e}")
            return None


class HPCJobService:
    """Service for managing HPC job submissions and monitoring"""
    
    def __init__(self):
        self.scheduler = settings.GEOSPATIAL_SETTINGS.get('JOB_SCHEDULER', 'local')
        self.max_jobs = settings.GEOSPATIAL_SETTINGS.get('MAX_CONCURRENT_JOBS', 5)
    
    def submit_processing_job(
        self, 
        job: ProcessingJob,
        script_path: str,
        cores: int = 1,
        memory_gb: float = 4.0,
        time_hours: int = 2
    ) -> bool:
        """
        Submit a processing job to the HPC scheduler.
        
        Args:
            job: ProcessingJob database object
            script_path: Path to processing script
            cores: Number of CPU cores requested
            memory_gb: Memory in GB
            time_hours: Maximum runtime in hours
            
        Returns:
            True if submission successful
        """
        try:
            if self.scheduler == 'slurm':
                return self._submit_slurm_job(job, script_path, cores, memory_gb, time_hours)
            elif self.scheduler == 'pbs':
                return self._submit_pbs_job(job, script_path, cores, memory_gb, time_hours)
            else:
                return self._submit_local_job(job, script_path)
                
        except Exception as e:
            logger.error(f"Error submitting job {job.id}: {e}")
            job.status = 'failed'
            job.error_message = str(e)
            job.save()
            return False
    
    def _submit_slurm_job(
        self, 
        job: ProcessingJob, 
        script_path: str, 
        cores: int, 
        memory_gb: float, 
        time_hours: int
    ) -> bool:
        """Submit job using SLURM scheduler"""
        import subprocess
        
        # Create SLURM batch script
        slurm_script = f"""#!/bin/bash
#SBATCH --job-name=grs_job_{job.id}
#SBATCH --cpus-per-task={cores}
#SBATCH --mem={memory_gb}G
#SBATCH --time={time_hours:02d}:00:00
#SBATCH --output={job.log_file_path}
#SBATCH --error={job.log_file_path}

{script_path}
"""
        
        # Write script to temporary file
        script_file = Path(f"/tmp/grs_job_{job.id}.sh")
        script_file.write_text(slurm_script)
        
        # Submit job
        result = subprocess.run(
            ['sbatch', str(script_file)],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            # Parse job ID from output
            job_id = result.stdout.strip().split()[-1]
            job.slurm_job_id = job_id
            job.status = 'queued'
            job.allocated_cores = cores
            job.allocated_memory_gb = memory_gb
            job.save()
            logger.info(f"Submitted SLURM job {job_id} for processing job {job.id}")
            return True
        else:
            logger.error(f"SLURM submission failed: {result.stderr}")
            return False
    
    def _submit_local_job(self, job: ProcessingJob, script_path: str) -> bool:
        """Submit job for local execution"""
        import subprocess
        import threading
        
        def run_job():
            try:
                job.status = 'processing'
                job.started_at = timezone.now()
                job.save()
                
                # Execute script
                result = subprocess.run(
                    [script_path],
                    capture_output=True,
                    text=True,
                    timeout=3600  # 1 hour timeout
                )
                
                if result.returncode == 0:
                    job.status = 'complete'
                    logger.info(f"Local job {job.id} completed successfully")
                else:
                    job.status = 'failed'
                    job.error_message = result.stderr
                    logger.error(f"Local job {job.id} failed: {result.stderr}")
                    
            except Exception as e:
                job.status = 'failed'
                job.error_message = str(e)
                logger.error(f"Local job {job.id} error: {e}")
            finally:
                job.completed_at = timezone.now()
                job.save()
        
        # Start job in background thread
        thread = threading.Thread(target=run_job)
        thread.daemon = True
        thread.start()
        
        job.status = 'queued'
        job.save()
        return True
    
    def check_job_status(self, job: ProcessingJob) -> str:
        """Check the current status of a job"""
        if self.scheduler == 'slurm' and job.slurm_job_id:
            return self._check_slurm_status(job)
        elif self.scheduler == 'local':
            return job.status
        else:
            return 'unknown'
    
    def _check_slurm_status(self, job: ProcessingJob) -> str:
        """Check SLURM job status"""
        import subprocess
        
        try:
            result = subprocess.run(
                ['squeue', '-j', job.slurm_job_id, '-h', '-o', '%T'],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0 and result.stdout.strip():
                slurm_status = result.stdout.strip()
                
                # Map SLURM status to our status
                status_mapping = {
                    'PENDING': 'queued',
                    'RUNNING': 'processing',
                    'COMPLETED': 'complete',
                    'FAILED': 'failed',
                    'CANCELLED': 'cancelled'
                }
                
                return status_mapping.get(slurm_status, 'unknown')
            else:
                # Job not found, might be completed
                return 'complete'
                
        except Exception as e:
            logger.error(f"Error checking SLURM status: {e}")
            return 'unknown'


class AOIManagementService:
    """Service for AOI validation, management, and spatial operations"""
    
    @staticmethod
    def validate_aoi_upload(geometry_data: str, file_format: str = 'geojson') -> Tuple[bool, str, Optional[GEOSGeometry]]:
        """
        Validate uploaded AOI geometry.
        
        Args:
            geometry_data: Geometry data as string
            file_format: Format of the geometry data
            
        Returns:
            Tuple of (is_valid, error_message, geometry)
        """
        try:
            if file_format.lower() == 'geojson':
                geom = GEOSGeometry(geometry_data)
            else:
                return False, f"Unsupported format: {file_format}", None
            
            # Validate geometry
            if not geom.valid:
                return False, "Invalid geometry", None
            
            # Check if it's within reasonable bounds
            extent = geom.extent
            if abs(extent[0]) > 180 or abs(extent[2]) > 180:
                return False, "Longitude out of valid range", None
            if abs(extent[1]) > 90 or abs(extent[3]) > 90:
                return False, "Latitude out of valid range", None
            
            # Calculate area
            geom_transformed = geom.transform(3857, clone=True)  # Web Mercator for area calc
            area_km2 = geom_transformed.area / 1_000_000
            
            max_area = settings.GEOSPATIAL_SETTINGS.get('MAX_AOI_SIZE_KM2', 10000)
            if area_km2 > max_area:
                return False, f"AOI area ({area_km2:.2f} km²) exceeds maximum ({max_area} km²)", None
            
            return True, "", geom
            
        except Exception as e:
            return False, f"Error validating geometry: {str(e)}", None
    
    @staticmethod
    def find_optimal_imagery(
        aoi: AOI, 
        start_date: datetime, 
        end_date: datetime,
        max_cloud_cover: float = 30.0
    ) -> List[SatelliteImage]:
        """
        Find optimal imagery for AOI based on coverage and quality.
        
        Args:
            aoi: Area of Interest
            start_date: Start date for search
            end_date: End date for search
            max_cloud_cover: Maximum acceptable cloud cover
            
        Returns:
            List of optimal satellite images
        """
        # Get all intersecting images
        images = aoi.get_intersecting_tiles(
            start_date=start_date,
            end_date=end_date,
            max_cloud_cover=max_cloud_cover
        )
        
        # Score images based on coverage, cloud cover, and recency
        scored_images = []
        for img in images:
            try:
                # Calculate coverage percentage
                intersection = aoi.geometry.intersection(img.bounds)
                coverage = (intersection.area / aoi.geometry.area) * 100
                
                # Calculate score (higher is better)
                # Factors: coverage (40%), cloud cover (30%), recency (30%)
                days_old = (timezone.now().date() - img.sensed_at.date()).days
                recency_score = max(0, 100 - days_old / 365 * 100)  # Newer = better
                cloud_score = 100 - img.cloud_cover  # Less cloud = better
                
                total_score = (coverage * 0.4) + (cloud_score * 0.3) + (recency_score * 0.3)
                
                scored_images.append((img, total_score, coverage))
                
            except Exception as e:
                logger.warning(f"Error scoring image {img.id}: {e}")
                continue
        
        # Sort by score (highest first)
        scored_images.sort(key=lambda x: x[1], reverse=True)
        
        # Return top images that provide good coverage
        selected_images = []
        total_coverage = 0
        
        for img, score, coverage in scored_images:
            selected_images.append(img)
            total_coverage += coverage
            
            # Stop when we have reasonable coverage or max images
            if total_coverage >= 95 or len(selected_images) >= 10:
                break
        
        return selected_images

    @staticmethod
    def parse_geometry_file(file_path: str, file_extension: str) -> List[Dict]:
        """
        Parse geometry file and extract geometries with metadata.
        
        Args:
            file_path: Path to the geometry file
            file_extension: File extension (geojson, zip, tar, rar, etc.)
            
        Returns:
            List of dictionaries containing geometry and metadata
        """
        geometries = []
        
        try:
            # Handle compressed files
            if file_extension.lower() in ['zip', 'tar', 'gz', 'bz2', 'xz', 'rar', '7z']:
                return AOIManagementService._parse_compressed_file(file_path, file_extension)
                
            elif file_extension.lower() in ['geojson', 'json']:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if data.get('type') == 'FeatureCollection':
                    # Handle FeatureCollection
                    for i, feature in enumerate(data.get('features', [])):
                        if feature.get('geometry'):
                            geometry = GEOSGeometry(json.dumps(feature['geometry']))
                            
                            # Convert to MultiPolygon if necessary
                            if geometry.geom_type == 'Polygon':
                                geometry = MultiPolygon(geometry)
                            elif geometry.geom_type not in ['MultiPolygon']:
                                # Skip non-polygon geometries for now
                                continue
                            
                            properties = feature.get('properties', {})
                            
                            geometries.append({
                                'geometry': geometry,
                                'name': properties.get('name', f'Feature {i + 1}'),
                                'description': properties.get('description', ''),
                                'properties': properties
                            })
                
                elif data.get('type') == 'Feature':
                    # Handle single Feature
                    if data.get('geometry'):
                        geometry = GEOSGeometry(json.dumps(data['geometry']))
                        
                        # Convert to MultiPolygon if necessary
                        if geometry.geom_type == 'Polygon':
                            geometry = MultiPolygon(geometry)
                        elif geometry.geom_type not in ['MultiPolygon']:
                            # Skip non-polygon geometries for now
                            raise ValueError("Only Polygon and MultiPolygon geometries are supported")
                        
                        properties = data.get('properties', {})
                        
                        geometries.append({
                            'geometry': geometry,
                            'name': properties.get('name', 'Uploaded Feature'),
                            'description': properties.get('description', ''),
                            'properties': properties
                        })
                
                elif data.get('type') in ['Polygon', 'MultiPolygon']:
                    # Handle direct geometry
                    geometry = GEOSGeometry(json.dumps(data))
                    
                    # Convert to MultiPolygon if necessary
                    if geometry.geom_type == 'Polygon':
                        geometry = MultiPolygon(geometry)
                    
                    geometries.append({
                        'geometry': geometry,
                        'name': 'Uploaded Geometry',
                        'description': '',
                        'properties': {}
                    })
            
            else:
                # For now, only support GeoJSON and compressed files
                raise ValueError(f"Unsupported file format: {file_extension}. Supported formats: GeoJSON (.geojson, .json), compressed archives (.zip, .tar, .gz, .bz2, .xz, .rar, .7z) containing shapefiles or GeoJSON files")
            
        except Exception as e:
            raise ValueError(f"Error parsing geometry file: {str(e)}")
        
        if not geometries:
            raise ValueError("No valid geometries found in file")
        
        return geometries

    @staticmethod
    def _parse_compressed_file(file_path: str, file_extension: str) -> List[Dict]:
        """
        Parse compressed file that may contain shapefiles or other geometry files.
        
        Args:
            file_path: Path to the compressed file
            file_extension: File extension (zip, tar, rar, etc.)
            
        Returns:
            List of dictionaries containing geometry and metadata
        """
        geometries = []
        
        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                # Extract compressed file based on format
                if file_extension.lower() == 'zip':
                    AOIManagementService._extract_zip(file_path, temp_dir)
                elif file_extension.lower() in ['tar', 'gz', 'bz2', 'xz']:
                    AOIManagementService._extract_tar(file_path, temp_dir, file_extension)
                elif file_extension.lower() == 'rar':
                    AOIManagementService._extract_rar(file_path, temp_dir)
                elif file_extension.lower() == '7z':
                    AOIManagementService._extract_7z(file_path, temp_dir)
                else:
                    raise ValueError(f"Unsupported compression format: {file_extension}")
                
                # Look for shapefiles (.shp files)
                shp_files = list(Path(temp_dir).rglob('*.shp'))
                
                if shp_files:
                    # Process shapefiles using GeoDjango
                    for shp_file in shp_files:
                        try:
                            geometries.extend(AOIManagementService._parse_shapefile(str(shp_file)))
                        except Exception as e:
                            logger.warning(f"Error processing shapefile {shp_file}: {e}")
                            continue
                else:
                    # Look for other supported files in the archive
                    geojson_files = list(Path(temp_dir).rglob('*.geojson')) + list(Path(temp_dir).rglob('*.json'))
                    
                    for geojson_file in geojson_files:
                        try:
                            file_geometries = AOIManagementService.parse_geometry_file(str(geojson_file), 'geojson')
                            geometries.extend(file_geometries)
                        except Exception as e:
                            logger.warning(f"Error processing GeoJSON file {geojson_file}: {e}")
                            continue
                
            except Exception as e:
                raise ValueError(f"Error extracting compressed file: {str(e)}")
        
        if not geometries:
            raise ValueError("No valid shapefiles or GeoJSON files found in compressed archive")
        
        return geometries

    @staticmethod
    def _extract_zip(zip_path: str, extract_dir: str):
        """Extract ZIP file."""
        try:
            if not zipfile.is_zipfile(zip_path):
                raise ValueError(
                    "Invalid ZIP file format. The uploaded file does not appear to be a valid ZIP archive.\n"
                    "Please ensure you're uploading a proper ZIP file."
                )
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
                
        except zipfile.BadZipFile:
            raise ValueError(
                "Corrupted or invalid ZIP file. The file appears to be damaged or is not a valid ZIP archive.\n"
                "Please check your file and try again."
            )
        except Exception as e:
            raise ValueError(f"Error extracting ZIP file: {str(e)}")

    @staticmethod
    def _extract_tar(tar_path: str, extract_dir: str, file_extension: str):
        """Extract TAR file (including .tar.gz, .tar.bz2, .tar.xz)."""
        try:
            mode_map = {
                'tar': 'r',
                'gz': 'r:gz',
                'bz2': 'r:bz2',
                'xz': 'r:xz'
            }
            
            # Handle compound extensions like .tar.gz
            if 'tar' in tar_path.lower():
                if tar_path.lower().endswith('.tar.gz') or tar_path.lower().endswith('.tgz'):
                    mode = 'r:gz'
                elif tar_path.lower().endswith('.tar.bz2'):
                    mode = 'r:bz2'
                elif tar_path.lower().endswith('.tar.xz'):
                    mode = 'r:xz'
                else:
                    mode = 'r'
            else:
                mode = mode_map.get(file_extension, 'r')
            
            # Check if file is a valid TAR file
            if not tarfile.is_tarfile(tar_path):
                raise ValueError(
                    "Invalid TAR file format. The uploaded file does not appear to be a valid TAR archive.\n"
                    "Please ensure you're uploading a proper TAR file."
                )
            
            with tarfile.open(tar_path, mode) as tar_ref:
                tar_ref.extractall(extract_dir)
                
        except tarfile.ReadError:
            raise ValueError(
                "Corrupted or invalid TAR file. The file appears to be damaged or is not a valid TAR archive.\n"
                "Please check your file and try again."
            )
        except Exception as e:
            raise ValueError(f"Error extracting TAR file: {str(e)}")

    @staticmethod
    def _extract_rar(rar_path: str, extract_dir: str):
        """Extract RAR file using rarfile library."""
        try:
            import rarfile
            
            # Check if any RAR tool is available by trying to set up tools
            try:
                rarfile.tool_setup()
            except rarfile.RarCannotExec:
                raise ValueError(
                    "RAR extraction tool not found. Please install 'unrar' utility:\n"
                    "• Windows: Download from https://www.rarlab.com/rar_add.htm\n"
                    "• Linux: sudo apt-get install unrar (Ubuntu/Debian) or yum install unrar (RHEL/CentOS)\n"
                    "• macOS: brew install unrar\n\n"
                    "Alternative: Use ZIP, TAR.GZ, or 7Z formats for maximum compatibility."
                )
            
            # Check if the file is actually a valid RAR file
            if not rarfile.is_rarfile(rar_path):
                raise ValueError(
                    "Invalid RAR file format. The uploaded file does not appear to be a valid RAR archive.\n"
                    "Please ensure you're uploading a proper RAR file, or consider using ZIP format instead."
                )
            
            with rarfile.RarFile(rar_path) as rar_ref:
                rar_ref.extractall(extract_dir)
                
        except ImportError:
            raise ValueError(
                "RAR support not available. Please install 'rarfile' package:\n"
                "pip install rarfile\n\n"
                "Note: You'll also need the 'unrar' utility installed on your system."
            )
        except rarfile.RarCannotExec:
            raise ValueError(
                "RAR extraction tool not found. Please install 'unrar' utility:\n"
                "• Windows: Download from https://www.rarlab.com/rar_add.htm\n"
                "• Linux: sudo apt-get install unrar (Ubuntu/Debian) or yum install unrar (RHEL/CentOS)\n"
                "• macOS: brew install unrar\n\n"
                "Alternative: Use ZIP, TAR.GZ, or 7Z formats for maximum compatibility."
            )
        except rarfile.BadRarFile:
            raise ValueError(
                "Corrupted or invalid RAR file. The file appears to be damaged or is not a valid RAR archive.\n"
                "Please check your file and try again, or use a different format like ZIP."
            )
        except rarfile.PasswordRequired:
            raise ValueError(
                "Password-protected RAR files are not supported.\n"
                "Please create an unprotected archive or use ZIP format instead."
            )
        except Exception as e:
            error_msg = str(e)
            if "Cannot find working tool" in error_msg or "tool not found" in error_msg.lower():
                raise ValueError(
                    "RAR extraction tool not found. Please install 'unrar' utility:\n"
                    "• Windows: Download from https://www.rarlab.com/rar_add.htm\n"
                    "• Linux: sudo apt-get install unrar (Ubuntu/Debian) or yum install unrar (RHEL/CentOS)\n"
                    "• macOS: brew install unrar\n\n"
                    "Alternative: Use ZIP, TAR.GZ, or 7Z formats for maximum compatibility."
                )
            else:
                raise ValueError(f"Error extracting RAR file: {error_msg}")
                
    @staticmethod
    def _extract_7z(sevenz_path: str, extract_dir: str):
        """Extract 7Z file using py7zr library."""
        try:
            import py7zr
            
            # Check if file is a valid 7Z file
            if not py7zr.is_7zfile(sevenz_path):
                raise ValueError(
                    "Invalid 7Z file format. The uploaded file does not appear to be a valid 7Z archive.\n"
                    "Please ensure you're uploading a proper 7Z file, or consider using ZIP format instead."
                )
            
            with py7zr.SevenZipFile(sevenz_path, mode='r') as sevenz_ref:
                sevenz_ref.extractall(extract_dir)
                
        except ImportError:
            raise ValueError(
                "7Z support not available. Please install 'py7zr' package:\n"
                "pip install py7zr\n\n"
                "Alternative: Use ZIP or TAR.GZ formats for maximum compatibility."
            )
        except py7zr.exceptions.Bad7zFile:
            raise ValueError(
                "Corrupted or invalid 7Z file. The file appears to be damaged or is not a valid 7Z archive.\n"
                "Please check your file and try again, or use a different format like ZIP."
            )
        except Exception as e:
            raise ValueError(f"Error extracting 7Z file: {str(e)}")

    @staticmethod
    def _parse_shapefile(shp_path: str) -> List[Dict]:
        """
        Parse a shapefile using GeoDjango's DataSource.
        
        Args:
            shp_path: Path to the .shp file
            
        Returns:
            List of dictionaries containing geometry and metadata
        """
        from django.contrib.gis.gdal import DataSource
        
        geometries = []
        
        try:
            # Open shapefile with GDAL
            ds = DataSource(shp_path)
            
            for layer in ds:
                for i, feature in enumerate(layer):
                    geom = feature.geom
                    
                    if geom:
                        # Convert GDAL geometry to GEOS geometry
                        geos_geom = geom.geos
                        
                        # Convert to MultiPolygon if necessary
                        if geos_geom.geom_type == 'Polygon':
                            geos_geom = MultiPolygon(geos_geom)
                        elif geos_geom.geom_type not in ['MultiPolygon']:
                            # Skip non-polygon geometries for now
                            continue
                        
                        # Extract attributes
                        attributes = {}
                        for field in layer.fields:
                            try:
                                attributes[field] = feature.get(field)
                            except:
                                pass
                        
                        # Try to get name from common attribute fields
                        name = (attributes.get('NAME') or 
                               attributes.get('name') or 
                               attributes.get('Name') or 
                               attributes.get('DISTRICT') or
                               attributes.get('district') or
                               f'Feature {i + 1}')
                        
                        description = (attributes.get('DESCRIPTIO') or 
                                     attributes.get('description') or 
                                     attributes.get('COMMENT') or 
                                     '')
                        
                        geometries.append({
                            'geometry': geos_geom,
                            'name': str(name),
                            'description': str(description),
                            'properties': attributes
                        })
        
        except Exception as e:
            raise ValueError(f"Error parsing shapefile: {str(e)}")
        
        return geometries


class AdministrativeBoundaryService:
    """Service for managing administrative boundaries upload, parsing, and organization"""
    
    @staticmethod
    def upload_boundary_archive(
        file_path: str, 
        file_name: str, 
        user=None, 
        boundary_set_name: str = None,
        description: str = "",
        source: str = "",
        data_year: int = None
    ) -> Tuple[bool, str, Optional[AdministrativeBoundarySet]]:
        """
        Upload and process administrative boundary archive (ZIP containing shapefiles).
        
        Args:
            file_path: Path to the uploaded archive file
            file_name: Original filename
            user: User uploading the boundaries
            boundary_set_name: Name for the boundary set
            description: Description of the boundary set
            source: Data source information
            data_year: Year the boundaries represent
            
        Returns:
            Tuple of (success, message, boundary_set)
        """
        try:
            # Create boundary set
            if not boundary_set_name:
                boundary_set_name = f"Boundaries from {file_name}"
            
            boundary_set = AdministrativeBoundarySet.objects.create(
                name=boundary_set_name,
                description=description,
                source=source,
                uploaded_by=user,
                original_filename=file_name,
                data_year=data_year,
                file_size_mb=os.path.getsize(file_path) / (1024 * 1024)
            )
            
            # Extract and process archive
            with tempfile.TemporaryDirectory() as temp_dir:
                # Extract archive
                if file_name.lower().endswith('.zip'):
                    with zipfile.ZipFile(file_path, 'r') as zip_ref:
                        zip_ref.extractall(temp_dir)
                elif file_name.lower().endswith(('.tar.gz', '.tgz')):
                    with tarfile.open(file_path, 'r:gz') as tar_ref:
                        tar_ref.extractall(temp_dir)
                else:
                    return False, f"Unsupported archive format: {file_name}", None
                
                # Find shapefiles
                shapefiles = []
                for root, dirs, files in os.walk(temp_dir):
                    for file in files:
                        if file.lower().endswith('.shp'):
                            shapefiles.append(os.path.join(root, file))
                
                if not shapefiles:
                    boundary_set.delete()
                    return False, "No shapefiles found in archive", None
                
                # Process each shapefile
                total_boundaries = 0
                levels_included = set()
                
                for shapefile_path in shapefiles:
                    try:
                        boundaries_added, level = AdministrativeBoundaryService._process_shapefile(
                            shapefile_path, boundary_set
                        )
                        total_boundaries += boundaries_added
                        if level:
                            levels_included.add(level)
                            
                        logger.info(f"Processed {shapefile_path}: {boundaries_added} boundaries, level: {level}")
                        
                    except Exception as e:
                        logger.error(f"Error processing {shapefile_path}: {e}")
                        continue
                
                # Update boundary set statistics
                boundary_set.total_boundaries = total_boundaries
                boundary_set.levels_included = list(levels_included)
                boundary_set.save()
                
                # Build hierarchical relationships
                AdministrativeBoundaryService._build_hierarchy(boundary_set)
                
                return True, f"Successfully uploaded {total_boundaries} boundaries across {len(levels_included)} levels", boundary_set
                
        except Exception as e:
            logger.error(f"Error uploading boundary archive: {e}")
            if 'boundary_set' in locals():
                boundary_set.delete()
            return False, f"Failed to upload boundaries: {str(e)}", None
    
    @staticmethod
    def _process_shapefile(shapefile_path: str, boundary_set: AdministrativeBoundarySet) -> Tuple[int, str]:
        """
        Process a single shapefile and create boundary records.
        
        Returns:
            Tuple of (number_of_boundaries_created, administrative_level)
        """
        try:
            # Read shapefile using geopandas
            gdf = gpd.read_file(shapefile_path)
            
            # Ensure CRS is WGS84
            if gdf.crs != 'EPSG:4326':
                gdf = gdf.to_crs('EPSG:4326')
            
            # Determine administrative level from attributes
            level = AdministrativeBoundaryService._detect_admin_level(gdf.columns.tolist())
            
            boundaries_created = 0
            
            for idx, row in gdf.iterrows():
                try:
                    # Get geometry
                    geometry = row.geometry
                    if geometry is None or geometry.is_empty:
                        continue
                    
                    # Convert to GEOS geometry
                    from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
                    geom = GEOSGeometry(geometry.wkt)
                    
                    # Ensure MultiPolygon
                    if isinstance(geom, Polygon):
                        geom = MultiPolygon(geom)
                    
                    # Extract attributes
                    attributes = {}
                    name = ""
                    name_0 = ""
                    name_1 = ""
                    name_2 = ""
                    name_3 = ""
                    code = ""
                    
                    # Map common attribute names
                    for col in gdf.columns:
                        if col.lower() == 'geometry':
                            continue
                        
                        value = row[col]
                        if pd.isna(value):
                            value = ""
                        else:
                            value = str(value)
                        
                        attributes[col] = value
                        
                        # Map to standard fields
                        col_lower = col.lower()
                        if col_lower in ['name_0', 'country', 'country_name']:
                            name_0 = value
                        elif col_lower in ['name_1', 'province', 'state', 'admin1', 'province_name']:
                            name_1 = value
                        elif col_lower in ['name_2', 'district', 'county', 'admin2', 'district_name']:
                            name_2 = value
                        elif col_lower in ['name_3', 'ward', 'municipality', 'admin3']:
                            name_3 = value
                        elif col_lower in ['name', 'admin_name', 'boundary_name'] and not name:
                            name = value
                        elif col_lower in ['code', 'admin_code', 'iso_code', 'fips_code']:
                            code = value
                    
                    # Determine the primary name based on level
                    if not name:
                        if level == 'country':
                            name = name_0
                        elif level == 'province':
                            name = name_1
                        elif level == 'district':
                            name = name_2
                        elif level == 'ward':
                            name = name_3
                    
                    # Create boundary record
                    boundary = AdministrativeBoundary.objects.create(
                        boundary_set=boundary_set,
                        level=level,
                        name=name or f"{level.title()} {idx + 1}",
                        code=code,
                        name_0=name_0,
                        name_1=name_1,
                        name_2=name_2,
                        name_3=name_3,
                        geometry=geom,
                        attributes=attributes
                    )
                    
                    boundaries_created += 1
                    
                except Exception as e:
                    logger.error(f"Error creating boundary from row {idx}: {e}")
                    continue
            
            return boundaries_created, level
            
        except Exception as e:
            logger.error(f"Error processing shapefile {shapefile_path}: {e}")
            return 0, ""
    
    @staticmethod
    def _detect_admin_level(columns: List[str]) -> str:
        """
        Detect administrative level from shapefile column names.
        """
        columns_lower = [col.lower() for col in columns]
        
        # Check for specific indicators
        if any(col in columns_lower for col in ['name_0', 'country', 'country_name']):
            if not any(col in columns_lower for col in ['name_1', 'province', 'state', 'admin1']):
                return 'country'
        
        if any(col in columns_lower for col in ['name_1', 'province', 'state', 'admin1', 'province_name']):
            if not any(col in columns_lower for col in ['name_2', 'district', 'county', 'admin2']):
                return 'province'
        
        if any(col in columns_lower for col in ['name_2', 'district', 'county', 'admin2', 'district_name']):
            if not any(col in columns_lower for col in ['name_3', 'ward', 'municipality', 'admin3']):
                return 'district'
        
        if any(col in columns_lower for col in ['name_3', 'ward', 'municipality', 'admin3']):
            return 'ward'
        
        # Default based on filename patterns
        return 'district'  # Default assumption
    
    @staticmethod
    def _build_hierarchy(boundary_set: AdministrativeBoundarySet):
        """
        Build hierarchical relationships between boundaries.
        """
        try:
            # Get all boundaries by level
            countries = list(boundary_set.boundaries.filter(level='country'))
            provinces = list(boundary_set.boundaries.filter(level='province'))
            districts = list(boundary_set.boundaries.filter(level='district'))
            wards = list(boundary_set.boundaries.filter(level='ward'))
            
            # Link provinces to countries
            for province in provinces:
                for country in countries:
                    if (province.name_0 and country.name and 
                        province.name_0.lower() == country.name.lower()):
                        province.parent = country
                        province.save()
                        break
            
            # Link districts to provinces
            for district in districts:
                for province in provinces:
                    if (district.name_1 and province.name and 
                        district.name_1.lower() == province.name.lower()):
                        district.parent = province
                        district.save()
                        break
            
            # Link wards to districts
            for ward in wards:
                for district in districts:
                    if (ward.name_2 and district.name and 
                        ward.name_2.lower() == district.name.lower()):
                        ward.parent = district
                        ward.save()
                        break
            
        except Exception as e:
            logger.error(f"Error building hierarchy: {e}")
    
    @staticmethod
    def get_boundaries_by_level(boundary_set_id: int, level: str, parent_id: int = None) -> List[AdministrativeBoundary]:
        """
        Get boundaries at a specific administrative level.
        """
        queryset = AdministrativeBoundary.objects.filter(
            boundary_set_id=boundary_set_id,
            level=level,
            is_active=True
        )
        
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        
        return queryset.order_by('name')
    
    @staticmethod
    def search_boundaries(
        query: str, 
        boundary_set_id: int = None, 
        level: str = None,
        limit: int = 50
    ) -> List[AdministrativeBoundary]:
        """
        Search boundaries by name across all levels.
        """
        queryset = AdministrativeBoundary.objects.filter(is_active=True)
        
        if boundary_set_id:
            queryset = queryset.filter(boundary_set_id=boundary_set_id)
        
        if level:
            queryset = queryset.filter(level=level)
        
        # Search in name and hierarchical names
        queryset = queryset.filter(
            Q(name__icontains=query) |
            Q(name_0__icontains=query) |
            Q(name_1__icontains=query) |
            Q(name_2__icontains=query) |
            Q(name_3__icontains=query)
        )
        
        return queryset.order_by('level', 'name')[:limit]
