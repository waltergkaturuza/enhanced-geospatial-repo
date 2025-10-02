"""
Enhanced Django models for comprehensive geospatial data storage
Supports CRS information, spatial metadata, and multi-format data
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.contrib.postgres.fields import JSONField
import json

class CoordinateReferenceSystem(models.Model):
    """Model to store coordinate reference system information"""
    epsg_code = models.IntegerField(unique=True, null=True, blank=True)
    proj4_string = models.TextField(null=True, blank=True)
    wkt = models.TextField(null=True, blank=True)  # Well-Known Text
    authority = models.CharField(max_length=100, null=True, blank=True)
    datum = models.CharField(max_length=100, null=True, blank=True)
    ellipsoid = models.CharField(max_length=100, null=True, blank=True)
    projection_name = models.CharField(max_length=100, null=True, blank=True)
    units = models.CharField(max_length=50, null=True, blank=True)
    is_geographic = models.BooleanField(default=False)
    is_projected = models.BooleanField(default=False)
    
    # Projection parameters
    central_meridian = models.FloatField(null=True, blank=True)
    false_easting = models.FloatField(null=True, blank=True)
    false_northing = models.FloatField(null=True, blank=True)
    standard_parallel_1 = models.FloatField(null=True, blank=True)
    standard_parallel_2 = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'coordinate_reference_systems'
        verbose_name = 'Coordinate Reference System'
        verbose_name_plural = 'Coordinate Reference Systems'
    
    def __str__(self):
        if self.epsg_code:
            return f"EPSG:{self.epsg_code}"
        elif self.projection_name:
            return self.projection_name
        return f"CRS {self.id}"

class SpatialExtent(models.Model):
    """Model to store spatial extent information"""
    # Bounding box in native CRS
    bbox_native_minx = models.FloatField(null=True, blank=True)
    bbox_native_miny = models.FloatField(null=True, blank=True)
    bbox_native_maxx = models.FloatField(null=True, blank=True)
    bbox_native_maxy = models.FloatField(null=True, blank=True)
    
    # Bounding box in WGS84
    bbox_wgs84_minx = models.FloatField(null=True, blank=True)
    bbox_wgs84_miny = models.FloatField(null=True, blank=True)
    bbox_wgs84_maxx = models.FloatField(null=True, blank=True)
    bbox_wgs84_maxy = models.FloatField(null=True, blank=True)
    
    # Centroid coordinates
    centroid_native_x = models.FloatField(null=True, blank=True)
    centroid_native_y = models.FloatField(null=True, blank=True)
    centroid_wgs84_x = models.FloatField(null=True, blank=True)
    centroid_wgs84_y = models.FloatField(null=True, blank=True)
    
    # Geometric properties
    area_sq_meters = models.FloatField(null=True, blank=True)
    area_sq_km = models.FloatField(null=True, blank=True)
    perimeter_meters = models.FloatField(null=True, blank=True)
    width_meters = models.FloatField(null=True, blank=True)
    height_meters = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'spatial_extents'
        verbose_name = 'Spatial Extent'
        verbose_name_plural = 'Spatial Extents'

class GeospatialDataProvider(models.Model):
    """Enhanced provider model with geospatial capabilities"""
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    
    # Provider-specific CRS preferences
    preferred_crs = models.ForeignKey(
        CoordinateReferenceSystem, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='preferred_by_providers'
    )
    
    # Spatial coverage area
    coverage_extent = models.ForeignKey(
        SpatialExtent,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='provider_coverage'
    )
    
    # Data specialization
    specializes_in = models.JSONField(default=list, blank=True)  # e.g., ['satellite', 'drone', 'vector']
    supported_formats = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'geospatial_data_providers'
        ordering = ['name']
    
    def __str__(self):
        return self.name

class EnhancedGeospatialFile(models.Model):
    """Enhanced file model with comprehensive geospatial metadata"""
    
    # File type categories
    DATA_TYPE_CHOICES = [
        ('raster', 'Raster Data'),
        ('vector', 'Vector Data'),
        ('project', 'Project File'),
        ('point_cloud', 'Point Cloud'),
        ('tabular', 'Tabular Data'),
        ('other', 'Other')
    ]
    
    FORMAT_CATEGORY_CHOICES = [
        ('satellite', 'Satellite Imagery'),
        ('drone', 'Drone Imagery'),
        ('aerial', 'Aerial Photography'),
        ('vector', 'Vector Data'),
        ('dem', 'Digital Elevation Model'),
        ('point_cloud', 'Point Cloud'),
        ('project', 'Project File'),
        ('other', 'Other')
    ]
    
    # Basic file information
    name = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=500)
    file_size_bytes = models.BigIntegerField()
    file_extension = models.CharField(max_length=20)
    mime_type = models.CharField(max_length=100, blank=True)
    
    # File classification
    data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES)
    format_category = models.CharField(max_length=20, choices=FORMAT_CATEGORY_CHOICES)
    is_geospatial = models.BooleanField(default=False)
    
    # Geospatial metadata
    crs = models.ForeignKey(
        CoordinateReferenceSystem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='files'
    )
    spatial_extent = models.ForeignKey(
        SpatialExtent,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='files'
    )
    
    # GDAL/OGR driver information
    gdal_driver = models.CharField(max_length=100, blank=True)
    ogr_driver = models.CharField(max_length=100, blank=True)
    
    # Raster-specific properties
    raster_width = models.IntegerField(null=True, blank=True)
    raster_height = models.IntegerField(null=True, blank=True)
    raster_band_count = models.IntegerField(null=True, blank=True)
    pixel_size_x = models.FloatField(null=True, blank=True)
    pixel_size_y = models.FloatField(null=True, blank=True)
    has_rotation = models.BooleanField(default=False)
    has_colormap = models.BooleanField(default=False)
    
    # Vector-specific properties
    vector_layer_count = models.IntegerField(null=True, blank=True)
    vector_feature_count = models.IntegerField(null=True, blank=True)
    geometry_types = models.JSONField(default=list, blank=True)
    
    # Statistical information
    statistics = models.JSONField(default=dict, blank=True)  # min, max, mean, std
    
    # AI-generated metadata
    ai_scene_description = models.TextField(blank=True)
    ai_detected_objects = models.JSONField(default=list, blank=True)
    ai_confidence_scores = models.JSONField(default=dict, blank=True)
    ai_land_cover_analysis = models.JSONField(default=dict, blank=True)
    
    # Organizational hierarchy
    provider = models.ForeignKey(
        GeospatialDataProvider,
        on_delete=models.CASCADE,
        related_name='files'
    )
    province = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    
    # Temporal information
    acquisition_date = models.DateTimeField(null=True, blank=True)
    processing_date = models.DateTimeField(auto_now_add=True)
    
    # User and permissions
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=False)
    
    # Quality and validation
    validation_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('valid', 'Valid'),
            ('warning', 'Warning'),
            ('error', 'Error')
        ],
        default='pending'
    )
    validation_messages = models.JSONField(default=list, blank=True)
    
    # Additional metadata
    metadata_json = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'enhanced_geospatial_files'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['data_type', 'format_category']),
            models.Index(fields=['provider', 'province', 'district']),
            models.Index(fields=['acquisition_date']),
            models.Index(fields=['is_geospatial', 'validation_status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.data_type})"
    
    @property
    def file_size_mb(self):
        """Get file size in megabytes"""
        return round(self.file_size_bytes / (1024 * 1024), 2)
    
    @property
    def has_valid_crs(self):
        """Check if file has valid coordinate system"""
        return self.crs is not None
    
    @property
    def spatial_coverage_area_km2(self):
        """Get spatial coverage area in square kilometers"""
        if self.spatial_extent and self.spatial_extent.area_sq_km:
            return self.spatial_extent.area_sq_km
        return None

class GeospatialProcessingJob(models.Model):
    """Enhanced processing job with geospatial capabilities"""
    
    JOB_TYPE_CHOICES = [
        ('metadata_extraction', 'Metadata Extraction'),
        ('crs_transformation', 'CRS Transformation'),
        ('spatial_analysis', 'Spatial Analysis'),
        ('format_conversion', 'Format Conversion'),
        ('ai_analysis', 'AI Analysis'),
        ('validation', 'Data Validation'),
        ('mosaic', 'Image Mosaicking'),
        ('clip', 'Spatial Clipping'),
        ('reproject', 'Reprojection'),
        ('other', 'Other')
    ]
    
    job_type = models.CharField(max_length=30, choices=JOB_TYPE_CHOICES)
    input_files = models.ManyToManyField(
        EnhancedGeospatialFile,
        related_name='input_processing_jobs'
    )
    output_files = models.ManyToManyField(
        EnhancedGeospatialFile,
        related_name='output_processing_jobs',
        blank=True
    )
    
    # Processing parameters
    source_crs = models.ForeignKey(
        CoordinateReferenceSystem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_jobs'
    )
    target_crs = models.ForeignKey(
        CoordinateReferenceSystem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='target_jobs'
    )
    
    processing_parameters = models.JSONField(default=dict, blank=True)
    processing_extent = models.ForeignKey(
        SpatialExtent,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processing_jobs'
    )
    
    # Job execution
    status = models.CharField(
        max_length=20,
        choices=[
            ('queued', 'Queued'),
            ('running', 'Running'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('cancelled', 'Cancelled')
        ],
        default='queued'
    )
    
    progress_percentage = models.IntegerField(default=0)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    # Results and logging
    result_metadata = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    log_messages = models.JSONField(default=list, blank=True)
    
    # User context
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'geospatial_processing_jobs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.job_type} - {self.status} ({self.id})"