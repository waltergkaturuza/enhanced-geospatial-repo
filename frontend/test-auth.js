// Test script to verify authentication
const API_BASE_URL = 'http://localhost:8000/api';

async function testLogin() {
  try {
    const credentials = {
      email: 'admin@example.com',
      password: 'admin123'
    };

    console.log('Testing login with:', { email: credentials.email, password: '***' });

    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);

    const data = await response.json();
    console.log('Response data:', data);

    if (data.success) {
      console.log('✅ Login successful!');
      console.log('User:', data.user);
      console.log('Token:', data.token);
    } else {
      console.log('❌ Login failed:', data.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the test
testLogin();
