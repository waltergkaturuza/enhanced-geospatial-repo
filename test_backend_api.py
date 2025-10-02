import requests
import json

# Test the Django backend API endpoints

BASE_URL = "http://127.0.0.1:8000/api"

def test_system_status():
    """Test the system status endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/system/status/")
        print(f"System Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"Error testing system status: {e}")
        return False

def test_auth_login():
    """Test the authentication login endpoint"""
    try:
        login_data = {
            "email": "admin@example.com",
            "password": "admin123"
        }
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        print(f"Auth Login: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"Error testing auth login: {e}")
        return False

def test_processing_queue():
    """Test the processing queue endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/system/processing-queue/")
        print(f"Processing Queue: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"Error testing processing queue: {e}")
        return False

def test_pending_users():
    """Test the pending users endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/admin/pending-users/")
        print(f"Pending Users: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"Error testing pending users: {e}")
        return False

def test_approve_user():
    """Test the approve user endpoint"""
    try:
        approve_data = {
            "user_id": "5",
            "admin_id": "admin_001"
        }
        response = requests.post(f"{BASE_URL}/admin/approve-user/", json=approve_data)
        print(f"Approve User: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"Error testing approve user: {e}")
        return False

def test_reject_user():
    """Test the reject user endpoint"""
    try:
        reject_data = {
            "user_id": "6",
            "admin_id": "admin_001",
            "reason": "Insufficient documentation provided"
        }
        response = requests.post(f"{BASE_URL}/admin/reject-user/", json=reject_data)
        print(f"Reject User: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f"Error testing reject user: {e}")
        return False

if __name__ == "__main__":
    print("Testing Django Backend API Endpoints")
    print("=" * 50)
    
    print("\n1. Testing System Status...")
    test_system_status()
    
    print("\n2. Testing Authentication...")
    test_auth_login()
    
    print("\n3. Testing Processing Queue...")
    test_processing_queue()
    
    print("\n4. Testing Pending Users...")
    test_pending_users()
    
    print("\n5. Testing User Approval...")
    test_approve_user()
    
    print("\n6. Testing User Rejection...")
    test_reject_user()
    
    print("\nAll tests completed!")
