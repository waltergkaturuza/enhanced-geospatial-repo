from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from .models import UserProfile, AOI, Download, ProcessingJob, IndexResult
from django.db.models import Count, Sum, Q
from rest_framework.authtoken.models import Token
import json
import logging
import os

# Helper function to authenticate token
def authenticate_token(request):
    """Extract and authenticate token from request headers"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return None
    return None

# Try to import psutil for system metrics, fallback if not available
try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

logger = logging.getLogger(__name__)

# Simple API views for the geospatial application
# These views provide basic functionality without requiring GDAL/PostGIS for now

@csrf_exempt
@require_http_methods(["GET", "POST"])
def parse_metadata(request):
    """Parse satellite imagery metadata"""
    if request.method == 'GET':
        return JsonResponse({
            'success': True, 
            'message': 'Metadata parsing endpoint ready',
            'supported_formats': ['TIFF', 'JP2', 'HDF'],
            'supported_satellites': ['Landsat 5', 'Landsat 7', 'Landsat 8', 'Landsat 9', 'Sentinel-2']
        })
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            filename = data.get('filename', 'unknown')
            logger.info(f"Parsing metadata for file: {filename}")
            
            # Simulate metadata parsing
            metadata = {
                'filename': filename,
                'satellite': 'Landsat 8',
                'acquisition_date': '2024-01-15',
                'cloud_cover': 12.5,
                'spatial_resolution': 30,
                'bands': ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'],
                'projection': 'EPSG:32635'
            }
            
            return JsonResponse({
                'success': True,
                'message': 'Metadata parsed successfully',
                'metadata': metadata
            })
        except Exception as e:
            logger.error(f"Error parsing metadata: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error parsing metadata: {str(e)}'
            }, status=400)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def upload_files(request):
    """Handle file uploads"""
    if request.method == 'GET':
        return JsonResponse({
            'success': True,
            'message': 'File upload endpoint ready',
            'max_file_size': '100MB',
            'supported_formats': ['.tif', '.jp2', '.hdf', '.nc']
        })
    
    if request.method == 'POST':
        try:
            uploaded_files = request.FILES.getlist('files')
            if not uploaded_files:
                return JsonResponse({
                    'success': False,
                    'message': 'No files provided'
                }, status=400)
            
            file_info = []
            for file in uploaded_files:
                file_info.append({
                    'name': file.name,
                    'size': file.size,
                    'content_type': file.content_type,
                    'upload_status': 'success'
                })
                logger.info(f"Uploaded file: {file.name} ({file.size} bytes)")
            
            return JsonResponse({
                'success': True,
                'message': f'Successfully uploaded {len(uploaded_files)} files',
                'files': file_info
            })
        except Exception as e:
            logger.error(f"Error uploading files: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error uploading files: {str(e)}'
            }, status=500)

@require_http_methods(["GET"])
def system_status(request):
    """Get comprehensive system status information for admin dashboard"""
    try:
        from django.contrib.auth.models import User
        from django.db import connection
        from django.utils import timezone
        from datetime import timedelta
        import os
        
        # Try to import psutil, but handle gracefully if not available
        try:
            import psutil
            PSUTIL_AVAILABLE = True
        except ImportError:
            PSUTIL_AVAILABLE = False
        
        # Get user metrics
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        # Get database response time
        start_time = timezone.now()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_response_time = int((timezone.now() - start_time).total_seconds() * 1000)
        
        # Get storage metrics
        storage_used = 0.0
        storage_total = 100.0  # Default 100GB
        
        try:
            # Try to get actual storage usage
            if hasattr(settings, 'MEDIA_ROOT') and settings.MEDIA_ROOT:
                media_root = str(settings.MEDIA_ROOT)
                if os.path.exists(media_root):
                    total_size = sum(
                        os.path.getsize(os.path.join(dirpath, filename))
                        for dirpath, dirnames, filenames in os.walk(media_root)
                        for filename in filenames
                    )
                    storage_used = total_size / (1024 ** 3)  # Convert to GB
        except Exception as e:
            logger.warning(f"Could not calculate storage usage: {e}")
            pass
        
        # Get system performance metrics
        if PSUTIL_AVAILABLE:
            try:
                cpu_usage = psutil.cpu_percent(interval=0.1)
                memory = psutil.virtual_memory()
                memory_usage = memory.percent
                disk = psutil.disk_usage('/')
                disk_usage = disk.percent
                network = psutil.net_io_counters()
                # Network usage as percentage (simplified - using bytes sent/received)
                network_usage = min(100, (network.bytes_sent + network.bytes_recv) / (1024 ** 3) * 10)  # Rough estimate
            except Exception:
                cpu_usage = 0
                memory_usage = 0
                disk_usage = 0
                network_usage = 0
        else:
            # Fallback values if psutil is not available
            cpu_usage = 0
            memory_usage = 0
            disk_usage = 0
            network_usage = 0
        
        # Get service status
        django_status = 'healthy'
        django_connections = 0
        django_response_time = db_response_time
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()")
                django_connections = cursor.fetchone()[0]
        except Exception:
            pass
        
        postgres_status = 'healthy'
        postgres_sessions = django_connections
        postgres_uptime = '99.9%'
        
        static_storage_status = 'healthy'
        static_storage_used_pct = (storage_used / storage_total * 100) if storage_total > 0 else 0
        static_storage_details = f"{storage_used:.1f} GB / {storage_total:.0f}GB"
        
        # Get API metrics (simplified - could be enhanced with actual tracking)
        api_requests = 0
        api_errors = 0
        error_rate = 0.0
        
        # Get recent security events (login events)
        security_events = []
        try:
            # Get recent user logins (last 24 hours)
            recent_logins = User.objects.filter(
                last_login__gte=timezone.now() - timedelta(days=1)
            ).order_by('-last_login')[:10]
            
            for user in recent_logins:
                if user.last_login:
                    security_events.append({
                        'id': str(user.id) + '-' + str(int(user.last_login.timestamp())),
                        'type': 'LOGIN',
                        'action': 'LOGIN SUCCESS',
                        'ipAddress': 'N/A',  # Would need to track IPs separately
                        'timestamp': user.last_login.isoformat(),
                        'status': 'success'
                    })
        except Exception:
            pass
        
        # Get system alerts
        alerts = []
        try:
            # Database health check
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            alerts.append({
                'id': 'db-health-1',
                'level': 'success',
                'title': 'Database Online',
                'message': f'PostgreSQL database is operational with {django_connections} active connections',
                'timestamp': timezone.now().isoformat()
            })
        except Exception as e:
            alerts.append({
                'id': 'db-error-1',
                'level': 'error',
                'title': 'Database Error',
                'message': f'Database connection issue: {str(e)}',
                'timestamp': timezone.now().isoformat()
            })
        
        # Compile comprehensive status
        status_info = {
            'status': 'active',
            'timestamp': timezone.now().isoformat(),
            'total_users': total_users,
            'active_users': active_users,
            'db_response_time': db_response_time,
            'storage_used': storage_used,
            'storage_total': storage_total,
            'api_calls': api_requests,
            'error_rate': error_rate,
            'performance': {
                'cpu': cpu_usage,
                'memory': memory_usage,
                'disk': disk_usage,
                'network': network_usage
            },
            'services': [
                {
                    'name': 'Django Backend',
                    'status': django_status,
                    'details': f'{django_connections} connections',
                    'metrics': f'{django_response_time}ms'
                },
                {
                    'name': 'PostgreSQL Database',
                    'status': postgres_status,
                    'details': f'{postgres_sessions} sessions',
                    'metrics': postgres_uptime + ' uptime'
                },
                {
                    'name': 'Static Storage',
                    'status': static_storage_status,
                    'details': f'{static_storage_used_pct:.1f}% used',
                    'metrics': static_storage_details
                },
                {
                    'name': 'API Gateway',
                    'status': 'healthy',
                    'details': f'{api_requests} requests',
                    'metrics': f'{error_rate:.2f}% errors'
                }
            ],
            'security_events': security_events[:5],  # Last 5 events
            'alerts': alerts[:5]  # Last 5 alerts
        }
        
        return JsonResponse({
            'success': True,
            'data': status_info
        })
    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error getting system status: {str(e)}'
        }, status=500)

@require_http_methods(["GET", "POST"])
def processing_queue(request):
    """Manage processing queue"""
    if request.method == 'GET':
        try:
            # Simulate processing queue data
            queue_data = {
                'queue_length': 3,
                'processing_capacity': 5,
                'jobs': [
                    {
                        'id': 'job_001',
                        'type': 'ndvi_calculation',
                        'status': 'running',
                        'progress': 65,
                        'started_at': '2024-01-15T09:45:00Z',
                        'estimated_completion': '2024-01-15T10:15:00Z'
                    },
                    {
                        'id': 'job_002',
                        'type': 'cloud_detection',
                        'status': 'queued',
                        'progress': 0,
                        'submitted_at': '2024-01-15T10:00:00Z'
                    },
                    {
                        'id': 'job_003',
                        'type': 'atmospheric_correction',
                        'status': 'queued',
                        'progress': 0,
                        'submitted_at': '2024-01-15T10:10:00Z'
                    }
                ]
            }
            
            return JsonResponse({
                'success': True,
                'data': queue_data
            })
        except Exception as e:
            logger.error(f"Error getting processing queue: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error getting processing queue: {str(e)}'
            }, status=500)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            job_type = data.get('type', 'unknown')
            parameters = data.get('parameters', {})
            
            # Simulate job submission
            job_id = f"job_{hash(str(data)) % 10000:04d}"
            
            logger.info(f"Submitted job {job_id} of type {job_type}")
            
            return JsonResponse({
                'success': True,
                'message': 'Job submitted successfully',
                'job_id': job_id,
                'status': 'queued',
                'estimated_start': '2024-01-15T10:30:00Z'
            })
        except Exception as e:
            logger.error(f"Error submitting job: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Error submitting job: {str(e)}'
            }, status=400)

# Authentication and user management endpoints
@csrf_exempt
@require_http_methods(["POST"])
def user_login(request):
    """User authentication endpoint"""
    try:
        data = json.loads(request.body)
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        
        if not password:
            return JsonResponse({
                'success': False,
                'message': 'Password is required'
            }, status=400)
            
        if not email and not username:
            return JsonResponse({
                'success': False,
                'message': 'Email or username is required'
            }, status=400)
        
        # Real authentication using Django's User model
        from django.contrib.auth import authenticate
        from django.contrib.auth.models import User
        
        user = None
        
        # Try to authenticate with email or username
        if email:
            try:
                user_obj = User.objects.get(email=email)
                user = authenticate(request, username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        elif username:
            user = authenticate(request, username=username, password=password)
        
        if user is not None and user.is_active:
            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            user_data = {
                'id': str(user.id),
                'email': user.email,
                'firstName': user.first_name or user.username,
                'lastName': user.last_name or '',
                'organization': getattr(profile, 'organization', 'Default Org'),
                'role': 'admin' if user.is_superuser else 'user',
                'subscriptionPlan': 'enterprise' if user.is_superuser else 'free',
                'isActive': user.is_active,
                'emailVerified': True,  # Assume verified for now
                'createdAt': user.date_joined.isoformat(),
                'modules': ['dashboard', 'imagery', 'analytics'] + (['admin'] if user.is_superuser else [])
            }
            
            # Generate a simple token (in production, use JWT or Django Rest Framework tokens)
            import secrets
            token = f"token_{user.id}_{secrets.token_hex(16)}"
            
            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'user': user_data,
                'token': token
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid credentials'
            }, status=401)
            
    except Exception as e:
        logger.error(f"Error during login: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Login error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def user_signup(request):
    """User registration endpoint"""
    try:
        data = json.loads(request.body)
        required_fields = ['email', 'password', 'firstName', 'lastName', 'organization']
        
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({
                    'success': False,
                    'message': f'{field} is required'
                }, status=400)
        
        # Simulate user creation
        user_data = {
            'id': str(hash(data['email']) % 10000),
            'email': data['email'],
            'firstName': data['firstName'],
            'lastName': data['lastName'],
            'organization': data['organization'],
            'role': data.get('role', 'viewer'),
            'subscriptionPlan': data.get('subscriptionPlan', 'free'),
            'isActive': True,
            'emailVerified': False,
            'createdAt': '2024-01-15T10:30:00Z',
            'modules': ['dashboard', 'imagery']
        }
        
        logger.info(f"Created user account for: {data['email']}")
        
        return JsonResponse({
            'success': True,
            'message': 'Account created successfully',
            'user': user_data
        })
        
    except Exception as e:
        logger.error(f"Error during signup: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Signup error: {str(e)}'
        }, status=500)

@require_http_methods(["GET"])
def user_profile(request):
    """Get user profile information"""
    # In a real app, this would be protected by authentication middleware
    try:
        # Simulate getting user profile
        profile_data = {
            'id': '1',
            'email': 'user@example.com',
            'firstName': 'Demo',
            'lastName': 'User',
            'organization': 'GeoSpatial Corp',
            'role': 'analyst',
            'subscriptionPlan': 'professional',
            'isActive': True,
            'emailVerified': True,
            'modules': ['dashboard', 'imagery', 'analytics'],
            'preferences': {
                'theme': 'light',
                'language': 'en',
                'timezone': 'UTC'
            }
        }
        
        return JsonResponse({
            'success': True,
            'user': profile_data
        })
        
    except Exception as e:
        logger.error(f"Error getting user profile: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error getting profile: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def pending_users(request):
    """Get list of users pending approval with detailed application information"""
    try:
        # Authenticate via token
        user = authenticate_token(request)
        if not user or not user.is_authenticated:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Check if user is admin or superuser
        if not (user.is_superuser or user.is_staff):
            return JsonResponse({
                'success': False,
                'message': 'Admin access required'
            }, status=403)
        
        logger.info("Fetching pending users")
        
        from django.contrib.auth.models import User
        
        # Get users with pending approval status in their profile
        pending_users_list = []
        
        # Get all users and check their profiles
        users = User.objects.all().select_related('profile').order_by('-date_joined')
        
        for user in users:
            try:
                profile = user.profile
                
                # Check if user is pending approval
                if profile.approval_status == 'pending':
                    # Extract email domain for trust assessment
                    email_domain = user.email.split('@')[1] if '@' in user.email else ''
                    
                    pending_users_list.append({
                        'id': str(user.id),
                        'email': user.email,
                        'emailDomain': email_domain,
                        'firstName': user.first_name,
                        'lastName': user.last_name,
                        'organization': profile.organization or '',
                        'organizationType': profile.organization_type or '',
                        'intendedUse': profile.intended_use or '',
                        'intendedUseDetails': profile.intended_use_details or '',
                        'country': profile.country or 'Zimbabwe',
                        'userPath': profile.user_path or 'individual',
                        'role': 'pending_user',
                        'subscriptionPlan': 'free_pending',
                        'isActive': user.is_active,
                        'emailVerified': True,
                        'isApproved': False,
                        'approvalStatus': 'pending',
                        'createdAt': user.date_joined.isoformat(),
                        'modules': ['dashboard', 'data_store']
                    })
            except Exception as e:
                logger.warning(f"Could not get profile for user {user.id}: {str(e)}")
                continue
        
        return JsonResponse({
            'success': True,
            'results': pending_users_list,  # Frontend expects 'results'
            'count': len(pending_users_list)
        })
        
    except Exception as e:
        logger.error(f"Error fetching pending users: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching pending users: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def approve_user(request):
    """
    Approve a pending user and assign appropriate role and subscription.
    
    Admin assigns:
    - Role (viewer, researcher, analyst, business_user, etc.)
    - Subscription plan (free, professional, enterprise)
    - Data access level
    - Storage/compute quotas
    """
    try:
        # Use token authentication
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Check if user is admin or superuser
        if not (user.is_superuser or user.is_staff):
            return JsonResponse({
                'success': False,
                'message': 'Admin access required'
            }, status=403)
        
        data = json.loads(request.body)
        user_id = data.get('user_id') or data.get('userId')
        assigned_role = data.get('role', 'viewer')  # Default to viewer
        assigned_subscription = data.get('subscription_plan', 'free')  # Default to free
        assigned_quotas = data.get('quotas', {})
        notes = data.get('notes', '')
        
        if not user_id:
            return JsonResponse({
                'success': False,
                'message': 'User ID is required'
            }, status=400)
        
        logger.info(f"Admin {user.username} approving user {user_id} with role {assigned_role}")
        
        from django.contrib.auth.models import User, Group
        from django.utils import timezone
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'User not found'
            }, status=404)
        
        # Get or create user profile
        from .models import UserProfile
        profile, created = UserProfile.objects.get_or_create(user=target_user)
        
        # Check if user is already approved
        if profile.approval_status == 'approved':
            return JsonResponse({
                'success': False,
                'message': 'User is already approved'
            }, status=400)
        
        # Assign modules based on role FIRST (IMPORTANT: Regular users get DOWNLOAD only, not UPLOAD)
        if assigned_role == 'admin':
            # Admin: Full system access
            assigned_modules = ['dashboard', 'imagery', 'analytics', 'business', 'admin', 'upload', 'files', 'store']
        elif assigned_role in ['analyst', 'business_user']:
            # Analyst/Business: Download + advanced analytics (no upload/file management)
            assigned_modules = ['dashboard', 'imagery', 'analytics', 'data_store']
        elif assigned_role == 'researcher':
            # Researcher: Download + basic analytics (no upload/file management)
            assigned_modules = ['dashboard', 'imagery', 'analytics', 'data_store']
        else:
            # Viewer: Browse and download only
            assigned_modules = ['dashboard', 'imagery', 'data_store']
        
        # Update approval status
        profile.approval_status = 'approved'
        profile.approved_by = user
        profile.approved_at = timezone.now()
        
        # IMPORTANT: Activate the user account (allow login)
        target_user.is_active = True
        target_user.save()
        
        # Assign quotas based on role and subscription
        if assigned_subscription == 'free':
            profile.max_aois = assigned_quotas.get('max_aois', 10)
            profile.max_download_size_gb = assigned_quotas.get('max_download_size_gb', 50.0)
            profile.max_concurrent_downloads = assigned_quotas.get('max_concurrent_downloads', 3)
        elif assigned_subscription == 'professional':
            profile.max_aois = assigned_quotas.get('max_aois', 50)
            profile.max_download_size_gb = assigned_quotas.get('max_download_size_gb', 500.0)
            profile.max_concurrent_downloads = assigned_quotas.get('max_concurrent_downloads', 10)
        elif assigned_subscription == 'enterprise':
            profile.max_aois = assigned_quotas.get('max_aois', 999)
            profile.max_download_size_gb = assigned_quotas.get('max_download_size_gb', 5000.0)
            profile.max_concurrent_downloads = assigned_quotas.get('max_concurrent_downloads', 50)
        
        # Store assigned modules in profile
        profile.assigned_modules = assigned_modules
        profile.save()
        
        # Assign user to appropriate group based on role
        target_user.groups.clear()
        
        role_group_mapping = {
            'viewer': 'User',
            'researcher': 'Researcher',
            'analyst': 'Analyst',
            'business_user': 'Business User',
            'admin': 'Admin'
        }
        
        group_name = role_group_mapping.get(assigned_role, 'User')
        user_group, _ = Group.objects.get_or_create(name=group_name)
        target_user.groups.add(user_group)
        
        # If admin role, also make them staff
        if assigned_role == 'admin':
            target_user.is_staff = True
            target_user.save()
        
        logger.info(f"User {target_user.email} approved successfully:")
        logger.info(f"  - Role: {assigned_role}")
        logger.info(f"  - Subscription: {assigned_subscription}")
        logger.info(f"  - Modules: {', '.join(assigned_modules)}")
        logger.info(f"  - Max AOIs: {profile.max_aois}")
        logger.info(f"  - Max Download: {profile.max_download_size_gb} GB")
        
        # TODO: Send approval email notification
        # send_approval_email(target_user, assigned_role, assigned_subscription)
        
        approval_result = {
            'user_id': user_id,
            'status': 'approved',
            'approved_by': user.username,
            'approved_at': profile.approved_at.isoformat(),
            'assigned_role': assigned_role,
            'assigned_subscription': assigned_subscription,
            'assigned_modules': assigned_modules,
            'quotas': {
                'max_aois': profile.max_aois,
                'max_download_size_gb': profile.max_download_size_gb,
                'max_concurrent_downloads': profile.max_concurrent_downloads
            }
        }
        
        return JsonResponse({
            'success': True,
            'message': f'User {target_user.first_name} {target_user.last_name} approved successfully with {assigned_role} role',
            'data': approval_result
        })
        
    except Exception as e:
        logger.error(f"Error approving user: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error approving user: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def reject_user(request):
    """
    Reject a pending user with a reason.
    
    User account remains but cannot access data until re-applied.
    """
    try:
        # Use token authentication
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Check if user is admin or superuser
        if not (user.is_superuser or user.is_staff):
            return JsonResponse({
                'success': False,
                'message': 'Admin access required'
            }, status=403)
        
        data = json.loads(request.body)
        user_id = data.get('user_id') or data.get('userId')
        rejection_reason = data.get('reason', 'No reason provided')
        
        if not user_id:
            return JsonResponse({
                'success': False,
                'message': 'User ID is required'
            }, status=400)
        
        if not rejection_reason or rejection_reason.strip() == '':
            return JsonResponse({
                'success': False,
                'message': 'Rejection reason is required'
            }, status=400)
        
        logger.info(f"Admin {user.username} rejecting user {user_id}, reason: {rejection_reason}")
        
        from django.contrib.auth.models import User
        from django.utils import timezone
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'User not found'
            }, status=404)
        
        # Get or create user profile
        from .models import UserProfile
        profile, created = UserProfile.objects.get_or_create(user=target_user)
        
        # Update rejection status
        profile.approval_status = 'rejected'
        profile.rejection_reason = rejection_reason
        profile.approved_by = user  # Track who rejected
        profile.approved_at = timezone.now()  # Track when rejected
        profile.save()
        
        # Optionally deactivate the user account
        # target_user.is_active = False
        # target_user.save()
        
        logger.info(f"User {target_user.email} rejected successfully")
        logger.info(f"  - Reason: {rejection_reason}")
        
        # TODO: Send rejection email notification
        # send_rejection_email(target_user, rejection_reason)
        
        rejection_result = {
            'user_id': user_id,
            'status': 'rejected',
            'rejected_by': user.username,
            'rejected_at': timezone.now().isoformat(),
            'rejection_reason': rejection_reason
        }
        
        return JsonResponse({
            'success': True,
            'message': f'User {target_user.first_name} {target_user.last_name} rejected',
            'data': rejection_result
        })
        
    except Exception as e:
        logger.error(f"Error rejecting user: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error rejecting user: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def admin_users(request):
    """Get all users for admin/role management"""
    try:
        # Authenticate via token
        user = authenticate_token(request)
        if not user or not user.is_authenticated:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Check if user is admin or superuser
        if not (user.is_superuser or user.is_staff):
            return JsonResponse({
                'success': False,
                'message': 'Admin access required'
            }, status=403)
        
        from django.contrib.auth.models import User
        
        # Get all users WITHOUT select_related to avoid UserProfile errors
        users = User.objects.all().order_by('-date_joined')
        
        # Transform to frontend format
        users_data = []
        for user in users:
            is_superuser = user.is_superuser or user.is_staff
            user_role = 'admin' if is_superuser else 'user'
            subscription_plan = 'enterprise' if is_superuser else 'free'
            
            # Get user's last login from session (if available)
            # Django doesn't track last login by default, so we'll use date_joined as fallback
            last_login = user.last_login.isoformat() if user.last_login else None
            
            # Get organization if available (handle missing profile gracefully)
            organization = ''
            try:
                if hasattr(user, 'profile'):
                    organization = getattr(user.profile, 'organization', '') or ''
            except Exception:
                pass
            
            # Determine modules based on role
            if is_superuser:
                # Staff/Admin: Full access
                user_modules = ['dashboard', 'imagery', 'analytics', 'business', 'admin', 'upload', 'files', 'store']
            else:
                # Regular users: Download only
                user_modules = ['dashboard', 'imagery', 'data_store']
            
            users_data.append({
                'id': str(user.id),
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'organization': organization,
                'role': user_role,
                'subscriptionPlan': subscription_plan,
                'isActive': user.is_active,
                'isSuperuser': is_superuser,
                'emailVerified': True,  # Assume verified for existing users
                'isApproved': True,  # Assume approved for existing users
                'approvalStatus': 'approved',
                'createdAt': user.date_joined.isoformat(),
                'lastLoginAt': last_login,
                'modules': user_modules
            })
        
        return JsonResponse({
            'success': True,
            'data': {
                'users': users_data,
                'count': len(users_data)
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching users: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching users: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def update_user_role(request):
    """Update user role and status"""
    try:
        # Use token authentication
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Check if user is admin or superuser
        if not (user.is_superuser or user.is_staff):
            return JsonResponse({
                'success': False,
                'message': 'Admin access required'
            }, status=403)
        
        data = json.loads(request.body)
        user_id = data.get('userId') or data.get('user_id')
        new_role = data.get('role')
        is_active = data.get('isActive')
        
        if not user_id:
            return JsonResponse({
                'success': False,
                'message': 'User ID is required'
            }, status=400)
        
        from django.contrib.auth.models import User, Group
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'User not found'
            }, status=404)
        
        # Prevent modifying superusers (unless current user is also superuser)
        if target_user.is_superuser and not user.is_superuser:
            return JsonResponse({
                'success': False,
                'message': 'Cannot modify superuser accounts'
            }, status=403)
        
        # Update active status
        if is_active is not None:
            target_user.is_active = is_active
            target_user.save()
        
        # Update role by managing groups
        if new_role:
            # Clear existing groups
            target_user.groups.clear()
            
            # Add user to appropriate group based on role
            if new_role == 'admin':
                admin_group, created = Group.objects.get_or_create(name='Admin')
                target_user.groups.add(admin_group)
                target_user.is_staff = True
                target_user.save()
            elif new_role == 'user':
                user_group, created = Group.objects.get_or_create(name='User')
                target_user.groups.add(user_group)
                target_user.is_staff = False
                target_user.save()
            elif new_role == 'viewer':
                viewer_group, created = Group.objects.get_or_create(name='Viewer')
                target_user.groups.add(viewer_group)
                target_user.is_staff = False
                target_user.save()
        
        return JsonResponse({
            'success': True,
            'message': 'User updated successfully',
            'data': {
                'userId': str(target_user.id),
                'role': new_role or target_user.groups.first().name if target_user.groups.exists() else 'user',
                'isActive': target_user.is_active
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Error updating user role: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error updating user role: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET", "POST"])
def emergency_fix_columns(request):
    """
    TEMPORARY EMERGENCY ENDPOINT
    
    Manually adds UserProfile columns using raw SQL.
    Visit this URL in your browser to fix the "column does not exist" errors.
    
    Usage: GET https://your-site.com/api/admin/emergency-fix-columns/
    """
    try:
        # Check if user is admin or superuser (only for GET, allow POST for emergency)
        if request.method == 'GET':
            if not request.user.is_authenticated or not (request.user.is_superuser or request.user.is_staff):
                return JsonResponse({
                    'success': False,
                    'message': 'Admin access required. Login to /admin/ first, then visit this URL.'
                }, status=403)
        
        from django.db import connection
        
        logger.info("=" * 60)
        logger.info("EMERGENCY FIX: Adding UserProfile columns")
        logger.info("=" * 60)
        
        results = []
        
        sql_commands = [
            ('organization', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS organization VARCHAR(255) DEFAULT '' NOT NULL"),
            ('organization_type', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS organization_type VARCHAR(100) DEFAULT '' NOT NULL"),
            ('intended_use', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS intended_use VARCHAR(100) DEFAULT '' NOT NULL"),
            ('intended_use_details', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS intended_use_details TEXT DEFAULT '' NOT NULL"),
            ('country', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Zimbabwe' NOT NULL"),
            ('user_path', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS user_path VARCHAR(50) DEFAULT 'individual' NOT NULL"),
            ('approval_status', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending' NOT NULL"),
            ('approved_at', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP NULL"),
            ('approved_by_id', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS approved_by_id INTEGER NULL"),
            ('rejection_reason', "ALTER TABLE imagery_userprofile ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '' NOT NULL"),
        ]
        
        with connection.cursor() as cursor:
            for column_name, sql in sql_commands:
                try:
                    logger.info(f"Adding column: {column_name}")
                    cursor.execute(sql)
                    results.append({
                        'column': column_name,
                        'status': 'added',
                        'message': 'Column added successfully or already exists'
                    })
                    logger.info(f"✓ {column_name} - OK")
                except Exception as e:
                    error_msg = str(e)
                    if 'already exists' in error_msg or 'duplicate column' in error_msg:
                        results.append({
                            'column': column_name,
                            'status': 'exists',
                            'message': 'Column already exists'
                        })
                        logger.info(f"✓ {column_name} - Already exists")
                    else:
                        results.append({
                            'column': column_name,
                            'status': 'error',
                            'message': error_msg
                        })
                        logger.error(f"✗ {column_name} - Error: {error_msg}")
        
        # Try to add foreign key constraint
        try:
            with connection.cursor() as cursor:
                cursor.execute("""
                    ALTER TABLE imagery_userprofile 
                    ADD CONSTRAINT IF NOT EXISTS imagery_userprofile_approved_by_id_fkey 
                    FOREIGN KEY (approved_by_id) REFERENCES auth_user(id) ON DELETE SET NULL
                """)
                results.append({
                    'column': 'approved_by_id_fkey',
                    'status': 'added',
                    'message': 'Foreign key constraint added'
                })
        except Exception as e:
            logger.warning(f"Could not add foreign key: {str(e)}")
            results.append({
                'column': 'approved_by_id_fkey',
                'status': 'skipped',
                'message': f'FK constraint skipped: {str(e)}'
            })
        
        logger.info("=" * 60)
        logger.info("EMERGENCY FIX COMPLETED")
        logger.info("=" * 60)
        
        return JsonResponse({
            'success': True,
            'message': 'Emergency column fix completed! Refresh your admin page.',
            'results': results,
            'next_steps': [
                'Refresh the admin page (/admin/auth/user/)',
                'Try signing up a new user',
                'All API endpoints should now work',
                'You can delete this endpoint after confirming everything works'
            ]
        })
        
    except Exception as e:
        logger.error(f"Emergency fix error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Emergency fix failed: {str(e)}',
            'help': 'Check server logs for details'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def database_stats(request):
    """Get real database statistics"""
    try:
        # Use token authentication
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        from django.db import connection
        from django.contrib.auth.models import User
        
        # Get table statistics from database
        with connection.cursor() as cursor:
            # Get database size
            cursor.execute("""
                SELECT pg_database_size(current_database()) / (1024.0 * 1024.0 * 1024.0) as size_gb
            """)
            db_size_result = cursor.fetchone()
            db_size_gb = float(db_size_result[0]) if db_size_result else 0.0
            
            # Get table information
            cursor.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    pg_total_relation_size(schemaname||'.'||tablename) / (1024.0 * 1024.0) as size_mb,
                    n_tup_ins + n_tup_upd + n_tup_del as row_count
                FROM pg_stat_user_tables
                WHERE schemaname = 'public'
                ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
                LIMIT 20
            """)
            
            tables_data = []
            for row in cursor.fetchall():
                schema, table_name, size_mb, row_count = row
                
                # Format size
                if size_mb < 1:
                    size_display = f"{size_mb * 1024:.1f} KB"
                elif size_mb >= 1024:
                    size_display = f"{size_mb / 1024:.2f} GB"
                else:
                    size_display = f"{size_mb:.1f} MB"
                
                tables_data.append({
                    'name': table_name,
                    'rows': int(row_count) if row_count else 0,
                    'size': size_display,
                    'size_mb': float(size_mb)
                })
            
            # Get connection count
            cursor.execute("""
                SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()
            """)
            connection_count = cursor.fetchone()[0]
            
            # Get query time (simple test)
            start = timezone.now()
            cursor.execute("SELECT COUNT(*) FROM auth_user")
            user_count = cursor.fetchone()[0]
            query_time_ms = int((timezone.now() - start).total_seconds() * 1000)
        
        return JsonResponse({
            'success': True,
            'data': {
                'database_size_gb': round(db_size_gb, 2),
                'total_size_gb': 100.0,  # Your plan limit
                'tables': tables_data,
                'connection_count': connection_count,
                'avg_query_time_ms': query_time_ms,
                'total_users': user_count
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching database stats: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching database stats: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def dashboard_stats(request):
    """Get dashboard statistics for the authenticated user"""
    try:
        # Authenticate via token
        user = authenticate_token(request)
        if not user or not user.is_authenticated:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Get active projects (AOIs)
        active_projects = AOI.objects.filter(user=user).count()
        
        # Get data downloads count
        data_downloads = Download.objects.filter(user=user).count()
        
        # Get analysis jobs count (processing jobs)
        analysis_jobs = ProcessingJob.objects.filter(user=user).count()
        
        # Get storage used (sum of download file sizes)
        storage_used_gb = Download.objects.filter(
            user=user
        ).aggregate(
            total_size=Sum('file_size_gb')
        )['total_size'] or 0.0
        
        # Format storage
        if storage_used_gb < 1:
            storage_display = f"{storage_used_gb * 1024:.1f} MB"
        else:
            storage_display = f"{storage_used_gb:.1f} GB"
        
        stats = {
            'active_projects': active_projects,
            'data_downloads': data_downloads,
            'analysis_jobs': analysis_jobs,
            'storage_used': storage_display,
            'storage_used_gb': storage_used_gb
        }
        
        return JsonResponse({
            'success': True,
            'data': stats
        })
        
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error getting dashboard stats: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def dashboard_activity(request):
    """Get recent activity for the authenticated user"""
    try:
        # Authenticate via token
        user = authenticate_token(request)
        if not user or not user.is_authenticated:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        activities = []
        
        # Get recent downloads (last 10)
        recent_downloads = Download.objects.filter(
            user=user
        ).order_by('-requested_at')[:5]
        
        for download in recent_downloads:
            activities.append({
                'id': f"download_{download.id}",
                'type': 'download',
                'title': f'Downloaded {download.aoi.name if download.aoi else "imagery"}',
                'timestamp': download.requested_at,
                'icon': 'download'
            })
        
        # Get recent processing jobs (last 10)
        recent_jobs = ProcessingJob.objects.filter(
            user=user
        ).order_by('-submitted_at')[:5]
        
        for job in recent_jobs:
            job_type_display = job.job_type.replace('_', ' ').title()
            activities.append({
                'id': f"job_{job.id}",
                'type': 'analysis',
                'title': f'Completed {job_type_display} job',
                'timestamp': job.completed_at or job.submitted_at,
                'icon': 'analysis'
            })
        
        # Get recent AOIs (last 5)
        recent_aois = AOI.objects.filter(
            user=user
        ).order_by('-created_at')[:3]
        
        for aoi in recent_aois:
            activities.append({
                'id': f"aoi_{aoi.id}",
                'type': 'upload',
                'title': f'Created AOI: {aoi.name}',
                'timestamp': aoi.created_at,
                'icon': 'upload'
            })
        
        # Get recent index results (last 5)
        recent_indices = IndexResult.objects.filter(
            aoi__user=user
        ).order_by('-computed_at')[:3]
        
        for index in recent_indices:
            activities.append({
                'id': f"index_{index.id}",
                'type': 'analysis',
                'title': f'Computed {index.index_type} for {index.aoi.name}',
                'timestamp': index.computed_at,
                'icon': 'analysis'
            })
        
        # Sort by timestamp (most recent first) and limit to 10
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        activities = activities[:10]
        
        # Format timestamps to relative time
        now = timezone.now()
        formatted_activities = []
        for activity in activities:
            timestamp = activity['timestamp']
            if isinstance(timestamp, str):
                from django.utils.dateparse import parse_datetime
                timestamp = parse_datetime(timestamp)
            
            if timestamp:
                delta = now - timestamp
                if delta.days > 0:
                    if delta.days == 1:
                        time_str = '1 day ago'
                    else:
                        time_str = f'{delta.days} days ago'
                elif delta.seconds >= 3600:
                    hours = delta.seconds // 3600
                    time_str = f'{hours} hour{"s" if hours > 1 else ""} ago'
                elif delta.seconds >= 60:
                    minutes = delta.seconds // 60
                    time_str = f'{minutes} minute{"s" if minutes > 1 else ""} ago'
                else:
                    time_str = 'Just now'
            else:
                time_str = 'Unknown'
            
            formatted_activities.append({
                'id': activity['id'],
                'type': activity['type'],
                'title': activity['title'],
                'timestamp': time_str,
                'icon': activity['icon']
            })
        
        return JsonResponse({
            'success': True,
            'data': formatted_activities
        })
        
    except Exception as e:
        logger.error(f"Error getting dashboard activity: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error getting dashboard activity: {str(e)}'
        }, status=500)

# ============================================================================
# SUBSCRIPTION MANAGEMENT ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def subscription_plans(request):
    """Get all available subscription plans"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        from .models import SubscriptionPlan
        
        # Get active plans
        plans = SubscriptionPlan.objects.filter(is_active=True, is_public=True).order_by('display_order')
        
        plans_data = []
        for plan in plans:
            plans_data.append({
                'id': plan.id,
                'name': plan.name,
                'slug': plan.slug,
                'description': plan.description,
                'pricing': {
                    'monthly': float(plan.price_monthly),
                    'yearly': float(plan.price_yearly),
                    'is_free': plan.is_free,
                    'annual_savings': float(plan.get_annual_savings()) if plan.price_yearly else 0
                },
                'quotas': {
                    'max_aois': plan.max_aois,
                    'max_download_size_gb': plan.max_download_size_gb,
                    'max_concurrent_downloads': plan.max_concurrent_downloads,
                    'max_users': plan.max_users
                },
                'features': plan.features,
                'capabilities': {
                    'analytics': plan.has_analytics,
                    'api_access': plan.has_api_access,
                    'priority_support': plan.has_priority_support,
                    'custom_processing': plan.has_custom_processing
                },
                'target_user_types': plan.target_user_types
            })
        
        return JsonResponse({
            'success': True,
            'data': plans_data
        })
        
    except Exception as e:
        logger.error(f"Error getting subscription plans: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error getting subscription plans: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def current_subscription(request):
    """Get current user's subscription details"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        from .models import UserSubscription
        
        try:
            subscription = UserSubscription.objects.select_related('plan').get(user=user)
            
            subscription_data = {
                'id': subscription.id,
                'plan': {
                    'name': subscription.plan.name,
                    'slug': subscription.plan.slug,
                    'description': subscription.plan.description
                },
                'status': subscription.status,
                'billing_cycle': subscription.billing_cycle,
                'dates': {
                    'starts_at': subscription.starts_at.isoformat() if subscription.starts_at else None,
                    'expires_at': subscription.expires_at.isoformat() if subscription.expires_at else None,
                    'trial_ends_at': subscription.trial_ends_at.isoformat() if subscription.trial_ends_at else None,
                    'cancelled_at': subscription.cancelled_at.isoformat() if subscription.cancelled_at else None,
                    'next_payment_date': subscription.next_payment_date.isoformat() if subscription.next_payment_date else None
                },
                'auto_renew': subscription.auto_renew,
                'is_valid': subscription.is_valid()
            }
            
            return JsonResponse({
                'success': True,
                'data': subscription_data
            })
            
        except UserSubscription.DoesNotExist:
            return JsonResponse({
                'success': True,
                'data': None,
                'message': 'No active subscription found'
            })
        
    except Exception as e:
        logger.error(f"Error getting current subscription: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error getting current subscription: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def user_invoices(request):
    """Get user's invoices"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        from .models import Invoice
        
        invoices = Invoice.objects.filter(user=user).order_by('-invoice_date')
        
        invoices_data = []
        for invoice in invoices:
            invoices_data.append({
                'id': invoice.id,
                'invoice_number': invoice.invoice_number,
                'invoice_date': invoice.invoice_date.isoformat(),
                'due_date': invoice.due_date.isoformat(),
                'amounts': {
                    'subtotal': float(invoice.subtotal),
                    'tax_rate': float(invoice.tax_rate),
                    'tax_amount': float(invoice.tax_amount),
                    'total': float(invoice.total_amount),
                    'currency': invoice.currency
                },
                'status': invoice.status,
                'paid_at': invoice.paid_at.isoformat() if invoice.paid_at else None,
                'payment_method': invoice.payment_method,
                'items': invoice.items
            })
        
        return JsonResponse({
            'success': True,
            'data': invoices_data
        })
        
    except Exception as e:
        logger.error(f"Error getting invoices: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error getting invoices: {str(e)}'
        }, status=500)

# ============================================================================
# SUPPORT REQUEST ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET", "POST"])
def support_requests(request):
    """List or create support requests"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        from .models import SupportRequest, SupportMessage
        
        if request.method == 'GET':
            # Staff can see all requests, users see only their own
            if user.is_staff or user.is_superuser:
                status_filter = request.GET.get('status')
                if status_filter:
                    requests_qs = SupportRequest.objects.filter(status=status_filter)
                else:
                    requests_qs = SupportRequest.objects.all()
            else:
                requests_qs = SupportRequest.objects.filter(user=user)
            
            requests_qs = requests_qs.select_related('user', 'assigned_to').order_by('-created_at')
            
            requests_data = []
            for req in requests_qs:
                # Get message count
                message_count = req.messages.count()
                last_message = req.messages.last()
                
                requests_data.append({
                    'id': req.id,
                    'request_type': req.request_type,
                    'request_type_display': req.get_request_type_display(),
                    'subject': req.subject,
                    'description': req.description,
                    'status': req.status,
                    'status_display': req.get_status_display(),
                    'priority': req.priority,
                    'priority_display': req.get_priority_display(),
                    'user': {
                        'id': req.user.id,
                        'email': req.user.email,
                        'name': f"{req.user.first_name} {req.user.last_name}".strip()
                    },
                    'assigned_to': {
                        'id': req.assigned_to.id,
                        'email': req.assigned_to.email,
                        'name': f"{req.assigned_to.first_name} {req.assigned_to.last_name}".strip()
                    } if req.assigned_to else None,
                    'created_at': req.created_at.isoformat(),
                    'updated_at': req.updated_at.isoformat(),
                    'resolved_at': req.resolved_at.isoformat() if req.resolved_at else None,
                    'message_count': message_count,
                    'last_message_at': last_message.created_at.isoformat() if last_message else None
                })
            
            return JsonResponse({
                'success': True,
                'data': requests_data
            })
        
        elif request.method == 'POST':
            data = json.loads(request.body)
            
            # Create new support request
            support_request = SupportRequest.objects.create(
                user=user,
                request_type=data.get('request_type', 'general'),
                subject=data.get('subject', ''),
                description=data.get('description', ''),
                priority=data.get('priority', 'medium')
            )
            
            # Create initial message
            if data.get('description'):
                SupportMessage.objects.create(
                    request=support_request,
                    user=user,
                    message=data.get('description'),
                    is_staff_reply=False
                )
            
            return JsonResponse({
                'success': True,
                'message': 'Support request created successfully',
                'data': {
                    'id': support_request.id,
                    'subject': support_request.subject
                }
            })
        
    except Exception as e:
        logger.error(f"Error handling support requests: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error handling support requests: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET", "POST", "PUT"])
def support_request_detail(request, request_id):
    """Get or update a specific support request with messages"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        from .models import SupportRequest, SupportMessage
        
        # Get the support request
        try:
            support_request = SupportRequest.objects.select_related('user', 'assigned_to').get(id=request_id)
        except SupportRequest.DoesNotExist:
            return JsonResponse({
                'success': False,
                'message': 'Support request not found'
            }, status=404)
        
        # Check access permission
        if not (user.is_staff or user.is_superuser or support_request.user == user):
            return JsonResponse({
                'success': False,
                'message': 'Access denied'
            }, status=403)
        
        if request.method == 'GET':
            # Get all messages
            messages = support_request.messages.select_related('user').order_by('created_at')
            
            # Filter out internal messages for non-staff
            if not (user.is_staff or user.is_superuser):
                messages = messages.filter(is_internal=False)
            
            messages_data = []
            for msg in messages:
                messages_data.append({
                    'id': msg.id,
                    'user': {
                        'id': msg.user.id,
                        'email': msg.user.email,
                        'name': f"{msg.user.first_name} {msg.user.last_name}".strip()
                    },
                    'message': msg.message,
                    'is_staff_reply': msg.is_staff_reply,
                    'is_internal': msg.is_internal,
                    'created_at': msg.created_at.isoformat()
                })
            
            request_data = {
                'id': support_request.id,
                'request_type': support_request.request_type,
                'request_type_display': support_request.get_request_type_display(),
                'subject': support_request.subject,
                'description': support_request.description,
                'status': support_request.status,
                'status_display': support_request.get_status_display(),
                'priority': support_request.priority,
                'priority_display': support_request.get_priority_display(),
                'user': {
                    'id': support_request.user.id,
                    'email': support_request.user.email,
                    'name': f"{support_request.user.first_name} {support_request.user.last_name}".strip()
                },
                'assigned_to': {
                    'id': support_request.assigned_to.id,
                    'email': support_request.assigned_to.email,
                    'name': f"{support_request.assigned_to.first_name} {support_request.assigned_to.last_name}".strip()
                } if support_request.assigned_to else None,
                'created_at': support_request.created_at.isoformat(),
                'updated_at': support_request.updated_at.isoformat(),
                'resolved_at': support_request.resolved_at.isoformat() if support_request.resolved_at else None,
                'messages': messages_data
            }
            
            return JsonResponse({
                'success': True,
                'data': request_data
            })
        
        elif request.method == 'POST':
            # Add a new message
            data = json.loads(request.body)
            
            message = SupportMessage.objects.create(
                request=support_request,
                user=user,
                message=data.get('message', ''),
                is_staff_reply=user.is_staff or user.is_superuser,
                is_internal=data.get('is_internal', False) and (user.is_staff or user.is_superuser)
            )
            
            # Update request status if needed
            if support_request.status == 'waiting_user' and not message.is_staff_reply:
                support_request.status = 'open'
                support_request.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Message added successfully',
                'data': {
                    'id': message.id,
                    'created_at': message.created_at.isoformat()
                }
            })
        
        elif request.method == 'PUT':
            # Update request (staff only)
            if not (user.is_staff or user.is_superuser):
                return JsonResponse({
                    'success': False,
                    'message': 'Only staff can update request details'
                }, status=403)
            
            data = json.loads(request.body)
            
            if 'status' in data:
                support_request.status = data['status']
                if data['status'] == 'resolved':
                    support_request.mark_resolved()
                elif data['status'] == 'closed':
                    support_request.mark_closed()
            
            if 'priority' in data:
                support_request.priority = data['priority']
            
            if 'assigned_to' in data:
                if data['assigned_to']:
                    from django.contrib.auth.models import User
                    assigned_user = User.objects.get(id=data['assigned_to'])
                    support_request.assigned_to = assigned_user
                else:
                    support_request.assigned_to = None
            
            support_request.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Support request updated successfully'
            })
        
    except Exception as e:
        logger.error(f"Error handling support request detail: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error handling support request: {str(e)}'
        }, status=500)

# ============================================================================
# FEEDBACK ENDPOINT
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def submit_feedback(request):
    """Submit user feedback"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        from .models import SupportRequest, SupportMessage
        
        data = json.loads(request.body)
        
        # Create support request with type 'feature_request' or 'general'
        feedback_type = data.get('type', 'general')
        rating = data.get('rating', 0)
        subject = data.get('subject', 'User Feedback')
        message = data.get('message', '')
        
        # Add rating to description
        description = f"Rating: {rating}/5\n\n{message}"
        
        # Map feedback type to support request type
        type_mapping = {
            'feature': 'feature_request',
            'bug': 'bug_report',
            'general': 'general',
            'improvement': 'feature_request'
        }
        
        request_type = type_mapping.get(feedback_type, 'general')
        
        # Create the feedback as a support request
        feedback_request = SupportRequest.objects.create(
            user=user,
            request_type=request_type,
            subject=subject,
            description=description,
            priority='low'  # Feedback typically low priority
        )
        
        # Create initial message
        SupportMessage.objects.create(
            request=feedback_request,
            user=user,
            message=description,
            is_staff_reply=False
        )
        
        logger.info(f"Feedback submitted by {user.email}: {subject}")
        
        return JsonResponse({
            'success': True,
            'message': 'Thank you for your feedback! We appreciate your input.',
            'data': {
                'id': feedback_request.id
            }
        })
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error submitting feedback: {str(e)}'
        }, status=500)

