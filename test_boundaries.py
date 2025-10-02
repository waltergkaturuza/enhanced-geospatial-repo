#!/usr/bin/env python3
"""
Test script for administrative boundary upload functionality.
This script demonstrates how to use the administrative boundary management system.
"""

import os
import sys
import django
import requests
import json
from pathlib import Path

# Add the project directory to the Python path
project_dir = Path(__file__).parent
sys.path.insert(0, str(project_dir))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geospatial_repo.settings')
django.setup()

from imagery.models import AdministrativeBoundarySet, AdministrativeBoundary
from imagery.services import AdministrativeBoundaryService
from django.contrib.gis.geos import GEOSGeometry, MultiPolygon, Polygon
from django.contrib.auth import get_user_model

User = get_user_model()

def create_sample_zimbabwe_boundaries():
    """Create sample Zimbabwe administrative boundaries for testing."""
    
    print("Creating sample Zimbabwe administrative boundaries...")
    
    # Create or get a test user
    user, created = User.objects.get_or_create(
        username='admin',
        defaults={'email': 'admin@example.com', 'is_staff': True, 'is_superuser': True}
    )
    if created:
        user.set_password('admin123')
        user.save()
        print(f"Created test user: {user.username}")
    
    # Create boundary set
    boundary_set, created = AdministrativeBoundarySet.objects.get_or_create(
        name="Zimbabwe Administrative Boundaries",
        defaults={
            'description': "Complete administrative hierarchy for Zimbabwe including country, provinces, and districts",
            'source': "Sample data for testing",
            'uploaded_by': user,
            'data_year': 2023,
            'is_public': True,
            'coordinate_system': 'EPSG:4326'
        }
    )
    
    if created:
        print(f"Created boundary set: {boundary_set.name}")
    else:
        print(f"Using existing boundary set: {boundary_set.name}")
    
    # Sample Zimbabwe country boundary (simplified) - using WKT
    zimbabwe_wkt = "MULTIPOLYGON(((25.237 -22.271, 33.224 -22.271, 33.224 -15.609, 25.237 -15.609, 25.237 -22.271)))"
    zimbabwe_geom = GEOSGeometry(zimbabwe_wkt)
    
    # Create country boundary
    country, created = AdministrativeBoundary.objects.get_or_create(
        boundary_set=boundary_set,
        level='country',
        name='Zimbabwe',
        defaults={
            'name_0': 'Zimbabwe',
            'geometry': zimbabwe_geom,
            'code': 'ZW',
            'attributes': {
                'iso_code': 'ZW',
                'continent': 'Africa',
                'region': 'Southern Africa'
            }
        }
    )
    print(f"{'Created' if created else 'Found'} country: {country.name}")
    
    # Sample provinces with simplified boundaries
    provinces_data = [
        {
            'name': 'Harare Province',
            'wkt': 'MULTIPOLYGON(((30.8 -17.2, 31.8 -17.2, 31.8 -18.2, 30.8 -18.2, 30.8 -17.2)))'
        },
        {
            'name': 'Bulawayo Province', 
            'wkt': 'MULTIPOLYGON(((28.4 -20.5, 29.4 -20.5, 29.4 -19.5, 28.4 -19.5, 28.4 -20.5)))'
        },
        {
            'name': 'Manicaland Province',
            'wkt': 'MULTIPOLYGON(((31.5 -19.0, 33.0 -19.0, 33.0 -17.5, 31.5 -17.5, 31.5 -19.0)))'
        },
        {
            'name': 'Mashonaland Central Province',
            'wkt': 'MULTIPOLYGON(((30.0 -16.0, 32.0 -16.0, 32.0 -17.5, 30.0 -17.5, 30.0 -16.0)))'
        },
        {
            'name': 'Mashonaland East Province',
            'wkt': 'MULTIPOLYGON(((31.0 -17.5, 33.0 -17.5, 33.0 -19.0, 31.0 -19.0, 31.0 -17.5)))'
        }
    ]
    
    provinces = []
    for prov_data in provinces_data:
        prov_geom = GEOSGeometry(prov_data['wkt'])
        province, created = AdministrativeBoundary.objects.get_or_create(
            boundary_set=boundary_set,
            level='province',
            name=prov_data['name'],
            defaults={
                'name_0': 'Zimbabwe',
                'name_1': prov_data['name'],
                'geometry': prov_geom,
                'parent': country,
                'attributes': {
                    'province_type': 'Administrative Province'
                }
            }
        )
        provinces.append(province)
        print(f"{'Created' if created else 'Found'} province: {province.name}")
    
    # Sample districts for Harare Province
    harare_province = provinces[0]  # Harare Province
    districts_data = [
        {
            'name': 'Harare Metropolitan',
            'wkt': 'MULTIPOLYGON(((30.9 -17.7, 31.1 -17.7, 31.1 -17.9, 30.9 -17.9, 30.9 -17.7)))'
        },
        {
            'name': 'Chitungwiza',
            'wkt': 'MULTIPOLYGON(((31.0 -18.0, 31.2 -18.0, 31.2 -18.2, 31.0 -18.2, 31.0 -18.0)))'
        },
        {
            'name': 'Epworth',
            'wkt': 'MULTIPOLYGON(((31.1 -17.8, 31.3 -17.8, 31.3 -18.0, 31.1 -18.0, 31.1 -17.8)))'
        }
    ]
    
    for dist_data in districts_data:
        dist_geom = GEOSGeometry(dist_data['wkt'])
        district, created = AdministrativeBoundary.objects.get_or_create(
            boundary_set=boundary_set,
            level='district',
            name=dist_data['name'],
            defaults={
                'name_0': 'Zimbabwe',
                'name_1': 'Harare Province',
                'name_2': dist_data['name'],
                'geometry': dist_geom,
                'parent': harare_province,
                'attributes': {
                    'district_type': 'Urban District'
                }
            }
        )
        print(f"{'Created' if created else 'Found'} district: {district.name}")
    
    # Update boundary set statistics
    boundary_set.total_boundaries = boundary_set.boundaries.count()
    boundary_set.levels_included = ['country', 'province', 'district']
    boundary_set.save()
    
    print(f"\nSample data creation complete!")
    print(f"Boundary set: {boundary_set.name}")
    print(f"Total boundaries: {boundary_set.total_boundaries}")
    print(f"Levels included: {', '.join(boundary_set.levels_included)}")
    
    return boundary_set

