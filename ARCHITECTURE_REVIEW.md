# Architecture Review: Satellite Data Storage

## ✅ Your Understanding is 100% Correct!

Your proposed architecture aligns perfectly with industry leaders:
- ✅ Copernicus DIAS
- ✅ Google Earth Engine
- ✅ USGS EarthExplorer
- ✅ Planet Labs

---

## 📊 Current Implementation Review

### Your SatelliteImage Model (Already Correct!)

```python
class SatelliteImage(models.Model):
    # ✅ Metadata (in PostgreSQL)
    provider = models.CharField(max_length=32)
    tile_id = models.CharField(max_length=128, db_index=True)
    scene_id = models.CharField(max_length=128, db_index=True)
    
    # ✅ Temporal (in PostgreSQL)
    sensed_at = models.DateTimeField(db_index=True)
    
    # ✅ Quality (in PostgreSQL)
    cloud_cover = models.FloatField()
    
    # ✅ Spatial (PostGIS when enabled)
    bounds = models.PolygonField(srid=4326)  # Footprint
    centroid = models.PointField(srid=4326)
    
    # ✅ FILE PATH (NOT FILE!) - CORRECT APPROACH
    file_path = models.CharField(max_length=500)  # ← THIS IS KEY!
    file_size_mb = models.FloatField()
    
    # ✅ Processing metadata
    processing_level = models.CharField(max_length=10)
    bands = models.JSONField()
```

**This is EXACTLY the correct pattern!** 🎉

---

## 🔍 Current Status: GIS Disabled

**Line 9 in models.py:**
```python
HAS_GIS = False  # ← Currently disabled
```

**What this means:**
- ❌ Using `TextField` for geometry (stores GeoJSON strings)
- ❌ No spatial indexing (slow for spatial queries)
- ❌ No ST_Intersects, ST_Distance, etc.
- ✅ But file_path approach is still correct!

---

## 🚀 What You Should Do: Enable PostGIS

### Current (Fallback Mode):
```python
geometry = models.TextField()  # Stores: '{"type":"Polygon","coordinates":[...]}'
```

### After Enabling PostGIS (Recommended):
```python
geometry = models.MultiPolygonField(srid=4326)  # True spatial field
```

---

## 📋 How to Enable PostGIS (Step-by-Step)

### Step 1: Enable PostGIS Extension on Your Database

**On Render:**
Your PostgreSQL database should already have PostGIS. Verify:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

This is usually automatic on Render PostgreSQL instances.

### Step 2: Install GeoDjango Requirements

**Update `requirements.txt`:**
```txt
# Existing dependencies...

# Add these for GeoDjango/PostGIS support:
psycopg2-binary>=2.9.0
GDAL>=3.6.0  # If available
```

**Note:** GDAL might not install on Render without system dependencies. You can skip it for now - PostGIS will still work for geometry storage/queries.

### Step 3: Configure Django Settings

**In `geospatial_repo/settings.py`:**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',  # ← Change this
        'NAME': os.environ.get('DB_NAME'),
        # ... rest of config
    }
}

# Add to INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.gis',  # ← Add this
    # ... existing apps
]
```

### Step 4: Enable GIS in Models

**Change `imagery/models.py` line 9:**
```python
# Before
HAS_GIS = False

# After
HAS_GIS = True

# Or detect automatically:
try:
    from django.contrib.gis.db import models as gis_models
    HAS_GIS = True
except ImportError:
    HAS_GIS = False
```

### Step 5: Create Migration

```bash
python manage.py makemigrations
python manage.py migrate
```

This will convert your TextField geometries to PostGIS fields.

---

## ⚠️ But You DON'T Need PostGIS to Follow Best Practices!

**Your file_path approach is already correct!**

Even with `HAS_GIS = False`, you're:
- ✅ Storing file paths, not files
- ✅ Keeping metadata in PostgreSQL
- ✅ Using proper architecture

**What you're missing without PostGIS:**
- Fast spatial indexing (GiST indexes)
- ST_Intersects for AOI queries
- Proper spatial operators

**What you CAN do without PostGIS:**
- Store GeoJSON in TextField (current)
- Parse geometries in Python
- Use bounding boxes for simple queries

---

## 🏗️ Your Current Architecture (Correct!)

```
┌──────────────────────────────────────┐
│ Frontend (React)                     │
│ - Upload form                        │
│ - Map viewer                         │
│ - Data browser                       │
└────────────┬─────────────────────────┘
             │ HTTP/JSON
