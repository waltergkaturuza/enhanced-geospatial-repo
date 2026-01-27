# Render Shell Commands - Quick Fix Guide

## 🚨 Immediate Actions Required

You now have shell access! Run these commands to fix all database issues:

---

## ⚡ Run These Commands NOW

### 1. Navigate to Project Directory
```bash
cd /opt/render/project/src
```

### 2. Run All Pending Migrations
```bash
python manage.py migrate
```

**Expected Output:**
```
Running migrations:
  Applying imagery.0002_userprofile_approval... OK
  Applying imagery.0003_add_userprofile_columns_sql... OK
  Applying imagery.0004_userprofile_assigned_modules... OK
  Applying imagery.0005_subscriptionplan_usersubscription_invoice... OK
  Applying imagery.0006_supportrequest_supportmessage... OK
```

### 3. Verify Migrations
```bash
python manage.py showmigrations
```

**Should show all [X] (applied):**
```
imagery
 [X] 0001_initial
 [X] 0002_userprofile_approval...
 [X] 0003_add_userprofile_columns_sql
 [X] 0004_userprofile_assigned_modules
 [X] 0005_subscriptionplan...
 [X] 0006_supportrequest...
```

### 4. Create Initial Subscription Plans (Optional)
```bash
python manage.py shell
```

Then paste this:
```python
from imagery.models import SubscriptionPlan

# Educational/Free Plan
SubscriptionPlan.objects.get_or_create(
    slug='educational',
    defaults={
        'name': 'Educational Access',
        'description': 'For students, schools, and academic research',
        'price_monthly': 0,
        'price_yearly': 0,
        'is_free': True,
        'max_aois': 10,
        'max_download_size_gb': 50.0,
        'max_concurrent_downloads': 3,
        'has_analytics': False,
        'has_api_access': False,
        'features': ['Browse catalog', 'Download data', 'Basic support'],
        'target_user_types': ['education', 'individual'],
        'is_active': True,
        'is_public': True,
        'display_order': 1
    }
)

# Government/Institutional Plan
SubscriptionPlan.objects.get_or_create(
    slug='government',
    defaults={
        'name': 'Government Access',
        'description': 'For councils, government agencies, and NGOs',
        'price_monthly': 99,
        'price_yearly': 990,  # 2 months free
        'is_free': False,
        'max_aois': 50,
        'max_download_size_gb': 500.0,
        'max_concurrent_downloads': 10,
        'has_analytics': True,
        'has_api_access': False,
        'has_priority_support': True,
        'features': ['All data access', 'Advanced analytics', 'Priority support', 'Custom processing'],
        'target_user_types': ['government', 'ngo'],
        'is_active': True,
        'is_public': True,
        'display_order': 2
    }
)

# Commercial/Enterprise Plan
SubscriptionPlan.objects.get_or_create(
    slug='commercial',
    defaults={
        'name': 'Commercial Access',
        'description': 'For private companies and consulting firms',
        'price_monthly': 499,
        'price_yearly': 4990,  # 2 months free
        'is_free': False,
        'max_aois': 999,
        'max_download_size_gb': 5000.0,
        'max_concurrent_downloads': 50,
        'has_analytics': True,
        'has_api_access': True,
        'has_priority_support': True,
        'has_custom_processing': True,
        'features': ['Unlimited access', 'API access', 'Custom processing', 'Dedicated support'],
        'target_user_types': ['commercial', 'consulting'],
        'is_active': True,
        'is_public': True,
        'display_order': 3
    }
)

print("✅ Subscription plans created!")
exit()
```

### 5. Restart Service (Optional)
```bash
# Exit shell, then in Render dashboard:
# Click "Restart Service"
```

---

## ✅ After Running These Commands

### Everything Should Work:

1. **Django Admin:**
   - `/admin/imagery/subscriptionplan/` ✅ Works
   - `/admin/imagery/usersubscription/` ✅ Works
   - `/admin/imagery/invoice/` ✅ Works
   - `/admin/imagery/supportrequest/` ✅ Works
   - `/admin/auth/user/` ✅ No more "column does not exist"

2. **API Endpoints:**
   - `/api/auth/signup/` ✅ Works
   - `/api/admin/users/` ✅ Returns users
   - `/api/system/status/` ✅ Works

3. **Frontend:**
   - User Management shows all users ✅
   - Database Management shows real stats ✅
   - Upload/File Manager hidden from regular users ✅

---

## 🔍 Troubleshooting

### If migrations fail:

**Error: "relation already exists"**
- Some tables were partially created
- Run: `python manage.py migrate --fake imagery 0005`
- Then: `python manage.py migrate`

**Error: "column already exists"**
- Migration 0003 already added some columns
- Safe to ignore - migrations have IF NOT EXISTS checks

**Error: "no such table"**
- Database connection issue
- Check DATABASE_URL environment variable

---

## 📊 Verify Everything Works

### Check Tables Were Created:
```bash
python manage.py dbshell
```

Then in PostgreSQL:
```sql
\dt imagery_*
```

Should show:
```
imagery_subscriptionplan
imagery_usersubscription
imagery_invoice
imagery_supportrequest
imagery_supportmessage
imagery_userprofile
... (and others)
```

Type `\q` to exit.

---

## 🎯 Quick Reference

```bash
# Most important commands:
cd /opt/render/project/src
python manage.py migrate
python manage.py showmigrations
python manage.py shell  # For creating default data
```

---

**After running these commands, refresh your browser and all errors should be gone!** ✅
