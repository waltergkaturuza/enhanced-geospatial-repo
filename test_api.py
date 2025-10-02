#!/usr/bin/env python3
"""
Test script for the system management API endpoints.
"""

import requests
import json

# Test data for metadata parsing
test_metadata = '''GROUP = L1_METADATA_FILE
  GROUP = METADATA_FILE_INFO
    ORIGIN = "Image courtesy of the U.S. Geological Survey"
    REQUEST_ID = "501_01_009_210"
    LANDSAT_SCENE_ID = "LC80440342016259LGN00"
    FILE_DATE = 2016-09-16T06:55:18Z
    STATION_ID = "LGN"
    PROCESSING_SOFTWARE_VERSION = "LPGS_2.6.2"
  END_GROUP = METADATA_FILE_INFO
  GROUP = PRODUCT_METADATA
    DATA_TYPE = "L1T"
    COLLECTION_NUMBER = 01
    COLLECTION_CATEGORY = "T1"
    ELEVATION_SOURCE = "GLS2000"
    OUTPUT_FORMAT = "GEOTIFF"
    SPACECRAFT_ID = "LANDSAT_8"
    SENSOR_ID = "OLI_TIRS"
    DATE_ACQUIRED = 2016-09-15
    SCENE_CENTER_TIME = "08:49:27.7840570Z"
    CORNER_UL_LAT_PRODUCT = -17.47896
    CORNER_UL_LON_PRODUCT = 31.16519
    CORNER_UR_LAT_PRODUCT = -17.41484
    CORNER_UR_LON_PRODUCT = 33.45630
    CORNER_LL_LAT_PRODUCT = -19.57738
    CORNER_LL_LON_PRODUCT = 31.09036
    CORNER_LR_LAT_PRODUCT = -19.51168
    CORNER_LR_LON_PRODUCT = 33.35234
    CLOUD_COVER = 3.31
    CLOUD_COVER_LAND = 2.79
    WRS_PATH = 44
    WRS_ROW = 034
  END_GROUP = PRODUCT_METADATA
END_GROUP = L1_METADATA_FILE'''

def test_parse_metadata():
    """Test the metadata parsing endpoint."""
    print("Testing metadata parsing endpoint...")
    
    url = "http://127.0.0.1:8000/api/system/parse-metadata/"
    data = {
        "metadata_text": test_metadata
    }
    
    try:
        response = requests.post(url, json=data, headers={'Content-Type': 'application/json'})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

def test_system_status():
    """Test the system status endpoint."""
    print("\nTesting system status endpoint...")
    
    url = "http://127.0.0.1:8000/api/system/status/"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_parse_metadata()
    test_system_status()
