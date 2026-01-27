from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
import os

# GIS is disabled for now
HAS_GIS = False

# Dummy classes for when GIS is not available
class GEOSGeometry:
    def __init__(self, *args, **kwargs):
        pass

class Area:
    pass

class Intersection:
    pass

# Optional: Choices for providers
SATELLITE_PROVIDERS = (
    ('SENTINEL1', 'Sentinel-1 (SAR)'),
    ('SENTINEL2', 'Sentinel-2 (Optical)'),
    ('LANDSAT8', 'Landsat 8'),
    ('LANDSAT9', 'Landsat 9'),
    ('MODIS', 'MODIS'),
    ('PLANET', 'Planet'),
    ('CUSTOM', 'Custom Provider'),
)

INDEX_TYPES = (
    ('NDVI', 'Normalized Difference Vegetation Index'),
    ('NDWI', 'Normalized Difference Water Index'),
    ('EVI', 'Enhanced Vegetation Index'),
    ('SAVI', 'Soil Adjusted Vegetation Index'),
    ('NDBI', 'Normalized Difference Built-up Index'),
    ('MNDWI', 'Modified Normalized Difference Water Index'),
    ('CUSTOM', 'Custom Index'),
)

PROCESSING_STATUS = (
    ('pending', 'Pending'),
    ('queued', 'Queued'),
    ('processing', 'Processing'),
    ('complete', 'Complete'),
    ('failed', 'Failed'),
    ('cancelled', 'Cancelled'),
)

class UserProfile(models.Model):
    """Extended user profile for quota management and preferences"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile'
    )
    
    # Organization details (for access request system)
    organization = models.CharField(max_length=255, blank=True, default='')
    organization_type = models.CharField(max_length=100, blank=True, default='', help_text='Type of organization (e.g., local_council, university, etc.)')
    intended_use = models.CharField(max_length=100, blank=True, default='', help_text='Primary intended use of the platform')
    intended_use_details = models.TextField(blank=True, default='', help_text='Additional details about intended use')
    country = models.CharField(max_length=100, blank=True, default='Zimbabwe')
    user_path = models.CharField(max_length=50, blank=True, default='individual', help_text='User type path: government, organization, education, individual')
    
    # Approval status
    approval_status = models.CharField(
        max_length=20, 
        default='pending', 
        choices=[
            ('pending', 'Pending Review'),
            ('approved', 'Approved'),
            ('rejected', 'Rejected')
        ]
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_users'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, default='')
    
    # Quota settings
    max_aois = models.IntegerField(default=10)
    max_download_size_gb = models.FloatField(default=50.0)
    max_concurrent_downloads = models.IntegerField(default=3)
    
    # Usage tracking
    current_aois = models.IntegerField(default=0)
    current_download_size_gb = models.FloatField(default=0.0)
    current_downloads = models.IntegerField(default=0)
    
    # Preferences
    default_cloud_cover_threshold = models.FloatField(default=20.0)
    preferred_providers = models.JSONField(default=list, blank=True)
    notification_email = models.EmailField(blank=True)
    
    # Access control - modules assigned to this user
    assigned_modules = models.JSONField(
        default=list, 
        blank=True,
        help_text='List of modules user can access (e.g., dashboard, imagery, data_store). Staff can upload/manage files, regular users download only.'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    def can_create_aoi(self):
        return self.current_aois < self.max_aois
    
    def can_download(self, size_gb):
        return (self.current_download_size_gb + size_gb) <= self.max_download_size_gb

class AOI(models.Model):
    """Enhanced Area of Interest with validation and metadata"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='aois', null=True, blank=True
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    geometry = models.MultiPolygonField(srid=4326) if HAS_GIS else models.TextField(help_text="GeoJSON string when GIS unavailable")
    
    # Enhanced metadata
    tags = models.JSONField(default=list, blank=True)  # User-defined tags
    is_public = models.BooleanField(default=False)  # Share with other users
    upload_source = models.CharField(max_length=255, blank=True)  # Original file name
    area_km2 = models.FloatField(null=True, blank=True)  # Computed area
    
    # Validation fields
    is_valid = models.BooleanField(default=True)
    validation_errors = models.JSONField(default=list, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Area of Interest"
        verbose_name_plural = "Areas of Interest"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['is_public', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.user.username})"
    
    def save(self, *args, **kwargs):
        # Compute area in km²
        if self.geometry:
            # Transform to equal-area projection for accurate area calculation
            geom_transformed = self.geometry.transform(3857, clone=True)  # Web Mercator
            self.area_km2 = geom_transformed.area / 1_000_000  # Convert m² to km²
        super().save(*args, **kwargs)
    
    def validate_geometry(self):
        """Validate AOI geometry constraints"""
        errors = []
        
        if not self.geometry:
            errors.append("Geometry is required")
            return errors
            
        # Check area constraints (max 10,000 km²)
        if self.area_km2 and self.area_km2 > 10000:
            errors.append(f"AOI area ({self.area_km2:.2f} km²) exceeds maximum allowed (10,000 km²)")
        
        # Check geometry validity
        if not self.geometry.valid:
            errors.append("Invalid geometry")
        
        # Check for reasonable bounds
        extent = self.geometry.extent
        if abs(extent[0]) > 180 or abs(extent[2]) > 180:
            errors.append("Longitude out of valid range (-180 to 180)")
        if abs(extent[1]) > 90 or abs(extent[3]) > 90:
            errors.append("Latitude out of valid range (-90 to 90)")
            
        self.validation_errors = errors
        self.is_valid = len(errors) == 0
        return errors
    
    def get_intersecting_tiles(self, provider=None, start_date=None, end_date=None, max_cloud_cover=None):
        """Find satellite tiles that intersect with this AOI"""
        qs = SatelliteImage.objects.filter(bounds__intersects=self.geometry)
        
        if provider:
            qs = qs.filter(provider=provider)
        if start_date:
            qs = qs.filter(sensed_at__gte=start_date)
        if end_date:
            qs = qs.filter(sensed_at__lte=end_date)
        if max_cloud_cover is not None:
            qs = qs.filter(cloud_cover__lte=max_cloud_cover)
            
        return qs.order_by('-sensed_at')

