// System Management Constants

import { Upload, Settings, Database, Info } from 'lucide-react';
import type { SystemTab } from '../types/system';

export const SYSTEM_TABS = [
  { id: 'upload' as SystemTab, label: 'File Upload', icon: Upload },
  { id: 'metadata' as SystemTab, label: 'Metadata Parser', icon: Settings },
  { id: 'processing' as SystemTab, label: 'Processing Queue', icon: Database },
  { id: 'database' as SystemTab, label: 'Database Status', icon: Info }
];

export const SUPPORTED_FILE_TYPES = [
  'image/tiff',
  'image/geotiff', 
  'application/zip',
  'application/json',
  'text/plain'
];

export const FILE_TYPE_DESCRIPTIONS = {
  'image/tiff': 'GeoTIFF imagery files',
  'image/geotiff': 'GeoTIFF imagery files', 
  'application/zip': 'Shapefile archives',
  'application/json': 'GeoJSON boundary files',
  'text/plain': 'Metadata and text files'
};

export const SAMPLE_METADATA = `GROUP = L1_METADATA_FILE
  GROUP = METADATA_FILE_INFO
    ORIGIN = "Image courtesy of the U.S. Geological Survey"
    REQUEST_ID = "0501906082000_00011"
    LANDSAT_SCENE_ID = "LC81690732024213LGN00"
    FILE_DATE = 2024-08-01T10:30:45Z
    STATION_ID = "LGN"
    PROCESSING_SOFTWARE_VERSION = "LPGS_2.12.0"
  END_GROUP = METADATA_FILE_INFO
  
  GROUP = PRODUCT_METADATA
    DATA_TYPE = "L1TP"
    COLLECTION_NUMBER = 02
    COLLECTION_CATEGORY = "T1"
    ELEVATION_SOURCE = "SRTM"
    OUTPUT_FORMAT = "GEOTIFF"
    SPACECRAFT_ID = "LANDSAT_8"
    SENSOR_ID = "OLI_TIRS"
    DATE_ACQUIRED = 2024-08-01
    SCENE_CENTER_TIME = "10:30:45.123456Z"
    WRS_PATH = 169
    WRS_ROW = 073
    TARGET_WRS_PATH = 169
    TARGET_WRS_ROW = 073
    CLOUD_COVER = 15.23
    CLOUD_COVER_LAND = 12.45
    IMAGE_QUALITY_OLI = 9
    IMAGE_QUALITY_TIRS = 9
  END_GROUP = PRODUCT_METADATA
  
  GROUP = IMAGE_ATTRIBUTES
    EARTH_SUN_DISTANCE = 1.0158326
    SUN_AZIMUTH = 32.12345678
    SUN_ELEVATION = 45.67891234
    GROUND_CONTROL_POINTS_VERSION = 4
    GROUND_CONTROL_POINTS_MODEL = 544
    GEOMETRIC_RMSE_MODEL = 5.123
    GEOMETRIC_RMSE_MODEL_Y = 3.456
    GEOMETRIC_RMSE_MODEL_X = 3.789
  END_GROUP = IMAGE_ATTRIBUTES
  
  GROUP = PROJECTION_PARAMETERS
    MAP_PROJECTION = "UTM"
    DATUM = "WGS84"
    ELLIPSOID = "WGS84"
    UTM_ZONE = 36
    GRID_CELL_SIZE_PANCHROMATIC = 15.00
    GRID_CELL_SIZE_REFLECTIVE = 30.00
    GRID_CELL_SIZE_THERMAL = 100.00
    ORIENTATION = "NORTH_UP"
    RESAMPLING_OPTION = "CUBIC_CONVOLUTION"
  END_GROUP = PROJECTION_PARAMETERS
END_GROUP = L1_METADATA_FILE`;

export const METADATA_FIELD_GROUPS = {
  FILE_INFO: 'File Information',
  PRODUCT: 'Product Metadata', 
  IMAGE: 'Image Attributes',
  PROJECTION: 'Projection Parameters',
  QUALITY: 'Quality Assessment'
};

export const PROCESSING_JOB_TYPES = {
  metadata: 'Metadata Processing',
  upload: 'File Upload',
  processing: 'Image Processing', 
  database: 'Database Operations'
};

export const STATUS_COLORS = {
  active: 'text-green-600 bg-green-100',
  inactive: 'text-gray-600 bg-gray-100',
  maintenance: 'text-yellow-600 bg-yellow-100',
  error: 'text-red-600 bg-red-100',
  pending: 'text-blue-600 bg-blue-100',
  running: 'text-orange-600 bg-orange-100',
  completed: 'text-green-600 bg-green-100'
};

