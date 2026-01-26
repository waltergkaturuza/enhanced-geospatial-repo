# Approval-Based Access Request System

## Overview

This platform implements an **enterprise-grade, approval-based access request system** following best practices from leading GIS platforms (Esri, Copernicus, USGS EarthExplorer, Planet Labs).

**Mental Model:** "Apply for access → reviewed → granted permissions"

Users cannot self-assign roles or subscription plans. All access is controlled by administrators after reviewing applications.

---

## 🎯 Key Features

### 1. **Multi-Path User Selection**
Users self-identify their category on signup:
- **Government / Council** - Ministries, local councils, government agencies
- **Organization / Company** - Private companies, NGOs, consulting firms
- **University / School** - Educational institutions, research centers
- **Individual / Student** - Independent researchers, students, learners

### 2. **Application-Based Registration**
Instead of "Create Account," users:
- Submit an **access request** with detailed information
- Provide organization details, intended use, and credentials
- Wait for admin approval before gaining full access

### 3. **Admin Review & Assignment**
Admins can:
- Review pending applications with full context
- Approve or reject with reasons
- Assign appropriate **roles** and **access tiers**
- Set storage quotas and download limits

---

## 📋 User Signup Flow

### Step 1: Path Selection
User selects their category:
```
┌─────────────────────────────────────────────────┐
│  Who are you?                                   │
├─────────────────────────────────────────────────┤
│  [Government/Council]  [Organization/Company]   │
│  [University/School]   [Individual/Student]     │
└─────────────────────────────────────────────────┘
```

### Step 2: Application Form
User provides:
- **Personal Information**: Name, email (institutional preferred)
- **Organization Details**: Name, type, country
- **Intended Use**: Research, planning, education, commercial, etc.
- **Account Security**: Password with strength validation

### Step 3: Automatic Processing
Backend automatically:
- Creates user account with `role = 'pending_user'`
- Sets `approval_status = 'pending'`
- Stores application details in UserProfile
- Logs any security alerts (e.g., admin role self-assignment attempts)
- Allows login but with **limited access** (Dashboard + Data Store only)

### Step 4: Admin Notification
Admin sees:
- New pending user in admin panel
- Organization type and intended use
- Email domain (helps verify legitimacy)
- Full application details

---

## 🔐 Security Features

### Backend Security (auth_views.py)
```python
# SECURITY: Ignore any role or subscription from frontend
frontend_role = data.get('role')  # Captured but ignored

if frontend_role and frontend_role in ['admin', 'super_admin']:
    logger.warning(f"SECURITY ALERT: Attempted self-assignment of admin role by {email}")
    # Continue but log the attempt

# Always create with pending status
role = 'pending_user'  # NEVER trust frontend
```

### Profile Protection
```python
# Store application details
profile.approval_status = 'pending'
profile.organization_type = data.get('organizationType')
profile.intended_use = data.get('intendedUse')
profile.user_path = data.get('userPath')
```

---

## 👨‍💼 Admin Approval Workflow

### 1. View Pending Applications
Navigate to: **Admin → User Approval**

Admins see:
- User name and email
- Organization name and type
- Intended use case
- Country/region
- Application date
- Any additional details provided

### 2. Review Application
Each application shows:
```
┌─────────────────────────────────────────────────┐
│ John Doe (john.doe@harare.gov.zw)              │
│ Harare City Council • Local Council            │
│                                                 │
│ Type: Local Council                            │
│ Use: Urban/Regional Planning                   │
│ Country: Zimbabwe                              │
│                                                 │
│ Details: "We need satellite imagery for        │
│ urban planning and infrastructure development" │
└─────────────────────────────────────────────────┘
```

### 3. Make Decision

#### Option A: APPROVE ✅
Admin selects:
- **Role** (determines features)
  - Viewer - Read-only access
  - Researcher - Data access + analysis
  - Analyst - Advanced analytics
  - Business User - Commercial access

- **Access Tier** (determines quotas)
  - Educational/Trial (10 AOIs, 50GB)
  - Government/Institutional (50 AOIs, 500GB)
  - Commercial (Unlimited)

System automatically:
- Updates `approval_status = 'approved'`
- Assigns selected role and tier
- Sets appropriate quotas
- Records who approved and when
- Sends approval email (TODO)

#### Option B: REJECT ❌
Admin provides:
- **Rejection reason** (required)
  - Example: "Institutional email required"
  - Example: "Insufficient use case details"

System automatically:
- Updates `approval_status = 'rejected'`
- Stores rejection reason
- Keeps account active but limited
- Sends rejection email with reason (TODO)

---

## 🎭 Role Definitions

| Role | Who | Data Access | Features | Typical Tier |
|------|-----|-------------|----------|--------------|
| **Viewer** | General users, students | Read-only | Browse, preview | Educational |
| **Researcher** | Academics, research labs | Download + Analysis | Processing, indices | Educational |
| **Analyst** | Government, councils | Full data access | Advanced analytics | Institutional |
| **Business User** | Private companies | Commercial use | All features | Commercial |
| **Admin** | Platform managers | Full system access | User management | N/A |

