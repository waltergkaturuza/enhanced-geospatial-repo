from django.contrib import admin
from django.contrib.admin import ModelAdmin, TabularInline
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User, Group
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.contrib import messages
from django.db.models import Count, Q

from .models import (
    UserProfile, AOI, SatelliteImage, Download, IndexResult,
    ProcessingJob, AdministrativeBoundarySet, AdministrativeBoundary,
    AOISatelliteImage, SubscriptionPlan, UserSubscription, Invoice
)


# ============================================================================
# Admin Site Customization
# ============================================================================

admin.site.site_header = "GeoSpatial Repository Administration"
admin.site.site_title = "GeoSpatial Admin"
admin.site.index_title = "System Administration Dashboard"


# ============================================================================
# User Profile Inline
# ============================================================================

class UserProfileInline(admin.StackedInline):
    """Inline admin for UserProfile"""
    model = UserProfile
    fk_name = 'user'  # Specify which ForeignKey to use (user, not approved_by)
    can_delete = False
    verbose_name_plural = "Profile"
    fields = (
        ('max_aois', 'current_aois'),
        ('max_download_size_gb', 'current_download_size_gb'),
        ('max_concurrent_downloads', 'current_downloads'),
        'default_cloud_cover_threshold',
        'preferred_providers',
        'notification_email',
    )
    readonly_fields = ('current_aois', 'current_download_size_gb', 'current_downloads')


# ============================================================================
# Custom User Admin with Role-Based Access
# ============================================================================

# Unregister the default User admin and register our custom one
admin.site.unregister(User)

class CustomUserAdmin(BaseUserAdmin):
    """Enhanced User admin with role-based filtering and actions"""
    
    inlines = [UserProfileInline]
    
    list_display = (
        'username', 'email', 'first_name', 'last_name',
        'is_staff', 'is_superuser', 'is_active',
        'date_joined', 'last_login', 'user_actions'
    )
    
    list_filter = (
        'is_staff', 'is_superuser', 'is_active',
        'groups', 'date_joined', 'last_login'
    )
    
    search_fields = ('username', 'email', 'first_name', 'last_name')
    
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Permissions', {
            'fields': (
                'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            ),
        }),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )
    
    filter_horizontal = ('groups', 'user_permissions')
    
    def user_actions(self, obj):
        """Display quick action links"""
        if obj.pk:
            return format_html(
                '<a href="{}" class="button">View Profile</a> | '
                '<a href="{}" class="button">View AOIs</a>',
                reverse('admin:imagery_userprofile_change', args=[obj.profile.pk]) if hasattr(obj, 'profile') else '#',
                reverse('admin:imagery_aoi_changelist') + f'?user__id__exact={obj.pk}'
            )
        return '-'
    user_actions.short_description = 'Actions'
    
    def get_queryset(self, request):
        """Optimize queryset with related objects"""
        qs = super().get_queryset(request)
        return qs.select_related('profile').prefetch_related('groups')
    
    # Role-based admin actions
    actions = ['make_staff', 'remove_staff', 'activate_users', 'deactivate_users', 'add_to_group_admin', 'add_to_group_user']
    
    @admin.action(description='Make selected users staff')
    def make_staff(self, request, queryset):
        """Grant staff status to selected users"""
        count = queryset.update(is_staff=True)
        self.message_user(
            request,
            f'{count} user(s) granted staff status.',
            messages.SUCCESS
        )
    
    @admin.action(description='Remove staff status from selected users')
    def remove_staff(self, request, queryset):
        """Remove staff status from selected users"""
        # Prevent removing staff from superusers
        non_superusers = queryset.exclude(is_superuser=True)
        count = non_superusers.update(is_staff=False)
        self.message_user(
            request,
            f'Staff status removed from {count} user(s). Superusers were skipped.',
            messages.SUCCESS
        )
    
    @admin.action(description='Activate selected users')
    def activate_users(self, request, queryset):
        """Activate selected users"""
        count = queryset.update(is_active=True)
        self.message_user(
            request,
            f'{count} user(s) activated.',
            messages.SUCCESS
        )
    
    @admin.action(description='Deactivate selected users')
    def deactivate_users(self, request, queryset):
        """Deactivate selected users (except superusers)"""
        non_superusers = queryset.exclude(is_superuser=True)
        count = non_superusers.update(is_active=False)
        self.message_user(
            request,
            f'{count} user(s) deactivated. Superusers were skipped.',
            messages.SUCCESS
        )
    
    @admin.action(description='Add selected users to Admin group')
    def add_to_group_admin(self, request, queryset):
        """Add users to Admin group"""
        admin_group, created = Group.objects.get_or_create(name='Admin')
        for user in queryset:
            user.groups.add(admin_group)
        self.message_user(
            request,
            f'{queryset.count()} user(s) added to Admin group.',
            messages.SUCCESS
        )
    
    @admin.action(description='Add selected users to User group')
    def add_to_group_user(self, request, queryset):
        """Add users to User group"""
        user_group, created = Group.objects.get_or_create(name='User')
        for user in queryset:
            user.groups.add(user_group)
        self.message_user(
            request,
            f'{queryset.count()} user(s) added to User group.',
            messages.SUCCESS
        )

