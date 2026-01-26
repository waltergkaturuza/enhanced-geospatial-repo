# Django Admin Setup with Role-Based Access Control

This document describes the comprehensive Django admin setup with role-based access control and proper authentication configuration.

## Overview

The backend includes:
- **Custom Django Admin Interface** with enhanced user management
- **Role-Based Access Control** using Django Groups and Permissions
- **Token Authentication** for API access
- **Session Authentication** for admin interface
- **Comprehensive Admin Actions** for user management

## Admin Features

### 1. Custom User Admin

The `CustomUserAdmin` extends Django's default User admin with:

- **Enhanced List Display**: Shows username, email, staff status, superuser status, active status, and dates
- **Role-Based Filtering**: Filter users by groups, staff status, superuser status, and active status
- **Inline User Profile**: View and edit user profiles directly from user admin
- **Bulk Actions**:
  - Make users staff
  - Remove staff status
  - Activate/deactivate users
  - Add users to Admin or User groups

### 2. Group Management

Custom Group admin displays:
- Number of users in each group
- Number of permissions in each group
- Easy permission management

### 3. Model Admins

All models have comprehensive admin interfaces:

- **UserProfile**: Manage user quotas and preferences
- **AOI**: Manage Areas of Interest with geometry preview
- **SatelliteImage**: Manage satellite imagery metadata
- **Download**: Track download requests and status
- **IndexResult**: View computed indices
- **ProcessingJob**: Monitor HPC processing jobs
- **AdministrativeBoundarySet**: Manage boundary datasets
- **AdministrativeBoundary**: Manage individual boundaries

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 3. Create Superuser

```bash
python manage.py createsuperuser
```

Follow the prompts to create an admin user.

### 4. Setup Default Groups

Create default user groups with appropriate permissions:

```bash
python manage.py setup_groups
```

This creates:
- **Admin**: Full access to all features
- **User**: Standard user with upload/download permissions
- **Viewer**: Read-only access

To reset and recreate groups:

```bash
python manage.py setup_groups --reset
```

### 5. Verify Setup

Run the verification script:

```bash
python verify_admin_setup.py
```

This checks:
- Admin registration
- Migration status
- Authentication configuration
- Groups and permissions
- User profiles
- Admin site customization

## Accessing the Admin Interface

1. Start the development server:
   ```bash
   python manage.py runserver
   ```

2. Navigate to: `http://localhost:8000/admin/`

3. Login with your superuser credentials

## Role-Based Access Control

### Default Groups

#### Admin Group
- Full access to all models
- Can manage users, groups, and permissions
- Can access all admin features

#### User Group
- Can create and manage AOIs
- Can upload and view satellite images
- Can create download requests
- Can view processing jobs
- Can view administrative boundaries

#### Viewer Group
- Read-only access
- Can view AOIs, satellite images, downloads
- Cannot create or modify data

### Assigning Roles

#### Via Django Admin

1. Go to **Authentication and Authorization > Users**
2. Select a user
3. Scroll to **Permissions** section
4. Add user to appropriate **Groups**
5. Save

#### Programmatically

```python
from django.contrib.auth.models import User, Group

user = User.objects.get(username='example_user')
admin_group = Group.objects.get(name='Admin')
user.groups.add(admin_group)
```

## Authentication Configuration

### REST Framework Authentication

The API uses two authentication methods:

1. **Token Authentication**: For programmatic API access
   - Tokens are created automatically when users are created
   - Access via: `Authorization: Token <token>`

2. **Session Authentication**: For browser-based access
   - Uses Django sessions
   - Automatically handled by Django admin

### Creating API Tokens

#### Via Django Admin

1. Go to **AUTH TOKEN > Tokens**
2. Click **Add Token**
3. Select a user
4. Save (token is auto-generated)

#### Programmatically

```python
from rest_framework.authtoken.models import Token

user = User.objects.get(username='example_user')
token, created = Token.objects.get_or_create(user=user)
print(f"Token: {token.key}")
```

## Admin Customization

The admin site is customized with:

- **Site Header**: "GeoSpatial Repository Administration"
- **Site Title**: "GeoSpatial Admin"
- **Index Title**: "System Administration Dashboard"

These are set in `imagery/admin.py`.

## User Profile Management

Each user automatically gets a `UserProfile` with:

- **Quota Settings**:
  - Maximum AOIs (default: 10)
  - Maximum download size (default: 50 GB)
  - Maximum concurrent downloads (default: 3)

- **Usage Tracking**:
  - Current AOIs count
  - Current download size
  - Current active downloads

- **Preferences**:
  - Default cloud cover threshold
  - Preferred satellite providers
  - Notification email

Profiles are created automatically via a signal handler when users are created.

## Security Best Practices

1. **Superuser Accounts**: Limit superuser accounts to trusted administrators
2. **Staff Status**: Only grant staff status to users who need admin access
3. **Group Permissions**: Use groups to manage permissions rather than individual user permissions
4. **Token Security**: Store API tokens securely, never commit them to version control
5. **Password Policy**: Enforce strong passwords via Django's password validators

## Troubleshooting

### Admin Not Loading

If admin models don't appear:

1. Check that `imagery` is in `INSTALLED_APPS` in `settings.py`
2. Verify `imagery/admin.py` exists and is properly formatted
3. Restart the development server

### Migrations Not Applied

If you see model errors:

```bash
python manage.py makemigrations
python manage.py migrate
```

### Groups Not Created

Run the setup command:

```bash
python manage.py setup_groups
```

### User Profile Not Created

Profiles are created automatically. If missing:

```python
from imagery.models import UserProfile
from django.contrib.auth.models import User

user = User.objects.get(username='example_user')
profile, created = UserProfile.objects.get_or_create(user=user)
```

## API Authentication Example

### Using Token Authentication

```python
import requests

token = 'your-token-here'
headers = {'Authorization': f'Token {token}'}
response = requests.get('http://localhost:8000/api/aois/', headers=headers)
```

### Using Session Authentication

```python
import requests

session = requests.Session()
session.post('http://localhost:8000/api/login/', {
    'username': 'your-username',
    'password': 'your-password'
})
response = session.get('http://localhost:8000/api/aois/')
```

## Next Steps

1. **Create Additional Groups**: Customize groups for your specific use case
2. **Custom Permissions**: Create custom permissions for specific features
3. **Admin Actions**: Add custom admin actions for bulk operations
4. **Admin Filters**: Add custom filters for better data organization
5. **Admin Views**: Create custom admin views for complex operations

## References

- [Django Admin Documentation](https://docs.djangoproject.com/en/stable/ref/contrib/admin/)
- [Django Authentication](https://docs.djangoproject.com/en/stable/topics/auth/)
- [Django REST Framework Authentication](https://www.django-rest-framework.org/api-guide/authentication/)
- [Django Permissions](https://docs.djangoproject.com/en/stable/topics/auth/default/#permissions-and-authorization)
