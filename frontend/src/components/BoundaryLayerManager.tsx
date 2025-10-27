import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boundariesApi, type AdministrativeBoundarySet, type AdministrativeBoundary } from '../lib/api';
import { formatDate, formatArea, cn, getErrorMessage } from '@/lib/utils';
import { 
  Upload, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  Calendar,
  Globe,
  MapPin,
  Layers
} from 'lucide-react';
import type { MapViewState } from './MapComponent';

interface BoundaryLayerManagerProps {
  selectedBoundaries: AdministrativeBoundary[];
  onBoundarySelect: (boundaries: AdministrativeBoundary[]) => void;
  onMapViewChange: (viewState: MapViewState) => void;
  visibleLayers: Set<string>;
  onLayerVisibilityChange: (layerId: string, visible: boolean) => void;
}

const BoundaryLayerManager: React.FC<BoundaryLayerManagerProps> = ({
  selectedBoundaries,
  onBoundarySelect,
  onMapViewChange,
  visibleLayers,
  onLayerVisibilityChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set());
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
  const [selectedSet, setSelectedSet] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch boundary sets
  const { data: boundarySets = [], isLoading, error } = useQuery({
    queryKey: ['boundary-sets'],
    queryFn: boundariesApi.getBoundarySets,
  });

  // Fetch hierarchy for selected set
  const { data: hierarchy } = useQuery({
    queryKey: ['boundary-hierarchy', selectedSet],
    queryFn: () => selectedSet ? boundariesApi.getBoundarySetHierarchy(selectedSet) : null,
    enabled: !!selectedSet,
  });

  // Upload boundaries mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, metadata }: { file: File; metadata: any }) => {
      return boundariesApi.uploadBoundarySet(file, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boundary-sets'] });
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
    },
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      // Extract name from filename
      const filename = file.name.replace(/\.(zip|tar|gz|tgz)$/i, '');
      
      // Detect Zimbabwe admin level from filename
      let name = filename;
      let description = '';
      let data_year = new Date().getFullYear();
      
      if (filename.toLowerCase().includes('zim_admin0')) {
        name = 'Zimbabwe Country Boundary';
        description = 'Zimbabwe country-level administrative boundary';
      } else if (filename.toLowerCase().includes('zim_admin1')) {
        name = 'Zimbabwe Provincial Boundaries';
        description = 'Zimbabwe provincial administrative boundaries';
      } else if (filename.toLowerCase().includes('zim_admin2')) {
        name = 'Zimbabwe District Boundaries';
        description = 'Zimbabwe district-level administrative boundaries';
      } else if (filename.toLowerCase().includes('zimbabwe')) {
        name = `Zimbabwe Administrative Boundaries - ${filename}`;
        description = 'Zimbabwe administrative boundaries';
      }

      await uploadMutation.mutateAsync({
        file,
        metadata: {
          name,
          description,
          source: 'User Upload',
          data_year,
        },
      });
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Toggle set expansion
  const toggleSetExpansion = (setId: number) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(setId)) {
      newExpanded.delete(setId);
      if (selectedSet === setId) {
        setSelectedSet(null);
      }
    } else {
      newExpanded.add(setId);
      setSelectedSet(setId);
    }
    setExpandedSets(newExpanded);
  };

  // Toggle level expansion
  const toggleLevelExpansion = (level: string) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  // Toggle layer visibility
  const toggleLayerVisibility = (layerId: string) => {
    const isVisible = visibleLayers.has(layerId);
    onLayerVisibilityChange(layerId, !isVisible);
  };

  // Handle boundary selection
  const handleBoundarySelect = (boundary: AdministrativeBoundary) => {
    const isSelected = selectedBoundaries.some(b => b.id === boundary.id);
    
    if (isSelected) {
      // Remove from selection
      onBoundarySelect(selectedBoundaries.filter(b => b.id !== boundary.id));
    } else {
      // Add to selection (allow multiple)
      onBoundarySelect([...selectedBoundaries, boundary]);
    }
  };

  // Zoom to boundary set
  const zoomToBoundarySet = async (boundarySet: AdministrativeBoundarySet) => {
    try {
      // Get some boundaries to calculate bounds
      const boundaries = await boundariesApi.getBoundariesInSet(boundarySet.id, {
        level: 'country',
        include_geometry: true,
      });
      
      if (boundaries.length > 0 && boundaries[0].geometry) {
        // Calculate bounds from first boundary (should be country level)
        const geometry = boundaries[0].geometry;
        if (geometry.type === 'MultiPolygon' || geometry.type === 'Polygon') {
          // Rough bounds calculation - in production you'd use a proper GIS library
          let minLon = 180, minLat = 90, maxLon = -180, maxLat = -90;
          
          const coords = geometry.type === 'Polygon' 
            ? geometry.coordinates[0] 
            : geometry.coordinates[0][0];
          
          coords.forEach(([lon, lat]) => {
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
          });
          
          const centerLat = (minLat + maxLat) / 2;
          const centerLon = (minLon + maxLon) / 2;
          
          onMapViewChange({
            center: [centerLat, centerLon],
            zoom: 6,
          });
        }
      }
    } catch (error) {
      console.error('Failed to zoom to boundary set:', error);
    }
  };

  // Filter sets based on search
  const filteredSets = boundarySets.filter(set =>
    set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 text-sm">{getErrorMessage(error)}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Administrative Boundaries</h2>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary p-2"
            title="Upload boundary ZIP file"
          >
            {uploading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search boundary sets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Upload status */}
        {uploadMutation.isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-800">Uploading and processing boundaries...</span>
            </div>
          </div>
        )}

        {uploadMutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-800">
                {getErrorMessage(uploadMutation.error)}
              </span>
            </div>
          </div>
        )}

        {uploadMutation.isSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-800">
                Boundaries uploaded successfully!
              </span>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.tar,.gz,.tgz"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Boundary Sets List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
            <p className="text-gray-600 text-sm">Loading boundary sets...</p>
          </div>
        ) : filteredSets.length === 0 ? (
          <div className="p-4 text-center">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {searchTerm ? 'No boundary sets match your search' : 'No boundary sets available'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Upload a ZIP file containing shapefiles to get started
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredSets.map((boundarySet) => (
              <div key={boundarySet.id} className="card">
                {/* Boundary Set Header */}
                <div 
                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleSetExpansion(boundarySet.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      {expandedSets.has(boundarySet.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <Globe className="w-4 h-4 text-primary-600" />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{boundarySet.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{boundarySet.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          zoomToBoundarySet(boundarySet);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                        title="Zoom to boundaries"
                      >
                        <Eye className="w-3 h-3 text-gray-500" />
                      </button>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {boundarySet.total_boundaries}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-4">
                      {boundarySet.data_year && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {boundarySet.data_year}
                        </div>
                      )}
                      <div>
                        Levels: {boundarySet.levels_included.join(', ')}
                      </div>
                    </div>
                    <div>{formatDate(boundarySet.created_at)}</div>
                  </div>
                </div>

                {/* Boundary Hierarchy */}
                {expandedSets.has(boundarySet.id) && hierarchy?.boundary_set.id === boundarySet.id && (
                  <div className="border-t border-gray-100 p-3">
                    {Object.entries(hierarchy.hierarchy).map(([level, boundaries]) => (
                      <div key={level} className="mb-3 last:mb-0">
                        <div 
                          className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded"
                          onClick={() => toggleLevelExpansion(`${boundarySet.id}-${level}`)}
                        >
                          {expandedLevels.has(`${boundarySet.id}-${level}`) ? (
                            <ChevronDown className="w-3 h-3 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                          )}
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {level} ({boundaries.length})
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLayerVisibility(`${boundarySet.id}-${level}`);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                            title={visibleLayers.has(`${boundarySet.id}-${level}`) ? 'Hide layer' : 'Show layer'}
                          >
                            {visibleLayers.has(`${boundarySet.id}-${level}`) ? (
                              <Eye className="w-3 h-3 text-primary-600" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>

                        {expandedLevels.has(`${boundarySet.id}-${level}`) && (
                          <div className="ml-5 space-y-1">
                            {boundaries.slice(0, 10).map((boundary) => (
                              <div 
                                key={boundary.id}
                                className={cn(
                                  "flex items-center justify-between p-2 rounded text-sm cursor-pointer hover:bg-gray-50",
                                  selectedBoundaries.some(b => b.id === boundary.id) 
                                    ? 'bg-primary-50 border border-primary-200' 
                                    : ''
                                )}
                                onClick={() => handleBoundarySelect(boundary)}
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{boundary.name}</div>
                                  {boundary.full_path !== boundary.name && (
                                    <div className="text-xs text-gray-500">{boundary.full_path}</div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {boundary.area_km2 ? formatArea(boundary.area_km2) : ''}
                                </div>
                              </div>
                            ))}
                            {boundaries.length > 10 && (
                              <div className="text-xs text-gray-500 text-center py-1">
                                ... and {boundaries.length - 10} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Boundaries Summary */}
      {selectedBoundaries.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">
            Selected Boundaries ({selectedBoundaries.length})
          </h3>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {selectedBoundaries.map((boundary) => (
              <div key={boundary.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 truncate">{boundary.full_path}</span>
                <button
                  onClick={() => handleBoundarySelect(boundary)}
                  className="text-red-500 hover:text-red-700 ml-2"
                  title="Remove from selection"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoundaryLayerManager;