# ============================================================================
# ADDITIONAL CRITERIA ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def get_available_products(request):
    """Get list of available data products"""
    try:
        products = [
            {'id': 'ndvi', 'name': 'NDVI', 'category': 'vegetation'},
            {'id': 'land_cover', 'name': 'Land Cover', 'category': 'classification'},
            {'id': 'uav_imagery', 'name': 'UAV Imagery', 'category': 'imagery'},
            {'id': 'change_detection', 'name': 'Change Detection', 'category': 'analysis'},
            {'id': 'surface_reflectance', 'name': 'Surface Reflectance', 'category': 'imagery'},
            {'id': 'lst', 'name': 'LST', 'category': 'thermal'},
            {'id': 'burned_area', 'name': 'Burned Area', 'category': 'classification'},
            {'id': 'snow_cover', 'name': 'Snow Cover', 'category': 'classification'},
            {'id': 'vegetation_indices', 'name': 'Vegetation Indices', 'category': 'vegetation'},
            {'id': 'dem', 'name': 'DEM', 'category': 'elevation'},
            {'id': 'dsm', 'name': 'DSM', 'category': 'elevation'},
            {'id': 'chm', 'name': 'CHM', 'category': 'elevation'},
            {'id': 'water_quality', 'name': 'Water Quality', 'category': 'water'},
            {'id': 'soil_moisture', 'name': 'Soil Moisture', 'category': 'soil'},
            {'id': 'urban_mapping', 'name': 'Urban Mapping', 'category': 'classification'},
        ]
        
        return JsonResponse({
            'success': True,
            'data': products
        })
        
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching products: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_available_formats(request):
    """Get list of available file formats"""
    try:
        formats = [
            {'id': 'geotiff', 'name': 'GeoTIFF', 'extension': '.tif', 'category': 'raster'},
            {'id': 'jpeg', 'name': 'JPEG', 'extension': '.jpg', 'category': 'raster'},
            {'id': 'png', 'name': 'PNG', 'extension': '.png', 'category': 'raster'},
            {'id': 'shapefile', 'name': 'Shapefile', 'extension': '.shp', 'category': 'vector'},
            {'id': 'kml', 'name': 'KML', 'extension': '.kml', 'category': 'vector'},
            {'id': 'gpx', 'name': 'GPX', 'extension': '.gpx', 'category': 'vector'},
            {'id': 'netcdf', 'name': 'NetCDF', 'extension': '.nc', 'category': 'raster'},
            {'id': 'hdf5', 'name': 'HDF5', 'extension': '.h5', 'category': 'raster'},
            {'id': 'csv', 'name': 'CSV', 'extension': '.csv', 'category': 'tabular'},
            {'id': 'las', 'name': 'LAS', 'extension': '.las', 'category': 'point_cloud'},
            {'id': 'laz', 'name': 'LAZ', 'extension': '.laz', 'category': 'point_cloud'},
        ]
        
        return JsonResponse({
            'success': True,
            'data': formats
        })
        
    except Exception as e:
        logger.error(f"Error fetching formats: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching formats: {str(e)}'
        }, status=500)
