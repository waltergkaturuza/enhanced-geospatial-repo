import React, { useState } from 'react';
import DatasetsTab from './DatasetsTab';

interface SearchCriteria {
  selectedFormats: Record<string, string[]>;
  selectedProducts: Record<string, string[]>;
}

const DatasetsTabTest: React.FC = () => {
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>(['zimsat2', 'sentinel2_msi']);
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);
  const [selectedMetadataItem, setSelectedMetadataItem] = useState<any>(null);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    selectedFormats: {},
    selectedProducts: {}
  });

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Datasets Tab Test</h1>
      <div className="border border-gray-300 rounded">
        <DatasetsTab
          selectedDatasets={selectedDatasets}
          setSelectedDatasets={setSelectedDatasets}
          expandedDataset={expandedDataset}
          setExpandedDataset={setExpandedDataset}
          selectedMetadataItem={selectedMetadataItem}
          setSelectedMetadataItem={setSelectedMetadataItem}
          searchCriteria={searchCriteria}
          setSearchCriteria={setSearchCriteria}
        />
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-semibold mb-2">Current State:</h2>
        <p><strong>Selected Datasets:</strong> {selectedDatasets.join(', ')}</p>
        <p><strong>Expanded Dataset:</strong> {expandedDataset || 'None'}</p>
        <p><strong>Selected Formats:</strong> {JSON.stringify(searchCriteria.selectedFormats, null, 2)}</p>
        <p><strong>Selected Products:</strong> {JSON.stringify(searchCriteria.selectedProducts, null, 2)}</p>
      </div>
    </div>
  );
};

export default DatasetsTabTest;
