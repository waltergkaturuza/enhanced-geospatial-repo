# Deployment Guide - Render

## Quick Reference

### When You Push Code Changes

1. **Commit and push** your changes
2. **Wait 2-3 minutes** for Render to detect the push
3. **Check Render dashboard** for build status
4. **Wait 5-10 minutes** for build to complete
5. **Test** the deployment

### If You Get Migration Errors

Error: `django.db.utils.ProgrammingError: column X does not exist`

**This means:** The database hasn't been updated with the new schema yet.

**Solution:**
1. Check if build is complete in Render dashboard
2. If build is stuck, trigger manual deploy
3. If deploy completed but error persists, run migration manually

---

## Detailed Steps

### 1. Check Build Status

Go to: https://dashboard.render.com

1. Find your service: `enhanced-geospatial-repo`
2. Check the **Events** tab
3. Look for:
   ```
   Build started
   Installing dependencies...
   Running migrations...
   Build succeeded
   Deploy live
   ```

### 2. Manual Deploy

If auto-deploy doesn't trigger:

1. Go to service dashboard
2. Click **"Manual Deploy"** button (top right)
3. Select **"Deploy latest commit"**
4. Wait for completion

### 3. Manual Migration (Emergency)

If you need to apply migrations immediately:

#### Via Render Shell:
```bash
# In Render Dashboard → Shell tab
cd /opt/render/project/src
python manage.py migrate
python manage.py collectstatic --no-input
```

#### Via SSH (if configured):
```bash
ssh render-service
cd /opt/render/project/src
python manage.py migrate
```

### 4. Verify Deployment

Check these URLs after deployment:

- **Frontend**: https://enhanced-geospatial-repo.onrender.com
- **API Health**: https://enhanced-geospatial-repo.onrender.com/api/health/ (if exists)
- **Admin**: https://enhanced-geospatial-repo.onrender.com/admin/

### 5. Check Migration Status

Run locally before pushing:
```bash
python check_migrations.py
```

Or on Render:
```bash
python manage.py showmigrations
```

Expected output:
```
imagery
 [X] 0001_initial
 [X] 0002_userprofile_approval_status_userprofile_approved_at_and_more
```

`[X]` = Applied ✅
`[ ]` = Not applied ❌

---

## Common Issues

### Issue 1: Column does not exist
**Error:** `column imagery_userprofile.organization does not exist`

**Cause:** Migration not applied
**Fix:** Wait for build or run migration manually

### Issue 2: Build fails during npm install
**Error:** `npm ERR!` during build

**Cause:** Node dependencies issue
**Fix:** Check `frontend/package.json` and `package-lock.json`

### Issue 3: Static files not loading
**Error:** 404 on CSS/JS files

**Cause:** `collectstatic` not run or STATIC_URL misconfigured
**Fix:** 
```bash
python manage.py collectstatic --no-input
```

### Issue 4: Database connection failed
**Error:** `could not connect to database`

**Cause:** DATABASE_URL not set or database offline
**Fix:** Check Render environment variables

---

## Build Process Flow

```
1. Git Push
   ↓
2. Render Detects Change
   ↓
3. Run build.sh:
   a. Install Python deps (pip install -r requirements.txt)
   b. Build frontend (npm ci && npm run build)
   c. Collect static (python manage.py collectstatic)
   d. Run migrations (python manage.py migrate) ← THIS APPLIES SCHEMA CHANGES
   ↓
4. Start application (./start.sh)
   ↓
5. Deploy Live
```

**Key Point:** Migrations run during build (step 3d), not startup!

---

## Emergency Procedures

### If Site is Down

1. **Check Render Status**: https://status.render.com
2. **Check Logs**: Render Dashboard → Logs tab
3. **Check Database**: Ensure database service is running
4. **Restart Service**: Manual Deploy → "Clear build cache & deploy"

### If Migrations Break Production

**⚠️ This is rare but can happen**

1. **Identify the problem migration**:
   ```bash
   python manage.py showmigrations
   ```

2. **Rollback to previous migration**:
   ```bash
   python manage.py migrate imagery 0001
   ```

3. **Fix the migration file locally**

4. **Test locally first**:
   ```bash
   python manage.py migrate
   ```

5. **Push fix**

### If Need to Reset Database (⚠️ DANGER)

**This will delete all data!**

```bash
# In Render Shell
python manage.py flush --no-input
python manage.py migrate
python manage.py createsuperuser
```

---

## Pre-Push Checklist

Before pushing code that changes models:

- [ ] Created migrations locally: `python manage.py makemigrations`
- [ ] Tested migrations locally: `python manage.py migrate`
- [ ] Checked migration file is committed: `git add imagery/migrations/`
- [ ] Build works locally: `cd frontend && npm run build`
- [ ] Tests pass (if you have them)
- [ ] Committed and pushed: `git push origin main`

---

## Monitoring Deployment

Watch these in real-time:

### Render Dashboard → Logs
```
Installing dependencies...
Building frontend...
✓ 2110 modules transformed
Collecting static files...
Running migrations...
  Applying imagery.0002_userprofile_approval... OK
Starting Django...
==> Detected service running on port 10000
```

### Key Indicators:
- ✅ `Applying imagery.0002_userprofile_approval... OK` → Migration applied
- ✅ `==> Detected service running on port 10000` → Server started
- ✅ `Deploy live` event → Deployment complete
- ❌ `Build failed` → Check error logs
- ⚠️ `WARNING` messages → Usually safe but investigate

---

## Testing After Deployment

1. **Basic Health Check**:
   ```bash
   curl https://enhanced-geospatial-repo.onrender.com/admin/
   ```
   Should return 200 (redirect to login)

2. **API Test**:
   ```bash
   curl https://enhanced-geospatial-repo.onrender.com/api/
   ```

3. **Migration Verification**:
   - Login to admin: /admin/
   - Try to view Users
   - Should NOT get "column does not exist" error

4. **Signup Test**:
   - Go to signup page
   - Fill form
   - Submit
   - Should NOT get 500 error

---

## Useful Commands

### Local Development
```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate

# Check migration status
python manage.py showmigrations

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Build frontend
cd frontend && npm run build
```

### On Render (via Shell)
```bash
# Check Python version
python --version

# Check Django version
python -c "import django; print(django.VERSION)"

# List installed packages
pip list

# Check database connection
python manage.py dbshell

# Run Django shell
python manage.py shell
```

---

## Support

- **Render Docs**: https://render.com/docs
- **Django Migrations**: https://docs.djangoproject.com/en/stable/topics/migrations/
- **Project Issues**: Check GitHub issues or create new one

---

**Last Updated:** January 26, 2026
**Version:** 1.0