// Satellite Data Management Constants
export const SATELLITE_PLATFORMS = {
  LANDSAT: {
    name: 'Landsat Program',
    provider: 'USGS/NASA',
    satellites: ['landsat5', 'landsat7', 'landsat8', 'landsat9'],
    description: 'Long-running Earth observation program since 1972'
  },
  SENTINEL: {
    name: 'Sentinel Program', 
    provider: 'ESA Copernicus',
    satellites: ['sentinel2', 'sentinel1'],
    description: 'European Space Agency Earth observation constellation'
  },
  GAOFEN: {
    name: 'GaoFen Series',
    provider: 'China National Space Administration',
    satellites: ['gaofen1', 'gaofen2', 'gf3_sar'],
    description: 'Chinese high-resolution Earth observation satellites'
  }
};

export const SATELLITE_SENSORS = {
  // Landsat Sensors
  TM: {
    name: 'Thematic Mapper',
    satellite: 'Landsat 5',
    bands: ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'Thermal', 'SWIR2'],
    resolution: '30m (120m thermal)',
    period: '1984-2012'
  },
  ETM_PLUS: {
    name: 'Enhanced Thematic Mapper Plus',
    satellite: 'Landsat 7',
    bands: ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'Thermal', 'SWIR2', 'Pan'],
    resolution: '30m (60m thermal, 15m pan)',
    period: '1999-present'
  },
  OLI_TIRS: {
    name: 'Operational Land Imager / Thermal Infrared Sensor',
    satellite: 'Landsat 8',
    bands: ['Coastal', 'Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2', 'Pan', 'Cirrus', 'Thermal1', 'Thermal2'],
    resolution: '30m (100m thermal, 15m pan)',
    period: '2013-present'
  },
  OLI2_TIRS2: {
    name: 'Operational Land Imager 2 / Thermal Infrared Sensor 2', 
    satellite: 'Landsat 9',
    bands: ['Coastal', 'Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2', 'Pan', 'Cirrus', 'Thermal1', 'Thermal2'],
    resolution: '30m (100m thermal, 15m pan)',
    period: '2021-present'
  }
};

export const DATA_PROCESSING_LEVELS = {
  L1TP: {
    name: 'Level 1 Terrain Precision',
    description: 'Radiometrically calibrated and orthorectified',
    accuracy: '±12m geometric accuracy',
    applications: ['Change detection', 'Time series analysis', 'Mapping']
  },
  L2SP: {
    name: 'Level 2 Surface Reflectance',
    description: 'Atmospherically corrected surface reflectance',
    accuracy: '±0.05 reflectance units',
    applications: ['Vegetation analysis', 'Land cover classification', 'Environmental monitoring']
  },
  L2ST: {
    name: 'Level 2 Surface Temperature',
    description: 'Land surface temperature product',
    accuracy: '±2K under clear conditions',
    applications: ['Climate studies', 'Urban heat mapping', 'Agriculture']
  }
};

export const SUPPORTED_SATELLITE_FORMATS = {
  GEOTIFF: {
    extension: '.tif',
    description: 'Georeferenced Tagged Image File Format',
    size: '500MB - 2GB per scene',
    compression: 'LZW, JPEG, or uncompressed'
  },
  HDF: {
    extension: '.hdf',
    description: 'Hierarchical Data Format',
    size: '400MB - 1.5GB per scene',
    compression: 'Built-in compression algorithms'
  },
  NETCDF: {
    extension: '.nc',
    description: 'Network Common Data Form',
    size: '600MB - 2.5GB per scene',
    compression: 'Climate and Forecast compliant'
  },
  SAFE: {
    extension: '.SAFE',
    description: 'Sentinel Application Platform Exchange',
    size: '1GB - 8GB per scene',
    compression: 'ZIP archive with XML metadata'
  }
};

export const METADATA_PARSERS = {
  LANDSAT_MTL: {
    name: 'Landsat Metadata File',
    extension: '_MTL.txt',
    format: 'Key-value pairs',
    satellites: ['Landsat 5', 'Landsat 7', 'Landsat 8', 'Landsat 9']
  },
  SENTINEL_XML: {
    name: 'Sentinel Metadata',
    extension: '.xml',
    format: 'XML structure',
    satellites: ['Sentinel-1', 'Sentinel-2']
  },
  GAOFEN_XML: {
    name: 'GaoFen Metadata',
    extension: '.xml',
    format: 'XML structure',
    satellites: ['GaoFen-1', 'GaoFen-2', 'GaoFen-3']
  }
};
