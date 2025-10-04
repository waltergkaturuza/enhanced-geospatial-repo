import React from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  MapPin, 
  Mountain, 
  Satellite, 
  Navigation, 
  RotateCw, 
  Target, 
  Layers, 
  Maximize, 
  Settings,
  Download,
  Eye,
  Info
} from 'lucide-react';
import MapComponent from './MapComponent';
import { type AOI } from '@/lib/api';

interface MapContainerProps {
  mapViewState: {
    center: [number, number];
    zoom: number;
  };
  setMapViewState: React.Dispatch<React.SetStateAction<{
    center: [number, number];
    zoom: number;
  }>>;
  activeDrawingTool: string | null;
  setActiveDrawingTool: (tool: string | null) => void;
  showZimbabweBoundary: boolean;
  showSelectionBoundaries: boolean;
  selectedAOI: AOI | null;
  mapRotation: number;
  setMapRotation: (rotation: number | ((prev: number) => number)) => void;
  is3DMode: boolean;
  setIs3DMode: (is3D: boolean) => void;
  showMinimap: boolean;
  setShowMinimap: (show: boolean) => void;
  showCoordinates: boolean;
  setShowCoordinates: (show: boolean) => void;
  showScale: boolean;
  setShowScale: (show: boolean) => void;
  setShowZimbabweBoundary: (show: boolean) => void;
  searchCriteria: any;
  selectedDatasets: string[];
  imagery: any;
  isLoading?: boolean;
}

