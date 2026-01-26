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
            
            # All modules for superusers, limited for regular users
            if is_superuser:
                user_modules = [
                    'dashboard', 'imagery', 'analytics', 'business', 
                    'admin', 'upload', 'files', 'store'
                ]
            else:
                user_modules = ['dashboard', 'imagery', 'upload']
            
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
    Handle user registration
    """
    try:
        data = json.loads(request.body)
        
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('firstName', '')
        last_name = data.get('lastName', '')
        
        if not email or not password:
            return JsonResponse({
                'success': False,
                'message': 'Email and password are required'
            }, status=400)
        
        # Check if user already exists
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'success': False,
                'message': 'User with this email already exists'
            }, status=400)
        
        # Create user
        user = User.objects.create_user(
            username=email,  # Use email as username
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Account created successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'firstName': user.first_name,
                'lastName': user.last_name
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
            'message': 'Registration failed'
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
    
    # All modules for superusers, limited for regular users
    if is_superuser:
        user_modules = [
            'dashboard', 'imagery', 'analytics', 'business', 
            'admin', 'upload', 'files', 'store'
        ]
    else:
        user_modules = ['dashboard', 'imagery', 'upload']
    
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
            'isSuperuser': is_superuser,  # Add superuser flag
            'emailVerified': True,
            'createdAt': user.date_joined.isoformat(),
            'modules': user_modules
        }
    })