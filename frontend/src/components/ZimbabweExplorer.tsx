import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navigation from './Navigation';
import Sidebar from './Sidebar';
import MapContainer from './MapContainer';
import AdditionalTab from './AdditionalTab';
import { GeospatialAPI } from '@/lib/api';
import { useAppState, useSearchHandlers, useMapState, useAreaSelection } from '@/hooks';

const ZimbabweExplorer: React.FC = () => {
  // Main application state
  const appState = useAppState();
  const mapState = useMapState();
  const areaSelection = useAreaSelection();
  const searchHandlers = useSearchHandlers(appState);

  // Additional criteria modal state
  const [isAdditionalCriteriaOpen, setIsAdditionalCriteriaOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search for imagery
  const { data: imagery, isLoading, error: searchError, refetch } = useQuery({
    queryKey: ['zimbabwe-imagery', appState.searchCriteria],
    queryFn: async () => {
      if (appState.selectedDatasets.length === 0) return { results: [], count: 0 };
      
      const result = await GeospatialAPI.searchImageryByLocation({
        location: appState.searchCriteria.location,
        start_date: appState.searchCriteria.dateRange.start,
        end_date: appState.searchCriteria.dateRange.end,
        providers: appState.selectedDatasets,
        max_cloud_cover: appState.searchCriteria.cloudCover,
        max_results: appState.searchCriteria.resultsLimit
      });
      
      // Ensure the result has both results and count properties
      return {
        results: result.results || [],
        count: result.count || result.results?.length || 0
      };
    },
    enabled: false
  });

  const handleSearch = () => {
    refetch();
  };

  const handleApplyAdditionalCriteria = (products: string[], formats: string[]) => {
    setSelectedProducts(products);
    setSelectedFormats(formats);
    // You can store these in the search criteria or use them in the search query
    console.log('Applied filters - Products:', products, 'Formats:', formats);
    // TODO: Integrate with search criteria
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100" style={{fontFamily: 'Roboto, sans-serif'}}>
      <Navigation
        activeTab={appState.activeTab as 'search' | 'datasets' | 'upload' | 'results'}
        setActiveTab={appState.setActiveTab as (tab: 'search' | 'datasets' | 'upload' | 'results') => void}
        handleClearSearch={searchHandlers.handleClearSearch}
        onOpenAdditionalCriteria={() => setIsAdditionalCriteriaOpen(true)}
      />

      <AdditionalTab
        isOpen={isAdditionalCriteriaOpen}
        onClose={() => setIsAdditionalCriteriaOpen(false)}
        onApply={handleApplyAdditionalCriteria}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={appState.activeTab}
          selectedProvince={appState.selectedProvince}
          setSelectedProvince={appState.setSelectedProvince}
          selectedDistrict={appState.selectedDistrict}
          setSelectedDistrict={appState.setSelectedDistrict}
          searchCriteria={appState.searchCriteria}
          setSearchCriteria={appState.setSearchCriteria}
          selectedCoordinates={appState.selectedCoordinates}
          setSelectedCoordinates={appState.setSelectedCoordinates}
          areaSelectionMode={areaSelection.areaSelectionMode}
          setAreaSelectionMode={areaSelection.setAreaSelectionMode}
          selectedCoordinateSystem={areaSelection.selectedCoordinateSystem}
          setSelectedCoordinateSystem={areaSelection.setSelectedCoordinateSystem}
          coordinateInputs={areaSelection.coordinateInputs}
          setCoordinateInputs={areaSelection.setCoordinateInputs}
          uploadedFiles={areaSelection.uploadedFiles}
          setUploadedFiles={areaSelection.setUploadedFiles}
          uploadError={areaSelection.uploadError}
          setUploadError={areaSelection.setUploadError}
          isProcessingFiles={areaSelection.isProcessingFiles}
          areasOfInterest={areaSelection.areasOfInterest}
          setAreasOfInterest={areaSelection.setAreasOfInterest}
          activeDrawingTool={areaSelection.activeDrawingTool}
          setActiveDrawingTool={areaSelection.setActiveDrawingTool}
          fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
          processUploadedFiles={areaSelection.processUploadedFiles}
          selectedDatasets={appState.selectedDatasets}
          setSelectedDatasets={appState.setSelectedDatasets}
          expandedDataset={appState.expandedDataset}
          setExpandedDataset={appState.setExpandedDataset}
          selectedMetadataItem={appState.selectedMetadataItem}
          setSelectedMetadataItem={appState.setSelectedMetadataItem}
          handleSearch={handleSearch}
          handleClearSearch={searchHandlers.handleClearSearch}
          searchResults={imagery?.results || []}
          isLoading={isLoading}
          searchError={searchError?.message || null}
        />

        <MapContainer
          mapViewState={mapState.mapViewState}
          setMapViewState={mapState.setMapViewState}
          activeDrawingTool={areaSelection.activeDrawingTool}
          setActiveDrawingTool={areaSelection.setActiveDrawingTool}
          showZimbabweBoundary={mapState.showZimbabweBoundary}
          showSelectionBoundaries={mapState.showSelectionBoundaries}
          selectedAOI={areaSelection.selectedAOI}
          mapRotation={mapState.mapRotation}
          setMapRotation={mapState.setMapRotation}
          is3DMode={mapState.is3DMode}
          setIs3DMode={mapState.setIs3DMode}
          showMinimap={mapState.showMinimap}
          setShowMinimap={mapState.setShowMinimap}
          showCoordinates={mapState.showCoordinates}
          setShowCoordinates={mapState.setShowCoordinates}
          showScale={mapState.showScale}
          setShowScale={mapState.setShowScale}
          setShowZimbabweBoundary={mapState.setShowZimbabweBoundary}
          searchCriteria={appState.searchCriteria}
          selectedDatasets={appState.selectedDatasets}
          imagery={imagery}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ZimbabweExplorer;
