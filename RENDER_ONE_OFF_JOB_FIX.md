# Quick Fix: Run One-Off Job on Render (No Shell Access Needed!)

## 🚨 Problem
Migration isn't running automatically and you're getting:
```
column imagery_userprofile.organization does not exist
```

## ✅ Solution: One-Off Job

You can run a Django management command as a **one-off job** on Render without needing shell access!

---

## 📋 Step-by-Step Instructions

### 1. Go to Render Dashboard
https://dashboard.render.com

### 2. Find Your Service
Click on: **enhanced-geospatial-repo**

### 3. Run One-Off Job

Look for the **"Shell"** tab at the top, or find **"Run a one-off job"** option.

#### In the command field, enter:
```bash
python manage.py fix_userprofile_columns
```

#### Or if that doesn't work, try:
```bash
cd /opt/render/project/src && python manage.py fix_userprofile_columns
```

### 4. Click "Run"

You'll see output like:
```
============================================================
FIXING USERPROFILE COLUMNS
============================================================
Executing command 1/11...
✓ Command 1 completed
Executing command 2/11...
✓ Command 2 completed
...
============================================================
✓ USERPROFILE COLUMNS FIXED
============================================================
```

### 5. Restart Your Service

After the command completes:
1. Go back to your service dashboard
2. Click **"Manual Deploy" → "Clear build cache & deploy"**
   OR
3. Just click **"Restart Service"**

### 6. Test

Visit: https://enhanced-geospatial-repo.onrender.com/admin/auth/user/

Should work now! ✅

---

## Alternative: If One-Off Jobs Don't Work

### Option A: Add to Startup Script (Already Done!)

We already added migrations to `start.sh`, so just **restart the service**:

1. Render Dashboard → Your Service
2. Click the three dots (⋮) menu
3. Select **"Restart service"**

The migration will run on startup.

### Option B: Create Temporary Endpoint

I can create a temporary admin endpoint that runs the fix when you visit it in your browser. Let me know if you want this!

---

## 🎯 What This Command Does

The `fix_userprofile_columns` command:
- ✅ Adds all missing columns using raw SQL
- ✅ Checks if columns exist first (won't duplicate)
- ✅ Safe to run multiple times
- ✅ No shell access needed
- ✅ Works as a one-off job

---

## 📞 Still Not Working?

If you can't find the one-off job option, let me know and I'll create:
1. A temporary admin URL endpoint to run the fix
2. Or modify the startup to force the fix on next restart

Just tell me which you prefer!
