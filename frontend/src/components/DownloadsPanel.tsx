import { useQuery } from '@tanstack/react-query';
import { GeospatialAPI } from '@/lib';
import { formatDate, getStatusColor } from '@/lib/utils';
import { Loader, AlertCircle, Calendar, FileDown } from 'lucide-react';

const DownloadsPanel: React.FC = () => {
  const { data: downloads, isLoading, error } = useQuery({
    queryKey: ['downloads'],
    queryFn: GeospatialAPI.getDownloads,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
          <p className="text-gray-600 text-sm">Loading downloads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm">Failed to load downloads</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Downloads</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!downloads?.results || downloads.results.length === 0 ? (
          <div className="p-4 text-center">
            <FileDown className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No downloads yet</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {downloads.results.map((download) => (
              <div key={download.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      Download #{download.id}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {download.satellite_image_details?.tile_id || 'Unknown image'}
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusColor(download.status)}`}>
                    {download.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {formatDate(download.requested_at)}
                    </span>
                  </div>
                  
                  {download.progress > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${download.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DownloadsPanel;
