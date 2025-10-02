from django.urls import path
from . import views_simple
from . import upload_handler
from . import file_manager_api
from . import ai_metadata_extractor
from . import enhanced_views

# API URL patterns for the geospatial application
urlpatterns = [
    # System management endpoints
    path('system/parse-metadata/', views_simple.parse_metadata, name='system-parse-metadata'),
    path('system/upload-files/', views_simple.upload_files, name='system-upload-files'),
    path('system/status/', views_simple.system_status, name='system-status'),
    path('system/processing-queue/', views_simple.processing_queue, name='system-processing-queue'),
    
    # Enhanced upload endpoints
    path('upload/satellite-imagery/', upload_handler.upload_satellite_imagery, name='upload-satellite-imagery'),
    path('upload/status/', upload_handler.get_upload_status, name='upload-status'),
    path('upload/supported-formats/', upload_handler.get_supported_formats, name='upload-supported-formats'),
    path('upload/advanced-satellite-imagery/', ai_metadata_extractor.advanced_upload_satellite_imagery, name='upload-advanced-satellite-imagery'),
    
    # AI-powered metadata extraction
    path('ai/extract-metadata/', ai_metadata_extractor.extract_metadata_ai, name='ai-extract-metadata'),
    path('ai/capabilities/', ai_metadata_extractor.ai_capabilities, name='ai-capabilities'),
    
    # Enhanced geospatial endpoints
    path('enhanced/upload/', enhanced_views.enhanced_geospatial_upload, name='enhanced-geospatial-upload'),
    path('enhanced/status/', enhanced_views.enhanced_geospatial_status, name='enhanced-geospatial-status'),
    path('enhanced/files/tree/', enhanced_views.enhanced_file_tree, name='enhanced-file-tree'),
    
    # File management endpoints
    path('files/tree/', file_manager_api.get_file_tree, name='files-tree'),
    path('files/search/', file_manager_api.search_files, name='files-search'),
    path('files/stats/', file_manager_api.get_file_stats, name='files-stats'),
    path('files/delete/<path:file_id>/', file_manager_api.delete_file, name='files-delete'),
    
    # Authentication endpoints
    path('auth/login/', views_simple.user_login, name='user-login'),
    path('auth/signup/', views_simple.user_signup, name='user-signup'),
    path('auth/profile/', views_simple.user_profile, name='user-profile'),
    
    # User approval endpoints
    path('admin/pending-users/', views_simple.pending_users, name='admin-pending-users'),
    path('admin/approve-user/', views_simple.approve_user, name='admin-approve-user'),
    path('admin/reject-user/', views_simple.reject_user, name='admin-reject-user'),
]
