# User Approval System Implementation

## Overview

This document outlines the implementation of a comprehensive user approval system for the geospatial application, where new users can register and access limited features while awaiting admin approval.

## System Architecture

### Frontend Components

#### 1. User Types and Status Management
- **User Interface Updates**: Extended user types to include approval status
- **Approval Status Fields**:
  - `isApproved`: Boolean flag for approval status
  - `approvalStatus`: Detailed status ('pending', 'approved', 'rejected')
  - `approvedBy`: ID of admin who approved the user
  - `approvedAt`: Timestamp of approval
  - `rejectionReason`: Reason for rejection if applicable

#### 2. Role and Permission System
- **New Role**: `pending_user` - For users awaiting approval
- **New Subscription Plan**: `free_pending` - Limited access plan
- **New Permissions**: 
  - `user.approve` - Approve pending users
  - `user.reject` - Reject pending users

#### 3. User Experience Components

##### ApprovalStatusBanner Component
```typescript
// Location: frontend/src/components/ApprovalStatusBanner.tsx
```
- Displays approval status at the top of the dashboard
- Shows different messages based on email verification and approval status
- Provides actionable information (resend email, view rejection reason)
- Color-coded alerts (yellow for email verification, blue for pending, red for rejected)

##### UserApproval Component  
```typescript
// Location: frontend/src/components/admin/UserApproval.tsx
```
- Admin interface for managing pending user approvals
- Search and filter pending users
- Approve/reject users with reasons
- Real-time updates and status management

#### 4. Updated Authentication Flow

##### AuthContext Updates
- Enhanced signup process to create users with pending status
- Added approval status check functions:
  - `isUserApproved()`: Check if user is approved
  - `isPendingApproval()`: Check if user is pending approval
  - `canAccessFullFeatures()`: Check if user has full access
  - `getAccessLevelMessage()`: Get status message for user

##### Dashboard Integration
- Approval status banner automatically displays for users
- Limited feature access based on approval status
- Clear messaging about available features during pending state

### Backend Implementation

#### 1. API Endpoints

```python
# Location: imagery/views_simple.py
```

##### User Approval Endpoints:
- `GET /api/admin/pending-users/` - Get list of pending users
- `POST /api/admin/approve-user/` - Approve a pending user
- `POST /api/admin/reject-user/` - Reject a pending user with reason

#### 2. URL Configuration
```python
# Location: imagery/urls.py
```
- Added approval endpoints to URL patterns
- Proper routing for admin functionality

### User Journey

#### 1. New User Registration
1. User registers with email, name, organization
2. System creates account with:
   - Role: `pending_user`
   - Subscription: `free_pending`
   - Status: `isApproved: false`, `approvalStatus: 'pending'`
3. User receives immediate access to limited features:
   - Browse public datasets
   - Basic analytics
   - Download sample data
   - Community support
   - 500MB storage limit
   - 50 API calls/month

#### 2. Admin Approval Process
1. Admin accesses User Approval page (`/admin/approvals`)
2. Views list of pending users with details:
   - Name, email, organization
   - Registration date
   - Email verification status
3. Admin can:
   - **Approve**: User gets full access based on requested role
   - **Reject**: User receives notification with reason

#### 3. Post-Approval Experience
- **If Approved**:
  - Role upgraded (e.g., to `viewer`, `analyst`, etc.)
  - Subscription upgraded to `free` or higher
  - Full feature access unlocked
  - Status banner disappears
  
- **If Rejected**:
  - User sees rejection message
  - Can view rejection reason
  - Retains limited access
  - Can contact support for appeal

## Technical Features

### 1. Feature Access Control
```typescript
// Example access control based on approval status
const canAccessFullFeatures = user?.isApproved && user?.emailVerified;

// Limited features for pending users
const pendingUserFeatures = [
  'view_public_data',
  'basic_analytics',
  'download_samples',
  'community_support'
];
```

### 2. Security Considerations
- Approval actions logged with admin ID and timestamp
- Rejection reasons stored for audit trail
- Email verification required before full approval
- Role-based access to approval functionality

### 3. User Interface Design
- Clear status indicators throughout the application
- Helpful messaging explaining current access level
- Progressive disclosure of features based on status
- Admin-friendly approval interface with bulk actions

## Configuration

### Role Definitions
```typescript
// New pending user role with limited access
pending_user: {
  name: 'pending_user',
  displayName: 'Pending User',
  description: 'New user awaiting approval - has access to free features',
  level: 2,
  modules: [
    { moduleId: 'dashboard', access: 'read', features: ['view_public', 'view_personal'] },
    { moduleId: 'satellite_data', access: 'read', features: ['view_free_data', 'download_small'] },
    { moduleId: 'data_store', access: 'read', features: ['browse_free', 'download_free'] },
    // ... limited feature set
  ]
}
```

### Subscription Plans
```typescript
// Limited subscription for pending users
free_pending: {
  id: 'free_pending',
  name: 'Free (Pending Approval)',
  description: 'Limited access while awaiting account approval',
  limits: {
    storage: 0.5, // GB
    apiCalls: 50,
    users: 1,
    projects: 1
  }
}
```

## Benefits

### 1. Security and Control
- Administrators have full control over who gets access
- Prevents unauthorized or spam registrations
- Maintains data security and compliance

### 2. User Experience
- Immediate access to core features
- Clear communication about status and expectations
- No frustrating "wait for approval" with zero access

### 3. Business Value
- Opportunity to showcase platform value during trial period
- Higher conversion rates from trial to paid plans
- Better user onboarding and engagement

### 4. Administrative Efficiency
- Streamlined approval process
- Bulk actions for managing multiple users
- Audit trail for all approval decisions

## Usage Examples

### 1. Admin Approving Users
```bash
# Get pending users
curl -X GET http://localhost:8000/api/admin/pending-users/

# Approve a user
curl -X POST http://localhost:8000/api/admin/approve-user/ \
  -H "Content-Type: application/json" \
  -d '{"user_id": "5", "admin_id": "admin_001"}'

# Reject a user
curl -X POST http://localhost:8000/api/admin/reject-user/ \
  -H "Content-Type: application/json" \
  -d '{"user_id": "6", "admin_id": "admin_001", "reason": "Incomplete documentation"}'
```

### 2. Frontend Integration
```tsx
// Using approval status in components
const { user, isPendingApproval, canAccessFullFeatures } = useAuthContext();

if (isPendingApproval()) {
  return <LimitedFeatureSet />;
}

if (canAccessFullFeatures()) {
  return <FullFeatureSet />;
}
```

## Conclusion

The user approval system successfully balances security requirements with user experience by providing immediate value while maintaining administrative control. The implementation is scalable, maintainable, and provides clear audit trails for compliance and business intelligence.

The system is now ready for production use and can be extended with additional features such as:
- Automated approval workflows
- Integration with external identity providers
- Advanced analytics on approval patterns
- Bulk user management tools
