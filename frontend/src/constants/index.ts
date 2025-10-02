import type { CoordinateSystem, ZimbabweDataset, MapViewState, DatasetMetadata } from '../types';

export const ZIMBABWE_PROVINCES = [
  'All Zimbabwe',
  'Harare',
  'Bulawayo',
  'Manicaland',
  'Mashonaland Central',
  'Mashonaland East', 
  'Mashonaland West',
  'Matabeleland North',
  'Matabeleland South',
  'Midlands',
  'Masvingo'
];

export const ZIMBABWE_DISTRICTS = {
  'All Zimbabwe': [],
  'Harare': ['Harare Central', 'Harare North', 'Harare South', 'Harare East', 'Harare West', 'Epworth', 'Chitungwiza'],
  'Bulawayo': ['Bulawayo Central', 'Bulawayo North', 'Bulawayo South', 'Bulawayo East', 'Bulawayo West'],
  'Manicaland': ['Mutare', 'Rusape', 'Chipinge', 'Makoni', 'Nyanga', 'Buhera', 'Chimanimani'],
  'Mashonaland Central': ['Bindura', 'Shamva', 'Mount Darwin', 'Muzarabani', 'Centenary', 'Rushinga'],
  'Mashonaland East': ['Marondera', 'Murehwa', 'Mutoko', 'Seke', 'Goromonzi', 'Wedza', 'Uzumba Maramba Pfungwe'],
  'Mashonaland West': ['Chinhoyi', 'Kariba', 'Makonde', 'Zvimba', 'Hurungwe', 'Mhondoro-Ngezi', 'Sanyati'],
  'Matabeleland North': ['Hwange', 'Binga', 'Lupane', 'Nkayi', 'Tsholotsho', 'Umguza'],
  'Matabeleland South': ['Gwanda', 'Beitbridge', 'Bulilima', 'Mangwe', 'Matobo', 'Umzingwane', 'Insiza'],
  'Midlands': ['Gweru', 'Kwekwe', 'Redcliff', 'Shurugwi', 'Chirumhanzu', 'Gokwe North', 'Gokwe South', 'Zvishavane'],
  'Masvingo': ['Masvingo', 'Chiredzi', 'Zaka', 'Bikita', 'Gutu', 'Masvingo Rural', 'Chivi']
} as const;

export const ZIMBABWE_COORDINATES: Record<string, MapViewState> = {
  'All Zimbabwe': { center: [-19.0154, 29.1549], zoom: 6 },
  'Harare': { center: [-17.8252, 31.0335], zoom: 10 },
  'Bulawayo': { center: [-20.1594, 28.5833], zoom: 10 },
  'Manicaland': { center: [-18.9707, 32.6731], zoom: 8 },
  'Mashonaland Central': { center: [-16.7500, 31.1167], zoom: 8 },
  'Mashonaland East': { center: [-18.1833, 31.9167], zoom: 8 },
  'Mashonaland West': { center: [-17.3667, 30.1833], zoom: 8 },
  'Matabeleland North': { center: [-18.1500, 27.0333], zoom: 8 },
  'Matabeleland South': { center: [-21.0167, 29.0167], zoom: 8 },
  'Midlands': { center: [-19.4500, 29.8167], zoom: 8 },
  'Masvingo': { center: [-20.0667, 30.8333], zoom: 8 }
};

export const COORDINATE_SYSTEMS: CoordinateSystem[] = [
  {
    id: 'wgs84',
    name: 'WGS 84 (Geographic)',
    code: 'EPSG:4326',
    type: 'geographic',
    description: 'World Geodetic System 1984 - Global standard for GPS and satellite data'
  },
  {
    id: 'utm35s',
    name: 'UTM Zone 35S',
    code: 'EPSG:32735',
    type: 'utm',
    zone: '35S',
    description: 'Universal Transverse Mercator Zone 35 South - Western Zimbabwe'
  },
  {
    id: 'utm36s',
    name: 'UTM Zone 36S',
    code: 'EPSG:32736',
    type: 'utm',
    zone: '36S',
    description: 'Universal Transverse Mercator Zone 36 South - Eastern Zimbabwe'
  }
];

