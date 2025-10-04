import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GeospatialAPI, type AOI, type SatelliteImage } from '@/lib/api.ts';
import { formatDate, formatFileSize, getCloudCoverColor, getProviderColor, getProviderName } from '@/lib/utils';
import { 
  Satellite, 
  Cloud, 
  Download,
  Loader,
  AlertCircle,
  Eye
} from 'lucide-react';

interface ImageryPanelProps {
  selectedAOI: AOI | null;
  onAOISelect: (aoi: AOI | null) => void;
}

const ImageryPanel: React.FC<ImageryPanelProps> = ({
  selectedAOI,
}) => {
  const [searchParams, setSearchParams] = useState({
    start_date: '',
    end_date: '',
    max_cloud_cover: 30,
    provider: [] as string[],
  });

  // Fetch imagery data based on selected AOI
  const { data: imagery, isLoading, error } = useQuery<{ count: number; results: SatelliteImage[] }>({
    queryKey: ['imagery', selectedAOI?.id, searchParams],
    queryFn: async () => {
      if (!selectedAOI) return { count: 0, results: [] };
      
      return GeospatialAPI.searchImagesByAOI({
        aoi_id: selectedAOI.id,
        ...searchParams,
      });
    },
    enabled: !!selectedAOI,
  });

  const handleDownload = async (image: SatelliteImage) => {
    try {
      await GeospatialAPI.downloadImage(image.id, {
        clip_geometry: selectedAOI?.geometry,
        output_format: 'GeoTIFF',
      });
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!selectedAOI) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <Satellite className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AOI Selected</h3>
          <p className="text-gray-600 text-sm">
            Select an AOI from the AOIs tab to view available satellite imagery
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Satellite Imagery</h2>
        
        {/* Search Filters */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={searchParams.start_date}
                onChange={(e) => setSearchParams(prev => ({ ...prev, start_date: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={searchParams.end_date}
                onChange={(e) => setSearchParams(prev => ({ ...prev, end_date: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Max Cloud Cover: {searchParams.max_cloud_cover}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={searchParams.max_cloud_cover}
              onChange={(e) => setSearchParams(prev => ({ ...prev, max_cloud_cover: Number(e.target.value) }))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
            <p className="text-gray-600 text-sm">Searching for imagery...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 text-sm">Failed to load imagery</p>
          </div>
        ) : !imagery?.results || imagery.results.length === 0 ? (
          <div className="p-4 text-center">
            <Satellite className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No imagery found for this AOI</p>
            <p className="text-gray-500 text-xs mt-1">
              Try adjusting the date range or cloud cover filter
            </p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {imagery.results.map((image: any) => (
              <div key={image.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getProviderColor(image.provider)}`}>
                        {getProviderName(image.provider)}
                      </span>
                      <span className="text-xs text-gray-500">{image.tile_id}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {formatDate(image.sensed_at)}
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownload(image)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="Download image"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-gray-400" />
                      <span className={`font-medium ${getCloudCoverColor(image.cloud_cover)}`}>
                        {image.cloud_cover.toFixed(1)}% clouds
                      </span>
                    </div>
                    
                    {image.aoi_coverage && (
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {(image.aoi_coverage * 100).toFixed(1)}% coverage
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {image.file_size_mb && (
                      <div className="text-gray-600">
                        Size: {formatFileSize(image.file_size_mb)}
                      </div>
                    )}
                    
                    {image.age_days !== undefined && (
                      <div className="text-gray-600">
                        {image.age_days === 0 ? 'Today' : `${image.age_days} days ago`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AOI Info */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2">Current AOI</h3>
        <div className="text-sm text-gray-600">
          <div>{selectedAOI.name}</div>
          {imagery && (
            <div className="text-xs text-gray-500 mt-1">
              Found {imagery.results?.length || 0} images
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageryPanel;