---

## 📊 Access Tiers & Quotas

### Educational / Trial Access (Free)
```
Max AOIs: 10
Max Download: 50 GB
Concurrent Downloads: 3
Suitable for: Students, independent researchers, small projects
```

### Government / Institutional Access (Professional)
```
Max AOIs: 50
Max Download: 500 GB
Concurrent Downloads: 10
Suitable for: Councils, universities, NGOs, government agencies
```

### Commercial Access (Enterprise)
```
Max AOIs: Unlimited
Max Download: 5000 GB
Concurrent Downloads: 50
Suitable for: Private companies, consulting firms, large-scale projects
```

---

## 🔄 User Status Lifecycle

```
┌──────────────┐
│   SIGNUP     │ User submits access request
└──────┬───────┘
       │
       v
┌──────────────┐
│   PENDING    │ Limited access (Dashboard + Data Store)
└──────┬───────┘
       │
       ├──> APPROVED ──> Full access with assigned role/tier
       │
       └──> REJECTED ──> Limited access, can reapply
```

---

## 📁 File Structure

### Frontend Components
```
frontend/src/components/
├── auth/
│   └── Signup.tsx          # Multi-path application form
├── admin/
│   └── UserApproval.tsx    # Admin review interface
└── system/
    └── UserManagement.tsx  # User list with approval actions
```

### Backend Views
```
imagery/
├── auth_views.py           # Signup with security checks
├── views_simple.py         # Admin approval endpoints
├── models.py               # UserProfile with approval fields
└── urls.py                 # API routes
```

---

## 🔌 API Endpoints

### Public Endpoints
```
POST /api/auth/signup/
  - Creates user with pending status
  - Stores application details
  - Returns limited token
```

### Admin Endpoints
```
GET /api/admin/pending-users/
  - Lists users with approval_status = 'pending'
  - Includes full application details

POST /api/admin/approve-user/
  Body: { user_id, role, subscription_plan, quotas }
  - Updates approval status
  - Assigns role and tier
  - Sets quotas

POST /api/admin/reject-user/
  Body: { user_id, reason }
  - Updates rejection status
  - Stores reason
```

---

## 🎨 UI/UX Best Practices

### Trust Signals
- ✅ "Used by planners, researchers, and educators"
- ✅ "Approval-based access to ensure responsible data use"
- ✅ "Trusted by institutions"

### Professional Language
- ✅ "Request Access" instead of "Create Account"
- ✅ "Your application will be reviewed within 1-2 business days"
- ✅ "Access Tier (Assigned after review)" instead of "Pricing Plan"

### Progressive Disclosure
- Only show role/subscription after approval
- Display as "Access Level: Researcher" not selectable dropdown
- Keep complexity hidden until needed

---

## 🚀 What Makes This Enterprise-Grade

### 1. Security
- No self-assigned admin roles
- All role changes logged
- Email domain verification
- Audit trail for approvals

### 2. Compliance
- Know your user (KYU) for data licensing
- Usage tracking for compliance
- Institutional verification

### 3. Scalability
- Approval workflow can be automated based on rules
- Email domain whitelisting possible
- Batch approval capabilities

### 4. User Experience
- Clear expectations ("approval required")
- Professional, trustworthy design
- Minimal friction for legitimate users

---

## 🔜 Future Enhancements

### Phase 2: Automation
- [ ] Auto-approve users from whitelisted domains (.gov.zw, .ac.zw)
- [ ] Email verification required before admin review
- [ ] Bulk approval/rejection capabilities

### Phase 3: Self-Service
- [ ] Users can upgrade tier (with approval)
- [ ] Quota usage dashboards
- [ ] Request additional access

### Phase 4: Communication
- [ ] Email notifications for approval/rejection
- [ ] Admin notification for new applications
- [ ] Approval reminders for admins

### Phase 5: Analytics
- [ ] Application funnel metrics
- [ ] Approval rate by organization type
- [ ] Time-to-approval tracking

---

## 🎓 Comparison to Industry Leaders

| Platform | Approach | Our System |
|----------|----------|------------|
| **Copernicus** | Account creation → limited access → request upgrade | ✅ Similar |
| **USGS EarthExplorer** | Create account → all users equal access | ❌ Less control |
| **Esri ArcGIS Online** | Org-based licensing → admin invites | ⚠️ Different model |
| **Planet Labs** | Contact sales → custom setup | ✅ Similar for enterprise |

Our system combines the best aspects: **open signup with controlled access**.

---

## 📞 Support

For questions about the approval system:
1. Check admin dashboard for pending applications
2. Review UserProfile model for stored application data
3. Check logs for security alerts
4. Email notifications coming soon

---

**Last Updated:** January 2026
**Version:** 1.0
**Status:** ✅ Fully Implemented
