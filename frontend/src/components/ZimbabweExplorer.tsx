import React, { useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Navigation from './Navigation';
import Sidebar from './Sidebar';
import MapContainer from './MapContainer';
import AdditionalTab from './AdditionalTab';
import { GeospatialAPI } from '@/lib/api';
import { useAppState, useSearchHandlers, useMapState, useAreaSelection } from '@/hooks';
import type { AreaOfInterest } from '@/types';

function getSearchBbox(
  areasOfInterest: AreaOfInterest[],
  coordinateInputs: { latitude: string; longitude: string; latitudeMax: string; longitudeMax: string }
): { min_lon: number; min_lat: number; max_lon: number; max_lat: number } | undefined {
  if (areasOfInterest.length > 0) {
    const aoi = areasOfInterest[areasOfInterest.length - 1];
    if (aoi.bounds && aoi.bounds.length === 4) {
      const [a, b, c, d] = aoi.bounds;
      // Support [min_lat, min_lon, max_lat, max_lon] or [west, south, east, north]
      if (Math.abs(a) <= 90) {
        return { min_lat: a, min_lon: b, max_lat: c, max_lon: d };
      }
      return { min_lon: a, min_lat: b, max_lon: c, max_lat: d };
    }
  }
  if (coordinateInputs.latitude && coordinateInputs.longitude) {
    const min_lat = parseFloat(coordinateInputs.latitude);
    const min_lon = parseFloat(coordinateInputs.longitude);
    const max_lat = coordinateInputs.latitudeMax ? parseFloat(coordinateInputs.latitudeMax) : min_lat;
    const max_lon = coordinateInputs.longitudeMax ? parseFloat(coordinateInputs.longitudeMax) : min_lon;
    if (!Number.isNaN(min_lat) && !Number.isNaN(min_lon)) {
      return {
        min_lat: Math.min(min_lat, max_lat),
        max_lat: Math.max(min_lat, max_lat),
        min_lon: Math.min(min_lon, max_lon),
        max_lon: Math.max(min_lon, max_lon),
      };
    }
  }
  return undefined;
}

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
    queryKey: ['zimbabwe-imagery', appState.searchCriteria, areaSelection.areasOfInterest],
    queryFn: async () => {
      if (appState.selectedDatasets.length === 0) return { results: [], count: 0 };

      const bbox = getSearchBbox(areaSelection.areasOfInterest, areaSelection.coordinateInputs);

      const result = await GeospatialAPI.searchImageryByLocation({
        location: appState.searchCriteria.location,
        start_date: appState.searchCriteria.dateRange.start,
        end_date: appState.searchCriteria.dateRange.end,
        providers: appState.selectedDatasets,
        max_cloud_cover: appState.searchCriteria.cloudCover,
        max_results: appState.searchCriteria.resultsLimit,
        bbox,
      });

      const results = (result.results || []).map((r: any) => ({
        ...r,
        id: String(r.id),
        preview: r.preview || r.thumbnail_url,
        downloadUrl: r.downloadUrl || r.download_url,
        file_size_mb: r.file_size_mb ?? r.metadata?.file_size_mb,
        resolution: r.resolution || r.metadata?.resolution || 'N/A',
        cloudCover: r.cloudCover ?? r.cloud_cover,
      }));

      return {
        results,
        count: result.count || results.length,
        source: result.source,
      };
    },
    enabled: false
  });

  const handleDownload = useCallback((result: { id: string; downloadUrl?: string }) => {
    if (result.downloadUrl) {
      window.open(result.downloadUrl, '_blank');
    } else {
      GeospatialAPI.downloadLocalImagery(Number(result.id));
    }
  }, []);

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
          onDownload={handleDownload}
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