# Register the custom User admin
admin.site.register(User, CustomUserAdmin)


# ============================================================================
# Group Admin Customization
# ============================================================================

# Unregister default Group admin and register custom one
admin.site.unregister(Group)

class CustomGroupAdmin(admin.ModelAdmin):
    """Enhanced Group admin with better display"""
    list_display = ('name', 'user_count', 'permission_count')
    search_fields = ('name',)
    filter_horizontal = ('permissions',)
    
    def user_count(self, obj):
        """Display number of users in group"""
        return obj.user_set.count()
    user_count.short_description = 'Users'
    
    def permission_count(self, obj):
        """Display number of permissions in group"""
        return obj.permissions.count()
    permission_count.short_description = 'Permissions'

# Register the custom Group admin
admin.site.register(Group, CustomGroupAdmin)


# ============================================================================
# User Profile Admin
# ============================================================================

@admin.register(UserProfile)
class UserProfileAdmin(ModelAdmin):
    """Admin for UserProfile model"""
    
    list_display = (
        'user', 'max_aois', 'current_aois',
        'max_download_size_gb', 'current_download_size_gb',
        'quota_status', 'created_at'
    )
    
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'user__email', 'notification_email')
    readonly_fields = ('created_at', 'updated_at', 'current_aois', 'current_download_size_gb', 'current_downloads')
    
    fieldsets = (
        ('User', {'fields': ('user',)}),
        ('Quota Settings', {
            'fields': (
                ('max_aois', 'current_aois'),
                ('max_download_size_gb', 'current_download_size_gb'),
                ('max_concurrent_downloads', 'current_downloads'),
            )
        }),
        ('Preferences', {
            'fields': (
                'default_cloud_cover_threshold',
                'preferred_providers',
                'notification_email',
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def quota_status(self, obj):
        """Display quota status with color coding"""
        aoi_status = 'OK' if obj.can_create_aoi() else 'FULL'
        aoi_color = 'green' if obj.can_create_aoi() else 'red'
        return format_html(
            '<span style="color: {};">AOI: {}</span>',
            aoi_color, aoi_status
        )
    quota_status.short_description = 'Quota Status'


# ============================================================================
# AOI Admin
# ============================================================================

class AOISatelliteImageInline(TabularInline):
    """Inline for satellite images in AOI"""
    model = AOISatelliteImage
    extra = 0
    readonly_fields = ('intersection_area_km2', 'coverage_percentage', 'created_at')
    fields = ('satellite_image', 'intersects', 'intersection_area_km2', 'coverage_percentage', 'clipping_status')


@admin.register(AOI)
class AOIAdmin(ModelAdmin):
    """Admin for AOI model"""
    
    list_display = (
        'name', 'user', 'area_km2', 'is_public',
        'is_valid', 'created_at', 'view_count'
    )
    
    list_filter = (
        'is_public', 'is_valid', 'created_at',
        'user__is_staff', 'user__groups'
    )
    
    search_fields = ('name', 'description', 'user__username', 'user__email')
    
    readonly_fields = ('created_at', 'updated_at', 'area_km2', 'validation_errors', 'geometry_preview')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'user')
        }),
        ('Geometry', {
            'fields': ('geometry', 'geometry_preview', 'area_km2')
        }),
        ('Metadata', {
            'fields': ('tags', 'is_public', 'upload_source')
        }),
        ('Validation', {
            'fields': ('is_valid', 'validation_errors')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [AOISatelliteImageInline]
    
    def view_count(self, obj):
        """Count of satellite images for this AOI"""
        return obj.satellite_images.count()
    view_count.short_description = 'Satellite Images'
    
    def geometry_preview(self, obj):
        """Display geometry info"""
        if obj.geometry:
            return format_html(
                '<p><strong>Type:</strong> {}</p>'
                '<p><strong>Area:</strong> {:.2f} km²</p>',
                getattr(obj.geometry, 'geom_type', 'N/A'),
                obj.area_km2 or 0
            )
        return 'No geometry'
    geometry_preview.short_description = 'Geometry Info'


# ============================================================================
# Satellite Image Admin
# ============================================================================

@admin.register(SatelliteImage)
class SatelliteImageAdmin(ModelAdmin):
    """Admin for SatelliteImage model"""
    
    list_display = (
        'tile_id', 'provider', 'sensed_at',
        'cloud_cover', 'data_quality', 'is_available',
        'file_size_display', 'aoi_count'
    )
    
    list_filter = (
        'provider', 'data_quality', 'is_available',
        'archive_status', 'sensed_at', 'cloud_cover'
    )
    
    search_fields = ('tile_id', 'scene_id', 'provider')
    
    readonly_fields = (
        'created_at', 'ingested_at', 'centroid',
        'file_size_display', 'aoi_count'
    )
    
    fieldsets = (
        ('Identification', {
            'fields': ('provider', 'tile_id', 'scene_id')
        }),
        ('Temporal', {
            'fields': ('sensed_at', 'processed_at', 'ingested_at')
        }),
        ('Quality', {
            'fields': ('cloud_cover', 'data_quality')
        }),
        ('Spatial', {
            'fields': ('bounds', 'centroid', 'coordinate_system', 'pixel_resolution_m')
        }),
        ('File Information', {
            'fields': (
                'file_path', 'file_size_display',
                'processing_level', 'bands'
            )
        }),
        ('Availability', {
            'fields': (
                'is_available', 'archive_status',
                'download_url', 'preview_url', 'thumbnail_url'
            )
        }),
        ('Metadata', {
            'fields': ('meta',),
            'classes': ('collapse',)
        }),
    )
    
    def file_size_display(self, obj):
        """Display file size in readable format"""
        if obj.file_size_mb:
            if obj.file_size_mb >= 1024:
                return f"{obj.file_size_mb / 1024:.2f} GB"
            return f"{obj.file_size_mb:.2f} MB"
        return 'N/A'
    file_size_display.short_description = 'File Size'
    
    def aoi_count(self, obj):
        """Count of AOIs using this image"""
        return obj.aois.count()
    aoi_count.short_description = 'AOIs'


# ============================================================================
# Download Admin
# ============================================================================

class DownloadSatelliteImageInline(TabularInline):
    """Inline for satellite images in Download"""
    model = Download.satellite_images.through
    extra = 0


@admin.register(Download)
class DownloadAdmin(ModelAdmin):
    """Admin for Download model"""
    
    list_display = (
        'id', 'user', 'aoi', 'status',
        'progress_percentage', 'file_size_display',
        'requested_at', 'completed_at'
    )
    
    list_filter = (
        'status', 'clip_to_aoi', 'output_format',
        'compression', 'requested_at', 'completed_at'
    )
    
    search_fields = ('user__username', 'aoi__name', 'output_file_path')
    
    readonly_fields = (
        'requested_at', 'completed_at', 'downloaded_at',
        'file_size_display', 'total_images'
    )
    
    fieldsets = (
        ('User & AOI', {
            'fields': ('user', 'aoi')
        }),
        ('Processing', {
            'fields': (
                'clip_to_aoi', 'output_format', 'compression',
                'status', 'progress_percentage'
            )
        }),
        ('Files', {
            'fields': (
                'output_file_path', 'file_size_display',
                'download_url', 'expires_at', 'total_images'
            )
        }),
        ('Job Reference', {
            'fields': ('processing_job',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('log', 'metadata'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('requested_at', 'completed_at', 'downloaded_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [DownloadSatelliteImageInline]
    
    def file_size_display(self, obj):
        """Display file size"""
        if obj.file_size_gb:
            return f"{obj.file_size_gb:.2f} GB"
        return 'N/A'
    file_size_display.short_description = 'File Size'
    
    def total_images(self, obj):
        """Total satellite images in download"""
        return obj.satellite_images.count()
    total_images.short_description = 'Total Images'


# ============================================================================
# Index Result Admin
# ============================================================================

@admin.register(IndexResult)
class IndexResultAdmin(ModelAdmin):
    """Admin for IndexResult model"""
    
    list_display = (
        'index_type', 'aoi', 'satellite_image',
        'mean_value', 'computed_at'
    )
    
    list_filter = ('index_type', 'computed_at', 'computation_method')
    
    search_fields = (
        'aoi__name', 'satellite_image__tile_id',
        'index_type', 'custom_formula'
    )
    
    readonly_fields = ('computed_at', 'value_range_display')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('aoi', 'satellite_image', 'index_type', 'custom_formula')
        }),
        ('Results', {
            'fields': (
                'mean_value', 'median_value', 'std_deviation',
                'min_value', 'max_value', 'value_range_display'
            )
        }),
        ('Files', {
            'fields': (
                'raster_file_path', 'thumbnail_path', 'histogram_data'
            )
        }),
        ('Processing', {
            'fields': ('processing_job', 'computation_method', 'computed_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('meta',),
            'classes': ('collapse',)
        }),
    )
    
    def value_range_display(self, obj):
        """Display value range"""
        if obj.value_range is not None:
            return f"{obj.value_range:.4f}"
        return 'N/A'
    value_range_display.short_description = 'Value Range'


# ============================================================================
# Processing Job Admin
# ============================================================================

@admin.register(ProcessingJob)
class ProcessingJobAdmin(ModelAdmin):
    """Admin for ProcessingJob model"""
    
    list_display = (
        'id', 'user', 'job_type', 'status',
        'progress_percentage', 'priority',
        'submitted_at', 'runtime_display'
    )
    
    list_filter = (
        'job_type', 'status', 'priority',
        'submitted_at', 'started_at', 'completed_at'
    )
    
    search_fields = (
        'user__username', 'slurm_job_id',
        'error_message', 'log_file_path'
    )
    
    readonly_fields = (
        'submitted_at', 'started_at', 'completed_at',
        'runtime_display', 'progress_bar'
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'job_type', 'status', 'priority')
        }),
        ('HPC Integration', {
            'fields': (
                'slurm_job_id', 'allocated_cores',
                'allocated_memory_gb', 'estimated_runtime_minutes'
            )
        }),
        ('Progress', {
            'fields': ('progress_percentage', 'progress_bar', 'runtime_display')
        }),
        ('Timing', {
            'fields': ('submitted_at', 'started_at', 'completed_at')
        }),
        ('Input/Output', {
            'fields': ('input_parameters', 'output_files', 'log_file_path'),
            'classes': ('collapse',)
        }),
        ('Error Information', {
            'fields': ('error_message',),
            'classes': ('collapse',)
        }),
    )
    
    def runtime_display(self, obj):
        """Display runtime"""
        runtime = obj.runtime_minutes
        if runtime:
            hours = int(runtime // 60)
            minutes = int(runtime % 60)
            if hours > 0:
                return f"{hours}h {minutes}m"
            return f"{minutes}m"
        return 'N/A'
    runtime_display.short_description = 'Runtime'
    
    def progress_bar(self, obj):
        """Display progress bar"""
        return format_html(
            '<div style="width: 100%; background-color: #f0f0f0; border-radius: 4px;">'
            '<div style="width: {}%; background-color: #4CAF50; height: 20px; border-radius: 4px; text-align: center; color: white; line-height: 20px;">'
            '{}%</div></div>',
            obj.progress_percentage,
            obj.progress_percentage
        )
    progress_bar.short_description = 'Progress'


# ============================================================================
# Administrative Boundary Admin
# ============================================================================

class AdministrativeBoundaryInline(TabularInline):
    """Inline for boundaries in boundary set"""
    model = AdministrativeBoundary
    extra = 0
    fields = ('level', 'name', 'code', 'name_0', 'name_1', 'name_2', 'area_km2', 'is_active')
    readonly_fields = ('area_km2',)


@admin.register(AdministrativeBoundarySet)
class AdministrativeBoundarySetAdmin(ModelAdmin):
    """Admin for AdministrativeBoundarySet model"""
    
    list_display = (
        'name', 'source', 'total_boundaries',
        'data_year', 'is_public', 'status',
        'uploaded_by', 'upload_date'
    )
    
    list_filter = (
        'status', 'is_public', 'data_year',
        'upload_date', 'coordinate_system'
    )
    
    search_fields = ('name', 'description', 'source', 'uploaded_by__username')
    
    readonly_fields = (
        'upload_date', 'created_at', 'updated_at',
        'total_boundaries', 'levels_display'
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'source')
        }),
        ('Upload Information', {
            'fields': (
                'uploaded_by', 'upload_date',
                'original_filename', 'file_size_mb'
            )
        }),
        ('Metadata', {
            'fields': (
                'coordinate_system', 'data_year',
                'is_public', 'status'
            )
        }),
        ('Statistics', {
            'fields': ('total_boundaries', 'levels_included', 'levels_display')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [AdministrativeBoundaryInline]
    
    def levels_display(self, obj):
        """Display levels included"""
        if obj.levels_included:
            return ', '.join(obj.levels_included)
        return 'N/A'
    levels_display.short_description = 'Levels Included'


@admin.register(AdministrativeBoundary)
class AdministrativeBoundaryAdmin(ModelAdmin):
    """Admin for AdministrativeBoundary model"""
    
    list_display = (
        'name', 'level', 'boundary_set',
        'name_0', 'name_1', 'name_2',
        'area_km2', 'is_active', 'full_path'
    )
    
    list_filter = (
        'level', 'is_active', 'boundary_set',
        'name_0', 'name_1', 'name_2'
    )
    
    search_fields = (
        'name', 'code', 'name_0', 'name_1',
        'name_2', 'boundary_set__name'
    )
    
    readonly_fields = (
        'created_at', 'updated_at', 'area_km2',
        'perimeter_km', 'centroid', 'full_path',
        'geometry_preview'
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'boundary_set', 'level', 'name', 'code',
                'parent', 'is_active'
            )
        }),
        ('Hierarchy', {
            'fields': ('name_0', 'name_1', 'name_2', 'name_3', 'full_path')
        }),
        ('Geometry', {
            'fields': ('geometry', 'geometry_preview', 'centroid', 'area_km2', 'perimeter_km')
        }),
        ('Additional Data', {
            'fields': ('population', 'attributes'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def full_path(self, obj):
        """Display full administrative path"""
        return obj.get_full_path()
    full_path.short_description = 'Full Path'
    
    def geometry_preview(self, obj):
        """Display geometry info"""
        if obj.geometry:
            return format_html(
                '<p><strong>Type:</strong> {}</p>'
                '<p><strong>Area:</strong> {:.2f} km²</p>'
                '<p><strong>Perimeter:</strong> {:.2f} km</p>',
                getattr(obj.geometry, 'geom_type', 'N/A'),
                obj.area_km2 or 0,
                obj.perimeter_km or 0
            )
        return 'No geometry'
    geometry_preview.short_description = 'Geometry Info'


# ============================================================================
# Subscription and Billing Admin
# ============================================================================

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    """Admin interface for subscription plans/tiers"""
    list_display = ('name', 'price_monthly', 'price_yearly', 'is_free', 'max_aois', 'max_download_size_gb', 'is_active', 'subscriber_count')
    list_filter = ('is_free', 'is_active', 'is_public', 'has_analytics')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'display_order', 'is_active', 'is_public')
        }),
        ('Pricing', {
            'fields': ('price_monthly', 'price_yearly', 'is_free')
        }),
        ('Quotas', {
            'fields': ('max_aois', 'max_download_size_gb', 'max_concurrent_downloads', 'max_users')
        }),
        ('Features', {
            'fields': ('features', 'has_analytics', 'has_api_access', 'has_priority_support', 'has_custom_processing')
        }),
        ('Targeting', {
            'fields': ('target_user_types',)
        }),
    )
    
    def subscriber_count(self, obj):
        return obj.subscribers.filter(status='active').count()
    subscriber_count.short_description = 'Active Subscribers'


@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    """Admin interface for user subscriptions"""
    list_display = ('user_email', 'plan', 'status', 'billing_cycle', 'starts_at', 'expires_at', 'is_valid_status')
    list_filter = ('status', 'billing_cycle', 'plan', 'auto_renew')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'plan__name')
    date_hierarchy = 'starts_at'
    
    fieldsets = (
        ('Subscription', {
            'fields': ('user', 'plan', 'status', 'billing_cycle')
        }),
        ('Dates', {
            'fields': ('starts_at', 'expires_at', 'trial_ends_at', 'cancelled_at')
        }),
        ('Payment', {
            'fields': ('auto_renew', 'payment_method', 'last_payment_date', 'next_payment_date')
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def is_valid_status(self, obj):
        if obj.is_valid():
            return format_html('<span style="color: green;">✓ Valid</span>')
        return format_html('<span style="color: red;">✗ Expired</span>')
    is_valid_status.short_description = 'Valid'


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    """Admin interface for invoices and billing"""
    list_display = ('invoice_number', 'user_email', 'invoice_date', 'due_date', 'total_amount', 'status', 'status_badge')
    list_filter = ('status', 'invoice_date', 'paid_at')
    search_fields = ('invoice_number', 'user__email', 'user__first_name', 'user__last_name', 'billing_name', 'billing_email')
    date_hierarchy = 'invoice_date'
    
    fieldsets = (
        ('Invoice Details', {
            'fields': ('invoice_number', 'user', 'subscription', 'invoice_date', 'due_date')
        }),
        ('Amounts', {
            'fields': ('subtotal', 'tax_rate', 'tax_amount', 'total_amount', 'currency', 'items')
        }),
        ('Status & Payment', {
            'fields': ('status', 'paid_at', 'payment_method', 'payment_reference')
        }),
        ('Billing Information', {
            'fields': ('billing_name', 'billing_email', 'billing_address', 'tax_id')
        }),
        ('Notes', {
            'fields': ('notes', 'customer_notes')
        }),
    )
    
    readonly_fields = ('invoice_number', 'tax_amount', 'total_amount')
    actions = ['mark_as_sent', 'mark_as_paid', 'mark_as_overdue']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    
    def status_badge(self, obj):
        colors = {'paid': 'green', 'sent': 'blue', 'draft': 'gray', 'overdue': 'red', 'cancelled': 'orange', 'refunded': 'purple'}
        color = colors.get(obj.status, 'gray')
        return format_html('<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>', color, obj.status.upper())
    status_badge.short_description = 'Status'
    
    @admin.action(description='Mark as sent')
    def mark_as_sent(self, request, queryset):
        updated = queryset.update(status='sent')
        self.message_user(request, f'{updated} invoice(s) marked as sent.')
    
    @admin.action(description='Mark as paid')
    def mark_as_paid(self, request, queryset):
        for invoice in queryset:
            invoice.mark_as_paid()
        self.message_user(request, f'{queryset.count()} invoice(s) marked as paid.')
    
    @admin.action(description='Mark as overdue')
    def mark_as_overdue(self, request, queryset):
        updated = queryset.update(status='overdue')
        self.message_user(request, f'{updated} invoice(s) marked as overdue.')