export const ZIMBABWE_DATASETS: ZimbabweDataset[] = [
  // Priority Zimbabwe Satellites
  {
    id: 'zimsat2',
    name: 'ZimSat-2',
    description: 'Zimbabwe microsatellite for agricultural and environmental monitoring',
    provider: 'Zimbabwe Space Agency',
    resolution: '4m',
    bands: ['Blue', 'Green', 'Red', 'NIR'],
    temporalCoverage: '2023-present',
    spatialCoverage: 'Zimbabwe Priority Areas',
    dataProducts: ['NDVI', 'NDWI', 'EVI', 'LAI', 'Agriculture Index', 'Land Cover'],
    formats: ['GeoTIFF', 'NetCDF', 'HDF5'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'sentinel2_msi',
    name: 'Sentinel-2 MSI',
    description: 'European high-resolution multispectral imagery',
    provider: 'ESA Copernicus',
    resolution: '10-60m',
    bands: ['13 Spectral Bands', 'Visible', 'NIR', 'SWIR'],
    temporalCoverage: '2015-present',
    spatialCoverage: 'Global',
    dataProducts: ['NDVI', 'NDWI', 'LAI', 'fAPAR', 'Land Cover', 'Agriculture Index'],
    formats: ['SAFE', 'GeoTIFF', 'JP2'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'landsat9',
    name: 'Landsat 9 OLI-2/TIRS-2',
    description: 'Latest generation Landsat satellite with enhanced capabilities',
    provider: 'USGS/NASA',
    resolution: '15-100m',
    bands: ['Coastal', 'Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2', 'Thermal'],
    temporalCoverage: '2021-present',
    spatialCoverage: 'Global',
    dataProducts: ['NDVI', 'NDWI', 'LST', 'Surface Reflectance', 'Burned Area', 'Snow Cover'],
    formats: ['GeoTIFF', 'HDF', 'NetCDF'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'landsat8',
    name: 'Landsat 8 OLI/TIRS',
    description: 'Operational Land Imager and Thermal Infrared Sensor',
    provider: 'USGS/NASA',
    resolution: '15-100m',
    bands: ['Coastal', 'Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'SWIR2', 'Pan', 'Cirrus', 'Thermal1', 'Thermal2'],
    temporalCoverage: '2013-present',
    spatialCoverage: 'Global',
    dataProducts: ['NDVI', 'NDWI', 'LST', 'Surface Reflectance', 'Burned Area', 'Snow Cover', 'Albedo'],
    formats: ['GeoTIFF', 'HDF', 'NetCDF'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'landsat7',
    name: 'Landsat 7 ETM+',
    description: 'Enhanced Thematic Mapper Plus with systematic global coverage',
    provider: 'USGS/NASA',
    resolution: '15-60m',
    bands: ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'Thermal', 'SWIR2', 'Pan'],
    temporalCoverage: '1999-present',
    spatialCoverage: 'Global',
    dataProducts: ['NDVI', 'NDWI', 'LST', 'Surface Reflectance', 'Land Cover', 'Change Detection'],
    formats: ['GeoTIFF', 'HDF', 'FAST'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'landsat5',
    name: 'Landsat 5 TM',
    description: 'Thematic Mapper - longest operating Earth observation satellite',
    provider: 'USGS/NASA',
    resolution: '30-120m',
    bands: ['Blue', 'Green', 'Red', 'NIR', 'SWIR1', 'Thermal', 'SWIR2'],
    temporalCoverage: '1984-2012',
    spatialCoverage: 'Global',
    dataProducts: ['NDVI', 'NDWI', 'LST', 'Surface Reflectance', 'Historical Analysis', 'Change Detection'],
    formats: ['GeoTIFF', 'HDF', 'FAST'],
    category: 'Optical',
    enabled: true
  },

  // Chinese Satellites
  {
    id: 'gaofen1',
    name: 'GaoFen-1 (高分一号)',
    description: 'Chinese high-resolution Earth observation satellite',
    provider: 'China National Space Administration',
    resolution: '2-16m',
    bands: ['Blue', 'Green', 'Red', 'NIR'],
    temporalCoverage: '2013-present',
    spatialCoverage: 'Global',
    dataProducts: ['Land Cover', 'Urban Planning', 'Agriculture Monitoring', 'NDVI', 'NDWI'],
    formats: ['GeoTIFF', 'IMG', 'HDF'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'gaofen2',
    name: 'GaoFen-2 (高分二号)',
    description: 'Chinese very high-resolution optical satellite',
    provider: 'China National Space Administration',
    resolution: '0.8-3.2m',
    bands: ['Blue', 'Green', 'Red', 'NIR'],
    temporalCoverage: '2014-present',
    spatialCoverage: 'Global',
    dataProducts: ['Urban Mapping', 'Infrastructure', 'Detailed Land Cover', 'Change Detection'],
    formats: ['GeoTIFF', 'IMG', 'HDF'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'gf3_sar',
    name: 'GaoFen-3 SAR (高分三号)',
    description: 'Chinese C-band synthetic aperture radar satellite',
    provider: 'China National Space Administration',
    resolution: '1-500m',
    bands: ['HH', 'VV', 'HV', 'VH'],
    temporalCoverage: '2016-present',
    spatialCoverage: 'Global',
    dataProducts: ['Flood Mapping', 'Ship Detection', 'Oil Spill', 'Soil Moisture', 'Surface Roughness'],
    formats: ['GeoTIFF', 'Complex', 'SLC'],
    category: 'Radar',
    enabled: true
  },

  // Japanese Satellites
  {
    id: 'alos2_palsar',
    name: 'ALOS-2 PALSAR-2',
    description: 'Japanese L-band synthetic aperture radar',
    provider: 'JAXA',
    resolution: '1-100m',
    bands: ['HH', 'HV', 'VV', 'VH'],
    temporalCoverage: '2014-present',
    spatialCoverage: 'Global',
    dataProducts: ['Forest Monitoring', 'Biomass', 'Deforestation', 'Flood Mapping', 'Subsidence'],
    formats: ['GeoTIFF', 'CEOS', 'HDF5'],
    category: 'Radar',
    enabled: true
  },
  {
    id: 'himawari8',
    name: 'Himawari-8 Geostationary',
    description: 'Japanese geostationary meteorological satellite',
    provider: 'JMA/JAXA',
    resolution: '0.5-2km',
    bands: ['16 Spectral Bands', 'Visible', 'NIR', 'IR'],
    temporalCoverage: '2015-present',
    spatialCoverage: 'Asia-Pacific Region',
    dataProducts: ['Weather', 'Cloud Cover', 'Fire Detection', 'LST', 'Solar Radiation'],
    formats: ['NetCDF', 'HDF5', 'GRIB'],
    category: 'Thermal',
    enabled: true
  },

  // Radar Satellites
  {
    id: 'kondor_e',
    name: 'Kondor-E SAR',
    description: 'Russian S-band synthetic aperture radar',
    provider: 'Roscosmos',
    resolution: '1-3m',
    bands: ['HH', 'VV'],
    temporalCoverage: '2013-present',
    spatialCoverage: 'Global',
    dataProducts: ['High-res SAR', 'Urban Monitoring', 'Infrastructure', 'Emergency Response'],
    formats: ['GeoTIFF', 'Complex'],
    category: 'Radar',
    enabled: true
  },

  // Elevation Data
  {
    id: 'srtm_dem',
    name: 'SRTM Digital Elevation Model',
    description: 'Global elevation model from radar interferometry',
    provider: 'NASA/NGA',
    resolution: '30m',
    bands: ['Elevation'],
    temporalCoverage: '2000',
    spatialCoverage: 'Global',
    dataProducts: ['DTM', 'Slope', 'Aspect', 'Hillshade', 'Watershed Analysis'],
    formats: ['GeoTIFF', 'HGT', 'NetCDF'],
    category: 'Elevation',
    enabled: true
  },
  {
    id: 'lidar_zimbabwe',
    name: 'Airborne LiDAR Zimbabwe',
    description: 'High-resolution elevation and vegetation structure data',
    provider: 'Various Survey Companies',
    resolution: '0.5-2m',
    bands: ['Elevation', 'Intensity', 'RGB'],
    temporalCoverage: '2015-present',
    spatialCoverage: 'Major Cities and Forests',
    dataProducts: ['DTM', 'DSM', 'CHM', 'Building Heights', 'Forest Structure'],
    formats: ['LAS', 'LAZ', 'GeoTIFF', 'ASCII'],
    category: 'Elevation',
    enabled: true
  },

  // Hyperspectral
  {
    id: 'prism_hyperspectral',
    name: 'PRISM Hyperspectral',
    description: 'Precursore IperSpettrale Mission hyperspectral imaging',
    provider: 'ASI (Italian Space Agency)',
    resolution: '5-30m',
    bands: ['200+ Spectral Bands', 'VNIR', 'SWIR'],
    temporalCoverage: '2019-present',
    spatialCoverage: 'Selected Regions',
    dataProducts: ['Mineral Mapping', 'Vegetation Analysis', 'Soil Composition', 'Water Quality'],
    formats: ['ENVI', 'HDF5', 'GeoTIFF'],
    category: 'Hyperspectral',
    enabled: true
  },

  // Environmental and Climate Data
  {
    id: 'modis_fire',
    name: 'MODIS Fire Detection',
    description: 'Global fire detection and burned area mapping',
    provider: 'NASA',
    resolution: '500m-1km',
    bands: ['Thermal', 'Fire Radiative Power'],
    temporalCoverage: '2000-present',
    spatialCoverage: 'Global',
    dataProducts: ['Fire Hotspots', 'Burned Area', 'Fire Weather Index', 'Smoke Detection'],
    formats: ['HDF', 'GeoTIFF', 'NetCDF'],
    category: 'Derived',
    enabled: true
  },
  {
    id: 'era5_climate',
    name: 'ERA5 Climate Reanalysis',
    description: 'Comprehensive atmospheric reanalysis data',
    provider: 'ECMWF',
    resolution: '0.25°',
    bands: ['Temperature', 'Humidity', 'Wind', 'Precipitation'],
    temporalCoverage: '1940-present',
    spatialCoverage: 'Global',
    dataProducts: ['Temperature', 'Humidity', 'Wind Speed/Direction', 'Precipitation', 'Pressure'],
    formats: ['NetCDF', 'GRIB'],
    category: 'Derived',
    enabled: true
  },

  // UAV and Airborne Data Products
  {
    id: 'uav_multispectral',
    name: 'UAV Multispectral Imagery',
    description: 'High-resolution multispectral imagery from unmanned aerial vehicles',
    provider: 'Various UAV Operators',
    resolution: '1-10cm',
    bands: ['Red', 'Green', 'Blue', 'Red Edge', 'NIR'],
    temporalCoverage: '2018-present',
    spatialCoverage: 'Selected Sites in Zimbabwe',
    dataProducts: ['NDVI', 'NDRE', 'GNDVI', 'Plant Count', 'Canopy Cover', 'Crop Health Maps'],
    formats: ['GeoTIFF', 'Orthomosaic', 'Point Cloud', 'DSM'],
    category: 'UAV',
    enabled: true
  },
  {
    id: 'uav_rgb',
    name: 'UAV RGB Photography',
    description: 'Ultra-high resolution RGB imagery from drones',
    provider: 'Commercial UAV Services',
    resolution: '0.5-5cm',
    bands: ['Red', 'Green', 'Blue'],
    temporalCoverage: '2016-present',
    spatialCoverage: 'Urban Areas, Mining Sites, Agriculture',
    dataProducts: ['Orthomosaics', '3D Models', 'Digital Surface Models', 'Volume Calculations'],
    formats: ['JPEG', 'GeoTIFF', 'OBJ', 'PLY', 'LAS'],
    category: 'UAV',
    enabled: true
  },
  {
    id: 'uav_thermal',
    name: 'UAV Thermal Imagery',
    description: 'Thermal infrared imagery from UAV platforms',
    provider: 'Specialized UAV Services',
    resolution: '5-20cm',
    bands: ['Thermal IR (8-14μm)'],
    temporalCoverage: '2019-present',
    spatialCoverage: 'Infrastructure, Agriculture, Wildlife',
    dataProducts: ['Land Surface Temperature', 'Heat Maps', 'Thermal Anomalies', 'Energy Audits'],
    formats: ['TIFF', 'R-JPEG', 'CSV'],
    category: 'Thermal',
    enabled: true
  },
  {
    id: 'uav_lidar',
    name: 'UAV LiDAR',
    description: 'Light Detection and Ranging from UAV platforms',
    provider: 'Survey Companies',
    resolution: '2-10cm',
    bands: ['Elevation', 'Intensity', 'RGB'],
    temporalCoverage: '2020-present',
    spatialCoverage: 'Forests, Mining, Infrastructure',
    dataProducts: ['Digital Terrain Model', 'Canopy Height Model', 'Point Clouds', 'Forest Inventory'],
    formats: ['LAS', 'LAZ', 'PLY', 'GeoTIFF'],
    category: 'Elevation',
    enabled: true
  },

  // Additional Global Satellites
  {
    id: 'worldview3',
    name: 'WorldView-3',
    description: 'Very high resolution commercial satellite imagery',
    provider: 'DigitalGlobe/Maxar',
    resolution: '0.31-3.7m',
    bands: ['Panchromatic', '8 Multispectral', '8 SWIR'],
    temporalCoverage: '2014-present',
    spatialCoverage: 'Global (on-demand)',
    dataProducts: ['Pan-sharpened', 'Stereo Pairs', '3D Models', 'Change Detection'],
    formats: ['GeoTIFF', 'JPEG2000', 'NITF'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'worldview2',
    name: 'WorldView-2',
    description: 'High resolution 8-band commercial satellite',
    provider: 'DigitalGlobe/Maxar',
    resolution: '0.46-1.85m',
    bands: ['Panchromatic', '8 Multispectral including Coastal, Yellow, Red Edge'],
    temporalCoverage: '2009-present',
    spatialCoverage: 'Global (on-demand)',
    dataProducts: ['Enhanced Spectral Analysis', 'Vegetation Mapping', 'Mineral Detection'],
    formats: ['GeoTIFF', 'JPEG2000', 'NITF'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'pleiades',
    name: 'Pléiades 1A/1B',
    description: 'French very high resolution optical satellites',
    provider: 'Airbus Defence and Space',
    resolution: '0.5-2m',
    bands: ['Panchromatic', 'Blue', 'Green', 'Red', 'NIR'],
    temporalCoverage: '2011-present',
    spatialCoverage: 'Global (on-demand)',
    dataProducts: ['Ortho Products', 'Stereo Products', 'Tri-stereo', 'Video'],
    formats: ['DIMAP', 'GeoTIFF', 'JPEG2000'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'spot6_7',
    name: 'SPOT 6/7',
    description: 'High resolution optical Earth observation satellites',
    provider: 'Airbus Defence and Space',
    resolution: '1.5-6m',
    bands: ['Panchromatic', 'Blue', 'Green', 'Red', 'NIR'],
    temporalCoverage: '2012-present',
    spatialCoverage: 'Global',
    dataProducts: ['Ortho Rectified', 'Pansharpened', 'Color Infrared'],
    formats: ['DIMAP', 'GeoTIFF'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'rapideye',
    name: 'RapidEye Constellation',
    description: '5-satellite constellation for agriculture and environmental monitoring',
    provider: 'Planet Labs (formerly RapidEye)',
    resolution: '5m',
    bands: ['Blue', 'Green', 'Red', 'Red Edge', 'NIR'],
    temporalCoverage: '2009-2020',
    spatialCoverage: 'Global',
    dataProducts: ['Red Edge NDVI', 'Agriculture Index', 'Forest Monitoring'],
    formats: ['GeoTIFF', 'NITF'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'planetscope',
    name: 'PlanetScope',
    description: 'Daily global imagery from Planet Labs constellation',
    provider: 'Planet Labs',
    resolution: '3-4m',
    bands: ['Blue', 'Green', 'Red', 'NIR'],
    temporalCoverage: '2016-present',
    spatialCoverage: 'Global Daily',
    dataProducts: ['Daily Mosaics', 'Change Detection', 'Time Series Analysis'],
    formats: ['GeoTIFF', 'COG'],
    category: 'Optical',
    enabled: true
  },

  // Indian Satellites
  {
    id: 'cartosat2',
    name: 'Cartosat-2 Series',
    description: 'Indian high resolution Earth observation satellites',
    provider: 'ISRO',
    resolution: '0.65-2.5m',
    bands: ['Panchromatic', 'Multispectral'],
    temporalCoverage: '2007-present',
    spatialCoverage: 'Global',
    dataProducts: ['DEM Generation', 'Cartographic Applications', 'Urban Planning'],
    formats: ['GeoTIFF', 'DIMAP'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'resourcesat2',
    name: 'ResourceSat-2/2A',
    description: 'Indian Earth observation satellite for natural resource monitoring',
    provider: 'ISRO',
    resolution: '5.8-56m',
    bands: ['LISS-III (4 bands)', 'LISS-IV (3 bands)', 'AWiFS (4 bands)'],
    temporalCoverage: '2011-present',
    spatialCoverage: 'Global',
    dataProducts: ['Agriculture Monitoring', 'Forest Mapping', 'Water Resources'],
    formats: ['GeoTIFF', 'HDF'],
    category: 'Optical',
    enabled: true
  },

  // European Satellites
  {
    id: 'sentinel3_olci',
    name: 'Sentinel-3 OLCI',
    description: 'Ocean and Land Colour Instrument for marine and land monitoring',
    provider: 'ESA Copernicus',
    resolution: '300m',
    bands: ['21 Spectral Bands (400-1020nm)'],
    temporalCoverage: '2016-present',
    spatialCoverage: 'Global',
    dataProducts: ['Chlorophyll-a', 'Water Quality', 'Vegetation Indices', 'Fire Detection'],
    formats: ['NetCDF', 'SAFE'],
    category: 'Optical',
    enabled: true
  },
  {
    id: 'sentinel5p',
    name: 'Sentinel-5P TROPOMI',
    description: 'Atmospheric monitoring satellite for air quality',
    provider: 'ESA Copernicus',
    resolution: '3.5-7km',
    bands: ['UV-VIS-NIR-SWIR (270-2385nm)'],
    temporalCoverage: '2017-present',
    spatialCoverage: 'Global',
    dataProducts: ['NO2', 'O3', 'SO2', 'CO', 'CH4', 'Aerosols'],
    formats: ['NetCDF', 'HDF5'],
    category: 'Atmospheric',
    enabled: true
  }

];

// Comprehensive metadata for formats and products
export const DATASET_METADATA: Record<string, DatasetMetadata> = {
  zimsat2: {
    datasetId: 'zimsat2',
    formats: {
      'GeoTIFF': {
        description: 'Georeferenced Tagged Image File Format - standard for satellite imagery',
        fileSize: '50-200 MB per scene',
        processing: 'Radiometrically and geometrically corrected',
        applications: ['GIS analysis', 'Remote sensing', 'Cartography', 'Web mapping']
      },
      'NetCDF': {
        description: 'Network Common Data Form - for scientific datasets',
        fileSize: '100-500 MB per dataset',
        processing: 'Climate Data Operators (CDO) compatible',
        applications: ['Climate analysis', 'Atmospheric modeling', 'Research']
      },
      'HDF5': {
        description: 'Hierarchical Data Format version 5 - for complex datasets',
        fileSize: '200-1GB per dataset',
        processing: 'Preserves metadata and data structure',
        applications: ['Scientific computing', 'Big data analysis', 'Machine learning']
      }
    },
    products: {
      'NDVI': {
        description: 'Normalized Difference Vegetation Index - vegetation health indicator',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (water/clouds) to +1 (dense vegetation)',
        accuracy: '±0.05 NDVI units',
        applications: ['Agriculture monitoring', 'Forest health', 'Drought assessment']
      },
      'NDWI': {
        description: 'Normalized Difference Water Index - water content indicator',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (dry areas) to +1 (water bodies)',
        accuracy: '±0.03 NDWI units',
        applications: ['Water mapping', 'Irrigation monitoring', 'Flood detection']
      },
      'EVI': {
        description: 'Enhanced Vegetation Index - improved vegetation monitoring',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 to +1 (optimal vegetation ~0.2-0.8)',
        accuracy: '±0.04 EVI units',
        applications: ['Crop monitoring', 'Biomass estimation', 'Phenology studies']
      },
      'LAI': {
        description: 'Leaf Area Index from Zimbabwe microsatellite',
        units: 'm²/m² (dimensionless)',
        range: '0 (bare soil) to 6+ (dense crops)',
        accuracy: '±0.3 LAI units',
        applications: ['Precision agriculture', 'Yield prediction', 'Irrigation planning']
      },
      'Agriculture Index': {
        description: 'Composite index for agricultural productivity assessment',
        units: 'Index value (0-100)',
        range: '0 (no agriculture) to 100 (optimal conditions)',
        accuracy: '±5 index units',
        applications: ['Crop yield prediction', 'Farm management', 'Policy making']
      },
      'Land Cover': {
        description: 'Land cover classification for Zimbabwe',
        units: 'Class labels (1-15)',
        range: 'Cropland, Forest, Grassland, Water, Urban, etc.',
        accuracy: '85-92% overall accuracy',
        applications: ['Land use planning', 'Environmental monitoring', 'Policy support']
      }
    }
  },
  sentinel2_msi: {
    datasetId: 'sentinel2_msi',
    formats: {
      'SAFE': {
        description: 'Standard Archive Format for Europe - native Sentinel format',
        fileSize: '500MB-1.5GB per granule',
        processing: 'L1C (Top-of-atmosphere) or L2A (Bottom-of-atmosphere)',
        applications: ['European standards', 'ESA toolchains', 'Scientific research']
      },
      'GeoTIFF': {
        description: 'Individual bands as separate GeoTIFF files',
        fileSize: '50-300MB per band',
        processing: 'Resampled to common grid',
        applications: ['GIS integration', 'Commercial software', 'Web mapping']
      },
      'JP2': {
        description: 'JPEG 2000 format with georeferencing',
        fileSize: '30-200MB per band',
        processing: 'Lossless compression with metadata',
        applications: ['Web services', 'Mobile applications', 'Bandwidth-limited areas']
      }
    },
    products: {
      'NDVI': {
        description: 'High-resolution vegetation index from Sentinel-2',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 to +1 (healthy vegetation 0.2-0.8)',
        accuracy: '±0.04 NDVI units',
        applications: ['Precision agriculture', 'Forest monitoring', 'Vegetation phenology']
      },
      'NDWI': {
        description: 'Water content and surface water mapping',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 to +1 (water typically >0.3)',
        accuracy: '±0.03 NDWI units',
        applications: ['Water resource monitoring', 'Irrigation management', 'Flood mapping']
      },
      'LAI': {
        description: 'Leaf Area Index - vegetation density measure',
        units: 'm²/m² (dimensionless)',
        range: '0 (bare soil) to 8+ (dense forest)',
        accuracy: '±0.5 LAI units',
        applications: ['Forestry', 'Agriculture modeling', 'Carbon sequestration']
      },
      'fAPAR': {
        description: 'Fraction of Absorbed Photosynthetically Active Radiation',
        units: 'Fraction (0-1)',
        range: '0 (no absorption) to 1 (full absorption)',
        accuracy: '±0.1 absolute units',
        applications: ['Primary productivity', 'Crop monitoring', 'Ecosystem health']
      },
      'Land Cover': {
        description: 'Classification of land surface types',
        units: 'Class labels (1-20)',
        range: 'Water, Urban, Forest, Agriculture, etc.',
        accuracy: '80-95% depending on class',
        applications: ['Urban planning', 'Environmental assessment', 'Policy making']
      },
      'Agriculture Index': {
        description: 'Multi-spectral agricultural productivity index',
        units: 'Index value (0-100)',
        range: '0 (poor conditions) to 100 (optimal conditions)',
        accuracy: '±8 index units',
        applications: ['Crop yield forecasting', 'Agricultural insurance', 'Food security']
      }
    }
  },
  landsat9: {
    datasetId: 'landsat9',
    formats: {
      'GeoTIFF': {
        description: 'Standard format for Landsat data distribution',
        fileSize: '1-2 GB per scene (L1)',
        processing: 'Level 1 or Level 2 surface reflectance',
        applications: ['Time series analysis', 'Change detection', 'Environmental monitoring']
      },
      'HDF': {
        description: 'Hierarchical Data Format for scientific datasets',
        fileSize: '800MB-1.5GB per scene',
        processing: 'Maintains all metadata and quality bands',
        applications: ['Research applications', 'Algorithm development']
      },
      'NetCDF': {
        description: 'Climate and Forecast compliant format',
        fileSize: '1.2-2.5GB per scene',
        processing: 'CF-compliant with THREDDS support',
        applications: ['Climate studies', 'Web services', 'Data visualization']
      }
    },
    products: {
      'NDVI': {
        description: 'Normalized Difference Vegetation Index from Landsat 9',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (water/snow) to +1 (dense vegetation)',
        accuracy: '±0.05 NDVI units',
        applications: ['Vegetation monitoring', 'Agricultural assessment', 'Environmental studies']
      },
      'NDWI': {
        description: 'Normalized Difference Water Index',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (dry areas) to +1 (water bodies)',
        accuracy: '±0.03 NDWI units',
        applications: ['Water mapping', 'Drought monitoring', 'Wetland studies']
      },
      'LST': {
        description: 'Land Surface Temperature from thermal bands',
        units: 'Kelvin (K)',
        range: '220K to 350K (-53°C to 77°C)',
        accuracy: '±2K under clear sky conditions',
        applications: ['Urban heat islands', 'Climate monitoring', 'Agriculture']
      },
      'Surface Reflectance': {
        description: 'Atmospherically corrected surface reflectance',
        units: 'Reflectance (0-1)',
        range: '0 (no reflection) to 1 (perfect reflection)',
        accuracy: '±0.05 reflectance units',
        applications: ['Vegetation analysis', 'Land cover mapping', 'Change detection']
      },
      'Burned Area': {
        description: 'Fire-affected areas using spectral indices',
        units: 'Binary (burned/not burned)',
        range: '0 (not burned) to 1 (burned)',
        accuracy: '85-95% classification accuracy',
        applications: ['Fire management', 'Ecosystem monitoring', 'Carbon cycle']
      },
      'Snow Cover': {
        description: 'Snow and ice coverage mapping',
        units: 'Fractional snow cover (0-1)',
        range: '0 (no snow) to 1 (complete snow cover)',
        accuracy: '±10% snow fraction',
        applications: ['Hydrology', 'Climate studies', 'Water resource planning']
      }
    }
  },
  landsat8: {
    datasetId: 'landsat8',
    formats: {
      'GeoTIFF': {
        description: 'Standard format for Landsat 8 data distribution',
        fileSize: '1-2 GB per scene (L1)',
        processing: 'Level 1 or Level 2 surface reflectance',
        applications: ['Time series analysis', 'Change detection', 'Environmental monitoring']
      },
      'HDF': {
        description: 'Hierarchical Data Format for scientific datasets',
        fileSize: '800MB-1.5GB per scene',
        processing: 'Maintains all metadata and quality bands',
        applications: ['Research applications', 'Algorithm development']
      },
      'NetCDF': {
        description: 'Climate and Forecast compliant format',
        fileSize: '1.2-2.5GB per scene',
        processing: 'CF-compliant with THREDDS support',
        applications: ['Climate studies', 'Web services', 'Data visualization']
      }
    },
    products: {
      'NDVI': {
        description: 'Normalized Difference Vegetation Index from Landsat 8',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (water/snow) to +1 (dense vegetation)',
        accuracy: '±0.05 NDVI units',
        applications: ['Vegetation monitoring', 'Agricultural assessment', 'Environmental studies']
      },
      'NDWI': {
        description: 'Normalized Difference Water Index',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (dry areas) to +1 (water bodies)',
        accuracy: '±0.03 NDWI units',
        applications: ['Water mapping', 'Drought monitoring', 'Wetland studies']
      },
      'LST': {
        description: 'Land Surface Temperature from thermal bands',
        units: 'Kelvin (K)',
        range: '220K to 350K (-53°C to 77°C)',
        accuracy: '±2K under clear sky conditions',
        applications: ['Urban heat islands', 'Climate monitoring', 'Agriculture']
      },
      'Surface Reflectance': {
        description: 'Atmospherically corrected surface reflectance',
        units: 'Reflectance (0-1)',
        range: '0 (no reflection) to 1 (perfect reflection)',
        accuracy: '±0.05 reflectance units',
        applications: ['Vegetation analysis', 'Land cover mapping', 'Change detection']
      },
      'Albedo': {
        description: 'Surface albedo derived from all visible bands',
        units: 'Albedo (0-1)',
        range: '0 (dark surfaces) to 1 (bright surfaces)',
        accuracy: '±0.02 albedo units',
        applications: ['Climate modeling', 'Energy balance', 'Urban studies']
      }
    }
  },
  landsat7: {
    datasetId: 'landsat7',
    formats: {
      'GeoTIFF': {
        description: 'Standard format for Landsat 7 data distribution',
        fileSize: '800MB-1.5GB per scene (L1)',
        processing: 'Level 1 or Level 2 surface reflectance with SLC-off corrections',
        applications: ['Historical analysis', 'Long-term monitoring', 'Change detection']
      },
      'HDF': {
        description: 'Hierarchical Data Format for scientific datasets',
        fileSize: '600MB-1.2GB per scene',
        processing: 'Maintains all metadata and quality flags',
        applications: ['Research applications', 'Gap-filling studies']
      },
      'FAST': {
        description: 'Fast Format for Array Streaming Technology',
        fileSize: '500MB-1GB per scene',
        processing: 'Legacy format with band-sequential organization',
        applications: ['Historical data processing', 'Legacy system compatibility']
      }
    },
    products: {
      'NDVI': {
        description: 'Normalized Difference Vegetation Index from Landsat 7',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (water/snow) to +1 (dense vegetation)',
        accuracy: '±0.06 NDVI units (considering SLC-off)',
        applications: ['Long-term vegetation trends', 'Historical analysis', 'Climate studies']
      },
      'NDWI': {
        description: 'Normalized Difference Water Index',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (dry areas) to +1 (water bodies)',
        accuracy: '±0.04 NDWI units',
        applications: ['Water mapping', 'Wetland monitoring', 'Historical water analysis']
      },
      'LST': {
        description: 'Land Surface Temperature from thermal band',
        units: 'Kelvin (K)',
        range: '220K to 350K (-53°C to 77°C)',
        accuracy: '±3K under clear sky conditions',
        applications: ['Climate studies', 'Historical temperature analysis', 'Urban heat mapping']
      },
      'Change Detection': {
        description: 'Multi-temporal change analysis capabilities',
        units: 'Change magnitude (0-100)',
        range: '0 (no change) to 100 (complete change)',
        accuracy: '±5% change detection accuracy',
        applications: ['Land use change', 'Deforestation monitoring', 'Urban expansion']
      }
    }
  },
  landsat5: {
    datasetId: 'landsat5',
    formats: {
      'GeoTIFF': {
        description: 'Standard format for Landsat 5 historical data',
        fileSize: '500MB-1GB per scene (L1)',
        processing: 'Level 1 or Level 2 surface reflectance',
        applications: ['Historical analysis', 'Long-term trends', 'Baseline studies']
      },
      'HDF': {
        description: 'Hierarchical Data Format for scientific datasets',
        fileSize: '400MB-800MB per scene',
        processing: 'Complete metadata and quality information',
        applications: ['Research applications', 'Historical studies']
      },
      'FAST': {
        description: 'Fast Format for Array Streaming Technology',
        fileSize: '300MB-600MB per scene',
        processing: 'Legacy format with band-sequential organization',
        applications: ['Historical data processing', 'Legacy applications']
      }
    },
    products: {
      'NDVI': {
        description: 'Normalized Difference Vegetation Index from Landsat 5',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (water/snow) to +1 (dense vegetation)',
        accuracy: '±0.07 NDVI units',
        applications: ['Historical vegetation analysis', 'Long-term trends', 'Baseline studies']
      },
      'NDWI': {
        description: 'Normalized Difference Water Index',
        units: 'Dimensionless (-1 to +1)',
        range: '-1 (dry areas) to +1 (water bodies)',
        accuracy: '±0.05 NDWI units',
        applications: ['Historical water mapping', 'Long-term hydrological studies']
      },
      'LST': {
        description: 'Land Surface Temperature from thermal band',
        units: 'Kelvin (K)',
        range: '220K to 350K (-53°C to 77°C)',
        accuracy: '±3K under clear sky conditions',
        applications: ['Historical climate analysis', 'Long-term temperature trends']
      },
      'Historical Analysis': {
        description: 'Multi-decade time series analysis capabilities',
        units: 'Trend magnitude (units/year)',
        range: 'Variable depending on parameter',
        accuracy: '±10% for multi-year trends',
        applications: ['Climate change studies', 'Environmental monitoring', 'Policy assessment']
      }
    }
  }
};
