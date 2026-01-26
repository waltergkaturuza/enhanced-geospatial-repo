#!/usr/bin/env python
"""
Script to verify Django admin setup, migrations, and authentication configuration.
Run this after setting up the backend to ensure everything is properly configured.
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geospatial_repo.settings')

try:
    django.setup()
except Exception as e:
    print(f"Error setting up Django: {e}")
    print("Make sure all dependencies are installed: pip install -r requirements.txt")
    sys.exit(1)

from django.contrib import admin
from django.contrib.auth.models import User, Group, Permission
from django.core.management import call_command
from django.db import connection
from imagery.models import UserProfile, AOI, SatelliteImage

def check_admin_registration():
    """Check if all models are registered in admin"""
    print("\n" + "="*60)
    print("CHECKING ADMIN REGISTRATION")
    print("="*60)
    
    registered_models = []
    for model, admin_class in admin.site._registry.items():
        registered_models.append(model.__name__)
    
    expected_models = [
        'User', 'Group', 'UserProfile', 'AOI', 'SatelliteImage',
        'Download', 'IndexResult', 'ProcessingJob',
        'AdministrativeBoundarySet', 'AdministrativeBoundary'
    ]
    
    print(f"\nRegistered models ({len(registered_models)}):")
    for model in sorted(registered_models):
        print(f"  [OK] {model}")
    
    print(f"\nExpected models: {len(expected_models)}")
    missing = [m for m in expected_models if m not in registered_models]
    if missing:
        print(f"  [WARNING] Missing: {', '.join(missing)}")
    else:
        print("  [OK] All expected models are registered")
    
    return len(missing) == 0

def check_migrations():
    """Check migration status"""
    print("\n" + "="*60)
    print("CHECKING MIGRATIONS")
    print("="*60)
    
    try:
        # Check if migrations are applied
        from django.db.migrations.executor import MigrationExecutor
        from django.db import connections
        
        executor = MigrationExecutor(connections['default'])
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if plan:
            print(f"\n[WARNING] {len(plan)} migration(s) need to be applied:")
            for migration, backwards in plan:
                print(f"  - {migration}")
            print("\nRun: python manage.py migrate")
            return False
        else:
            print("\n[OK] All migrations are applied")
            return True
    except Exception as e:
        print(f"\n[WARNING] Error checking migrations: {e}")
        print("Run: python manage.py showmigrations")
        return False

def check_authentication():
    """Check authentication configuration"""
    print("\n" + "="*60)
    print("CHECKING AUTHENTICATION CONFIGURATION")
    print("="*60)
    
    from django.conf import settings
    
    # Check REST Framework authentication
    if hasattr(settings, 'REST_FRAMEWORK'):
        auth_classes = settings.REST_FRAMEWORK.get('DEFAULT_AUTHENTICATION_CLASSES', [])
        print(f"\nREST Framework Authentication Classes:")
        for auth_class in auth_classes:
            print(f"  [OK] {auth_class}")
        
        perm_classes = settings.REST_FRAMEWORK.get('DEFAULT_PERMISSION_CLASSES', [])
        print(f"\nREST Framework Permission Classes:")
        for perm_class in perm_classes:
            print(f"  [OK] {perm_class}")
    else:
        print("\n[WARNING] REST_FRAMEWORK settings not found")
    
    # Check if TokenAuthentication is available
    try:
        from rest_framework.authtoken.models import Token
        print("\n[OK] Token authentication is available")
    except ImportError:
        print("\n[WARNING] Token authentication not available (rest_framework.authtoken not installed)")
    
    return True

def check_groups_and_permissions():
    """Check if default groups exist"""
    print("\n" + "="*60)
    print("CHECKING GROUPS AND PERMISSIONS")
    print("="*60)
    
    groups = Group.objects.all()
    print(f"\nExisting groups ({groups.count()}):")
    for group in groups:
        user_count = group.user_set.count()
        perm_count = group.permissions.count()
        print(f"  - {group.name}: {user_count} users, {perm_count} permissions")
    
    # Check for common groups
    common_groups = ['Admin', 'User', 'Viewer']
    print(f"\nRecommended groups: {', '.join(common_groups)}")
    
    return True

def check_user_profiles():
    """Check user profiles"""
    print("\n" + "="*60)
    print("CHECKING USER PROFILES")
    print("="*60)
    
    users = User.objects.all()
    profiles = UserProfile.objects.all()
    
    print(f"\nTotal users: {users.count()}")
    print(f"Total profiles: {profiles.count()}")
    
    users_without_profiles = users.exclude(id__in=profiles.values_list('user_id', flat=True))
    if users_without_profiles.exists():
        print(f"\n[WARNING] {users_without_profiles.count()} user(s) without profiles:")
        for user in users_without_profiles[:5]:
            print(f"  - {user.username}")
        if users_without_profiles.count() > 5:
            print(f"  ... and {users_without_profiles.count() - 5} more")
        print("\nProfiles should be created automatically via signal handler")
    else:
        print("\n[OK] All users have profiles")
    
    return True

def check_admin_site_customization():
    """Check admin site customization"""
    print("\n" + "="*60)
    print("CHECKING ADMIN SITE CUSTOMIZATION")
    print("="*60)
    
    print(f"\nSite Header: {admin.site.site_header}")
    print(f"Site Title: {admin.site.site_title}")
    print(f"Index Title: {admin.site.index_title}")
    
    if admin.site.site_header == "GeoSpatial Repository Administration":
        print("\n[OK] Admin site is properly customized")
        return True
    else:
        print("\n[WARNING] Admin site customization may not be loaded")
        return False

def main():
    """Run all checks"""
    print("\n" + "="*60)
    print("DJANGO ADMIN SETUP VERIFICATION")
    print("="*60)
    
    results = {
        'admin_registration': check_admin_registration(),
        'migrations': check_migrations(),
        'authentication': check_authentication(),
        'groups': check_groups_and_permissions(),
        'profiles': check_user_profiles(),
        'admin_customization': check_admin_site_customization(),
    }
    
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    
    all_passed = all(results.values())
    
    for check, passed in results.items():
        status = "[OK] PASS" if passed else "[WARNING] NEEDS ATTENTION"
        print(f"{check.replace('_', ' ').title()}: {status}")
    
    if all_passed:
        print("\n[OK] All checks passed! Admin setup is complete.")
    else:
        print("\n[WARNING] Some checks need attention. Please review the output above.")
        print("\nNext steps:")
        print("1. Run migrations: python manage.py migrate")
        print("2. Create superuser: python manage.py createsuperuser")
        print("3. Create default groups (optional): python manage.py shell")
        print("4. Access admin at: http://localhost:8000/admin/")
    
    return 0 if all_passed else 1

if __name__ == '__main__':
    sys.exit(main())