const MapContainer: React.FC<MapContainerProps> = ({
  mapViewState,
  setMapViewState,
  activeDrawingTool,
  setActiveDrawingTool,
  showZimbabweBoundary,
  showSelectionBoundaries,
  selectedAOI,
  mapRotation,
  setMapRotation,
  is3DMode,
  setIs3DMode,
  showMinimap,
  setShowMinimap,
  showCoordinates,
  setShowCoordinates,
  showScale,
  setShowScale,
  setShowZimbabweBoundary,
  searchCriteria,
  selectedDatasets,
  imagery,
  isLoading
}) => {
  return (
    <div className="flex-1 flex flex-col">
      {/* Map Area */}
      <div className="flex-1 relative">
        <MapComponent
          viewState={mapViewState}
          height="100%"
          drawingEnabled={activeDrawingTool !== null}
          drawingMode={activeDrawingTool as 'polygon' | 'rectangle' | 'circle' | 'freehand' || 'polygon'}
          showZimbabweBoundary={showZimbabweBoundary}
          showSelectionBoundaries={showSelectionBoundaries}
          selectedAOI={selectedAOI}
          onDrawingComplete={(geometry) => {
            console.log('Drawing completed:', geometry);
            // Reset the active drawing tool after completion
            setActiveDrawingTool(null);
          }}
        />
        
        {/* Enhanced Map Controls - Repositioned further down to avoid overlap with background layer controls */}
        <div className="absolute top-24 right-4 space-y-2" style={{marginRight: '8px', zIndex: 2000}}>
          {/* Zoom Controls */}
          <div className="map-controls zoom-controls flex flex-col">
            <button 
              className="map-control-button"
              onClick={() => setMapViewState(prev => ({...prev, zoom: Math.min(prev.zoom + 1, 18)}))}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button 
              className="map-control-button"
              onClick={() => setMapViewState(prev => ({...prev, zoom: Math.max(prev.zoom - 1, 1)}))}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
          </div>

          {/* Base Layer Selector */}
          <div className="map-controls flex flex-col space-y-0 p-1">
            <button 
              className="map-control-button active"
              title="Street Map"
            >
              <MapPin className="h-4 w-4" />
            </button>
            <button 
              className="map-control-button"
              title="Terrain"
            >
              <Mountain className="h-4 w-4" />
            </button>
            <button 
              className="map-control-button"
              title="Satellite"
            >
              <Satellite className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="map-controls flex flex-col space-y-0 p-1">
            <button 
              className={`map-control-button ${is3DMode ? 'control-3d' : ''}`}
              onClick={() => setIs3DMode(!is3DMode)}
              title={is3DMode ? "Switch to 2D View" : "Switch to 3D View"}
            >
              {is3DMode ? '2D' : '3D'}
            </button>
            <button 
              className="map-control-button"
              onClick={() => setMapRotation(0)}
              title="Reset North"
            >
              <Navigation className="h-4 w-4" style={{transform: `rotate(${mapRotation}deg)`}} />
            </button>
            <button 
              className="map-control-button"
              onClick={() => setMapRotation(prev => (prev + 90) % 360)}
              title="Rotate Map"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button 
              className="map-control-button"
              onClick={() => setMapViewState({ center: [-19.0154, 29.1549], zoom: 6 })}
              title="Fit to Zimbabwe"
            >
              <Target className="h-4 w-4" />
            </button>
          </div>

          {/* Additional Tools */}
          <div className="map-controls flex flex-col space-y-0 p-1">
            <button 
              className="map-control-button"
              title="Layer Manager"
            >
              <Layers className="h-4 w-4" />
            </button>
            <button 
              className="map-control-button"
              onClick={() => setShowMinimap(!showMinimap)}
              title="Toggle Minimap"
            >
              <Maximize className="h-4 w-4" />
            </button>
            <button 
              className="map-control-button"
              title="Map Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Minimap */}
        {showMinimap && (
          <div className="absolute bottom-4 right-4 bg-white rounded shadow-lg p-2 border border-gray-300" style={{width: '150px', height: '120px', zIndex: 1500}}>
            <div className="bg-gray-200 h-full rounded flex flex-col items-center justify-center text-xs text-gray-600">
              <div>Overview Map</div>
              <div className="text-xs">Zimbabwe</div>
            </div>
          </div>
        )}

        {/* Enhanced Map Information Panel - Better positioned and always visible */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-md border border-gray-200" style={{marginBottom: showScale ? '110px' : '0px', maxWidth: '280px', zIndex: 1600}}>
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-800 text-sm">🗺️ Map Information</p>
              <div className="flex space-x-1">
                <button 
                  onClick={() => setShowCoordinates(!showCoordinates)}
                  className={`text-xs px-2 py-1 rounded ${showCoordinates ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                  title="Toggle Coordinates"
                >
                  GPS
                </button>
                <button 
                  onClick={() => setShowScale(!showScale)}
                  className={`text-xs px-2 py-1 rounded ${showScale ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
                  title="Toggle Scale"
                >
                  Scale
                </button>
                <button 
                  onClick={() => setShowZimbabweBoundary(!showZimbabweBoundary)}
                  className={`text-xs px-2 py-1 rounded ${showZimbabweBoundary ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}
                  title="Toggle Zimbabwe Boundary"
                >
                  Boundary
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium">Center:</span>
                <div>{(-19.0154).toFixed(4)}°, {(29.1549).toFixed(4)}°</div>
              </div>
              <div>
                <span className="font-medium">Zoom:</span>
                <div>Level {mapViewState.zoom}/18</div>
              </div>
              <div>
                <span className="font-medium">Rotation:</span>
                <div>{mapRotation}°</div>
              </div>
              <div>
                <span className="font-medium">Mode:</span>
                <div>{is3DMode ? '3D' : '2D'} View</div>
              </div>
            </div>
            <div className="mt-2 text-xs">
              <span className="font-medium">CRS:</span> WGS84 (EPSG:4326)
            </div>
            <div className="mt-2 text-xs">
              <span className="font-medium">Boundaries:</span> 
              <span className={`ml-1 ${showZimbabweBoundary ? 'text-green-600' : 'text-gray-400'}`}>
                Zimbabwe: {showZimbabweBoundary ? 'ON' : 'OFF'}
              </span>
              <span className={`ml-2 ${showSelectionBoundaries ? 'text-blue-600' : 'text-gray-400'}`}>
                Selections: {showSelectionBoundaries ? 'ON' : 'OFF'}
              </span>
            </div>
            <div className="mt-2 p-2 text-xs text-amber-700 bg-amber-50 rounded border border-amber-200">
              ⚠️ Maps are for reference and search purposes only
            </div>
          </div>
        </div>

        {/* Enhanced Search Summary Overlay - Better positioned to avoid overlap */}
        {imagery && (
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 max-w-sm border border-gray-200" style={{marginLeft: '68px', zIndex: 1600}}>
            <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
              <Satellite className="h-4 w-4 mr-2 text-blue-600" />
              Search Results
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-medium">Location:</span>
                  <div className="truncate">{searchCriteria.location}</div>
                </div>
                <div>
                  <span className="font-medium">Results:</span>
                  <div className="text-blue-600 font-semibold">{imagery.results?.length || 0} images</div>
                </div>
              </div>
              <div>
                <span className="font-medium">Date Range:</span>
                <div>{searchCriteria.dateRange.start} to {searchCriteria.dateRange.end}</div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Datasets:</span>
                  <span className="ml-1">{selectedDatasets.length} selected</span>
                </div>
                <div>
                  <span className="font-medium">Cloud:</span>
                  <span className="ml-1">≤ {searchCriteria.cloudCover}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-700">Searching for satellite imagery...</span>
            </div>
          </div>
        )}
      </div>

      {/* Results Footer */}
      <div className="bg-white border-t border-gray-300 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-xs text-gray-600">
          {imagery && (
            <>
              <span className="font-medium">Results: {imagery.results?.length || 0} images</span>
              <span>•</span>
              <span>Location: {searchCriteria.location}</span>
              <span>•</span>
              <span>Cloud ≤ {searchCriteria.cloudCover}%</span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center px-2 py-1 rounded hover:bg-blue-50">
            <Download className="h-3 w-3 mr-1" />
            Bulk Download
          </button>
          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center px-2 py-1 rounded hover:bg-blue-50">
            <Eye className="h-3 w-3 mr-1" />
            Preview All
          </button>
          <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center px-2 py-1 rounded hover:bg-blue-50">
            <Info className="h-3 w-3 mr-1" />
            Export Results
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapContainer;
