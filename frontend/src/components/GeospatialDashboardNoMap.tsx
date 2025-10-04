import React, { useState, useCallback } from 'react';
import { 
  Layers,
  MapPin,
  Menu,
  X
} from 'lucide-react';
// import MapComponent from './MapComponent';
import MapComponent from './MapComponent';
import AOISidebar from './AOISidebar';
import BoundaryLayerPanel from './BoundaryLayerPanel';
import ErrorBoundary from './ErrorBoundary';
import { type AOI, type AdministrativeBoundary } from '@/lib/api';

interface MapViewState {
  center: [number, number];
  zoom: number;
}

type SidebarView = 'aoi' | 'boundaries' | 'none';

const GeospatialDashboardNoMap: React.FC = () => {
  const [sidebarView, setSidebarView] = useState<SidebarView>('aoi');
  const [selectedAOI, setSelectedAOI] = useState<AOI | null>(null);
  const [selectedBoundaries, setSelectedBoundaries] = useState<AdministrativeBoundary[]>([]);
  const [visibleBoundaries, setVisibleBoundaries] = useState<Set<number>>(() => new Set());
  const [mapViewState, setMapViewState] = useState<MapViewState>({
    center: [-19.0154, 29.1549], // Zimbabwe center
    zoom: 6
  });

  // Handle AOI selection
  const handleAOISelect = useCallback((aoi: AOI | null) => {
    setSelectedAOI(aoi);
  }, []);

  // Handle boundary selection
  const handleBoundarySelect = useCallback((boundary: AdministrativeBoundary, selected: boolean) => {
    if (selected) {
      setSelectedBoundaries(prev => [...prev, boundary]);
    } else {
      setSelectedBoundaries(prev => prev.filter(b => b.id !== boundary.id));
    }
  }, []);

  // Handle boundary visibility
  const handleBoundaryVisibilityChange = useCallback((boundaryId: number, visible: boolean) => {
    setVisibleBoundaries(prev => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(boundaryId);
      } else {
        newSet.delete(boundaryId);
      }
      return newSet;
    });
  }, []);

  // Handle map view changes (prevent infinite loop)
  const handleMapViewChange = useCallback((viewState: MapViewState) => {
    setMapViewState(prev => {
      if (
        prev.center[0] !== viewState.center[0] ||
        prev.center[1] !== viewState.center[1] ||
        prev.zoom !== viewState.zoom
      ) {
        return viewState;
      }
      return prev;
    });
  }, []);

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      {sidebarView !== 'none' && (
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarView('aoi')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sidebarView === 'aoi'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MapPin className="w-4 h-4" />
                AOIs
              </button>
              <button
                onClick={() => setSidebarView('boundaries')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sidebarView === 'boundaries'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Layers className="w-4 h-4" />
                Boundaries
              </button>
            </div>
            <button
              onClick={() => setSidebarView('none')}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {sidebarView === 'aoi' && (
              <ErrorBoundary>
                <AOISidebar
                  selectedAOI={selectedAOI}
                  onAOISelect={handleAOISelect}
                  onMapViewChange={handleMapViewChange}
                />
              </ErrorBoundary>
            )}
            {sidebarView === 'boundaries' && (
              <ErrorBoundary>
                <BoundaryLayerPanel
                  selectedBoundaries={selectedBoundaries}
                  onBoundarySelect={handleBoundarySelect}
                  visibleBoundaries={visibleBoundaries}
                  onBoundaryVisibilityChange={handleBoundaryVisibilityChange}
                  onMapViewChange={handleMapViewChange}
                />
              </ErrorBoundary>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Map */}
        <div className="h-full">
          <MapComponent
            selectedAOI={selectedAOI}
            selectedBoundaries={selectedBoundaries}
            visibleBoundaries={visibleBoundaries}
            viewState={mapViewState}
            onViewStateChange={handleMapViewChange}
            showZimbabweBoundary={false}
          />
        </div>

        {/* Show sidebar button when hidden */}
        {sidebarView === 'none' && (
          <button
            onClick={() => setSidebarView('aoi')}
            className="absolute top-4 left-4 p-3 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-xl transition-shadow z-10"
            title="Show sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Layer control */}
        <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-3">
            <h3 className="font-medium text-gray-900 mb-2 text-sm">Active Layers</h3>
            
            {/* Selected AOI */}
            {selectedAOI && (
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>AOI: {selectedAOI.name}</span>
              </div>
            )}

            {/* Selected Boundaries */}
            {selectedBoundaries.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-700">
                  Boundaries ({selectedBoundaries.length})
                </div>
                {selectedBoundaries.slice(0, 3).map((boundary) => (
                  <div key={boundary.id} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className={`w-3 h-3 rounded ${
                      boundary.level === 'country' ? 'bg-blue-600' :
                      boundary.level === 'province' ? 'bg-green-600' :
                      boundary.level === 'district' ? 'bg-orange-600' :
                      'bg-purple-600'
                    }`}></div>
                    <span>{boundary.name}</span>
                  </div>
                ))}
                {selectedBoundaries.length > 3 && (
                  <div className="text-xs text-gray-500">
                    ... and {selectedBoundaries.length - 3} more
                  </div>
                )}
              </div>
            )}

            {/* No layers message */}
            {!selectedAOI && selectedBoundaries.length === 0 && (
              <div className="text-xs text-gray-500">
                No layers selected
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="absolute bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 z-10">
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div>
              Center: {mapViewState.center[0].toFixed(4)}, {mapViewState.center[1].toFixed(4)}
            </div>
            <div>
              Zoom: {mapViewState.zoom.toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeospatialDashboardNoMap;
