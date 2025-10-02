from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import UserProfile
import json
import logging

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
    """Get system status information"""
    try:
        status_info = {
            'status': 'active',
            'timestamp': '2024-01-15T10:30:00Z',
            'services': {
                'database': 'connected',
                'file_storage': 'available',
                'processing_queue': 'active',
                'api': 'operational'
            },
            'metrics': {
                'total_images': 1250,
                'pending_jobs': 3,
                'active_users': 12,
                'storage_used': '45.6GB'
            },
            'capabilities': [
                'metadata_parsing',
                'file_upload',
                'processing_queue',
                'user_management'
            ]
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
    """Get list of users pending approval"""
    try:
        logger.info("Fetching pending users")
        
        # Mock pending users data
        pending_users_data = [
            {
                'id': '5',
                'email': 'john.doe@company.com',
                'firstName': 'John',
                'lastName': 'Doe',
                'organization': 'Tech Solutions Inc',
                'role': 'pending_user',
                'subscriptionPlan': 'free_pending',
                'isActive': True,
                'emailVerified': True,
                'isApproved': False,
                'approvalStatus': 'pending',
                'createdAt': '2024-01-16T09:00:00Z',
                'modules': ['dashboard', 'data_store']
            },
            {
                'id': '6',
                'email': 'sarah.wilson@research.edu',
                'firstName': 'Sarah',
                'lastName': 'Wilson',
                'organization': 'University Research Lab',
                'role': 'pending_user',
                'subscriptionPlan': 'free_pending',
                'isActive': True,
                'emailVerified': True,
                'isApproved': False,
                'approvalStatus': 'pending',
                'createdAt': '2024-01-15T14:30:00Z',
                'modules': ['dashboard', 'data_store']
            },
            {
                'id': '7',
                'email': 'mike.johnson@startup.io',
                'firstName': 'Mike',
                'lastName': 'Johnson',
                'organization': 'GeoStartup',
                'role': 'pending_user',
                'subscriptionPlan': 'free_pending',
                'isActive': True,
                'emailVerified': False,
                'isApproved': False,
                'approvalStatus': 'pending',
                'createdAt': '2024-01-14T11:15:00Z',
                'modules': ['dashboard', 'data_store']
            }
        ]
        
        return JsonResponse({
            'success': True,
            'data': {
                'users': pending_users_data,
                'count': len(pending_users_data)
            }
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
    """Approve a pending user"""
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        admin_id = data.get('admin_id', 'admin_001')
        
        logger.info(f"Approving user {user_id} by admin {admin_id}")
        
        # Mock approval process
        approval_result = {
            'user_id': user_id,
            'status': 'approved',
            'approved_by': admin_id,
            'approved_at': '2024-01-16T15:30:00Z',
            'new_role': 'viewer',  # Default role after approval
            'new_subscription_plan': 'free'
        }
        
        return JsonResponse({
            'success': True,
            'message': 'User approved successfully',
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
    """Reject a pending user"""
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        admin_id = data.get('admin_id', 'admin_001')
        rejection_reason = data.get('reason', 'No reason provided')
        
        logger.info(f"Rejecting user {user_id} by admin {admin_id}, reason: {rejection_reason}")
        
        # Mock rejection process
        rejection_result = {
            'user_id': user_id,
            'status': 'rejected',
            'rejected_by': admin_id,
            'rejected_at': '2024-01-16T15:30:00Z',
            'rejection_reason': rejection_reason
        }
        
        return JsonResponse({
            'success': True,
            'message': 'User rejected successfully',
            'data': rejection_result
        })
        
    except Exception as e:
        logger.error(f"Error rejecting user: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error rejecting user: {str(e)}'
        }, status=500)
