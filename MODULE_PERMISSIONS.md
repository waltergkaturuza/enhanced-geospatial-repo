# Module Access Permissions

## 🎯 Access Control Philosophy

**This is a data repository platform, NOT a user upload platform.**

- **Staff/Admins** → Upload satellite data, manage files
- **Customers** → Browse, search, download data
- **Regular users** → Download only (no upload/file management)

---

## 📋 Module Permissions Matrix

| Module | Staff/Admin | Analyst | Researcher | Viewer | Guest/Pending |
|--------|-------------|---------|------------|--------|---------------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Imagery Explorer** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Data Store** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Analytics** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Upload Images** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **File Manager** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Business Intelligence** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **System Management** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Admin Panel** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🔐 Role Definitions (Updated)

### Super Admin / Staff
**Who:** Platform administrators, data managers

**Can:**
- ✅ Upload satellite imagery
- ✅ Manage all files
- ✅ Approve/reject users
- ✅ Assign roles and quotas
- ✅ System configuration
- ✅ All analytics and business tools

**Modules:**
```javascript
['dashboard', 'imagery', 'analytics', 'business', 'admin', 'upload', 'files', 'store']
```

### Analyst
**Who:** Government planners, council staff, advanced researchers

**Can:**
- ✅ Browse and search catalog
- ✅ Download data
- ✅ Run analytics
- ✅ Generate reports
- ❌ Cannot upload data
- ❌ Cannot manage files

**Modules:**
```javascript
['dashboard', 'imagery', 'analytics', 'data_store']
```

### Researcher
**Who:** University researchers, academic institutions, NGOs

**Can:**
- ✅ Browse and search catalog
- ✅ Download data
- ✅ Basic analytics
- ❌ Cannot upload data
- ❌ Cannot manage files
- ❌ Limited advanced analytics

**Modules:**
```javascript
['dashboard', 'imagery', 'analytics', 'data_store']
```

### Viewer
**Who:** Students, independent learners, trial users

**Can:**
- ✅ Browse catalog
- ✅ Download data (within quota)
- ❌ No analytics
- ❌ Cannot upload
- ❌ Cannot manage files

**Modules:**
```javascript
['dashboard', 'imagery', 'data_store']
```

### Pending User
**Who:** Newly registered, awaiting approval

**Can:**
- ✅ View dashboard (limited)
- ✅ Browse catalog (read-only)
- ❌ Cannot download
- ❌ Cannot upload
- ❌ No analytics

**Modules:**
```javascript
['dashboard', 'data_store']
```

---

## 💡 Key Changes Made

### Before (Incorrect):
```python
# Regular users could upload!
user_modules = ['dashboard', 'imagery', 'upload']  # ❌ WRONG
```

### After (Correct):
```python
# Staff only uploads
if is_superuser:
    user_modules = ['dashboard', 'imagery', 'analytics', 'business', 
                    'admin', 'upload', 'files', 'store']
else:
    # Regular users: Download only
    user_modules = ['dashboard', 'imagery', 'data_store']  # ✅ CORRECT
```

---

## 🏛️ Use Case Examples

### Example 1: Harare City Council (Analyst)
```
User: Jane Moyo (Urban Planner)
Role: Analyst
Tier: Government/Institutional

Can Access:
✅ Dashboard - View their downloads, quotas, activity
✅ Imagery Explorer - Search and browse satellite catalog
✅ Analytics - Run NDVI, land use analysis
✅ Data Store - Download Sentinel/Landsat data

Cannot Access:
❌ Upload - Staff uploads data, not councils
❌ File Manager - Staff manages files
❌ Admin Panel - Staff only
```

### Example 2: University Student (Viewer)
```
User: John Mugabe (Student)
Role: Viewer
Tier: Educational

Can Access:
✅ Dashboard - Track downloads
✅ Imagery Explorer - Browse catalog
✅ Data Store - Download within 50GB quota

Cannot Access:
❌ Analytics - Upgrade to Researcher for this
❌ Upload - Staff only
❌ File Manager - Staff only
```

