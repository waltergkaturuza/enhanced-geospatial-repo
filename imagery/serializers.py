from rest_framework_gis.serializers import GeoFeatureModelSerializer
from rest_framework import serializers
from .models import AOI, SatelliteImage, Download, IndexResult, ProcessingJob, UserProfile, AdministrativeBoundarySet, AdministrativeBoundary

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with quota information."""
    class Meta:
        model = UserProfile
        fields = ['quota_limits', 'preferences', 'created_at']
        read_only_fields = ['created_at']

class AOISerializer(GeoFeatureModelSerializer):
    """Enhanced AOI serializer with area calculation and validation."""
    area_km2 = serializers.SerializerMethodField()
    bounds = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AOI
        geo_field = "geometry"
        fields = "__all__"
    
    def get_user_name(self, obj):
        """Get username, handling null case."""
        return obj.user.username if obj.user else None
    
    def create(self, validated_data):
        """Create AOI instance, converting Polygon to MultiPolygon if needed."""
        from django.contrib.gis.geos import MultiPolygon, Polygon
        
        geometry = validated_data.get('geometry')
        if isinstance(geometry, Polygon):
            # Convert Polygon to MultiPolygon
            validated_data['geometry'] = MultiPolygon(geometry)
        
        return super().create(validated_data)
    
    def get_area_km2(self, obj):
        """Calculate area in square kilometers."""
        try:
            # This is an approximation - for accurate area calculation,
            # the geometry should be projected to an appropriate CRS
            return round(obj.geometry.area / 1000000, 2)
        except:
            return None
    
    def get_bounds(self, obj):
        """Get bounding box of the AOI."""
        try:
            return list(obj.geometry.extent)
        except:
            return None

class SatelliteImageSerializer(GeoFeatureModelSerializer):
    """Enhanced satellite image serializer with metadata and download info."""
    file_size_formatted = serializers.SerializerMethodField()
    age_days = serializers.SerializerMethodField()
    
    class Meta:
        model = SatelliteImage
        geo_field = "bounds"
        fields = "__all__"
    
    def get_file_size_formatted(self, obj):
        """Format file size in human-readable format."""
        if not obj.file_size_mb:
            return None
        
        size_mb = obj.file_size_mb
        if size_mb < 1024:
            return f"{size_mb:.1f} MB"
        else:
            return f"{size_mb/1024:.1f} GB"
    
    def get_age_days(self, obj):
        """Calculate age of the image in days."""
        try:
            from django.utils import timezone
            delta = timezone.now() - obj.sensed_at
            return delta.days
        except:
            return None

class ProcessingJobSerializer(serializers.ModelSerializer):
    """Serializer for processing jobs with status and progress tracking."""
    user_name = serializers.CharField(source='user.username', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = ProcessingJob
        fields = [
            'id', 'user', 'user_name', 'job_type', 'status', 'priority',
            'slurm_job_id', 'allocated_cores', 'allocated_memory_gb',
            'estimated_runtime_minutes', 'progress_percentage', 
            'log_file_path', 'error_message', 'submitted_at', 'started_at', 
            'completed_at', 'input_parameters', 'output_files', 'duration'
        ]
        read_only_fields = ['id', 'submitted_at', 'duration']
    
    def get_duration(self, obj):
        """Calculate job duration in seconds."""
        if obj.started_at and obj.completed_at:
            delta = obj.completed_at - obj.started_at
            return delta.total_seconds()
        return None

class DownloadSerializer(serializers.ModelSerializer):
    """Enhanced download serializer with progress tracking and user info."""
    user_name = serializers.CharField(source='user.username', read_only=True)
    satellite_image_details = SatelliteImageSerializer(source='satellite_image', read_only=True)
    processing_job_details = ProcessingJobSerializer(source='processing_job', read_only=True)
    duration = serializers.SerializerMethodField()
    
    class Meta:
        model = Download
        fields = [
            'id', 'user', 'user_name', 'satellite_image', 'satellite_image_details',
            'processing_job', 'processing_job_details', 'aoi',
            'status', 'progress', 'parameters', 'error_message',
            'requested_at', 'started_at', 'completed_at', 'duration'
        ]
        read_only_fields = ['id', 'user', 'requested_at', 'duration']
    
    def get_duration(self, obj):
        """Calculate download duration in seconds."""
        if obj.started_at and obj.completed_at:
            delta = obj.completed_at - obj.started_at
            return delta.total_seconds()
        return None

class IndexResultSerializer(serializers.ModelSerializer):
    """Enhanced index result serializer with detailed statistics and metadata."""
    aoi_name = serializers.CharField(source='aoi.name', read_only=True)
    satellite_image_details = serializers.SerializerMethodField()
    statistics_summary = serializers.SerializerMethodField()
    
    class Meta:
        model = IndexResult
        fields = [
            'id', 'aoi', 'aoi_name', 'satellite_image', 'satellite_image_details',
            'index_type', 'calculated_at', 'statistics', 'statistics_summary',
            'metadata', 'file_path'
        ]
        read_only_fields = ['id', 'calculated_at']
    
    def get_satellite_image_details(self, obj):
        """Get basic satellite image information."""
        if obj.satellite_image:
            return {
                'id': obj.satellite_image.id,
                'tile_id': obj.satellite_image.tile_id,
                'provider': obj.satellite_image.provider,
                'sensed_at': obj.satellite_image.sensed_at,
                'cloud_cover': obj.satellite_image.cloud_cover
            }
        return None
    
    def get_statistics_summary(self, obj):
        """Get formatted statistics summary."""
        if not obj.statistics:
            return None
        
        stats = obj.statistics
        return {
            'mean': round(stats.get('mean', 0), 4),
            'std': round(stats.get('std', 0), 4),
            'min': round(stats.get('min', 0), 4),
            'max': round(stats.get('max', 0), 4),
            'count': stats.get('count', 0)
        }

# Specialized serializers for API responses
class AOISearchResultSerializer(serializers.Serializer):
    """Serializer for AOI search results with coverage information."""
    aoi = AOISerializer()
    matching_images = serializers.IntegerField()
    best_image = SatelliteImageSerializer(allow_null=True)
    coverage_stats = serializers.DictField()

class ImagerySearchRequestSerializer(serializers.Serializer):
    """Serializer for satellite imagery search requests."""
    geometry = serializers.JSONField()
    start_date = serializers.DateTimeField(required=False)
    end_date = serializers.DateTimeField(required=False)
    providers = serializers.ListField(child=serializers.CharField(), default=['sentinel2'])
    max_cloud_cover = serializers.FloatField(default=30.0)
    max_results = serializers.IntegerField(default=100)
    submit_to_hpc = serializers.BooleanField(default=False)
    processing_options = serializers.DictField(default=dict)
    hpc_resources = serializers.DictField(default=dict)

class BulkDownloadRequestSerializer(serializers.Serializer):
    """Serializer for bulk download requests."""
    image_ids = serializers.ListField(child=serializers.IntegerField())
    clip_geometry = serializers.JSONField(required=False)
    output_format = serializers.CharField(default='GeoTIFF')
    compress = serializers.BooleanField(default=True)
    include_metadata = serializers.BooleanField(default=True)
    hpc_resources = serializers.DictField(default=dict)

class IndexCalculationRequestSerializer(serializers.Serializer):
    """Serializer for index calculation requests."""
    indices = serializers.ListField(child=serializers.CharField(), default=['NDVI'])
    clip_geometry = serializers.JSONField(required=False)
    output_format = serializers.CharField(default='GeoTIFF')
    use_hpc = serializers.BooleanField(default=False)
    hpc_resources = serializers.DictField(default=dict)

class BatchIndexCalculationRequestSerializer(serializers.Serializer):
    """Serializer for batch index calculation requests."""
    calculations = serializers.ListField(
        child=serializers.DictField()
    )
    indices = serializers.ListField(child=serializers.CharField(), default=['NDVI'])
    output_format = serializers.CharField(default='GeoTIFF')
    include_statistics = serializers.BooleanField(default=True)
    use_hpc = serializers.BooleanField(default=False)
    hpc_resources = serializers.DictField(default=dict)

class AdministrativeBoundarySetSerializer(serializers.ModelSerializer):
    """Serializer for administrative boundary sets."""
    level_counts = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdministrativeBoundarySet
        fields = [
            'id', 'name', 'description', 'source', 'upload_date', 'uploaded_by_name',
            'coordinate_system', 'data_year', 'is_public', 'status', 'original_filename',
            'file_size_mb', 'total_boundaries', 'levels_included', 'level_counts',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['upload_date', 'created_at', 'updated_at', 'total_boundaries']
    
    def get_level_counts(self, obj):
        """Get count of boundaries by administrative level."""
        return dict(obj.get_level_counts().values_list('level', 'count'))
    
    def get_uploaded_by_name(self, obj):
        """Get uploader username."""
        return obj.uploaded_by.username if obj.uploaded_by else None

class AdministrativeBoundarySerializer(GeoFeatureModelSerializer):
    """Serializer for individual administrative boundaries."""
    full_path = serializers.SerializerMethodField()
    boundary_set_name = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AdministrativeBoundary
        geo_field = "geometry"
        fields = [
            'id', 'boundary_set', 'boundary_set_name', 'level', 'name', 'code',
            'parent', 'name_0', 'name_1', 'name_2', 'name_3', 'centroid',
            'area_km2', 'perimeter_km', 'attributes', 'is_active', 'population',
            'full_path', 'children_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['centroid', 'area_km2', 'perimeter_km', 'created_at', 'updated_at']
    
    def get_full_path(self, obj):
        """Get the full administrative hierarchy path."""
        return obj.get_full_path()
    
    def get_boundary_set_name(self, obj):
        """Get the name of the boundary set."""
        return obj.boundary_set.name
    
    def get_children_count(self, obj):
        """Get count of child boundaries."""
        return obj.get_children().count()

class AdministrativeBoundaryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for boundary lists without geometry."""
    full_path = serializers.SerializerMethodField()
    boundary_set_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AdministrativeBoundary
        fields = [
            'id', 'boundary_set', 'boundary_set_name', 'level', 'name', 'code',
            'name_0', 'name_1', 'name_2', 'name_3', 'area_km2', 'population',
            'is_active', 'full_path'
        ]
    
    def get_full_path(self, obj):
        return obj.get_full_path()
    
    def get_boundary_set_name(self, obj):
        return obj.boundary_set.name
