#!/usr/bin/env python3
"""
Test RAR error handling via HTTP API call.
"""

import requests
import os

def test_rar_upload():
    """Test uploading a fake RAR file to see improved error message."""
    
    # Path to our fake RAR file
    rar_file_path = "fake_test.rar"
    
    if not os.path.exists(rar_file_path):
        print("❌ fake_test.rar not found")
        return
        
    print("Testing RAR upload error handling...")
    
    try:
        # Upload the fake RAR file
        with open(rar_file_path, 'rb') as f:
            files = {'file': ('test.rar', f, 'application/x-rar-compressed')}
            response = requests.post(
                'http://localhost:8000/api/aois/upload_geometry/',
                files=files,
                timeout=30
            )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 500:
            response_data = response.json()
            print("Response:")
            print(f"  Error: {response_data.get('error', 'N/A')}")
            print(f"  Details: {response_data.get('details', 'N/A')}")
            
            details = response_data.get('details', '')
            if 'RAR extraction tool not found' in details and 'install' in details:
                print("✅ SUCCESS: Improved error message is working!")
                print("✅ Error includes installation instructions")
            else:
                print("❌ FAILURE: Error message not improved")
                
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_rar_upload()