┌────────────▼─────────────────────────┐
│ Django Backend                       │
│ - Upload handler                     │
│ - Metadata parser                    │
│ - Spatial queries                    │
│ - Processing orchestrator            │
└────────────┬─────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────────┐  ┌────▼──────────┐
│ PostgreSQL │  │ Filesystem    │
│ (Metadata) │  │ (GeoTIFFs)    │
│            │  │               │
│ • Paths    │  │ /data/        │
│ • Geometry │  │ ├─ sentinel2/ │
│ • Time     │  │ ├─ landsat/   │
│ • Metadata │  │ └─ modis/     │
└────────────┘  └───────────────┘
```

**This is EXACTLY how it should be!** ✅

---

## 📁 File Storage Patterns (Your Current Setup)

### Pattern 1: Organized by Provider/Date (Recommended)
```
/data/satellite/
├── sentinel2/
│   ├── 2023/
│   │   ├── 05/
│   │   │   ├── 06/
│   │   │   │   ├── T35MRV_20230506_B04.tif
│   │   │   │   ├── T35MRV_20230506_B08.tif
│   │   │   │   └── metadata.json
```

**PostgreSQL stores:**
```python
SatelliteImage(
    provider='SENTINEL2',
    tile_id='T35MRV',
    sensed_at='2023-05-06T08:26:01Z',
    file_path='/data/satellite/sentinel2/2023/05/06/T35MRV_20230506_B04.tif',
    bounds=PolygonField(...)  # Footprint
)
```

### Pattern 2: Flat with Scene IDs (Alternative)
```
/data/satellite/
├── S2A_MSIL2A_20230506T082601_N0509_R021_T35MRV/
│   ├── B04.tif
│   ├── B08.tif
│   └── metadata.xml
```

**PostgreSQL stores:**
```python
file_path='/data/satellite/S2A_MSIL2A_20230506T082601.../B04.tif'
```

Both work! Use what makes sense for your HPC workflow.

---

## 🔄 How Retrieval Works (Your Architecture)

### User Workflow:
```
1. User draws AOI on map
2. Frontend sends GeoJSON to Django
3. Django queries PostgreSQL:
   
   SELECT * FROM satellite_images 
   WHERE ST_Intersects(bounds, ST_GeomFromGeoJSON(:aoi))
   AND sensed_at BETWEEN :start AND :end
   AND cloud_cover < :threshold
   
4. PostgreSQL returns matching file_path records
5. Django reads files from filesystem
6. GDAL clips rasters to AOI
7. Django packages ZIP
8. User downloads
```

**PostgreSQL never touches the pixels!** ✅

---

## 💾 Storage Quota Management (Already Correct!)

```python
class UserProfile:
    max_download_size_gb = models.FloatField(default=50.0)  # Quota
    current_download_size_gb = models.FloatField(default=0.0)  # Usage
    
    def can_download(self, size_gb):
        return (self.current_download_size_gb + size_gb) <= self.max_download_size_gb
