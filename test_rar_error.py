#!/usr/bin/env python3
"""
Test script to verify RAR error handling.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from imagery.services import AOIManagementService
import tempfile

def test_rar_error_handling():
    """Test that RAR error handling works correctly."""
    print("Testing RAR error handling...")
    
    # Create a fake RAR file (just a text file with .rar extension)
    with tempfile.NamedTemporaryFile(suffix='.rar', delete=False) as fake_rar:
        fake_rar.write(b"This is not a real RAR file")
        fake_rar_path = fake_rar.name
    
    try:
        aoi_service = AOIManagementService()
        
        # This should raise our improved error message
        result = aoi_service.parse_geometry_file(fake_rar_path, 'rar')
        print("ERROR: Should have failed!")
        
    except ValueError as e:
        error_msg = str(e)
        print(f"Caught expected error: {error_msg}")
        
        # Check if our improved error message is present
        if "RAR extraction tool not found" in error_msg:
            print("✅ SUCCESS: Improved RAR error message is working!")
            print("✅ Error includes installation instructions")
        elif "Cannot find working tool" in error_msg:
            print("❌ FAILURE: Still showing generic error message")
        else:
            print(f"❌ UNEXPECTED ERROR: {error_msg}")
            
    except Exception as e:
        print(f"❌ UNEXPECTED EXCEPTION: {type(e).__name__}: {e}")
        
    finally:
        # Clean up
        try:
            os.unlink(fake_rar_path)
        except:
            pass

if __name__ == "__main__":
    test_rar_error_handling()
