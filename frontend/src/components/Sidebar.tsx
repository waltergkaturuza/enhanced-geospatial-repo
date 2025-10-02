import React from 'react';
import SearchTabClean from './SearchTabClean';
import DatasetsTab from './DatasetsTab.tsx';
import AdditionalTab from './AdditionalTab.tsx';
import UploadTab from './UploadTab';
import ResultsTab from './ResultsTab';
import SearchButtons from './SearchButtons';

interface SidebarProps {
  activeTab: 'search' | 'datasets' | 'additional' | 'upload' | 'results';
  // Props that will be passed down to individual tabs
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  searchCriteria: any;
  setSearchCriteria: (criteria: any) => void;
  selectedCoordinates: string;
  setSelectedCoordinates: (coords: string) => void;
  // Area selection props
  areaSelectionMode: 'none' | 'coordinates' | 'drawing' | 'upload';
  setAreaSelectionMode: (mode: 'none' | 'coordinates' | 'drawing' | 'upload') => void;
  selectedCoordinateSystem: string;
  setSelectedCoordinateSystem: (system: string) => void;
  coordinateInputs: any;
  setCoordinateInputs: (inputs: any) => void;
  uploadedFiles: File[];
  setUploadedFiles: (files: File[]) => void;
  uploadError: string | null;
  setUploadError: (error: string | null) => void;
  isProcessingFiles: boolean;
  areasOfInterest: any[];
  setAreasOfInterest: (areas: any[]) => void;
  activeDrawingTool: string | null;
  setActiveDrawingTool: (tool: string | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  processUploadedFiles: () => Promise<void>;
  // Dataset props
  selectedDatasets: string[];
  setSelectedDatasets: (datasets: string[]) => void;
  expandedDataset: string | null;
  setExpandedDataset: (dataset: string | null) => void;
  selectedMetadataItem: any;
  setSelectedMetadataItem: (item: any) => void;
  // Search functions and results
  handleSearch: () => void;
  handleClearSearch: () => void;
  searchResults?: any[];
  isLoading?: boolean;
  searchError?: string | null;
}

const Sidebar: React.FC<SidebarProps> = (props) => {
  const { activeTab } = props;

  return (
    <div className="w-72 bg-white border-r border-gray-300 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        {/* Search Criteria Tab */}
        {activeTab === 'search' && (
          <SearchTabClean 
            selectedProvince={props.selectedProvince}
            setSelectedProvince={props.setSelectedProvince}
            selectedDistrict={props.selectedDistrict}
            setSelectedDistrict={props.setSelectedDistrict}
            searchCriteria={props.searchCriteria}
            setSearchCriteria={props.setSearchCriteria}
          />
        )}
        
        {/* Data Sets Tab */}
        {activeTab === 'datasets' && (
          <DatasetsTab 
            selectedDatasets={props.selectedDatasets}
            setSelectedDatasets={props.setSelectedDatasets}
            expandedDataset={props.expandedDataset}
            setExpandedDataset={props.setExpandedDataset}
            selectedMetadataItem={props.selectedMetadataItem}
            setSelectedMetadataItem={props.setSelectedMetadataItem}
            searchCriteria={props.searchCriteria}
            setSearchCriteria={props.setSearchCriteria}
          />
        )}
        
        {/* Additional Criteria Tab */}
        {activeTab === 'additional' && <AdditionalTab />}
        
        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <UploadTab 
            onFilesUploaded={(files) => {
              if (props.setUploadedFiles) {
                props.setUploadedFiles([...props.uploadedFiles || [], ...files]);
              }
            }}
            onFileRemove={(fileId) => {
              console.log('Remove file:', fileId);
              // Handle file removal logic here
            }}
          />
        )}
        
        {/* Results Tab */}
        {activeTab === 'results' && (
          <ResultsTab 
            searchResults={props.searchResults || []}
            isLoading={props.isLoading || false}
            searchError={props.searchError || null}
            onDownload={(result) => console.log('Download:', result)}
            onPreview={(result) => console.log('Preview:', result)}
          />
        )}
      </div>
      
      {/* Search and Clear buttons - always visible at bottom */}
      <SearchButtons 
        onSearch={props.handleSearch}
        onClearSearch={props.handleClearSearch}
        isLoading={false} // TODO: Add loading state
        selectedDatasets={props.selectedDatasets}
        resultsLimit={props.searchCriteria.resultsLimit || 100}
      />
    </div>
  );
};

export default Sidebar;
