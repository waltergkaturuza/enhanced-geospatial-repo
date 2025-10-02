import { Play, Loader, AlertCircle, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatDate, formatRelativeTime } from '../lib/utils';

// Mock data for now - would be replaced with real API calls
const mockJobs = [
  {
    id: 1,
    job_type: 'imagery_search',
    status: 'completed',
    progress: 100,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    aoi_name: 'Test AOI 1',
  },
  {
    id: 2,
    job_type: 'index_calculation',
    status: 'processing',
    progress: 65,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    aoi_name: 'Test AOI 2',
  },
];

const JobsPanel: React.FC = () => {
  const isLoading = false;
  const error = null;
  const jobs = mockJobs;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'status-success';
      case 'processing':
        return 'status-processing';
      case 'failed':
        return 'status-error';
      default:
        return 'status-info';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-600" />
          <p className="text-gray-600 text-sm">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 text-sm">Failed to load jobs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Processing Jobs</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {jobs.length === 0 ? (
          <div className="p-4 text-center">
            <Play className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No processing jobs</p>
          </div>
        ) : (
          <div className="space-y-3 p-4">
            {jobs.map((job) => (
              <div key={job.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(job.status)}
                      <h3 className="font-medium text-gray-900">
                        {job.job_type.replace('_', ' ').toUpperCase()}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      AOI: {job.aoi_name}
                    </p>
                  </div>
                  <span className={`status-badge ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {job.progress > 0 && job.status === 'processing' && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatRelativeTime(job.created_at)}
                    </div>
                    {job.completed_at && (
                      <div>
                        Completed {formatDate(job.completed_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPanel;
