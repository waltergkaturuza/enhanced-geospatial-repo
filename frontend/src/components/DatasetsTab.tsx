import React from 'react';
import { ChevronDown, ChevronRight, Info, Satellite, Database, Globe, Eye } from 'lucide-react';
import { ZIMBABWE_DATASETS, DATASET_METADATA } from '@/constants';

interface DatasetsTabProps {
  selectedDatasets: string[];
  setSelectedDatasets: (datasets: string[]) => void;
  expandedDataset: string | null;
  setExpandedDataset: (dataset: string | null) => void;
  selectedMetadataItem: any;
  setSelectedMetadataItem: (item: any) => void;
  searchCriteria: any;
  setSearchCriteria: (criteria: any) => void;
}

const DatasetsTab: React.FC<DatasetsTabProps> = ({
  selectedDatasets,
  setSelectedDatasets,
  expandedDataset,
  setExpandedDataset,
  selectedMetadataItem,
  setSelectedMetadataItem,
  searchCriteria,
  setSearchCriteria
}) => {
  
  const toggleDataset = (datasetId: string) => {
    setSelectedDatasets(
      selectedDatasets.includes(datasetId) 
        ? selectedDatasets.filter(id => id !== datasetId)
        : [...selectedDatasets, datasetId]
    );
  };

  const toggleFormat = (datasetId: string, format: string) => {
    setSearchCriteria((prev: any) => ({
      ...prev,
      selectedFormats: {
        ...prev.selectedFormats,
        [datasetId]: prev.selectedFormats[datasetId]?.includes(format)
          ? prev.selectedFormats[datasetId].filter((f: string) => f !== format)
          : [...(prev.selectedFormats[datasetId] || []), format]
      }
    }));
  };

  const toggleProduct = (datasetId: string, product: string) => {
    setSearchCriteria((prev: any) => ({
      ...prev,
      selectedProducts: {
        ...prev.selectedProducts,
        [datasetId]: prev.selectedProducts[datasetId]?.includes(product)
          ? prev.selectedProducts[datasetId].filter((p: string) => p !== product)
          : [...(prev.selectedProducts[datasetId] || []), product]
      }
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Optical': return <Satellite className="h-4 w-4 text-blue-600" />;
      case 'Radar': return <Globe className="h-4 w-4 text-green-600" />;
      case 'Elevation': return <Database className="h-4 w-4 text-yellow-600" />;
      case 'Derived': return <Info className="h-4 w-4 text-purple-600" />;
      case 'Hyperspectral': return <Eye className="h-4 w-4 text-orange-600" />;
      case 'Thermal': return <Satellite className="h-4 w-4 text-red-600" />;
      case 'UAV': return <Database className="h-4 w-4 text-cyan-600" />;
      case 'Atmospheric': return <Globe className="h-4 w-4 text-indigo-600" />;
      default: return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Optical': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Radar': return 'bg-green-100 text-green-800 border-green-200';
      case 'Elevation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Derived': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Hyperspectral': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Thermal': return 'bg-red-100 text-red-800 border-red-200';
      case 'UAV': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'Atmospheric': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMetadataInfo = (type: 'format' | 'product', item: string, datasetId: string) => {
    const metadata = DATASET_METADATA[datasetId];
    if (!metadata) return null;
    
    if (type === 'format') {
      return metadata.formats[item];
    } else {
      return metadata.products[item];
    }
  };

  return (
    <div>
      <div className="bg-gray-200 border-b border-gray-300 px-3 py-2">
        <h2 className="text-xs font-semibold text-gray-700">
          2. Data Sets
        </h2>
        <p className="text-xs text-gray-600 mt-1 leading-tight">
          Choose the satellite and airborne datasets to include in your search. 
          Zimbabwe data from multiple providers including local microsatellites, international missions, and UAV platforms.
          Select the data sets you would like to search. Click on items for detailed metadata.
        </p>
      </div>

      <div className="p-3 space-y-3">
        {/* Selection Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-800">
              {selectedDatasets.length} of {ZIMBABWE_DATASETS.length} datasets selected
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => setSelectedDatasets(ZIMBABWE_DATASETS.map(d => d.id))}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedDatasets([])}
                className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Dataset Categories */}
        {['Optical', 'Radar', 'Hyperspectral', 'Elevation', 'Derived', 'Thermal'].map(category => {
          const categoryDatasets = ZIMBABWE_DATASETS.filter(d => d.category === category);
          if (categoryDatasets.length === 0) return null;
          
          return (
            <div key={category} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(category)}
                  <h3 className="text-sm font-semibold text-gray-700">
                    {category} Satellites ({categoryDatasets.length})
                  </h3>
                </div>
                <div className="flex space-x-1">
                  <button 
                    onClick={() => {
                      const categoryIds = categoryDatasets.map(d => d.id);
                      setSelectedDatasets([...new Set([...selectedDatasets, ...categoryIds])]);
                    }}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={() => {
                      const categoryIds = categoryDatasets.map(d => d.id);
                      setSelectedDatasets(selectedDatasets.filter(id => !categoryIds.includes(id)));
                    }}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {categoryDatasets.map(dataset => (
                  <div key={dataset.id} className="border border-gray-200 rounded hover:bg-gray-50">
                    <div className="p-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedDatasets.includes(dataset.id)}
                          onChange={() => toggleDataset(dataset.id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {dataset.name}
                              </h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(category)}`}>
                                {category}
                              </span>
                            </div>
                            
                            <button
                              onClick={() => setExpandedDataset(expandedDataset === dataset.id ? null : dataset.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {expandedDataset === dataset.id ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          
                          <p className="text-xs text-gray-600 mt-1">
                            {dataset.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Provider: {dataset.provider}</span>
                            <span>Resolution: {dataset.resolution}</span>
                            <span>Coverage: {dataset.temporalCoverage}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedDataset === dataset.id && selectedDatasets.includes(dataset.id) && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                          {/* Dataset Details */}
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <h5 className="font-medium text-gray-700 mb-1">Spectral Bands</h5>
                              <div className="flex flex-wrap gap-1">
                                {dataset.bands.map(band => (
                                  <span key={band} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                    {band}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="font-medium text-gray-700 mb-1">Spatial Coverage</h5>
                              <p className="text-gray-600">{dataset.spatialCoverage}</p>
                            </div>
                          </div>

                          {/* Data Formats Selection */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">📁 Select Data Formats:</h5>
                            <div className="grid grid-cols-1 gap-2">
                              {dataset.formats.map(format => (
                                <label key={format} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={searchCriteria.selectedFormats[dataset.id]?.includes(format) || false}
                                    onChange={() => toggleFormat(dataset.id, format)}
                                    className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span 
                                    className="text-xs text-gray-700 hover:text-blue-600 cursor-pointer"
                                    onClick={() => setSelectedMetadataItem({type: 'format', item: format, datasetId: dataset.id})}
                                  >
                                    {format}
                                  </span>
                                  <button
                                    onClick={() => setSelectedMetadataItem({type: 'format', item: format, datasetId: dataset.id})}
                                    className="text-xs text-blue-500 hover:text-blue-700"
                                    title="View metadata"
                                  >
                                    ℹ️
                                  </button>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Data Products Selection */}
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">📊 Select Data Products:</h5>
                            <div className="grid grid-cols-1 gap-2">
                              {dataset.dataProducts.map(product => (
                                <label key={product} className="flex items-center space-x-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={searchCriteria.selectedProducts[dataset.id]?.includes(product) || false}
                                    onChange={() => toggleProduct(dataset.id, product)}
                                    className="h-3 w-3 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                  />
                                  <span 
                                    className="text-xs text-gray-700 hover:text-green-600 cursor-pointer"
                                    onClick={() => setSelectedMetadataItem({type: 'product', item: product, datasetId: dataset.id})}
                                  >
                                    {product}
                                  </span>
                                  <button
                                    onClick={() => setSelectedMetadataItem({type: 'product', item: product, datasetId: dataset.id})}
                                    className="text-xs text-green-500 hover:text-green-700"
                                    title="View metadata"
                                  >
                                    ℹ️
                                  </button>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Selection Summary */}
                          <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                            <p><strong>Selected:</strong> 
                              {(searchCriteria.selectedFormats[dataset.id]?.length || 0)} formats, 
                              {(searchCriteria.selectedProducts[dataset.id]?.length || 0)} products
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Metadata Display Panel */}
        {selectedMetadataItem && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-blue-800">
                {selectedMetadataItem.type === 'format' ? '📁 Format' : '📊 Product'} Metadata: {selectedMetadataItem.item}
              </h4>
              <button
                onClick={() => setSelectedMetadataItem(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </div>
            
            {(() => {
              const info = getMetadataInfo(selectedMetadataItem.type, selectedMetadataItem.item, selectedMetadataItem.datasetId);
              if (!info) {
                return <p className="text-xs text-gray-600">No detailed metadata available for this item.</p>;
              }
              
              return (
                <div className="text-xs space-y-2">
                  <p><strong>Description:</strong> {info.description}</p>
                  {selectedMetadataItem.type === 'format' && 'fileSize' in info && (
                    <>
                      <p><strong>File Size:</strong> {info.fileSize}</p>
                      <p><strong>Processing:</strong> {info.processing}</p>
                    </>
                  )}
                  {selectedMetadataItem.type === 'product' && 'units' in info && (
                    <>
                      <p><strong>Units:</strong> {info.units}</p>
                      <p><strong>Range:</strong> {info.range}</p>
                      <p><strong>Accuracy:</strong> {info.accuracy}</p>
                    </>
                  )}
                  <div>
                    <strong>Applications:</strong>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {info.applications.map((app: string, index: number) => (
                        <li key={index}>{app}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DatasetsTab;
