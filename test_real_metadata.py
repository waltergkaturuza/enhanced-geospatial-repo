#!/usr/bin/env python3
"""
Test script for real Landsat metadata from Zimbabwe scene.
"""

import requests
import json

def test_real_landsat_metadata():
    """Test with real Landsat metadata from Zimbabwe."""
    print("Testing with real Landsat 8 metadata from Zimbabwe...")
    
    # Read the real metadata file
    with open('sample_landsat_metadata.txt', 'r') as f:
        metadata_text = f.read()
    
    url = "http://127.0.0.1:8000/api/system/parse-metadata/"
    data = {
        "metadata_text": metadata_text
    }
    
    try:
        response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n=== PARSING RESULTS ===")
            print(f"Success: {result['success']}")
            print(f"Total fields parsed: {result['total_fields']}")
            print(f"Groups found: {', '.join(result['groups'])}")
            
            print("\n=== SUMMARY INFORMATION ===")
            summary = result['parsed_metadata']['summary']
            
            print("Satellite Info:")
            for key, value in summary['satellite_info'].items():
                if value:
                    print(f"  {key}: {value}")
            
            print("\nAcquisition Info:")
            for key, value in summary['acquisition_info'].items():
                if value:
                    print(f"  {key}: {value}")
            
            print("\nProcessing Info:")
            for key, value in summary['processing_info'].items():
                if value:
                    print(f"  {key}: {value}")
            
            print("\nGeographic Info:")
            for key, value in summary['geographic_info'].items():
                if value:
                    print(f"  {key}: {value}")
            
            print("\n=== KEY COORDINATES ===")
            groups = result['parsed_metadata']['groups']
            if 'PRODUCT_GEOMETRY' in groups:
                geom_group = groups['PRODUCT_GEOMETRY']
                print("Scene Coverage (Zimbabwe):")
                if 'CORNER_UL_LAT_PRODUCT' in geom_group:
                    print(f"  Upper Left: {geom_group['CORNER_UL_LAT_PRODUCT']['parsed_value']}, {geom_group['CORNER_UL_LON_PRODUCT']['parsed_value']}")
                if 'CORNER_LR_LAT_PRODUCT' in geom_group:
                    print(f"  Lower Right: {geom_group['CORNER_LR_LAT_PRODUCT']['parsed_value']}, {geom_group['CORNER_LR_LON_PRODUCT']['parsed_value']}")
                if 'SCENE_CENTER_LAT' in geom_group:
                    print(f"  Scene Center: {geom_group['SCENE_CENTER_LAT']['parsed_value']}, {geom_group['SCENE_CENTER_LON']['parsed_value']}")
            
            print("\n=== QUALITY METRICS ===")
            if 'PRODUCT_METADATA' in groups:
                prod_group = groups['PRODUCT_METADATA']
                if 'CLOUD_COVER' in prod_group:
                    print(f"Cloud Cover: {prod_group['CLOUD_COVER']['parsed_value']}%")
                if 'IMAGE_QUALITY_OLI' in prod_group:
                    print(f"Image Quality (OLI): {prod_group['IMAGE_QUALITY_OLI']['parsed_value']}/9")
                if 'GEOMETRIC_RMSE_MODEL' in prod_group:
                    print(f"Geometric RMSE: {prod_group['GEOMETRIC_RMSE_MODEL']['parsed_value']} meters")
            
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_real_landsat_metadata()
