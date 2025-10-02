# Authentication Integration with Backend

## Overview

The frontend authentication system has been successfully integrated with the Django backend API. Users can now register, login, and authenticate against the real backend instead of using mock data.

## Backend Endpoints

The following authentication endpoints are available:

- `POST /api/auth/login/` - User login
- `POST /api/auth/signup/` - User registration  
- `GET /api/auth/profile/` - Get user profile

## Frontend Integration

### API Client (`src/lib/api.ts`)

Added authentication methods to the `GeospatialAPI` class:

```typescript
// Login endpoint
static async login(credentials: { email: string; password: string }): Promise<{
  success: boolean;
  user?: any;
  token?: string;
  message?: string;
}>

// Signup endpoint  
static async signup(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization: string;
  role?: string;
  subscriptionPlan?: string;
}): Promise<{
  success: boolean;
  user?: any;
  message?: string;
}>

// Get user profile
static async getUserProfile(): Promise<{
  success: boolean;
  user?: any;
  message?: string;
}>
```

### Authentication Context (`src/contexts/AuthContext.tsx`)

Updated the `login` and `signup` functions to call the real backend API:

- **Login**: Calls `/api/auth/login/` and stores the JWT token and user data
- **Signup**: Calls `/api/auth/signup/` and creates user accounts with pending approval status
- **Error Handling**: Properly handles and displays backend error messages

### Login Component (`src/components/auth/Login.tsx`)

- Updated to pass `rememberMe` option in credentials
- Maintains existing UI and validation
- Integrates seamlessly with backend authentication

### Signup Component (`src/components/auth/Signup.tsx`)

- Already configured to use the signup function from AuthContext
- Now creates real user accounts in the backend
- Supports user approval workflow

## Test Credentials

For testing the authentication system:

```
Email: admin@example.com
Password: admin123
```

This will authenticate against the backend and return an admin user with full access.

## Features

### ✅ Completed
- [x] Backend API endpoints for login, signup, and profile
- [x] Frontend API client integration
- [x] Real authentication flow (no more mock data)
- [x] JWT token storage and management
- [x] Error handling for invalid credentials
- [x] User approval workflow support
- [x] TypeScript types and interfaces
- [x] Production build working

### 🔄 User Approval Workflow
- New users are created with `pending` approval status
- They have limited access until approved by an admin
- Admin users can approve/reject pending users via the admin panel

### 🔧 Technical Details

**Authentication Flow:**
1. User submits login credentials
2. Frontend calls `/api/auth/login/` 
3. Backend validates credentials
4. On success: returns JWT token and user data
5. Frontend stores token in localStorage
6. Token is included in all subsequent API requests

**Authorization:**
- JWT token stored in `localStorage` as `authToken`
- Automatically included in API requests via axios interceptor
- 401 responses redirect to login page

## Environment Configuration

Make sure your frontend environment variables are set:

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000/api
```

## Running the System

1. **Start Backend:**
   ```bash
   cd geospatial_repo
   python manage.py runserver
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000/api

## Security Considerations

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- CSRF protection enabled on backend
- Password validation and strength checking
- Email validation on signup
- Rate limiting should be added for production

## Next Steps

1. **Enhanced Security:**
   - Implement refresh token rotation
   - Add password reset functionality
   - Enable email verification

2. **User Management:**
   - Admin panel for user management
   - Bulk user operations
   - User role assignment

3. **Session Management:**
   - Remember me functionality
   - Session timeout handling
   - Multi-device session management