class SatelliteImage(models.Model):
    """Enhanced satellite image metadata with processing capabilities"""
    provider = models.CharField(max_length=32, choices=SATELLITE_PROVIDERS)
    tile_id = models.CharField(max_length=128, db_index=True)
    scene_id = models.CharField(max_length=128, db_index=True, blank=True)  # Full scene identifier
    
    # Temporal information
    sensed_at = models.DateTimeField(db_index=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    ingested_at = models.DateTimeField(auto_now_add=True)
    
    # Quality metrics
    cloud_cover = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    data_quality = models.CharField(
        max_length=20, 
        choices=[('excellent', 'Excellent'), ('good', 'Good'), ('fair', 'Fair'), ('poor', 'Poor')],
        default='good'
    )
    
    # Spatial information
    bounds = models.PolygonField(srid=4326) if HAS_GIS else models.TextField(help_text="GeoJSON string when GIS unavailable")  # Bounding box of tile
    centroid = models.PointField(srid=4326, null=True, blank=True) if HAS_GIS else models.TextField(null=True, blank=True, help_text="GeoJSON point when GIS unavailable")
    
    # File management
    file_path = models.CharField(max_length=500)  # Path to file on disk/storage
    file_size_mb = models.FloatField(null=True, blank=True)
    bands = models.JSONField(blank=True, null=True)  # Band information
    
    # Processing metadata
    processing_level = models.CharField(max_length=10, default='L1C')  # L1C, L2A, etc.
    coordinate_system = models.CharField(max_length=20, default='EPSG:4326')
    pixel_resolution_m = models.FloatField(null=True, blank=True)
    
    # Additional metadata
    meta = models.JSONField(blank=True, null=True)
    preview_url = models.URLField(blank=True, null=True)
    thumbnail_url = models.URLField(blank=True, null=True)
    
    # Availability and status
    is_available = models.BooleanField(default=True)
    download_url = models.URLField(blank=True, null=True)
    archive_status = models.CharField(
        max_length=20,
        choices=[('online', 'Online'), ('nearline', 'Nearline'), ('offline', 'Offline')],
        default='online'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    aois = models.ManyToManyField(
        AOI, related_name='satellite_images', blank=True,
        through='AOISatelliteImage'
    )
    
    class Meta:
        unique_together = ('provider', 'tile_id', 'sensed_at')
        ordering = ['-sensed_at']
        indexes = [
            models.Index(fields=['provider', '-sensed_at']),
            models.Index(fields=['cloud_cover', '-sensed_at']),
            models.Index(fields=['is_available', '-sensed_at']),
        ]
    
    def __str__(self):
        return f"{self.provider} {self.tile_id} ({self.sensed_at.date()})"
    
    def save(self, *args, **kwargs):
        # Compute centroid
        if self.bounds and not self.centroid:
            self.centroid = self.bounds.centroid
        super().save(*args, **kwargs)
    
    def get_file_size_gb(self):
        """Get file size in GB"""
        return self.file_size_mb / 1024 if self.file_size_mb else 0
    
    def is_suitable_for_aoi(self, aoi, max_cloud_cover=None):
        """Check if this image is suitable for the given AOI"""
        if max_cloud_cover and self.cloud_cover > max_cloud_cover:
            return False
        return self.bounds.intersects(aoi.geometry)

class AOISatelliteImage(models.Model):
    """Enhanced join table with intersection analytics"""
    aoi = models.ForeignKey(AOI, on_delete=models.CASCADE)
    satellite_image = models.ForeignKey(SatelliteImage, on_delete=models.CASCADE)
    
    # Intersection analytics
    intersects = models.BooleanField(default=True)
    intersection_area_km2 = models.FloatField(null=True, blank=True)
    coverage_percentage = models.FloatField(null=True, blank=True)  # % of AOI covered
    
    # Processing status for this AOI-Image combination
    clipping_status = models.CharField(max_length=20, choices=PROCESSING_STATUS, default='pending')
    clipped_file_path = models.CharField(max_length=500, blank=True)
    clipped_file_size_mb = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('aoi', 'satellite_image')
        indexes = [
            models.Index(fields=['aoi', '-created_at']),
            models.Index(fields=['satellite_image', '-created_at']),
            models.Index(fields=['clipping_status']),
        ]
    
    def save(self, *args, **kwargs):
        # Compute intersection analytics
        if self.aoi and self.satellite_image and not self.intersection_area_km2:
            try:
                intersection = self.aoi.geometry.intersection(self.satellite_image.bounds)
                if intersection:
                    # Transform to equal-area projection for accurate calculation
                    intersection_transformed = intersection.transform(3857, clone=True)
                    self.intersection_area_km2 = intersection_transformed.area / 1_000_000
                    
                    # Calculate coverage percentage
                    if self.aoi.area_km2:
                        self.coverage_percentage = (self.intersection_area_km2 / self.aoi.area_km2) * 100
            except Exception:
                pass  # Handle geometry errors gracefully
                
        super().save(*args, **kwargs)

class ProcessingJob(models.Model):
    """Track processing jobs for HPC integration"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='processing_jobs', null=True, blank=True
    )
    
    # Job details
    job_type = models.CharField(
        max_length=30,
        choices=[
            ('download', 'Download'),
            ('clip', 'Clip to AOI'),
            ('index', 'Compute Index'),
            ('batch_process', 'Batch Processing'),
            ('custom', 'Custom Processing'),
        ]
    )
    status = models.CharField(max_length=20, choices=PROCESSING_STATUS, default='pending')
    priority = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(10)])
    
    # HPC integration
    slurm_job_id = models.CharField(max_length=50, blank=True, null=True)
    allocated_cores = models.IntegerField(null=True, blank=True)
    allocated_memory_gb = models.FloatField(null=True, blank=True)
    estimated_runtime_minutes = models.IntegerField(null=True, blank=True)
    
    # Progress tracking
    progress_percentage = models.FloatField(default=0.0)
    log_file_path = models.CharField(max_length=500, blank=True)
    error_message = models.TextField(blank=True)
    
    # Timing
    submitted_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Input/Output
    input_parameters = models.JSONField(default=dict)
    output_files = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['-submitted_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['job_type', '-submitted_at']),
        ]
    
    def __str__(self):
        return f"{self.job_type} job {self.id} ({self.status})"
    
    @property
    def runtime_minutes(self):
        """Calculate actual runtime in minutes"""
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds() / 60
        elif self.started_at:
            return (timezone.now() - self.started_at).total_seconds() / 60
        return None

class Download(models.Model):
    """Enhanced download tracking with HPC job integration"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='downloads', null=True, blank=True
    )
    aoi = models.ForeignKey(AOI, on_delete=models.CASCADE, related_name='downloads')
    
    # Can be multiple satellite images for batch downloads
    satellite_images = models.ManyToManyField(SatelliteImage, related_name='downloads')
    
    # Processing parameters
    clip_to_aoi = models.BooleanField(default=True)
    output_format = models.CharField(
        max_length=20,
        choices=[('geotiff', 'GeoTIFF'), ('cog', 'Cloud Optimized GeoTIFF'), ('netcdf', 'NetCDF')],
        default='geotiff'
    )
    compression = models.CharField(
        max_length=20,
        choices=[('none', 'None'), ('lzw', 'LZW'), ('jpeg', 'JPEG'), ('deflate', 'Deflate')],
        default='lzw'
    )
    
    # Status and progress
    status = models.CharField(max_length=20, choices=PROCESSING_STATUS, default='pending')
    progress_percentage = models.FloatField(default=0.0)
    
    # File information
    output_file_path = models.CharField(max_length=500, blank=True)
    file_size_gb = models.FloatField(null=True, blank=True)
    download_url = models.URLField(blank=True, null=True)
    expires_at = models.DateTimeField(null=True, blank=True)  # Download link expiry
    
    # HPC job reference
    processing_job = models.ForeignKey(
        ProcessingJob, on_delete=models.SET_NULL, null=True, blank=True
    )
    
    # Timing
    requested_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    downloaded_at = models.DateTimeField(null=True, blank=True)  # When user actually downloaded
    
    # Metadata
    log = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', '-requested_at']),
        ]
    
    def __str__(self):
        return f"Download {self.id} by {self.user.username}"
    
    def get_total_images(self):
        return self.satellite_images.count()
    
    def get_estimated_size_gb(self):
        """Estimate total download size"""
        total_size = 0
        for img in self.satellite_images.all():
            if img.file_size_mb:
                total_size += img.file_size_mb
        return total_size / 1024 if total_size else None

