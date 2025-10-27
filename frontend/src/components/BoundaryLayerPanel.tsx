import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boundariesApi, type AdministrativeBoundary } from '../lib/api.ts';
import { formatDate, formatArea, cn, getErrorMessage } from '@/lib/utils';
import { 
  Layers, 
  Upload, 
  Search, 
  MapPin, 
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Loader,
  AlertCircle,
  FolderOpen,
  Folder,
  Globe,
  Building,
  Home
} from 'lucide-react';
import type { MapViewState } from './MapComponent';

interface BoundaryLayerPanelProps {
  selectedBoundaries: AdministrativeBoundary[];
  onBoundarySelect: (boundary: AdministrativeBoundary, selected: boolean) => void;
  visibleBoundaries: Set<number>;
  onBoundaryVisibilityChange: (boundaryId: number, visible: boolean) => void;
  onMapViewChange: (viewState: MapViewState) => void;
}

const BoundaryLayerPanel: React.FC<BoundaryLayerPanelProps> = ({
  selectedBoundaries,
  onBoundarySelect,
  visibleBoundaries,
  onBoundaryVisibilityChange,
  onMapViewChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expandedSets, setExpandedSets] = useState<Set<number>>(new Set());
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set(['country']));
  const [selectedBoundarySet, setSelectedBoundarySet] = useState<number | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState({
    name: '',
    description: '',
    source: '',
    data_year: new Date().getFullYear()
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch boundary sets
  const { data: boundarySetsResponse, isLoading: setsLoading, error: setsError } = useQuery({
    queryKey: ['boundary-sets'],
    queryFn: async () => {
      try {
        const response = await boundariesApi.getBoundarySets();
        // Handle paginated response structure
        if (response && typeof response === 'object' && 'results' in response) {
          return response.results;
        }
        // Handle direct array response
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Failed to fetch boundary sets:', error);
        return [];
      }
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Ensure boundarySets is always an array
  const boundarySets = Array.isArray(boundarySetsResponse) ? boundarySetsResponse : [];

  // Auto-select the first boundary set when data loads
  useEffect(() => {
    if (boundarySets.length > 0 && !selectedBoundarySet) {
      // Prefer the "Zimbabwe Administrative Boundaries" set if available
      const zimbabweSet = boundarySets.find(set => 
        set.name.toLowerCase().includes('zimbabwe administrative boundaries')
      );
      const firstSet = zimbabweSet || boundarySets[0];
      setSelectedBoundarySet(firstSet.id);
      setExpandedSets(new Set([firstSet.id]));
    }
  }, [boundarySets, selectedBoundarySet]);

  // Fetch hierarchy for selected set
  const { data: hierarchy, isLoading: hierarchyLoading } = useQuery({
    queryKey: ['boundary-hierarchy', selectedBoundarySet],
    queryFn: async () => {
      if (!selectedBoundarySet) return null;
      try {
        return await boundariesApi.getBoundarySetHierarchy(selectedBoundarySet);
      } catch (error) {
        console.error('Failed to fetch hierarchy:', error);
        return null;
      }
    },
    enabled: !!selectedBoundarySet,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Upload boundary set mutation
  const uploadMutation = useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata: any }) => 
      boundariesApi.uploadBoundarySet(file, metadata),
    onSuccess: (newSet) => {
      queryClient.invalidateQueries({ queryKey: ['boundary-sets'] });
      setSelectedBoundarySet(newSet.id);
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      console.error('Upload failed:', error);
      setUploading(false);
    },
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    // Auto-detect metadata from filename
    const filename = file.name;
    let autoMetadata = { ...uploadMetadata };
    
    if (filename.includes('Zim_admin0') || filename.includes('zimbabwe') && filename.includes('country')) {
      autoMetadata.name = `Zimbabwe Country Boundaries`;
      autoMetadata.description = 'Zimbabwe national boundary';
    } else if (filename.includes('Zim_admin1') || filename.includes('province')) {
      autoMetadata.name = `Zimbabwe Provincial Boundaries`;
      autoMetadata.description = 'Zimbabwe provincial boundaries';
    } else if (filename.includes('Zim_admin2') || filename.includes('district')) {
      autoMetadata.name = `Zimbabwe District Boundaries`;
      autoMetadata.description = 'Zimbabwe district boundaries';
    } else {
      autoMetadata.name = uploadMetadata.name || `Boundaries from ${filename}`;
    }

    uploadMutation.mutate({
      file,
      metadata: autoMetadata
    });
  };

  // Toggle set expansion
  const toggleSetExpansion = (setId: number) => {
    const newExpanded = new Set(expandedSets);
    if (newExpanded.has(setId)) {
      newExpanded.delete(setId);
    } else {
      newExpanded.add(setId);
      setSelectedBoundarySet(setId);
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

  // Get icon for administrative level
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'country': return Globe;
      case 'province': return Building;
      case 'district': return Home;
      case 'ward': return MapPin;
      default: return MapPin;
    }
  };

  // Get level color
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'country': return 'text-blue-600';
      case 'province': return 'text-green-600';
      case 'district': return 'text-orange-600';
      case 'ward': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  // Zoom to boundary
  const zoomToBoundary = (boundary: AdministrativeBoundary) => {
    if (boundary.geometry && boundary.geometry.type === 'MultiPolygon') {
      // Calculate bounds from geometry
      const coordinates = boundary.geometry.coordinates;
      let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
      
      coordinates.forEach(polygon => {
        polygon[0].forEach(coord => {
          const [lon, lat] = coord;
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        });
      });
      
      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;
      
      // Calculate zoom based on area
      const latDiff = maxLat - minLat;
      const lonDiff = maxLon - minLon;
      const maxDiff = Math.max(latDiff, lonDiff);
      
      let zoom = 10;
      if (maxDiff > 10) zoom = 4;
      else if (maxDiff > 5) zoom = 5;
      else if (maxDiff > 2) zoom = 6;
      else if (maxDiff > 1) zoom = 7;
      else if (maxDiff > 0.5) zoom = 8;
      else if (maxDiff > 0.1) zoom = 9;
      
      onMapViewChange({
        center: [centerLat, centerLon],
        zoom,
      });
    }
  };

  // Filter boundary sets
  const filteredSets = boundarySets.filter(set =>
    set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    set.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (setsError) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-600 text-sm">{getErrorMessage(setsError)}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Administrative Boundaries
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary p-2"
            title="Upload boundary archive"
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

        {/* Upload Metadata Form (shown when uploading) */}
        {uploading && (
          <div className="bg-blue-50 p-3 rounded-lg mb-4">
            <h4 className="font-medium text-blue-900 mb-2">Upload Progress</h4>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Boundary set name"
                value={uploadMetadata.name}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, name: e.target.value }))}
                className="input-field text-sm"
              />
              <input
                type="text"
                placeholder="Description"
                value={uploadMetadata.description}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                className="input-field text-sm"
              />
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
        {setsLoading ? (
          <div className="p-4 text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
            <p className="text-gray-600 text-sm">Loading boundary sets...</p>
          </div>
        ) : filteredSets.length === 0 ? (
          <div className="p-4 text-center">
            <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              {searchTerm ? 'No boundary sets match your search' : 'No boundary sets available'}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Upload a ZIP file containing shapefiles to create one
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-3">
            {filteredSets.map((set) => (
              <div key={set.id} className="border border-gray-200 rounded-lg">
                {/* Boundary Set Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleSetExpansion(set.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedSets.has(set.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                    {expandedSets.has(set.id) ? (
                      <FolderOpen className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Folder className="w-4 h-4 text-blue-500" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{set.name}</h3>
                      <p className="text-xs text-gray-500">
                        {set.total_boundaries} boundaries • {set.levels_included.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatDate(set.created_at)}
                  </div>
                </div>

                {/* Boundary Hierarchy */}
                {expandedSets.has(set.id) && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {hierarchyLoading ? (
                      <div className="p-4 text-center">
                        <Loader className="w-4 h-4 animate-spin mx-auto text-gray-500" />
                      </div>
                    ) : hierarchy && hierarchy.hierarchy ? (
                      <div className="p-2 space-y-1">
                        {Object.entries(hierarchy.hierarchy).map(([level, boundaries]) => (
                          <div key={level}>
                            {/* Level Header */}
                            <div
                              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                              onClick={() => toggleLevelExpansion(level)}
                            >
                              {expandedLevels.has(level) ? (
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-gray-400" />
                              )}
                              {(() => {
                                const Icon = getLevelIcon(level);
                                return <Icon className={cn("w-3 h-3", getLevelColor(level))} />;
                              })()}
                              <span className="text-xs font-medium text-gray-700 capitalize">
                                {level} ({boundaries.length})
                              </span>
                            </div>

                            {/* Boundaries in Level */}
                            {expandedLevels.has(level) && (
                              <div className="ml-6 space-y-1">
                                {boundaries.slice(0, 10).map((boundary) => {
                                  const isVisible = visibleBoundaries.has(boundary.id);
                                  const isSelected = selectedBoundaries.some(b => b.id === boundary.id);
                                  
                                  return (
                                    <div
                                      key={boundary.id}
                                      className={cn(
                                        "flex items-center justify-between p-2 rounded text-xs hover:bg-white cursor-pointer",
                                        isSelected ? "bg-blue-100 border border-blue-200" : "bg-white"
                                      )}
                                      onClick={() => onBoundarySelect(boundary, !isSelected)}
                                    >
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                        <span className="truncate">{boundary.name}</span>
                                        {boundary.area_km2 && (
                                          <span className="text-gray-400">
                                            ({formatArea(boundary.area_km2)})
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            zoomToBoundary(boundary);
                                          }}
                                          className="p-1 hover:bg-gray-200 rounded"
                                          title="Zoom to boundary"
                                        >
                                          <Eye className="w-3 h-3 text-gray-500" />
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onBoundaryVisibilityChange(boundary.id, !isVisible);
                                          }}
                                          className="p-1 hover:bg-gray-200 rounded"
                                          title={isVisible ? "Hide boundary" : "Show boundary"}
                                        >
                                          {isVisible ? (
                                            <EyeOff className="w-3 h-3 text-gray-500" />
                                          ) : (
                                            <Eye className="w-3 h-3 text-gray-500" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                                {boundaries.length > 10 && (
                                  <div className="text-xs text-gray-500 p-2">
                                    ... and {boundaries.length - 10} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-xs">
                        No boundaries found
                      </div>
                    )}
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
          <h3 className="font-medium text-gray-900 mb-2">Selected Boundaries ({selectedBoundaries.length})</h3>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {selectedBoundaries.map((boundary) => (
              <div key={boundary.id} className="text-sm text-gray-600">
                <span className="font-medium">{boundary.name}</span>
                <span className="text-gray-400 ml-2">({boundary.level})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoundaryLayerPanel;
