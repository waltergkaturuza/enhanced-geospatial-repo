#!/usr/bin/env python
"""
Test script for the Geospatial Repository System.
This script tests various functionality to ensure the system is working correctly.
"""

import os
import sys
import django
from django.conf import settings

# Add the project root to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geospatial_repo.settings')
django.setup()

# Now we can import Django models and services
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point, Polygon
from imagery.models import AOI, UserProfile
from imagery.services import SatelliteDataService, ImageProcessingService, HPCJobService, AOIManagementService

def test_database_connection():
    """Test database connectivity and basic operations."""
    print("Testing database connection...")
    try:
        # Test basic query
        user_count = User.objects.count()
        print(f"✓ Database connected. Found {user_count} users.")
        
        # Test GIS functionality
        from django.contrib.gis.db import connection
        cursor = connection.cursor()
        cursor.execute("SELECT PostGIS_Version();")
        postgis_version = cursor.fetchone()[0]
        print(f"✓ PostGIS connected. Version: {postgis_version}")
        
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def test_gis_libraries():
    """Test GDAL, GEOS, and other GIS libraries."""
    print("\nTesting GIS libraries...")
    
    try:
        # Test GEOS
        from django.contrib.gis.geos import GEOSGeometry
        point = Point(0, 0)
        print(f"✓ GEOS working. Created point: {point}")
        
        # Test geometry operations
        polygon = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))
        print(f"✓ Geometry operations working. Polygon area: {polygon.area}")
        
        # Test rasterio (if available)
        try:
            import rasterio
            print(f"✓ Rasterio available. Version: {rasterio.__version__}")
        except ImportError:
            print("⚠ Rasterio not available")
        
        # Test shapely
        try:
            import shapely
            print(f"✓ Shapely available. Version: {shapely.__version__}")
        except ImportError:
            print("⚠ Shapely not available")
        
        return True
    except Exception as e:
        print(f"✗ GIS libraries test failed: {e}")
        return False

def test_models():
    """Test model creation and basic operations."""
    print("\nTesting models...")
    
    try:
        # Create or get test user
        user, created = User.objects.get_or_create(
            username='test_user',
            defaults={'email': 'test@example.com'}
        )
        if created:
            print("✓ Created test user")
        else:
            print("✓ Using existing test user")
        
        # Create user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        if created:
            print("✓ Created user profile")
        else:
            print("✓ Using existing user profile")
        
        # Create test AOI
        test_polygon = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))
        aoi, created = AOI.objects.get_or_create(
            name='Test AOI',
            user=user,
            defaults={
                'description': 'Test AOI for system validation',
                'geometry': test_polygon
            }
        )
        if created:
            print("✓ Created test AOI")
        else:
            print("✓ Using existing test AOI")
        
        print(f"✓ AOI area: {aoi.geometry.area}")
        
        return True
    except Exception as e:
        print(f"✗ Models test failed: {e}")
        return False

def test_services():
    """Test service classes."""
    print("\nTesting services...")
    
    try:
        # Test satellite data service
        satellite_service = SatelliteDataService()
        print("✓ SatelliteDataService initialized")
        
        # Test image processing service
        processing_service = ImageProcessingService()
        print("✓ ImageProcessingService initialized")
        
        # Test HPC job service
        hpc_service = HPCJobService()
        print("✓ HPCJobService initialized")
        
        # Test AOI management service
        aoi_service = AOIManagementService()
        print("✓ AOIManagementService initialized")
        
        # Test AOI validation
        test_polygon = Polygon(((0, 0), (0, 1), (1, 1), (1, 0), (0, 0)))
        aoi = AOI.objects.filter(name='Test AOI').first()
        if aoi:
            validation = aoi_service.validate_aoi(aoi)
            print(f"✓ AOI validation: {validation['is_valid']}")
        
        return True
    except Exception as e:
        print(f"✗ Services test failed: {e}")
        return False

def test_api_setup():
    """Test API configuration."""
    print("\nTesting API setup...")
    
    try:
        # Test REST framework is configured
        from rest_framework.test import APIClient
        client = APIClient()
        print("✓ REST framework configured")
        
        # Test DRF-GIS is available
        from rest_framework_gis.serializers import GeoFeatureModelSerializer
        print("✓ DRF-GIS available")
        
        return True
    except Exception as e:
        print(f"✗ API setup test failed: {e}")
        return False

def test_directories():
    """Test that all required directories exist."""
    print("\nTesting directory structure...")
    
    try:
        required_dirs = [
            'logs',
            'data/imagery',
            'data/processed',
            'data/cache',
            'data/exports',
            'data/uploads',
            'data/temp',
            'data/hpc_jobs',
            'media',
        ]
        
        for dir_path in required_dirs:
            full_path = os.path.join(project_root, dir_path)
            if os.path.exists(full_path):
                print(f"✓ Directory exists: {dir_path}")
            else:
                os.makedirs(full_path, exist_ok=True)
                print(f"✓ Created directory: {dir_path}")
        
        return True
    except Exception as e:
        print(f"✗ Directory test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("=== Geospatial Repository System - Test Suite ===\n")
    
    tests = [
        test_database_connection,
        test_gis_libraries,
        test_directories,
        test_models,
        test_services,
        test_api_setup,
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"✗ Test {test.__name__} crashed: {e}")
            results.append(False)
    
    print(f"\n=== Test Results ===")
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! System is ready.")
        print("\nNext steps:")
        print("1. Run: python manage.py runserver")
        print("2. Visit: http://localhost:8000/api/")
        print("3. Access admin: http://localhost:8000/admin/")
        print("4. Create a superuser: python manage.py createsuperuser")
    else:
        print("⚠ Some tests failed. Please check the errors above.")
        print("\nTroubleshooting:")
        print("1. Ensure PostgreSQL with PostGIS is running")
        print("2. Check database connection settings")
        print("3. Install missing Python packages")
        print("4. Run migrations: python manage.py migrate")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
