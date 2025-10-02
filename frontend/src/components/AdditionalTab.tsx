import React from 'react';

const products = [
  'NDVI',
  'Land Cover',
  'UAV Imagery',
  'Change Detection',
  'Surface Reflectance',
  'LST',
  'Burned Area',
  'Snow Cover',
  'Vegetation Indices',
  'DEM',
  'DSM',
  'CHM',
  'Water Quality',
  'Soil Moisture',
  'Urban Mapping',
];

const formats = [
  'GeoTIFF',
  'JPEG',
  'PNG',
  'Shapefile',
  'KML',
  'GPX',
  'NetCDF',
  'HDF5',
  'CSV',
  'LAS',
  'LAZ',
];

const AdditionalTab: React.FC = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Additional Criteria</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
            Products
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {products.map((product) => (
              <label key={product} className="flex items-center space-x-2 text-gray-700 text-sm">
                <input type="checkbox" name="product" value={product} className="accent-blue-600" />
                <span>{product}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Formats Card */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400 mr-2"></span>
            Formats
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formats.map((format) => (
              <label key={format} className="flex items-center space-x-2 text-gray-700 text-sm">
                <input type="checkbox" name="format" value={format} className="accent-green-600" />
                <span>{format}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalTab;