class IndexResult(models.Model):
    """Enhanced index computation with advanced analytics"""
    aoi = models.ForeignKey(AOI, on_delete=models.CASCADE, related_name='indices')
    satellite_image = models.ForeignKey(SatelliteImage, on_delete=models.CASCADE, related_name='indices')
    
    # Index information
    index_type = models.CharField(max_length=32, choices=INDEX_TYPES)
    custom_formula = models.TextField(blank=True)  # For custom indices
    
    # Results
    mean_value = models.FloatField(null=True, blank=True)
    median_value = models.FloatField(null=True, blank=True)
    std_deviation = models.FloatField(null=True, blank=True)
    min_value = models.FloatField(null=True, blank=True)
    max_value = models.FloatField(null=True, blank=True)
    
    # Files
    raster_file_path = models.CharField(max_length=500, blank=True)  # Full resolution raster
    thumbnail_path = models.CharField(max_length=500, blank=True)   # Quick preview
    histogram_data = models.JSONField(blank=True, null=True)        # Value distribution
    
    # Processing
    processing_job = models.ForeignKey(
        ProcessingJob, on_delete=models.SET_NULL, null=True, blank=True
    )
    computation_method = models.CharField(max_length=50, default='standard')
    
    # Metadata
    computed_at = models.DateTimeField(auto_now_add=True)
    meta = models.JSONField(blank=True, null=True)
    
    class Meta:
        unique_together = ('aoi', 'satellite_image', 'index_type')
        ordering = ['-computed_at']
        indexes = [
            models.Index(fields=['aoi', 'index_type', '-computed_at']),
            models.Index(fields=['satellite_image', 'index_type']),
        ]
    
    def __str__(self):
        return f"{self.index_type} for {self.aoi} / {self.satellite_image}"
    
    @property
    def value_range(self):
        """Get the range of index values"""
        if self.min_value is not None and self.max_value is not None:
            return self.max_value - self.min_value
        return None

