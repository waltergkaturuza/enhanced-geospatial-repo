import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [expandedProducts, setExpandedProducts] = useState(true);
  const [expandedFormats, setExpandedFormats] = useState(true);
  const [searchProducts, setSearchProducts] = useState('');
  const [searchFormats, setSearchFormats] = useState('');

  const handleProductChange = (product: string) => {
    setSelectedProducts(prev => 
      prev.includes(product) 
        ? prev.filter(p => p !== product)
        : [...prev, product]
    );
  };

  const handleFormatChange = (format: string) => {
    setSelectedFormats(prev => 
      prev.includes(format) 
        ? prev.filter(f => f !== format)
        : [...prev, format]
    );
  };

  const filteredProducts = products.filter(product =>
    product.toLowerCase().includes(searchProducts.toLowerCase())
  );

  const filteredFormats = formats.filter(format =>
    format.toLowerCase().includes(searchFormats.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Additional Criteria</h2>
        <p className="text-gray-600">Select the data products and formats that match your requirements</p>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mt-2"></div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected Products</p>
              <p className="text-2xl font-bold text-blue-600">{selectedProducts.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Selected Formats</p>
              <p className="text-2xl font-bold text-green-600">{selectedFormats.length}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <Filter className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Search Results</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredProducts.length + filteredFormats.length}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Search className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Products Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Filter className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Products</h3>
                  <p className="text-blue-100 text-sm">Data products and analysis types</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedProducts(!expandedProducts)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {expandedProducts ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
          
          {expandedProducts && (
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchProducts}
                  onChange={(e) => setSearchProducts(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {filteredProducts.map((product) => (
                  <label 
                    key={product} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProducts.includes(product)
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(product)}
                      onChange={() => handleProductChange(product)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                    />
                    <span className="text-sm font-medium">{product}</span>
                  </label>
                ))}
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No products found matching "{searchProducts}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formats Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Filter className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Formats</h3>
                  <p className="text-green-100 text-sm">File formats and data types</p>
                </div>
              </div>
              <button
                onClick={() => setExpandedFormats(!expandedFormats)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                {expandedFormats ? (
                  <ChevronUp className="w-5 h-5 text-white" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white" />
                )}
              </button>
            </div>
          </div>
          
          {expandedFormats && (
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search formats..."
                  value={searchFormats}
                  onChange={(e) => setSearchFormats(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              {/* Formats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                {filteredFormats.map((format) => (
                  <label 
                    key={format} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedFormats.includes(format)
                        ? 'bg-green-50 border-green-300 text-green-900'
                        : 'bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-200'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedFormats.includes(format)}
                      onChange={() => handleFormatChange(format)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500" 
                    />
                    <span className="text-sm font-medium">{format}</span>
                  </label>
                ))}
              </div>
              
              {filteredFormats.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No formats found matching "{searchFormats}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-600">
            The search result limit is 100 records; select a Country, Feature Class, and/or Feature Type to reduce your chances of exceeding this limit.
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => {
                setSelectedProducts([]);
                setSelectedFormats([]);
                setSearchProducts('');
                setSearchFormats('');
              }}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Clear
            </button>
            <button className="px-6 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all font-medium shadow-lg">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalTab;
