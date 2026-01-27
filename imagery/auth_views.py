from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.models import User
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.authtoken.models import Token
import json
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    """
    Handle user login and return authentication token
    """
    try:
        data = json.loads(request.body)
        
        # Get credentials
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')
        
        if not password:
            return JsonResponse({
                'success': False,
                'message': 'Password is required'
            }, status=400)
        
        # Try to authenticate with email or username
        user = None
        if email:
            try:
                user_obj = User.objects.get(email=email)
                user = authenticate(request, username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass
        elif username:
            user = authenticate(request, username=username, password=password)
        
        if user and user.is_active:
            # Get or create token
            token, created = Token.objects.get_or_create(user=user)
            
            # Login user
            django_login(request, user)
            
            # Determine role and subscription based on superuser status
            is_superuser = user.is_superuser or user.is_staff
            user_role = 'admin' if is_superuser else 'user'
            subscription_plan = 'enterprise' if is_superuser else 'free'
            
            # Check if user has assigned modules in profile (from approval system)
            try:
                if hasattr(user, 'profile') and user.profile.assigned_modules:
                    user_modules = user.profile.assigned_modules
                else:
                    # Fallback: Assign based on staff status
                    if is_superuser:
                        # Staff/Admin: Full access including upload and file management
                        user_modules = [
                            'dashboard', 'imagery', 'analytics', 'business', 
                            'admin', 'upload', 'files', 'store'
                        ]
                    else:
                        # Regular users: Download only (no upload/file management)
                        user_modules = ['dashboard', 'imagery', 'data_store']
            except Exception:
                # If profile doesn't exist or error, use safe defaults
                if is_superuser:
                    user_modules = ['dashboard', 'imagery', 'analytics', 'business', 'admin', 'upload', 'files', 'store']
                else:
                    user_modules = ['dashboard', 'imagery', 'data_store']
            
            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'token': token.key,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'firstName': user.first_name,
                    'lastName': user.last_name,
                    'organization': getattr(user, 'organization', ''),
                    'role': user_role,
                    'subscriptionPlan': subscription_plan,
                    'isActive': user.is_active,
                    'isSuperuser': is_superuser,  # Add superuser flag
                    'emailVerified': True,  # Assume verified for now
                    'createdAt': user.date_joined.isoformat(),
                    'modules': user_modules
                }
            })
        else:
            return JsonResponse({
                'success': False,
                'message': 'Invalid credentials'
            }, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Login failed'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([AllowAny])
def signup_view(request):
    """
    Handle user access request (approval-based registration)
    
    SECURITY: Role and subscription are NEVER accepted from frontend.
    All new users are created as pending_user and must be approved by admin.
    """
    try:
        data = json.loads(request.body)
        
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        organization = data.get('organization', '')
        
        # New fields for access request
        organization_type = data.get('organizationType', '')
        intended_use = data.get('intendedUse', '')
        intended_use_details = data.get('intendedUseDetails', '')
        country = data.get('country', 'Zimbabwe')
        user_path = data.get('userPath', 'individual')
        
        # SECURITY: Ignore any role or subscription from frontend
        # These will be assigned by admin after approval
        frontend_role = data.get('role')  # Captured but ignored
        frontend_subscription = data.get('subscriptionPlan')  # Captured but ignored
        
        if frontend_role and frontend_role in ['admin', 'super_admin']:
            logger.warning(f"SECURITY ALERT: Attempted self-assignment of admin role by {email}")
            # Continue but log the attempt
        
        if not email or not password:
            return JsonResponse({
                'success': False,
                'message': 'Email and password are required'
            }, status=400)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'An account with this email already exists. Please sign in or use a different email.'
            }, status=400)
        
        # Create user with pending status
        # User CANNOT login until admin approves
        user = User.objects.create_user(
            username=email,  # Use email as username
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_active=False  # CANNOT login until approved by admin
        )
        
        # Get or create user profile and store application details
        try:
            from .models import UserProfile
            profile, created = UserProfile.objects.get_or_create(user=user)
            
            # Store application details in profile
            profile.organization = organization
            profile.organization_type = organization_type
            profile.intended_use = intended_use
            profile.intended_use_details = intended_use_details or ''
            profile.country = country
            profile.user_path = user_path
            profile.approval_status = 'pending'
            profile.save()
            
            logger.info(f"New access request from {email}:")
            logger.info(f"  - Organization: {organization} ({organization_type})")
            logger.info(f"  - Intended Use: {intended_use}")
            logger.info(f"  - User Path: {user_path}")
            logger.info(f"  - Country: {country}")
            if intended_use_details:
                logger.info(f"  - Details: {intended_use_details}")
                
        except Exception as e:
            logger.warning(f"Could not create profile for {email}: {str(e)}")
        
        # Create authentication token
        token, created = Token.objects.get_or_create(user=user)
        
        return JsonResponse({
            'success': True,
            'message': 'Access request submitted successfully! You will receive an email once your application is approved (typically within 1-2 business days). You can login after approval.',
            'requiresApproval': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'organization': organization,
                'role': 'pending_user',  # Always pending - admin assigns real role
                'subscriptionPlan': 'free_pending',  # Temporary plan
                'isActive': False,  # Cannot login until approved
                'isApproved': False,  # Requires admin approval
                'approvalStatus': 'pending',
                'modules': [],  # No access until approved
                'createdAt': user.date_joined.isoformat()
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'message': 'Invalid JSON data'
        }, status=400)
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Registration failed. Please try again.'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def logout_view(request):
    """
    Handle user logout
    """
    try:
        # Delete the user's token if it exists
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        
        django_logout(request)
        
        return JsonResponse({
            'success': True,
            'message': 'Logged out successfully'
        })
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'Logout failed'
        }, status=500)

@api_view(['GET'])
def user_profile(request):
    """
    Get current user profile
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'success': False,
            'message': 'Authentication required'
        }, status=401)
    
    user = request.user
    
    # Determine role and subscription based on superuser status
    is_superuser = user.is_superuser or user.is_staff
    user_role = 'admin' if is_superuser else 'user'
    subscription_plan = 'enterprise' if is_superuser else 'free'
    
    # Check if user has assigned modules in profile (from approval system)
    try:
        if hasattr(user, 'profile') and user.profile.assigned_modules:
            user_modules = user.profile.assigned_modules
        else:
            # Fallback: Assign based on staff status
            if is_superuser:
                # Staff/Admin: Full access including upload and file management
                user_modules = [
                    'dashboard', 'imagery', 'analytics', 'business', 
                    'admin', 'upload', 'files', 'store'
                ]
            else:
                # Regular users: Download only (no upload/file management)
                user_modules = ['dashboard', 'imagery', 'data_store']
    except Exception:
        # If profile doesn't exist or error, use safe defaults
        if is_superuser:
            user_modules = ['dashboard', 'imagery', 'analytics', 'business', 'admin', 'upload', 'files', 'store']
        else:
            user_modules = ['dashboard', 'imagery', 'data_store']
    
    return JsonResponse({
        'success': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'organization': getattr(user, 'organization', ''),
            'role': user_role,
            'subscriptionPlan': subscription_plan,
            'isActive': user.is_active,
            'isSuperuser': is_superuser,
            'emailVerified': True,
            'createdAt': user.date_joined.isoformat(),
            'modules': user_modules
        }
    })