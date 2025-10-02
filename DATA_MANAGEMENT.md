# Data Management Configuration for Geospatial Repository

## Directory Structure

The data folder is organized as follows:

```
data/
├── uploads/                    # Temporary upload area
├── raw/                        # Raw, unprocessed data
├── processed/                  # Processed data ready for analysis
├── cache/                      # Temporary cache files
├── exports/                    # Exported/downloaded data
├── temp/                       # Temporary working files
├── metadata/                   # Extracted metadata files
├── administrative_boundaries/  # Boundary data (shapefiles, etc.)
├── hpc_jobs/                  # HPC processing job data
└── imagery/                   # Satellite and UAV imagery organized by provider
    ├── landsat/               # Landsat 5, 7, 8, 9 data
    ├── sentinel/              # Sentinel-1, 2, 3 data
    ├── gaofen/                # GaoFen series data
    ├── spot/                  # SPOT satellite data
    ├── worldview/             # WorldView series data
    ├── quickbird/             # QuickBird data
    ├── ikonos/                # IKONOS data
    ├── uav/                   # UAV/Drone imagery
    ├── modis/                 # MODIS data
    ├── viirs/                 # VIIRS data
    └── unknown/               # Unidentified provider data
```

## File Organization Rules

### Automatic Provider Detection
Files are automatically organized by provider based on filename patterns:

- **Landsat**: LC08, LC09, LE07, LT05, landsat
- **Sentinel**: S1A, S1B, S2A, S2B, sentinel
- **GaoFen**: GF1, GF2, GF3, gaofen
- **SPOT**: SPOT6, SPOT7, spot
- **WorldView**: WV01, WV02, WV03, WV04, worldview
- **QuickBird**: QB02, quickbird
- **IKONOS**: IK01, ikonos
- **UAV/Drone**: dji, drone, uav, phantom, mavic
- **MODIS**: MOD, MYD, modis
- **VIIRS**: VNP, VJ1, viirs

### Supported File Formats

- **Landsat**: .tif, .tiff, .tar.gz, .zip
- **Sentinel**: .zip, .SAFE, .jp2, .tiff
- **GaoFen**: .tiff, .img, .zip
- **SPOT**: .tiff, .jp2, .zip
- **WorldView**: .tiff, .ntf, .zip
- **QuickBird**: .tiff, .ntf
- **IKONOS**: .tiff, .ntf
- **UAV/Drone**: .jpg, .jpeg, .tiff, .raw, .dng
- **MODIS**: .hdf, .tiff, .nc
- **VIIRS**: .h5, .nc, .tiff

## Data Management Commands

### Setup Directory Structure
```bash
python manage_data.py --setup
```

### Organize Uploaded Files
```bash
python manage_data.py --organize
```

### Generate Data Inventory
```bash
python manage_data.py --inventory
```

### Clean Temporary Files
```bash
python manage_data.py --cleanup
```

### Validate Data Integrity
```bash
python manage_data.py --validate
```

### Show Data Statistics
```bash
python manage_data.py --stats
```

### Full Data Management Workflow
```bash
python manage_data.py --setup --organize --inventory --cleanup --validate --stats
```

## Upload API Endpoints

### Upload Satellite Imagery
- **POST** `/api/upload/satellite-imagery/`
- Accepts multiple files with automatic provider detection
- Maximum file size: 5GB
- Returns detailed upload results with metadata extraction

### Get Upload Status
- **GET** `/api/upload/status/`
- Returns storage statistics and provider information

### Get Supported Formats
- **GET** `/api/upload/supported-formats/`
- Returns supported providers and file formats

## Best Practices

1. **File Naming**: Use descriptive filenames that include date and location when possible
2. **Metadata**: Always include metadata files when uploading satellite data
3. **Organization**: Let the system auto-organize files by provider
4. **Cleanup**: Regularly clean temporary files to save storage space
5. **Validation**: Run data integrity checks after bulk uploads
6. **Backup**: Keep backups of processed data in the exports folder

## Storage Limits

- Maximum file size: 5GB per file
- Temporary files are cleaned after 24 hours
- Cache files should not exceed 10GB total
- Monitor disk usage with the stats command

## Troubleshooting

### Common Issues

1. **File not detected correctly**: Check filename follows provider naming conventions
2. **Upload fails**: Verify file size is under 5GB limit
3. **Unsupported format**: Check file extension against supported formats list
4. **Permission errors**: Ensure write permissions on data directory

### Getting Help

- Run `python manage_data.py --help` for command options
- Check Django logs for detailed error messages
- Use `--validate` flag to check for data issues