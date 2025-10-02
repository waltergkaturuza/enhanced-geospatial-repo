# AOI Upload - Supported File Formats

The AOI (Area of Interest) upload system now supports multiple compression formats to accommodate different user preferences and workflow requirements.

## Supported Formats

### Direct Geometry Files
- **GeoJSON** (`.geojson`, `.json`)
  - Standard format for geographic features
  - Directly supported without compression
  - Supports FeatureCollection, Feature, and direct geometry objects

### Compressed Archives
All compression formats can contain:
- Shapefiles (`.shp`, `.dbf`, `.prj`, `.shx`, `.cpg`)
- GeoJSON files (`.geojson`, `.json`)

#### Standard Compression Formats
1. **ZIP** (`.zip`)
   - ✅ Universally supported
   - ✅ No additional dependencies required
   - ✅ Recommended format

2. **TAR** (`.tar`)
   - ✅ Built-in Python support
   - ✅ Cross-platform compatible

3. **TAR.GZ** (`.tar.gz`, `.tgz`)
   - ✅ Built-in Python support
   - ✅ Compressed tar format
   - ✅ Good compression ratio

4. **TAR.BZ2** (`.tar.bz2`)
   - ✅ Built-in Python support
   - ✅ Better compression than gzip
   - ✅ Slower compression/decompression

5. **TAR.XZ** (`.tar.xz`)
   - ✅ Built-in Python support
   - ✅ Best compression ratio
   - ✅ Modern LZMA compression

#### Advanced Compression Formats
6. **RAR** (`.rar`)
   - ⚠️ Requires `rarfile` package and `unrar` command
   - ✅ Good compression ratio
   - ✅ Popular on Windows

7. **7-Zip** (`.7z`)
   - ⚠️ Requires `py7zr` package
   - ✅ Excellent compression ratio
   - ✅ Modern compression format

## Installation Requirements

### Basic Support (ZIP, TAR, GZ, BZ2, XZ)
```bash
# No additional packages required - built into Python
```

### Advanced Support (RAR, 7Z)
```bash
# Install optional compression libraries
pip install rarfile py7zr

# For RAR support, also install system dependencies:
# Windows: Install WinRAR or 7-Zip
# Linux: sudo apt-get install unrar
# macOS: brew install unrar
```

## Usage Examples

### Creating Compressed Archives for Upload

#### Using the provided script:
```bash
python create_shapefile_zip.py
```

#### Manual creation:

**ZIP Archive:**
```bash
# Windows
7z a Buhera_District.zip Buhera_District.*

# Linux/macOS
zip Buhera_District.zip Buhera_District.*
```

**TAR.GZ Archive:**
```bash
tar -czf Buhera_District.tar.gz Buhera_District.*
```

**7Z Archive:**
```bash
7z a Buhera_District.7z Buhera_District.*
```

### Frontend Upload
1. Navigate to the AOI upload interface
2. Select or drag & drop your compressed archive
3. Click "Process Files"
4. The system will automatically detect the format and extract contents

## File Structure Requirements

### For Shapefiles
Your compressed archive must contain all required shapefile components:
```
archive.zip/
├── shapefile.shp    # Geometry data (required)
├── shapefile.dbf    # Attribute data (required)
├── shapefile.prj    # Projection info (required)
├── shapefile.shx    # Shape index (required)
└── shapefile.cpg    # Character encoding (optional)
```

### For GeoJSON
```
archive.zip/
├── area1.geojson
├── area2.geojson
└── metadata.json    # Optional
```

## Error Handling

The system provides detailed error messages for:
- Unsupported file formats
- Missing compression libraries
- Corrupted archives
- Invalid geometry data
- Missing required shapefile components

## Performance Considerations

### Compression Ratio Comparison (typical shapefile):
1. **7Z**: 85-90% compression
2. **TAR.XZ**: 80-85% compression
3. **TAR.BZ2**: 75-80% compression
4. **TAR.GZ**: 70-75% compression
5. **ZIP**: 65-70% compression
6. **TAR**: No compression

### Processing Speed:
1. **ZIP**: Fastest (recommended for large files)
2. **TAR**: Fast
3. **TAR.GZ**: Medium
4. **TAR.BZ2**: Slower
5. **7Z**: Slowest but best compression
6. **RAR**: Medium

## Recommendations

### For Most Users:
- Use **ZIP format** - universally supported, good balance of compression and speed

### For Large Files:
- Use **7Z format** - best compression ratio
- Use **TAR.XZ** - good compression with built-in support

### For Automated Workflows:
- Use **TAR.GZ** - good compression, widely supported, command-line friendly

### For Windows Users:
- **ZIP** or **RAR** formats are most familiar

## Troubleshooting

### "Unsupported file format" Error
- Check file extension matches the actual format
- Ensure the file isn't corrupted
- Verify optional libraries are installed for RAR/7Z

### "No valid geometries found" Error
- Check that your archive contains `.shp` files or `.geojson` files
- Verify shapefile has all required components
- Ensure GeoJSON is valid

### "RAR/7Z support not available" Error
```bash
# Install missing dependencies
pip install rarfile py7zr

# For RAR, also install system tools
# See installation requirements above
```

## API Response

Successful upload returns:
```json
{
  "success": true,
  "created_aois": [
    {
      "id": 123,
      "name": "Uploaded Feature",
      "geometry": {...},
      "properties": {...}
    }
  ],
  "count": 1
}
```