# Administrative Boundary Management
BOUNDARY_LEVELS = (
    ('country', 'Country'),
    ('province', 'Province/State'),
    ('district', 'District/County'),
    ('ward', 'Ward/Municipality'),
)

BOUNDARY_STATUS = (
    ('active', 'Active'),
    ('inactive', 'Inactive'),
    ('archived', 'Archived'),
)

class AdministrativeBoundarySet(models.Model):
    """A collection of administrative boundaries from a single upload/source"""
    name = models.CharField(max_length=255, help_text="Name of the boundary set (e.g., 'Zimbabwe Administrative Boundaries 2023')")
    description = models.TextField(blank=True, help_text="Description of the boundary set")
    source = models.CharField(max_length=255, blank=True, help_text="Data source or provider")
    upload_date = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='boundary_sets',
        null=True, blank=True
    )
    
    # Metadata
    coordinate_system = models.CharField(max_length=50, default='EPSG:4326')
    data_year = models.IntegerField(null=True, blank=True, help_text="Year the boundaries represent")
    is_public = models.BooleanField(default=True, help_text="Available to all users")
    status = models.CharField(max_length=20, choices=BOUNDARY_STATUS, default='active')
    
    # File information
    original_filename = models.CharField(max_length=255, blank=True)
    file_size_mb = models.FloatField(null=True, blank=True)
    
    # Statistics
    total_boundaries = models.IntegerField(default=0)
    levels_included = models.JSONField(default=list, help_text="List of admin levels included")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Administrative Boundary Set"
        verbose_name_plural = "Administrative Boundary Sets"
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} ({self.total_boundaries} boundaries)"
    
    def get_level_counts(self):
        """Get count of boundaries by level"""
        from django.db.models import Count
        return self.boundaries.values('level').annotate(count=Count('id'))