### Example 3: Private Company (Business User)
```
User: GeoConsult Analyst
Role: Business User
Tier: Commercial

Can Access:
✅ Dashboard - Activity tracking
✅ Imagery Explorer - Full catalog access
✅ Analytics - Advanced analytics
✅ Business Intelligence - Custom reports
✅ Data Store - Unlimited downloads

Cannot Access:
❌ Upload - Staff uploads, companies download
❌ File Manager - Staff only
❌ Admin Panel - Staff only
```

### Example 4: Data Manager (Staff)
```
User: Admin (GRS Staff)
Role: Super Admin
Tier: N/A

Can Access:
✅ Everything - Full system access
✅ Upload - Ingest satellite data
✅ File Manager - Organize files
✅ Admin - Approve users, manage system
```

---

## 🔄 Updated User Flow

### For Regular Users (Councils, Students, Companies):
```
1. Request Access → 2. Admin Approves → 3. Assigned Role
                                        ↓
4. Login → 5. Browse Catalog → 6. Search Data → 7. Download
```

**They NEVER upload. Staff uploads.**

### For Staff/Admins:
```
1. Login (as staff)
   ↓
2. Upload satellite data
   ↓
3. Manage files
   ↓
4. Data appears in catalog
   ↓
5. Users can download
```

---

## 📊 Module Access Flow

```
┌─────────────┐
│   LOGIN     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Check Role  │
└──────┬──────┘
       │
   ┌───┴────┐
   │        │
   ▼        ▼
┌──────┐  ┌──────────┐
│Staff │  │ Regular  │
│Admin │  │ User     │
└───┬──┘  └────┬─────┘
    │          │
    ▼          ▼
┌────────┐  ┌──────────┐
│ Upload │  │ Download │
│ Files  │  │ Only     │
│ Manage │  │          │
│ System │  │          │
└────────┘  └──────────┘
```

---

## 🔧 Implementation Details

### Backend (Django Views)

```python
# Login / Profile endpoints return:
{
    "user": {
        "role": "analyst",
        "modules": ["dashboard", "imagery", "analytics", "data_store"]
    }
}
```

### Frontend (React)

```typescript
// Dashboard checks user.modules
if (user.modules.includes('upload')) {
    // Show upload button
} else {
    // Hide upload - download only
}
```

### API Endpoints

```python
# Upload endpoint check:
@require_http_methods(["POST"])
def upload_satellite_imagery(request):
    if not (request.user.is_staff or request.user.is_superuser):
        return JsonResponse({'error': 'Upload requires staff access'}, status=403)
    # ... upload logic
```

---

## ✅ Benefits of This Approach

1. **Security** - Users can't pollute your catalog with invalid data
2. **Quality Control** - Staff ensures data meets standards
3. **Trust** - Councils/companies trust curated data
4. **Scalability** - Controlled ingestion prevents chaos
5. **Compliance** - Clear audit trail of who added what

---

## 🎓 Alignment with Industry

| Platform | User Upload | Staff Upload | Your System |
|----------|-------------|--------------|-------------|
| **Copernicus** | ❌ No | ✅ ESA uploads | ✅ Same |
| **USGS EarthExplorer** | ❌ No | ✅ USGS uploads | ✅ Same |
| **Google Earth Engine** | ⚠️ Some | ✅ Google uploads | ✅ Similar |
| **Planet** | ❌ No | ✅ Planet uploads | ✅ Same |

**Enterprise data repositories = Staff uploads, users download**

---

## 📝 Summary

**OLD (Wrong):**
- Everyone can upload ❌
- Everyone can manage files ❌
- Confusion about roles ❌

**NEW (Correct):**
- **Staff** → Upload & manage data ✅
- **Customers** → Download data ✅
- **Clear role separation** ✅

**This is now a proper enterprise data repository!** 🏛️

---

**Last Updated:** January 26, 2026
