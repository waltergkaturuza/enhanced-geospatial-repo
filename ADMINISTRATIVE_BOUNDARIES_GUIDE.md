# Zimbabwe Administrative Boundaries Management System

This system enables robust upload, storage, and management of Zimbabwe administrative boundaries from shapefile ZIP archives, with a user-friendly interface for visualizing, comparing, and selecting boundaries.

## Features

### Backend Features
- **Multiple Administrative Levels**: Support for country, province, district, and ward boundaries
- **Hierarchical Organization**: Automatic parent-child relationships between administrative levels
- **Attribute Preservation**: Maintains Name_0, Name_1, Name_2, Name_3 attributes from shapefiles
- **Flexible Upload**: Supports ZIP, TAR, and compressed archives containing shapefiles
- **API Access**: RESTful API for programmatic access to boundary data
- **Search Functionality**: Search boundaries by name across all levels

### Frontend Features
- **Layer Management Panel**: Dedicated boundary layer management interface
- **Hierarchical Navigation**: Expandable tree view of administrative levels
- **Boundary Selection**: Multi-select boundaries for analysis and comparison
- **Visual Controls**: Show/hide boundaries, zoom to specific regions
- **Upload Interface**: Drag-and-drop upload with metadata entry
- **Search Integration**: Real-time search across all boundary names

## File Structure

The uploaded shapefiles should follow this naming convention:
- `Zim_admin0.zip` - Zimbabwe Country Boundary
- `Zim_admin1.zip` - Zimbabwe Provincial Boundaries  
- `Zim_admin2.zip` - Zimbabwe District Boundaries

### Expected Shapefile Attributes
- **Name_0**: Country name (e.g., "Zimbabwe")
- **Name_1**: Province/State name (e.g., "Harare Province")
- **Name_2**: District/County name (e.g., "Harare Metropolitan")
- **Name_3**: Ward/Municipality name (optional)

## API Endpoints

### Boundary Sets
- `GET /api/boundary-sets/` - List all boundary sets
- `POST /api/boundary-sets/upload_boundaries/` - Upload new boundary archive
- `GET /api/boundary-sets/{id}/` - Get specific boundary set details
- `GET /api/boundary-sets/{id}/hierarchy/` - Get hierarchical structure
- `GET /api/boundary-sets/{id}/boundaries/` - Get boundaries in set (with filtering)

### Individual Boundaries
- `GET /api/boundaries/` - List boundaries (with filtering)
- `GET /api/boundaries/search/?q={query}` - Search boundaries by name
- `GET /api/boundaries/{id}/` - Get specific boundary details
- `GET /api/boundaries/{id}/children/` - Get child boundaries
- `GET /api/boundaries/{id}/aois/` - Get AOIs intersecting boundary

## Usage Instructions

### 1. Backend Setup
```bash
cd geospatial_repo
python manage.py makemigrations imagery
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Upload Boundary Data

#### Via Web Interface
1. Open http://localhost:5174
2. Click on the "Boundaries" tab in the sidebar
3. Click the upload button (📤)
4. Select your ZIP file containing shapefiles
5. Fill in metadata (name, description, source, year)
6. Upload and wait for processing

#### Via API
```bash
curl -X POST http://localhost:8000/api/boundary-sets/upload_boundaries/ \
  -F "file=@Zim_admin0.zip" \
  -F "name=Zimbabwe Country Boundaries" \
  -F "description=National boundary of Zimbabwe" \
  -F "source=Zimbabwe Survey Department" \
  -F "data_year=2023"
```

### 4. Browse and Select Boundaries

1. **Layer Management**: Use the Boundaries panel to browse available boundary sets
2. **Hierarchy Navigation**: Expand country → province → district levels
3. **Selection**: Click on boundaries to select them for analysis
4. **Visibility**: Use eye icons to show/hide boundaries on the map
5. **Zoom**: Use the zoom button to focus on specific boundaries

### 5. Search Functionality

- Use the search box in the Boundaries panel to find specific boundaries
- Search works across all administrative levels and names
- Results show the full administrative path (e.g., "Zimbabwe > Harare Province > Harare Metropolitan")

## Data Organization

### Database Structure
```
AdministrativeBoundarySet
├── name: "Zimbabwe Administrative Boundaries"
├── description: "Complete administrative hierarchy"
├── total_boundaries: 9
└── boundaries:
    ├── Country: Zimbabwe
    ├── Provinces: Harare, Bulawayo, Manicaland, etc.
    └── Districts: Harare Metropolitan, Chitungwiza, etc.
```

### File Storage
```
data/
└── administrative_boundaries/
    ├── uploaded_archives/
    ├── processed_shapefiles/
    └── metadata/
```

## Supported File Formats

### Input Formats
- ZIP archives (.zip)
- TAR archives (.tar, .tar.gz, .tgz)
- Shapefiles within archives (.shp, .shx, .dbf, .prj)

### Output Formats
- GeoJSON (via API)
- WKT (Well-Known Text)
- Leaflet-compatible geometries

## Example Use Cases

### 1. Province Comparison
- Select multiple provinces
- Compare their areas and populations
- Analyze spatial relationships

### 2. District Analysis
- Select a province to see its districts
- Choose specific districts for detailed study
- Export district boundaries for further analysis

### 3. Hierarchical Navigation
- Start at country level
- Drill down to provinces
- Explore individual districts within provinces

### 4. Search and Filter
- Search for "Harare" to find all Harare-related boundaries
- Filter by administrative level (country, province, district)
- Find boundaries within specific areas

## Integration with AOI System

The boundary system integrates seamlessly with the existing AOI (Area of Interest) system:

- **Boundary as AOI**: Convert selected boundaries to AOIs for analysis
- **AOI-Boundary Intersection**: Find which boundaries overlap with existing AOIs
- **Combined Analysis**: Use both custom AOIs and administrative boundaries together

## Technical Details

### Backend Stack
- Django + PostGIS for spatial database
- GeoPandas for shapefile processing
- GDAL/OGR for spatial data conversion
- REST API with Django REST Framework

### Frontend Stack
- React + TypeScript
- Leaflet for map visualization
- TanStack Query for data management
- Tailwind CSS for styling

### Spatial Processing
- Automatic coordinate system conversion to WGS84
- Geometry validation and cleanup
- Hierarchical relationship building
- Area and perimeter calculations

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check that ZIP contains valid shapefiles with all required files (.shp, .shx, .dbf)
2. **Missing Attributes**: Ensure shapefiles have Name_0, Name_1, Name_2 columns
3. **Geometry Errors**: Invalid geometries will be logged and skipped
4. **Large Files**: Files over 500MB may timeout - consider splitting into smaller archives

### Error Messages
- "No shapefiles found": ZIP doesn't contain .shp files
- "Invalid geometry": Shapefile contains malformed polygons
- "Missing required attributes": Name_X columns not found
- "Coordinate system error": Projection not supported

## Future Enhancements

- **Temporal Boundaries**: Support for historical boundary changes
- **Statistical Integration**: Population and economic data overlay
- **Export Functions**: Download selected boundaries in various formats
- **Advanced Analytics**: Spatial statistics and boundary analysis tools
- **Collaboration**: Share boundary selections between users

## Support

For technical support or feature requests, please refer to the project documentation or contact the development team.