class AdministrativeBoundary(models.Model):
    """Individual administrative boundary (country, province, district, etc.)"""
    boundary_set = models.ForeignKey(
        AdministrativeBoundarySet, on_delete=models.CASCADE, related_name='boundaries'
    )
    
    # Administrative hierarchy
    level = models.CharField(max_length=20, choices=BOUNDARY_LEVELS)
    name = models.CharField(max_length=255, help_text="Official name of the administrative unit")
    code = models.CharField(max_length=50, blank=True, help_text="Official code (if available)")
    
    # Hierarchical references
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True, related_name='children'
    )
    
    # Standard attribute names from shapefiles (Name_0, Name_1, Name_2, etc.)
    name_0 = models.CharField(max_length=255, blank=True, help_text="Country name")
    name_1 = models.CharField(max_length=255, blank=True, help_text="Province/State name")
    name_2 = models.CharField(max_length=255, blank=True, help_text="District/County name")
    name_3 = models.CharField(max_length=255, blank=True, help_text="Ward/Municipality name")
    
    # Geographic data
    geometry = models.MultiPolygonField(srid=4326) if HAS_GIS else models.TextField(help_text="GeoJSON string when GIS unavailable")
    centroid = models.PointField(srid=4326, null=True, blank=True) if HAS_GIS else models.TextField(null=True, blank=True, help_text="GeoJSON point when GIS unavailable")
    area_km2 = models.FloatField(null=True, blank=True)
    perimeter_km = models.FloatField(null=True, blank=True)
    
    # Additional attributes from shapefile
    attributes = models.JSONField(default=dict, help_text="Additional attributes from source data")
    
    # Status and metadata
    is_active = models.BooleanField(default=True)
    population = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Administrative Boundary"
        verbose_name_plural = "Administrative Boundaries"
        ordering = ['level', 'name']
        indexes = [
            models.Index(fields=['boundary_set', 'level']),
            models.Index(fields=['level', 'name']),
            models.Index(fields=['name_0', 'name_1', 'name_2']),
        ]
        unique_together = [
            ['boundary_set', 'level', 'name', 'name_0', 'name_1', 'name_2']
        ]
        
    def __str__(self):
        if self.level == 'country':
            return f"{self.name} (Country)"
        elif self.level == 'province':
            return f"{self.name}, {self.name_0} (Province)"
        elif self.level == 'district':
            return f"{self.name}, {self.name_1}, {self.name_0} (District)"
        else:
            return f"{self.name} ({self.level})"
    
    def save(self, *args, **kwargs):
        # Auto-calculate area and centroid
        if self.geometry:
            # Calculate centroid
            self.centroid = self.geometry.centroid
            
            # Calculate area in km²
            geom_transformed = self.geometry.transform(3857, clone=True)  # Web Mercator
            self.area_km2 = geom_transformed.area / 1_000_000
            
            # Calculate perimeter (rough approximation)
            self.perimeter_km = geom_transformed.boundary.length / 1000
            
        super().save(*args, **kwargs)
    
    def get_full_path(self):
        """Get the full administrative path (e.g., 'Zimbabwe > Harare Province > Harare District')"""
        path_parts = []
        if self.name_0:
            path_parts.append(self.name_0)
        if self.name_1 and self.level in ['district', 'ward']:
            path_parts.append(self.name_1)
        if self.name_2 and self.level == 'ward':
            path_parts.append(self.name_2)
        if self.name:
            path_parts.append(self.name)
        return ' > '.join(path_parts)
    
    def get_children(self):
        """Get child administrative units"""
        return self.children.filter(is_active=True).order_by('name')
    
    def get_aois_in_boundary(self):
        """Get AOIs that intersect with this boundary"""
        return AOI.objects.filter(geometry__intersects=self.geometry)

