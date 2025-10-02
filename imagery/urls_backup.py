from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AOIViewSet, 
    SatelliteImageViewSet, 
    DownloadViewSet, 
    IndexResultViewSet,
    ProcessingJobViewSet,
    AdministrativeBoundarySetViewSet,
    AdministrativeBoundaryViewSet,
    job_status,
    cancel_job,
    user_quota,
    imagery_search
)
from .system_management import (
    parse_metadata,
    upload_files,
    system_status,
    processing_queue
)
from .satellite_data_manager import (
    upload_satellite_data,
    list_satellite_data,
    satellite_ai_analysis,
    dataset_statistics
)

router = DefaultRouter()
router.register(r'aois', AOIViewSet)
router.register(r'satellite-images', SatelliteImageViewSet)
router.register(r'downloads', DownloadViewSet)
router.register(r'indices', IndexResultViewSet)
router.register(r'processing-jobs', ProcessingJobViewSet)
router.register(r'boundary-sets', AdministrativeBoundarySetViewSet)
router.register(r'boundaries', AdministrativeBoundaryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('jobs/<int:job_id>/status/', job_status, name='job-status'),
    path('jobs/<int:job_id>/cancel/', cancel_job, name='job-cancel'),
    path('user/quota/', user_quota, name='user-quota'),
    path('imagery/search/', imagery_search, name='imagery-search'),
    # System management endpoints
    path('system/parse-metadata/', parse_metadata, name='system-parse-metadata'),
    path('system/upload-files/', upload_files, name='system-upload-files'),
    path('system/status/', system_status, name='system-status'),
    path('system/processing-queue/', processing_queue, name='system-processing-queue'),
    # Enhanced satellite data management
    path('satellite/upload/', upload_satellite_data, name='satellite-upload'),
    path('satellite/list/', list_satellite_data, name='satellite-list'),
    path('satellite/analysis/<str:scene_id>/', satellite_ai_analysis, name='satellite-ai-analysis'),
    path('satellite/statistics/', dataset_statistics, name='satellite-statistics'),
]