def test_api_endpoints():
    """Test the boundary API endpoints."""
    print("\nTesting API endpoints...")
    
    base_url = "http://localhost:8000/api"
    
    # Test boundary sets endpoint
    try:
        response = requests.get(f"{base_url}/boundary-sets/")
        if response.status_code == 200:
            data = response.json()
            # Handle both list and paginated response formats
            if isinstance(data, list):
                sets = data
            else:
                sets = data.get('results', data)
            
            print(f"✓ Found {len(sets)} boundary sets")
            
            if sets:
                set_id = sets[0]['id']
                # Test hierarchy endpoint
                hierarchy_response = requests.get(f"{base_url}/boundary-sets/{set_id}/hierarchy/")
                if hierarchy_response.status_code == 200:
                    hierarchy = hierarchy_response.json()
                    print(f"✓ Retrieved hierarchy for set {set_id}")
                    print(f"  Levels: {list(hierarchy['hierarchy'].keys())}")
                
                # Test boundaries endpoint
                boundaries_response = requests.get(f"{base_url}/boundary-sets/{set_id}/boundaries/?level=country")
                if boundaries_response.status_code == 200:
                    boundaries = boundaries_response.json()
                    print(f"✓ Found {len(boundaries)} country boundaries")
        else:
            print(f"✗ Boundary sets endpoint failed: {response.status_code}")
    
    except requests.RequestException as e:
        print(f"✗ API test failed: {e}")
    except Exception as e:
        print(f"✗ API test error: {e}")

def main():
    """Main function."""
    print("Zimbabwe Administrative Boundaries Test System")
    print("=" * 50)
    
    try:
        # Create sample data
        boundary_set = create_sample_zimbabwe_boundaries()
        
        # Test API endpoints
        test_api_endpoints()
        
        print("\n" + "=" * 50)
        print("Setup complete! You can now:")
        print("1. Open the frontend at http://localhost:5174")
        print("2. Click on the 'Boundaries' tab in the sidebar")
        print("3. Explore the Zimbabwe administrative boundaries")
        print("4. Upload your own boundary ZIP files (Zim_admin0.zip, Zim_admin1.zip, Zim_admin2.zip)")
        print("\nAPI endpoints available:")
        print("- GET /api/boundary-sets/ - List all boundary sets")
        print("- POST /api/boundary-sets/upload_boundaries/ - Upload new boundaries")
        print("- GET /api/boundary-sets/{id}/hierarchy/ - Get hierarchical structure")
        print("- GET /api/boundaries/search/?q=harare - Search boundaries")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