class SubscriptionPlan(models.Model):
    """Subscription plans/tiers for different user types"""
    name = models.CharField(max_length=100, unique=True, help_text="Plan name (e.g., Educational, Professional, Enterprise)")
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Pricing
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Monthly price in USD")
    price_yearly = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Yearly price in USD (discounted)")
    is_free = models.BooleanField(default=False)
    
    # Quotas
    max_aois = models.IntegerField(default=10)
    max_download_size_gb = models.FloatField(default=50.0)
    max_concurrent_downloads = models.IntegerField(default=3)
    max_users = models.IntegerField(null=True, blank=True, help_text="For organization plans")
    
    # Features
    features = models.JSONField(default=list, help_text="List of feature descriptions")
    has_analytics = models.BooleanField(default=False)
    has_api_access = models.BooleanField(default=False)
    has_priority_support = models.BooleanField(default=False)
    has_custom_processing = models.BooleanField(default=False)
    
    # Availability
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=True, help_text="Visible on pricing page")
    display_order = models.IntegerField(default=0)
    
    # Targeting
    target_user_types = models.JSONField(
        default=list, 
        help_text="Recommended for: ['education', 'government', 'commercial']"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', 'price_monthly']
        verbose_name = "Subscription Plan"
        verbose_name_plural = "Subscription Plans"
    
    def __str__(self):
        return f"{self.name} (${self.price_monthly}/mo)"
    
    def get_annual_savings(self):
        """Calculate savings with annual plan"""
        monthly_annual = self.price_monthly * 12
        return monthly_annual - self.price_yearly

class UserSubscription(models.Model):
    """Track user's subscription status and billing"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription'
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='subscribers'
    )
    
    # Billing
    billing_cycle = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('yearly', 'Yearly'),
            ('one_time', 'One-Time'),
            ('free', 'Free')
        ],
        default='monthly'
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('cancelled', 'Cancelled'),
            ('expired', 'Expired'),
            ('suspended', 'Suspended'),
            ('trial', 'Trial')
        ],
        default='trial'
    )
    
    # Dates
    starts_at = models.DateTimeField()
    expires_at = models.DateTimeField(null=True, blank=True)
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Payment
    auto_renew = models.BooleanField(default=True)
    payment_method = models.CharField(max_length=50, blank=True)
    last_payment_date = models.DateTimeField(null=True, blank=True)
    next_payment_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "User Subscription"
        verbose_name_plural = "User Subscriptions"
    
    def __str__(self):
        return f"{self.user.email} - {self.plan.name} ({self.status})"
    
    def is_valid(self):
        """Check if subscription is currently valid"""
        if self.status != 'active':
            return False
        if self.expires_at and timezone.now() > self.expires_at:
            return False
        return True

class Invoice(models.Model):
    """Invoice tracking for subscription payments"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='invoices'
    )
    subscription = models.ForeignKey(
        UserSubscription,
        on_delete=models.CASCADE,
        related_name='invoices',
        null=True,
        blank=True
    )
    
    # Invoice details
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    invoice_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    
    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='USD')
    
    # Line items
    items = models.JSONField(
        default=list,
        help_text="List of invoice items: [{description, quantity, unit_price, amount}]"
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('sent', 'Sent'),
            ('paid', 'Paid'),
            ('overdue', 'Overdue'),
            ('cancelled', 'Cancelled'),
            ('refunded', 'Refunded')
        ],
        default='draft'
    )
    
    # Payment tracking
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_method = models.CharField(max_length=50, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    
    # Organization details (for invoice)
    billing_name = models.CharField(max_length=255)
    billing_email = models.EmailField()
    billing_address = models.TextField(blank=True)
    tax_id = models.CharField(max_length=50, blank=True, help_text="VAT/Tax ID")
    
    # Notes
    notes = models.TextField(blank=True, help_text="Internal notes")
    customer_notes = models.TextField(blank=True, help_text="Notes visible to customer")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-invoice_date']
        indexes = [
            models.Index(fields=['user', '-invoice_date']),
            models.Index(fields=['status', '-invoice_date']),
            models.Index(fields=['invoice_number']),
        ]
        verbose_name = "Invoice"
        verbose_name_plural = "Invoices"
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.user.email} - ${self.total_amount}"
    
    def save(self, *args, **kwargs):
        # Generate invoice number if not set
        if not self.invoice_number:
            import datetime
            date_str = self.invoice_date.strftime('%Y%m') if self.invoice_date else datetime.datetime.now().strftime('%Y%m')
            last_invoice = Invoice.objects.filter(invoice_number__startswith=f'INV-{date_str}').order_by('-invoice_number').first()
            if last_invoice:
                last_num = int(last_invoice.invoice_number.split('-')[-1])
                self.invoice_number = f'INV-{date_str}-{last_num + 1:04d}'
            else:
                self.invoice_number = f'INV-{date_str}-0001'
        
        # Calculate tax and total
        self.tax_amount = (self.subtotal * self.tax_rate) / 100
        self.total_amount = self.subtotal + self.tax_amount
        
        super().save(*args, **kwargs)
    
    def mark_as_paid(self, payment_method='', reference=''):
        """Mark invoice as paid"""
        self.status = 'paid'
        self.paid_at = timezone.now()
        self.payment_method = payment_method
        self.payment_reference = reference
        self.save()

# Signal handlers for automatic profile creation
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)