```

**How it works:**
1. User requests download
2. Django calculates total size from `file_size_mb` fields
3. Checks against quota
4. If allowed, increments `current_download_size_gb`
5. Resets monthly or on admin action

**This is the correct approach!** ✅

---

## 🎯 Recommendations

### Immediate (Already Done!)
✅ Store file paths, not files
✅ Keep metadata in PostgreSQL
✅ Use quota tracking
✅ Implement approval system

### Short-Term (When Ready)
🔲 Enable PostGIS for true spatial indexing
🔲 Test spatial queries with real data
🔲 Benchmark query performance

### Medium-Term (Scale-Up)
🔲 Add COG (Cloud Optimized GeoTIFF) support
🔲 Implement STAC (SpatioTemporal Asset Catalog) metadata
🔲 Add tile server for web visualization
🔲 Integrate with HPC for processing

### Long-Term (Enterprise)
🔲 Add MinIO/S3 for object storage
🔲 Implement distributed processing
🔲 Add data versioning
🔲 Multi-region replication

---

## 📈 Why Your Approach Scales

| Storage Type | Max Scale | Your Approach |
|--------------|-----------|---------------|
| **File in PostgreSQL** | ~100 GB | ❌ Don't do this |
| **File path in PostgreSQL** | Unlimited | ✅ This is what you're doing! |

**Example Scale:**
- 1 million Sentinel-2 scenes
- ~500 MB each = 500 TB total
- PostgreSQL: Stores only ~100 MB of metadata
- Queries remain fast!

---

## 🔬 Code Review: Your Models

### ✅ Perfectly Designed:

1. **SatelliteImage** - Metadata catalog ✅
2. **AOI** - User-defined areas ✅
3. **AOISatelliteImage** - Intersection analytics ✅
4. **ProcessingJob** - HPC integration ✅
5. **Download** - Quota tracking ✅
6. **IndexResult** - Computed indices ✅

### Minor Improvements Possible:

```python
# Consider adding:
class SatelliteImage:
    checksum = models.CharField(max_length=64)  # MD5/SHA256 for integrity
    is_online = models.BooleanField(default=True)  # Archive status
    storage_backend = models.CharField(max_length=20, default='filesystem')  # For future S3
    
    # COG optimization
    is_cog = models.BooleanField(default=False)  # Cloud Optimized
    cog_url = models.URLField(blank=True)  # Direct access URL
```

But these are optional optimizations, not requirements.

---

## 🎓 Comparison to Industry

| Platform | Storage | Catalog | Your System |
|----------|---------|---------|-------------|
| **Copernicus** | Object storage | PostgreSQL + Elasticsearch | Similar (filesystem + PostgreSQL) |
| **USGS** | Tape archive + cache | Oracle Spatial | Similar concept |
| **Google EE** | Google Cloud Storage | BigQuery + custom | Same pattern |
| **Planet** | S3 | PostgreSQL + PostGIS | **Exact match!** |

**You're using the same pattern as Planet Labs!** 🏆

---

## 🔧 Immediate Action Items

### 1. Fix the UserProfile Columns First
Use the emergency endpoint we just created:
```
https://enhanced-geospatial-repo.onrender.com/api/admin/emergency-fix-columns/
```

### 2. Then Focus on Real Data Ingestion

Your architecture is solid. Now you need:
- Data ingestion pipeline (Sentinel Hub API, AWS Open Data, etc.)
- Metadata extraction (already have this!)
- File organization on filesystem
- Catalog population

### 3. PostGIS Can Wait

Enable PostGIS when you're ready to:
- Do complex spatial queries
- Need spatial indexing performance
- Want to use ST_* functions

But your architecture is correct **with or without PostGIS**.

---

## 💡 Key Insight

**You asked about "another database for blobs" - the answer is NO!**

- PostgreSQL = Catalog (what you have)
- Filesystem = Storage (what you need)
- PostGIS = Spatial index (nice-to-have)
- S3/MinIO = Cloud storage (future)

**Never store satellite imagery in PostgreSQL!**

---

## 🎉 Summary

**What you have:**
- ✅ Correct architecture (file paths in DB)
- ✅ Proper models (metadata + paths)
- ✅ Quota system (download tracking)
- ✅ Approval system (access control)

**What you're missing:**
- Actual satellite data ingestion
- PostGIS enabled (optional but recommended)
- Processing pipeline integration

**What you DON'T need:**
- Another database for blobs
- Raster storage in PostgreSQL
- Complete rewrite of architecture

---

**Your architecture is enterprise-ready! Focus on:**
1. Fix the UserProfile columns (deployment in progress)
2. Ingest real satellite data
3. Enable PostGIS when ready
4. Build processing pipeline

You're on the right track! 🚀
