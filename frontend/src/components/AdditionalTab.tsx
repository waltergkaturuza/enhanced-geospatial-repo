import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, X, Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  category: string;
}

interface Format {
  id: string;
  name: string;
  extension: string;
  category: string;
}

interface AdditionalTabProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (selectedProducts: string[], selectedFormats: string[]) => void;
}

const AdditionalTab: React.FC<AdditionalTabProps> = ({ isOpen, onClose, onApply }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [expandedProducts, setExpandedProducts] = useState(true);
  const [expandedFormats, setExpandedFormats] = useState(true);
  const [searchProducts, setSearchProducts] = useState('');
  const [searchFormats, setSearchFormats] = useState('');

  // Fetch products and formats from the backend
  useEffect(() => {
    if (isOpen && products.length === 0 && formats.length === 0) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const baseUrl = getApiBaseUrl();
      
      // Fetch products
      const productsResponse = await fetch(`${baseUrl}/additional/products/`);
      const productsData = await productsResponse.json();
      
      if (productsData.success) {
        setProducts(productsData.data);
      }
      
      // Fetch formats
      const formatsResponse = await fetch(`${baseUrl}/additional/formats/`);
      const formatsData = await formatsResponse.json();
      
      if (formatsData.success) {
        setFormats(formatsData.data);
      }
    } catch (err) {
      console.error('Error fetching additional criteria data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
    product.name.toLowerCase().includes(searchProducts.toLowerCase())
  );

  const filteredFormats = formats.filter(format =>
    format.name.toLowerCase().includes(searchFormats.toLowerCase())
  );

  const handleApply = () => {
    onApply(selectedProducts, selectedFormats);
    onClose();
  };

  const handleClear = () => {
    setSelectedProducts([]);
    setSelectedFormats([]);
    setSearchProducts('');
    setSearchFormats('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">Additional Criteria</h2>
          <p className="text-blue-100">Select the data products and formats that match your requirements</p>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={fetchData}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
            </div>
          )}
          
          {/* Header */}
          <div className="mb-8">
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
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
                {isLoading ? (
                  <div className="col-span-2 flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : filteredProducts.map((product) => (
                  <label 
                    key={product.id} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedProducts.includes(product.id)
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleProductChange(product.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" 
                    />
                    <span className="text-sm font-medium">{product.name}</span>
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
                {isLoading ? (
                  <div className="col-span-2 flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : filteredFormats.map((format) => (
                  <label 
                    key={format.id} 
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedFormats.includes(format.id)
                        ? 'bg-green-50 border-green-300 text-green-900'
                        : 'bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-200'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={selectedFormats.includes(format.id)}
                      onChange={() => handleFormatChange(format.id)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500" 
                    />
                    <span className="text-sm font-medium">{format.name}</span>
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
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-600">
              Filter your search by selecting specific products and file formats
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={handleClear}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Clear All
              </button>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleApply}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-lg hover:from-blue-600 hover:to-green-600 transition-all font-medium shadow-lg"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalTab;
