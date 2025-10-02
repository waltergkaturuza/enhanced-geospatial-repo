from django.shortcuts import render
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.gis.geos import GEOSGeometry
from django.db.models import Q, F, Sum
from django.conf import settings
from django.http import JsonResponse, HttpResponse
from django.core.files.base import ContentFile
import json
import uuid
import tempfile
import os
import logging

# Create your views here.
from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.gis.geos import GEOSGeometry
from django.contrib.gis.db.models.functions import Intersection
from django.contrib.gis.db.models.functions import Area
from django_filters.rest_framework import DjangoFilterBackend
from .models import AOI, SatelliteImage, Download, IndexResult, ProcessingJob, UserProfile, AdministrativeBoundarySet, AdministrativeBoundary
from .serializers import AOISerializer, SatelliteImageSerializer, DownloadSerializer, IndexResultSerializer, ProcessingJobSerializer, AdministrativeBoundarySetSerializer, AdministrativeBoundarySerializer, AdministrativeBoundaryListSerializer
from .services import (
    SatelliteDataService, 
    ImageProcessingService, 
    HPCJobService, 
    AOIManagementService,
    AdministrativeBoundaryService
)

logger = logging.getLogger(__name__)

class AOIViewSet(viewsets.ModelViewSet):
    """
    Advanced AOI management with spatial search, optimization, and intelligent workflows.
    """
    queryset = AOI.objects.all()
    serializer_class = AOISerializer
    permission_classes = [permissions.AllowAny]  # Temporary for testing
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_queryset(self):
        """Filter AOIs by user ownership and permissions."""
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            # Users can see their own AOIs and public ones
            return queryset.filter(
                Q(user=self.request.user) | Q(is_public=True) | Q(user__isnull=True)
            )
        # For anonymous users, show public AOIs and those without a user (for testing)
        return queryset.filter(Q(is_public=True) | Q(user__isnull=True))

    def perform_create(self, serializer):
        """Set user and validate AOI on creation."""
        # For testing, allow creation without authenticated user
        user = self.request.user if self.request.user.is_authenticated else None
        if user is None:
            # For testing purposes, we'll skip user association
            aoi = serializer.save()
        else:
            aoi = serializer.save(user=user)
        
        # TODO: Add proper AOI validation using AOIManagementService
        # For now, just log successful creation
        logger.info(f"AOI {aoi.id} created successfully")
        
        return aoi

    @action(detail=True, methods=['get'])
    def intersecting_images(self, request, pk=None):
        """
        List all satellite images that intersect this AOI with advanced filtering.
        """
        aoi = self.get_object()
        
        # Parse query parameters for advanced filtering
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        max_cloud_cover = request.query_params.get('max_cloud_cover', 30)
        provider = request.query_params.get('provider')
        min_coverage = request.query_params.get('min_coverage', 0.8)
        
        try:
            max_cloud_cover = float(max_cloud_cover)
            min_coverage = float(min_coverage)
        except ValueError:
            return Response({
                "error": "Invalid numeric parameters"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Base query for intersecting images
        images = SatelliteImage.objects.filter(
            bounds__intersects=aoi.geometry,
            cloud_cover__lte=max_cloud_cover
        )
        
        # Apply additional filters
        if start_date:
            try:
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                images = images.filter(sensed_at__gte=start_date)
            except ValueError:
                return Response({
                    "error": "Invalid start_date format. Use ISO format."
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if end_date:
            try:
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                images = images.filter(sensed_at__lte=end_date)
            except ValueError:
                return Response({
                    "error": "Invalid end_date format. Use ISO format."
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if provider:
            images = images.filter(provider=provider)
        
        # Calculate coverage percentages and filter
        images_with_coverage = []
        for image in images:
            try:
                intersection = aoi.geometry.intersection(image.bounds)
                coverage = intersection.area / aoi.geometry.area
                if coverage >= min_coverage:
                    image_data = SatelliteImageSerializer(image).data
                    image_data['aoi_coverage'] = coverage
                    images_with_coverage.append(image_data)
            except Exception as e:
                logger.error(f"Error calculating coverage for image {image.id}: {e}")
                continue
        
        # Sort by coverage (descending) and date (descending)
        images_with_coverage.sort(
            key=lambda x: (x['aoi_coverage'], x['sensed_at']), 
            reverse=True
        )
        
        return Response({
            'count': len(images_with_coverage),
            'results': images_with_coverage,
            'aoi_info': {
                'id': aoi.id,
                'name': aoi.name,
                'area_km2': aoi.geometry.area / 1000000,  # Approximate
                'bounds': list(aoi.geometry.extent)
            }
        })

    @action(detail=True, methods=['post'])
    def find_optimal_imagery(self, request, pk=None):
        """
        Find optimal satellite imagery for this AOI using AI/ML-driven selection.
        """
        aoi = self.get_object()
        
        # Parse request parameters
        data = request.data
        date_range = data.get('date_range', {})
        priorities = data.get('priorities', {
            'cloud_cover': 0.4,
            'coverage': 0.3,
            'recency': 0.2,
            'resolution': 0.1
        })
        max_images = data.get('max_images', 10)
        
        try:
            aoi_service = AOIManagementService()
            optimal_images = aoi_service.find_optimal_imagery(
                aoi, 
                date_range=date_range,
                priorities=priorities,
                max_images=max_images
            )
            
            return Response({
                'aoi_id': aoi.id,
                'optimal_images': optimal_images,
                'selection_criteria': {
                    'priorities': priorities,
                    'max_images': max_images,
                    'date_range': date_range
                },
                'total_found': len(optimal_images)
            })
            
        except Exception as e:
            logger.error(f"Error finding optimal imagery for AOI {aoi.id}: {e}")
            return Response({
                "error": "Failed to find optimal imagery",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def request_imagery(self, request, pk=None):
        """
        Submit a request for automated imagery search, download, and processing.
        """
        aoi = self.get_object()
        data = request.data
        
        try:
            # Create processing job
            job = ProcessingJob.objects.create(
                aoi=aoi,
                user=request.user,
                job_type='imagery_request',
                parameters=data,
                status='queued'
            )
            
            # Initialize services
            satellite_service = SatelliteDataService()
            hpc_service = HPCJobService()
            
            # Search for imagery based on request parameters
            search_params = {
                'geometry': aoi.geometry,
                'start_date': data.get('start_date'),
                'end_date': data.get('end_date'),
                'max_cloud_cover': data.get('max_cloud_cover', 30),
                'providers': data.get('providers', ['sentinel2'])
            }
            
            if data.get('submit_to_hpc', False):
                # Submit as HPC job for large/complex requests
                script_content = hpc_service.generate_processing_script(
                    job_type='imagery_search_download',
                    parameters={
                        'aoi_id': aoi.id,
                        'job_id': job.id,
                        'search_params': search_params,
                        'processing_options': data.get('processing_options', {})
                    }
                )
                
                hpc_job_id = hpc_service.submit_job(
                    script_content=script_content,
                    job_name=f"imagery_request_{job.id}",
                    resources=data.get('hpc_resources', {})
                )
                
                job.hpc_job_id = hpc_job_id
                job.status = 'submitted'
                job.save()
                
                return Response({
                    'job_id': job.id,
                    'hpc_job_id': hpc_job_id,
                    'status': 'submitted',
                    'message': 'Imagery request submitted to HPC cluster'
                })
            else:
                # Process immediately for simple requests
                try:
                    results = satellite_service.search_imagery(**search_params)
                    
                    job.status = 'completed'
                    job.results = {
                        'images_found': len(results),
                        'search_results': results[:20]  # Limit for response size
                    }
                    job.save()
                    
                    return Response({
                        'job_id': job.id,
                        'status': 'completed',
                        'results': job.results
                    })
                except Exception as e:
                    job.status = 'failed'
                    job.error_message = str(e)
                    job.save()
                    raise
                    
        except Exception as e:
            logger.error(f"Error processing imagery request for AOI {aoi.id}: {e}")
            return Response({
                "error": "Failed to process imagery request",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def upload_geometry(self, request):
        """
        Upload AOI geometry from various formats (GeoJSON, KML, Shapefile).
        """
        try:
            if 'file' in request.FILES:
                # Handle single file upload
                uploaded_file = request.FILES['file']
                file_extension = uploaded_file.name.split('.')[-1].lower()
                
                # Check file size (limit to 100MB)
                max_size = 100 * 1024 * 1024  # 100MB in bytes
                if uploaded_file.size > max_size:
                    return Response({
                        "error": f"File too large. Maximum file size is 100MB. Your file is {uploaded_file.size / (1024*1024):.1f}MB."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                # Check if it's a supported single file format
                if file_extension not in ['geojson', 'json', 'kml', 'kmz', 'zip', 'tar', 'gz', 'bz2', 'xz', 'rar', '7z']:
                    return Response({
                        "error": f"Unsupported file format: {file_extension}. Supported formats: GeoJSON (.geojson, .json), compressed archives (.zip, .tar, .gz, .bz2, .xz, .rar, .7z) containing shapefiles or GeoJSON files."
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                aoi_service = AOIManagementService()
                
                # Save file temporarily
                with tempfile.NamedTemporaryFile(
                    suffix=f'.{file_extension}', 
                    delete=False
                ) as temp_file:
                    for chunk in uploaded_file.chunks():
                        temp_file.write(chunk)
                    temp_path = temp_file.name
                
                try:
                    # Parse geometry from file
                    geometries = aoi_service.parse_geometry_file(temp_path, file_extension)
                    
                    # Create AOIs from geometries
                    created_aois = []
                    for i, geom_data in enumerate(geometries):
                        aoi_name = geom_data.get('name', f"Uploaded AOI {i+1}")
                        
                        # Handle anonymous users
                        user = request.user if request.user.is_authenticated else None
                        
                        aoi = AOI.objects.create(
                            name=aoi_name,
                            description=geom_data.get('description', f"Uploaded from {uploaded_file.name}"),
                            geometry=geom_data['geometry'],
                            user=user,
                            upload_source=uploaded_file.name
                        )
                        created_aois.append(AOISerializer(aoi).data)
                    
                    return Response({
                        'success': True,
                        'created_aois': created_aois,
                        'count': len(created_aois)
                    })
                    
                finally:
                    # Clean up temp file
                    os.unlink(temp_path)
                    
            elif 'geometry' in request.data:
                # Handle direct GeoJSON geometry
                geometry_data = request.data['geometry']
                
                if isinstance(geometry_data, str):
                    geometry = GEOSGeometry(geometry_data)
                else:
                    geometry = GEOSGeometry(json.dumps(geometry_data))
                
                # Handle anonymous users
                user = request.user if request.user.is_authenticated else None
                
                aoi = AOI.objects.create(
                    name=request.data.get('name', 'New AOI'),
                    description=request.data.get('description', 'Uploaded geometry'),
                    geometry=geometry,
                    user=user
                )
                
                return Response({
                    'success': True,
                    'aoi': AOISerializer(aoi).data
                })
                
            else:
                return Response({
                    "error": "No geometry provided. Send 'file' or 'geometry' parameter."
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error uploading geometry: {e}")
            return Response({
                "error": "Failed to upload geometry",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class SatelliteImageViewSet(viewsets.ModelViewSet):
    """
    Advanced satellite image management with spatial/temporal search and provider integration.
    """
    queryset = SatelliteImage.objects.all()
    serializer_class = SatelliteImageSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['provider', 'cloud_cover', 'sensed_at']
    search_fields = ['tile_id', 'provider']

    @action(detail=False, methods=['get'])
    def by_aoi(self, request):
        """
        Find all satellite images intersecting a given AOI with advanced filtering and ranking.
        """
        aoi_id = request.query_params.get('aoi_id')
        geometry = request.query_params.get('geometry')  # WKT or GeoJSON
        
        # Parse additional parameters
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        max_cloud_cover = request.query_params.get('max_cloud_cover', 30)
        providers = request.query_params.getlist('provider')
        sort_by = request.query_params.get('sort_by', 'sensed_at')  # sensed_at, cloud_cover, coverage
        
        try:
            if aoi_id:
                try:
                    aoi = AOI.objects.get(pk=aoi_id)
                    search_geometry = aoi.geometry
                except AOI.DoesNotExist:
                    return Response({
                        "error": "AOI not found"
                    }, status=status.HTTP_404_NOT_FOUND)
            elif geometry:
                try:
                    if geometry.startswith('{'):
                        # GeoJSON
                        search_geometry = GEOSGeometry(geometry)
                    else:
                        # WKT
                        search_geometry = GEOSGeometry(geometry)
                except Exception as e:
                    return Response({
                        "error": "Invalid geometry",
                        "details": str(e)
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    "error": "Provide aoi_id or geometry (WKT/GeoJSON)"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Build query
            images = SatelliteImage.objects.filter(
                bounds__intersects=search_geometry,
                cloud_cover__lte=float(max_cloud_cover)
            )
            
            # Apply date filters
            if start_date:
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                images = images.filter(sensed_at__gte=start_date)
            
            if end_date:
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                images = images.filter(sensed_at__lte=end_date)
            
            # Apply provider filter
            if providers:
                images = images.filter(provider__in=providers)
            
            # Sort results
            if sort_by == 'cloud_cover':
                images = images.order_by('cloud_cover', '-sensed_at')
            elif sort_by == 'coverage':
                # This is more complex - we'll calculate coverage on the fly
                pass
            else:  # Default to sensed_at
                images = images.order_by('-sensed_at')
            
            # Calculate coverage and enhance results
            enhanced_results = []
            for image in images:
                try:
                    intersection = search_geometry.intersection(image.bounds)
                    coverage = intersection.area / search_geometry.area
                    
                    image_data = self.get_serializer(image).data
                    image_data['aoi_coverage'] = coverage
                    image_data['intersection_area'] = intersection.area
                    enhanced_results.append(image_data)
                except Exception as e:
                    logger.error(f"Error calculating coverage for image {image.id}: {e}")
                    continue
            
            # Sort by coverage if requested
            if sort_by == 'coverage':
                enhanced_results.sort(key=lambda x: x['aoi_coverage'], reverse=True)
            
            # Pagination
            page = self.paginate_queryset(enhanced_results)
            if page is not None:
                return self.get_paginated_response(page)
                
            return Response({
                'count': len(enhanced_results),
                'results': enhanced_results
            })
            
        except Exception as e:
            logger.error(f"Error in by_aoi search: {e}")
            return Response({
                "error": "Search failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def search_providers(self, request):
        """
        Search satellite imagery from external providers (Sentinel-2, Landsat, etc.).
        """
        data = request.data
        
        try:
            # Parse search parameters
            geometry = data.get('geometry')
            if isinstance(geometry, str):
                search_geometry = GEOSGeometry(geometry)
            else:
                search_geometry = GEOSGeometry(json.dumps(geometry))
            
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            providers = data.get('providers', ['sentinel2'])
            max_cloud_cover = data.get('max_cloud_cover', 30)
            max_results = data.get('max_results', 100)
            
            # Initialize satellite data service
            satellite_service = SatelliteDataService()
            
            # Search each provider
            all_results = []
            for provider in providers:
                try:
                    provider_results = satellite_service.search_imagery(
                        geometry=search_geometry,
                        start_date=start_date,
                        end_date=end_date,
                        provider=provider,
                        max_cloud_cover=max_cloud_cover,
                        max_results=max_results
                    )
                    
                    # Add provider info to results
                    for result in provider_results:
                        result['provider'] = provider
                    
                    all_results.extend(provider_results)
                    
                except Exception as e:
                    logger.error(f"Error searching provider {provider}: {e}")
                    continue
            
            # Sort by date (most recent first)
            all_results.sort(key=lambda x: x.get('sensed_at', ''), reverse=True)
            
            # Limit results
            if max_results:
                all_results = all_results[:max_results]
            
            return Response({
                'search_params': {
                    'geometry': geometry,
                    'start_date': start_date,
                    'end_date': end_date,
                    'providers': providers,
                    'max_cloud_cover': max_cloud_cover
                },
                'total_found': len(all_results),
                'results': all_results
            })
            
        except Exception as e:
            logger.error(f"Error in provider search: {e}")
            return Response({
                "error": "Provider search failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        """
        Initiate download of satellite image with optional preprocessing.
        """
        image = self.get_object()
        data = request.data
        
        try:
            # Create download record
            download = Download.objects.create(
                user=request.user,
                satellite_image=image,
                requested_at=timezone.now(),
                status='queued',
                parameters=data
            )
            
            # Check if clipping is requested
            clip_geometry = data.get('clip_geometry')
            if clip_geometry:
                if isinstance(clip_geometry, str):
                    clip_geom = GEOSGeometry(clip_geometry)
                else:
                    clip_geom = GEOSGeometry(json.dumps(clip_geometry))
                
                # Create processing job for clipping
                job = ProcessingJob.objects.create(
                    user=request.user,
                    satellite_image=image,
                    job_type='clip_and_download',
                    parameters={
                        'download_id': download.id,
                        'clip_geometry': clip_geometry,
                        'output_format': data.get('output_format', 'GeoTIFF'),
                        'resampling': data.get('resampling', 'bilinear')
                    },
                    status='queued'
                )
                
                download.processing_job = job
                download.save()
                
                # Submit to HPC if requested or if image is large
                if data.get('use_hpc', False) or image.file_size_mb > 100:
                    hpc_service = HPCJobService()
                    script_content = hpc_service.generate_processing_script(
                        job_type='clip_and_download',
                        parameters=job.parameters
                    )
                    
                    hpc_job_id = hpc_service.submit_job(
                        script_content=script_content,
                        job_name=f"clip_download_{job.id}",
                        resources=data.get('hpc_resources', {})
                    )
                    
                    job.hpc_job_id = hpc_job_id
                    job.status = 'submitted'
                    job.save()
                    
                    return Response({
                        'download_id': download.id,
                        'job_id': job.id,
                        'hpc_job_id': hpc_job_id,
                        'status': 'submitted',
                        'message': 'Download and clipping job submitted to HPC'
                    })
            
            # Simple download without processing
            download.status = 'completed'
            download.completed_at = timezone.now()
            download.save()
            
            return Response({
                'download_id': download.id,
                'status': 'completed',
                'download_url': image.file_url,
                'message': 'Image ready for download'
            })
            
        except Exception as e:
            logger.error(f"Error initiating download for image {image.id}: {e}")
            return Response({
                "error": "Download failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def calculate_indices(self, request, pk=None):
        """
        Calculate spectral indices (NDVI, NDWI, etc.) for satellite image.
        """
        image = self.get_object()
        data = request.data
        
        try:
            # Parse parameters
            indices = data.get('indices', ['NDVI'])
            clip_geometry = data.get('clip_geometry')
            output_format = data.get('output_format', 'GeoTIFF')
            
            # Create processing job
            job = ProcessingJob.objects.create(
                user=request.user,
                satellite_image=image,
                job_type='calculate_indices',
                parameters={
                    'indices': indices,
                    'clip_geometry': clip_geometry,
                    'output_format': output_format
                },
                status='queued'
            )
            
            # Initialize processing service
            processing_service = ImageProcessingService()
            
            if data.get('use_hpc', False):
                # Submit to HPC
                hpc_service = HPCJobService()
                script_content = hpc_service.generate_processing_script(
                    job_type='calculate_indices',
                    parameters=job.parameters
                )
                
                hpc_job_id = hpc_service.submit_job(
                    script_content=script_content,
                    job_name=f"indices_{job.id}",
                    resources=data.get('hpc_resources', {})
                )
                
                job.hpc_job_id = hpc_job_id
                job.status = 'submitted'
                job.save()
                
                return Response({
                    'job_id': job.id,
                    'hpc_job_id': hpc_job_id,
                    'status': 'submitted',
                    'indices': indices,
                    'message': 'Index calculation submitted to HPC'
                })
            else:
                # Process locally for small images
                try:
                    results = processing_service.calculate_indices(
                        image_path=image.file_path,
                        indices=indices,
                        clip_geometry=clip_geometry
                    )
                    
                    # Save results
                    index_results = []
                    for index_name, index_data in results.items():
                        index_result = IndexResult.objects.create(
                            satellite_image=image,
                            index_type=index_name,
                            calculated_at=timezone.now(),
                            statistics=index_data.get('statistics', {}),
                            metadata=index_data.get('metadata', {})
                        )
                        index_results.append(index_result.id)
                    
                    job.status = 'completed'
                    job.results = {'index_result_ids': index_results}
                    job.save()
                    
                    return Response({
                        'job_id': job.id,
                        'status': 'completed',
                        'index_results': index_results,
                        'results': results
                    })
                    
                except Exception as e:
                    job.status = 'failed'
                    job.error_message = str(e)
                    job.save()
                    raise
                    
        except Exception as e:
            logger.error(f"Error calculating indices for image {image.id}: {e}")
            return Response({
                "error": "Index calculation failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DownloadViewSet(viewsets.ModelViewSet):
    """
    Advanced download management with progress tracking and bulk operations.
    """
    queryset = Download.objects.all()
    serializer_class = DownloadSerializer
    permission_classes = [permissions.AllowAny]  # Temporary for testing

    def get_queryset(self):
        """Filter downloads by user."""
        if self.request.user.is_authenticated:
            return self.queryset.filter(user=self.request.user)
        return self.queryset.none()

    def perform_create(self, serializer):
        """Create download with user and initiate async download job."""
        download = serializer.save(user=self.request.user)
        
        # Check if this should be queued for background processing
        if download.satellite_image and download.satellite_image.file_size_mb > 50:
            # Large files - queue for background download
            job = ProcessingJob.objects.create(
                user=self.request.user,
                satellite_image=download.satellite_image,
                job_type='download',
                parameters={'download_id': download.id},
                status='queued'
            )
            download.processing_job = job
            download.save()
        
        return download

    @action(detail=False, methods=['post'])
    def bulk_download(self, request):
        """
        Create bulk download job for multiple images with optional processing.
        """
        data = request.data
        image_ids = data.get('image_ids', [])
        
        if not image_ids:
            return Response({
                "error": "No image IDs provided"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Validate images exist
            images = SatelliteImage.objects.filter(id__in=image_ids)
            if len(images) != len(image_ids):
                return Response({
                    "error": "Some image IDs not found"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create bulk download job
            job = ProcessingJob.objects.create(
                user=request.user,
                job_type='bulk_download',
                parameters={
                    'image_ids': image_ids,
                    'clip_geometry': data.get('clip_geometry'),
                    'output_format': data.get('output_format', 'GeoTIFF'),
                    'compress': data.get('compress', True),
                    'include_metadata': data.get('include_metadata', True)
                },
                status='queued'
            )
            
            # Create individual download records
            downloads = []
            for image in images:
                download = Download.objects.create(
                    user=request.user,
                    satellite_image=image,
                    processing_job=job,
                    status='queued',
                    parameters=data
                )
                downloads.append(download.id)
            
            # Submit to HPC for large bulk jobs
            total_size = sum(img.file_size_mb or 0 for img in images)
            if len(images) > 5 or total_size > 500:
                hpc_service = HPCJobService()
                script_content = hpc_service.generate_processing_script(
                    job_type='bulk_download',
                    parameters=job.parameters
                )
                
                hpc_job_id = hpc_service.submit_job(
                    script_content=script_content,
                    job_name=f"bulk_download_{job.id}",
                    resources=data.get('hpc_resources', {
                        'memory': '16GB',
                        'cpus': 4,
                        'time': '2:00:00'
                    })
                )
                
                job.hpc_job_id = hpc_job_id
                job.status = 'submitted'
                job.save()
                
                return Response({
                    'job_id': job.id,
                    'hpc_job_id': hpc_job_id,
                    'download_ids': downloads,
                    'status': 'submitted',
                    'total_images': len(images),
                    'estimated_size_mb': total_size,
                    'message': 'Bulk download submitted to HPC cluster'
                })
            
            return Response({
                'job_id': job.id,
                'download_ids': downloads,
                'status': 'queued',
                'total_images': len(images),
                'estimated_size_mb': total_size
            })
            
        except Exception as e:
            logger.error(f"Error creating bulk download: {e}")
            return Response({
                "error": "Bulk download creation failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """
        Get download progress and status.
        """
        download = self.get_object()
        
        response_data = {
            'download_id': download.id,
            'status': download.status,
            'progress': download.progress,
            'requested_at': download.requested_at,
            'started_at': download.started_at,
            'completed_at': download.completed_at,
            'error_message': download.error_message
        }
        
        # Add job information if available
        if download.processing_job:
            job = download.processing_job
            response_data['job'] = {
                'id': job.id,
                'status': job.status,
                'progress': job.progress,
                'hpc_job_id': job.hpc_job_id,
                'error_message': job.error_message
            }
            
            # Query HPC status if available
            if job.hpc_job_id:
                try:
                    hpc_service = HPCJobService()
                    hpc_status = hpc_service.get_job_status(job.hpc_job_id)
                    response_data['hpc_status'] = hpc_status
                except Exception as e:
                    logger.error(f"Error querying HPC status: {e}")
        
        return Response(response_data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel download if it's still in progress.
        """
        download = self.get_object()
        
        if download.status in ['completed', 'cancelled', 'failed']:
            return Response({
                "error": f"Cannot cancel download with status: {download.status}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Cancel HPC job if it exists
            if download.processing_job and download.processing_job.hpc_job_id:
                hpc_service = HPCJobService()
                hpc_service.cancel_job(download.processing_job.hpc_job_id)
                
                download.processing_job.status = 'cancelled'
                download.processing_job.save()
            
            download.status = 'cancelled'
            download.save()
            
            return Response({
                'download_id': download.id,
                'status': 'cancelled',
                'message': 'Download cancelled successfully'
            })
            
        except Exception as e:
            logger.error(f"Error cancelling download {download.id}: {e}")
            return Response({
                "error": "Failed to cancel download",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class IndexResultViewSet(viewsets.ModelViewSet):
    """
    Advanced index result management with statistical analysis and visualization support.
    """
    queryset = IndexResult.objects.all()
    serializer_class = IndexResultSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['aoi', 'satellite_image', 'index_type']

    def get_queryset(self):
        """Filter results by user access permissions."""
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            # Users can see results for their AOIs and public AOIs
            return queryset.filter(
                Q(aoi__user=self.request.user) | 
                Q(aoi__is_public=True) |
                Q(aoi__isnull=True)  # Global/no specific AOI
            )
        return queryset.filter(Q(aoi__is_public=True) | Q(aoi__isnull=True))

    @action(detail=False, methods=['post'])
    def batch_calculate(self, request):
        """
        Calculate indices for multiple AOI/image combinations.
        """
        data = request.data
        
        try:
            # Parse batch parameters
            calculations = data.get('calculations', [])
            indices = data.get('indices', ['NDVI'])
            use_hpc = data.get('use_hpc', False)
            
            if not calculations:
                return Response({
                    "error": "No calculations specified"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate calculations
            validated_calculations = []
            for calc in calculations:
                try:
                    aoi = AOI.objects.get(id=calc['aoi_id'])
                    image = SatelliteImage.objects.get(id=calc['image_id'])
                    validated_calculations.append({
                        'aoi': aoi,
                        'image': image,
                        'indices': calc.get('indices', indices)
                    })
                except (AOI.DoesNotExist, SatelliteImage.DoesNotExist) as e:
                    return Response({
                        "error": f"Invalid AOI or image ID: {e}"
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create batch processing job
            job = ProcessingJob.objects.create(
                user=request.user,
                job_type='batch_index_calculation',
                parameters={
                    'calculations': [
                        {
                            'aoi_id': calc['aoi'].id,
                            'image_id': calc['image'].id,
                            'indices': calc['indices']
                        } for calc in validated_calculations
                    ],
                    'output_format': data.get('output_format', 'GeoTIFF'),
                    'statistics': data.get('include_statistics', True)
                },
                status='queued'
            )
            
            if use_hpc or len(validated_calculations) > 10:
                # Submit to HPC for large batches
                hpc_service = HPCJobService()
                script_content = hpc_service.generate_processing_script(
                    job_type='batch_index_calculation',
                    parameters=job.parameters
                )
                
                hpc_job_id = hpc_service.submit_job(
                    script_content=script_content,
                    job_name=f"batch_indices_{job.id}",
                    resources=data.get('hpc_resources', {
                        'memory': '32GB',
                        'cpus': 8,
                        'time': '4:00:00'
                    })
                )
                
                job.hpc_job_id = hpc_job_id
                job.status = 'submitted'
                job.save()
                
                return Response({
                    'job_id': job.id,
                    'hpc_job_id': hpc_job_id,
                    'status': 'submitted',
                    'total_calculations': len(validated_calculations),
                    'message': 'Batch index calculation submitted to HPC'
                })
            else:
                # Process immediately for small batches
                processing_service = ImageProcessingService()
                results = []
                
                for calc in validated_calculations:
                    try:
                        calc_results = processing_service.calculate_indices(
                            image_path=calc['image'].file_path,
                            indices=calc['indices'],
                            clip_geometry=calc['aoi'].geometry
                        )
                        
                        # Save results
                        for index_name, index_data in calc_results.items():
                            index_result = IndexResult.objects.create(
                                aoi=calc['aoi'],
                                satellite_image=calc['image'],
                                index_type=index_name,
                                calculated_at=timezone.now(),
                                statistics=index_data.get('statistics', {}),
                                metadata=index_data.get('metadata', {})
                            )
                            results.append(index_result.id)
                            
                    except Exception as e:
                        logger.error(f"Error calculating indices for AOI {calc['aoi'].id}, Image {calc['image'].id}: {e}")
                        continue
                
                job.status = 'completed'
                job.results = {'index_result_ids': results}
                job.save()
                
                return Response({
                    'job_id': job.id,
                    'status': 'completed',
                    'index_result_ids': results,
                    'total_completed': len(results)
                })
                
        except Exception as e:
            logger.error(f"Error in batch index calculation: {e}")
            return Response({
                "error": "Batch calculation failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def time_series(self, request):
        """
        Get time series of index values for an AOI.
        """
        aoi_id = request.query_params.get('aoi_id')
        index_type = request.query_params.get('index_type', 'NDVI')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not aoi_id:
            return Response({
                "error": "aoi_id parameter required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            aoi = AOI.objects.get(id=aoi_id)
            
            # Build query
            results = IndexResult.objects.filter(
                aoi=aoi,
                index_type=index_type
            ).select_related('satellite_image')
            
            # Apply date filters
            if start_date:
                start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                results = results.filter(satellite_image__sensed_at__gte=start_date)
            
            if end_date:
                end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                results = results.filter(satellite_image__sensed_at__lte=end_date)
            
            # Order by sensing date
            results = results.order_by('satellite_image__sensed_at')
            
            # Format time series data
            time_series_data = []
            for result in results:
                time_series_data.append({
                    'date': result.satellite_image.sensed_at.isoformat(),
                    'value': result.statistics.get('mean'),
                    'min': result.statistics.get('min'),
                    'max': result.statistics.get('max'),
                    'std': result.statistics.get('std'),
                    'cloud_cover': result.satellite_image.cloud_cover,
                    'provider': result.satellite_image.provider,
                    'result_id': result.id
                })
            
            return Response({
                'aoi_id': aoi.id,
                'aoi_name': aoi.name,
                'index_type': index_type,
                'time_range': {
                    'start': start_date.isoformat() if start_date else None,
                    'end': end_date.isoformat() if end_date else None
                },
                'count': len(time_series_data),
                'time_series': time_series_data
            })
            
        except AOI.DoesNotExist:
            return Response({
                "error": "AOI not found"
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error generating time series: {e}")
            return Response({
                "error": "Time series generation failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        """
        Export index result as raster or vector data.
        """
        result = self.get_object()
        export_format = request.query_params.get('format', 'geotiff')
        
        try:
            processing_service = ImageProcessingService()
            
            if export_format.lower() == 'geotiff':
                # Export as GeoTIFF
                export_path = processing_service.export_index_raster(
                    result, 
                    format='GTiff'
                )
            elif export_format.lower() == 'geojson':
                # Export statistics as GeoJSON
                export_data = processing_service.export_index_vector(
                    result,
                    format='GeoJSON'
                )
                return JsonResponse(export_data)
            else:
                return Response({
                    "error": f"Unsupported export format: {export_format}"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Serve file
            if os.path.exists(export_path):
                with open(export_path, 'rb') as f:
                    response = HttpResponse(
                        f.read(),
                        content_type='application/octet-stream'
                    )
                    response['Content-Disposition'] = f'attachment; filename="{os.path.basename(export_path)}"'
                    return response
            else:
                return Response({
                    "error": "Export file not found"
                }, status=status.HTTP_404_NOT_FOUND)
                
        except Exception as e:
            logger.error(f"Error exporting index result {result.id}: {e}")
            return Response({
                "error": "Export failed",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProcessingJobViewSet(viewsets.ModelViewSet):
    """
    Processing job management for background tasks and HPC workflows.
    """
    queryset = ProcessingJob.objects.all()
    serializer_class = ProcessingJobSerializer
    permission_classes = [permissions.AllowAny]  # Temporary for testing
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'job_type', 'user']
    search_fields = ['name', 'processing_type']

    def get_queryset(self):
        """Filter jobs by user ownership."""
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            return queryset.filter(user=self.request.user)
        return queryset.none()

    def perform_create(self, serializer):
        """Associate job with current user and start processing."""
        job = serializer.save(user=self.request.user if self.request.user.is_authenticated else None)
        
        # For testing, we'll create a simple processing job
        job.status = 'queued'
        job.save()
        
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start a processing job."""
        job = self.get_object()
        if job.status == 'queued':
            job.status = 'processing'
            job.started_at = timezone.now()
            job.save()
            return Response({'status': 'Job started'})
        return Response({'error': 'Job cannot be started'}, status=400)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a processing job."""
        job = self.get_object()
        if job.status in ['queued', 'processing']:
            job.status = 'cancelled'
            job.completed_at = timezone.now()
            job.save()
            return Response({'status': 'Job cancelled'})
        return Response({'error': 'Job cannot be cancelled'}, status=400)

# Additional API endpoints for advanced functionality

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def job_status(request, job_id):
    """
    Get detailed status of a processing job.
    """
    try:
        job = ProcessingJob.objects.get(id=job_id, user=request.user)
        
        response_data = {
            'job_id': job.id,
            'job_type': job.job_type,
            'status': job.status,
            'progress': job.progress,
            'created_at': job.created_at,
            'started_at': job.started_at,
            'completed_at': job.completed_at,
            'error_message': job.error_message,
            'parameters': job.parameters,
            'results': job.results
        }
        
        # Add HPC information if available
        if job.hpc_job_id:
            try:
                hpc_service = HPCJobService()
                hpc_status = hpc_service.get_job_status(job.hpc_job_id)
                response_data['hpc_status'] = hpc_status
                
                # Get logs if available
                logs = hpc_service.get_job_logs(job.hpc_job_id)
                if logs:
                    response_data['logs'] = logs
                    
            except Exception as e:
                logger.error(f"Error querying HPC status for job {job.id}: {e}")
                response_data['hpc_error'] = str(e)
        
        return Response(response_data)
        
    except ProcessingJob.DoesNotExist:
        return Response({
            "error": "Job not found"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error getting job status: {e}")
        return Response({
            "error": "Failed to get job status",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cancel_job(request, job_id):
    """
    Cancel a processing job.
    """
    try:
        job = ProcessingJob.objects.get(id=job_id, user=request.user)
        
        if job.status in ['completed', 'cancelled', 'failed']:
            return Response({
                "error": f"Cannot cancel job with status: {job.status}"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cancel HPC job if it exists
        if job.hpc_job_id:
            hpc_service = HPCJobService()
            hpc_service.cancel_job(job.hpc_job_id)
        
        job.status = 'cancelled'
        job.save()
        
        return Response({
            'job_id': job.id,
            'status': 'cancelled',
            'message': 'Job cancelled successfully'
        })
        
    except ProcessingJob.DoesNotExist:
        return Response({
            "error": "Job not found"
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error cancelling job {job_id}: {e}")
        return Response({
            "error": "Failed to cancel job",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_quota(request):
    """
    Get user's current quota and usage statistics.
    """
    try:
        user_profile = UserProfile.objects.get(user=request.user)
        
        # Calculate current usage
        current_usage = {
            'aois': AOI.objects.filter(user=request.user).count(),
            'downloads': Download.objects.filter(user=request.user).count(),
            'processing_jobs': ProcessingJob.objects.filter(user=request.user).count(),
        }
        
        # Calculate storage usage (in MB)
        total_storage = Download.objects.filter(
            user=request.user,
            status='completed'
        ).aggregate(
            total=Sum('satellite_image__file_size_mb')
        )['total'] or 0
        
        return Response({
            'user_id': request.user.id,
            'username': request.user.username,
            'quota_limits': user_profile.quota_limits,
            'current_usage': current_usage,
            'storage_usage_mb': total_storage,
            'quota_warnings': user_profile.check_quota_limits(current_usage)
        })
        
    except UserProfile.DoesNotExist:
        # Create default profile if it doesn't exist
        user_profile = UserProfile.objects.create(user=request.user)
        return Response({
            'user_id': request.user.id,
            'username': request.user.username,
            'quota_limits': user_profile.quota_limits,
            'current_usage': {'aois': 0, 'downloads': 0, 'processing_jobs': 0},
            'storage_usage_mb': 0,
            'quota_warnings': []
        })
    except Exception as e:
        logger.error(f"Error getting user quota: {e}")
        return Response({
            "error": "Failed to get quota information",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def imagery_search(request):
    """Simple imagery search endpoint for testing purposes."""
    try:
        data = request.data
        geometry = data.get('geometry')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        providers = data.get('providers', ['sentinel2'])
        max_cloud_cover = data.get('max_cloud_cover', 30.0)
        
        # Return mock search results for now
        results = {
            'total_results': 0,
            'images': [],
            'search_parameters': {
                'geometry': geometry,
                'start_date': start_date,
                'end_date': end_date,
                'providers': providers,
                'max_cloud_cover': max_cloud_cover
            },
            'message': 'Imagery search functionality is not fully implemented yet. This is a mock response for testing.'
        }
        
        return Response(results, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in imagery search: {e}")
        return Response({
            "error": "Failed to search imagery",
            "details": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AdministrativeBoundarySetViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing administrative boundary sets.
    """
    queryset = AdministrativeBoundarySet.objects.all()
    serializer_class = AdministrativeBoundarySetSerializer
    permission_classes = [permissions.AllowAny]  # Temporary for testing
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'is_public', 'data_year']
    search_fields = ['name', 'description', 'source']
    
    def get_queryset(self):
        """Filter boundary sets by user permissions."""
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            # Users can see their own sets and public ones
            return queryset.filter(
                Q(uploaded_by=self.request.user) | Q(is_public=True)
            )
        # Anonymous users see public sets only
        return queryset.filter(is_public=True)
    
    @action(detail=False, methods=['post'])
    def upload_boundaries(self, request):
        """
        Upload administrative boundaries from ZIP archive.
        """
        try:
            if 'file' not in request.FILES:
                return Response({
                    "error": "No file provided. Please upload a ZIP archive containing shapefiles."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            uploaded_file = request.FILES['file']
            file_extension = uploaded_file.name.split('.')[-1].lower()
            
            # Check file size (limit to 500MB for boundary files)
            max_size = 500 * 1024 * 1024  # 500MB in bytes
            if uploaded_file.size > max_size:
                return Response({
                    "error": f"File too large. Maximum file size is 500MB. Your file is {uploaded_file.size / (1024*1024):.1f}MB."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check file format
            if file_extension not in ['zip', 'tar', 'gz', 'tgz']:
                return Response({
                    "error": f"Unsupported file format: {file_extension}. Supported formats: ZIP, TAR, TAR.GZ"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get metadata from request
            boundary_set_name = request.data.get('name', f"Boundaries from {uploaded_file.name}")
            description = request.data.get('description', "")
            source = request.data.get('source', "")
            data_year = request.data.get('data_year')
            
            if data_year:
                try:
                    data_year = int(data_year)
                except ValueError:
                    data_year = None
            
            # Save file temporarily
            with tempfile.NamedTemporaryFile(
                suffix=f'.{file_extension}', 
                delete=False
            ) as temp_file:
                for chunk in uploaded_file.chunks():
                    temp_file.write(chunk)
                temp_path = temp_file.name
            
            try:
                # Process the boundaries
                user = request.user if request.user.is_authenticated else None
                success, message, boundary_set = AdministrativeBoundaryService.upload_boundary_archive(
                    temp_path,
                    uploaded_file.name,
                    user=user,
                    boundary_set_name=boundary_set_name,
                    description=description,
                    source=source,
                    data_year=data_year
                )
                
                if success:
                    return Response({
                        'success': True,
                        'message': message,
                        'boundary_set': AdministrativeBoundarySetSerializer(boundary_set).data
                    })
                else:
                    return Response({
                        "error": message
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            finally:
                # Clean up temp file
                os.unlink(temp_path)
                
        except Exception as e:
            logger.error(f"Error uploading boundaries: {e}")
            return Response({
                "error": "Failed to upload boundaries",
                "details": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def boundaries(self, request, pk=None):
        """
        Get boundaries in this set, optionally filtered by level.
        """
        boundary_set = self.get_object()
        level = request.query_params.get('level')
        parent_id = request.query_params.get('parent_id')
        include_geometry = request.query_params.get('include_geometry', 'false').lower() == 'true'
        
        queryset = AdministrativeBoundary.objects.filter(
            boundary_set=boundary_set,
            is_active=True
        )
        
        if level:
            queryset = queryset.filter(level=level)
        
        if parent_id:
            try:
                parent_id = int(parent_id)
                queryset = queryset.filter(parent_id=parent_id)
            except ValueError:
                pass
        
        queryset = queryset.order_by('level', 'name')
        
        # Use appropriate serializer based on whether geometry is needed
        if include_geometry:
            serializer = AdministrativeBoundarySerializer(queryset, many=True)
        else:
            serializer = AdministrativeBoundaryListSerializer(queryset, many=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def hierarchy(self, request, pk=None):
        """
        Get hierarchical structure of boundaries in this set.
        """
        boundary_set = self.get_object()
        
        # Build hierarchy
        hierarchy = {}
        
        # Get all levels in order
        levels = ['country', 'province', 'district', 'ward']
        
        for level in levels:
            boundaries = AdministrativeBoundary.objects.filter(
                boundary_set=boundary_set,
                level=level,
                is_active=True
            ).order_by('name')
            
            if boundaries.exists():
                hierarchy[level] = AdministrativeBoundaryListSerializer(boundaries, many=True).data
        
        return Response({
            'boundary_set': AdministrativeBoundarySetSerializer(boundary_set).data,
            'hierarchy': hierarchy
        })

class AdministrativeBoundaryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for individual administrative boundaries.
    """
    queryset = AdministrativeBoundary.objects.all()
    serializer_class = AdministrativeBoundarySerializer
    permission_classes = [permissions.AllowAny]  # Temporary for testing
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['boundary_set', 'level', 'is_active', 'parent']
    search_fields = ['name', 'name_0', 'name_1', 'name_2', 'name_3']
    
    def get_queryset(self):
        """Filter boundaries by boundary set permissions."""
        queryset = super().get_queryset()
        if self.request.user.is_authenticated:
            # Users can see boundaries from their sets and public sets
            return queryset.filter(
                Q(boundary_set__uploaded_by=self.request.user) | 
                Q(boundary_set__is_public=True)
            )
        # Anonymous users see boundaries from public sets only
        return queryset.filter(boundary_set__is_public=True)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search boundaries by name with intelligent filtering.
        """
        query = request.query_params.get('q', '').strip()
        boundary_set_id = request.query_params.get('boundary_set')
        level = request.query_params.get('level')
        limit = min(int(request.query_params.get('limit', 50)), 100)
        
        if not query:
            return Response([])
        
        try:
            boundary_set_id = int(boundary_set_id) if boundary_set_id else None
        except ValueError:
            boundary_set_id = None
        
        # Use service to search
        boundaries = AdministrativeBoundaryService.search_boundaries(
            query=query,
            boundary_set_id=boundary_set_id,
            level=level,
            limit=limit
        )
        
        # Filter by permissions
        if self.request.user.is_authenticated:
            boundaries = boundaries.filter(
                Q(boundary_set__uploaded_by=self.request.user) | 
                Q(boundary_set__is_public=True)
            )
        else:
            boundaries = boundaries.filter(boundary_set__is_public=True)
        
        serializer = AdministrativeBoundaryListSerializer(boundaries, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """
        Get child boundaries (next administrative level down).
        """
        boundary = self.get_object()
        children = boundary.get_children()
        
        include_geometry = request.query_params.get('include_geometry', 'false').lower() == 'true'
        
        if include_geometry:
            serializer = AdministrativeBoundarySerializer(children, many=True)
        else:
            serializer = AdministrativeBoundaryListSerializer(children, many=True)
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def aois(self, request, pk=None):
        """
        Get AOIs that intersect with this boundary.
        """
        boundary = self.get_object()
        aois = boundary.get_aois_in_boundary()
        
        # Filter by user permissions
        if self.request.user.is_authenticated:
            aois = aois.filter(
                Q(user=self.request.user) | Q(is_public=True) | Q(user__isnull=True)
            )
        else:
            aois = aois.filter(Q(is_public=True) | Q(user__isnull=True))
        
        serializer = AOISerializer(aois, many=True)
        return Response(serializer.data)
