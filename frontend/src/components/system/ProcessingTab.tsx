import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PROCESSING_JOB_TYPES, STATUS_COLORS } from '../../constants/system';
import { useSystemState } from '../../hooks/useSystemState';
import type { ProcessingJob } from '../../types/system';

const ProcessingTab: React.FC = () => {
  const { processingJobs, setProcessingJobs } = useSystemState();
  const getStatusIcon = (status: ProcessingJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Play className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const end = endTime || new Date();
    const diffMs = end.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const pauseJob = (jobId: string) => {
    setProcessingJobs(prev => 
      prev.map(job => 
        job.id === jobId ? { ...job, status: 'pending' } : job
      )
    );
  };

  const resumeJob = (jobId: string) => {
    setProcessingJobs(prev => 
      prev.map(job => 
        job.id === jobId ? { ...job, status: 'running' } : job
      )
    );
  };

  const retryJob = (jobId: string) => {
    setProcessingJobs(prev => 
      prev.map(job => 
        job.id === jobId ? { 
          ...job, 
          status: 'pending', 
          progress: 0,
          error: undefined,
          startTime: new Date()
        } : job
      )
    );
  };

  const addSampleJob = () => {
    const newJob: ProcessingJob = {
      id: `job_${Date.now()}`,
      name: `New Processing Task ${processingJobs.length + 1}`,
      type: 'processing',
      status: 'pending',
      progress: 0,
      startTime: new Date()
    };
    
    setProcessingJobs(prev => [newJob, ...prev]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Processing Queue</h2>
          <p className="text-sm text-gray-600 mt-1">
            Monitor and manage data processing jobs
          </p>
        </div>
        <button
          onClick={addSampleJob}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Job
        </button>
      </div>

      {/* Queue Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {processingJobs.filter(job => job.status === 'pending').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Play className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Running</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {processingJobs.filter(job => job.status === 'running').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Completed</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {processingJobs.filter(job => job.status === 'completed').length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600">Errors</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {processingJobs.filter(job => job.status === 'error').length}
          </p>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Active Jobs</h3>
        </div>
        
        {processingJobs.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No Jobs in Queue</h3>
            <p className="text-gray-400">Processing jobs will appear here when added</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {processingJobs.map((job) => (
              <div key={job.id} className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{job.name}</h4>
                      <p className="text-sm text-gray-500">
                        {PROCESSING_JOB_TYPES[job.type]} • Started at {formatTime(job.startTime)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full",
                      STATUS_COLORS[job.status]
                    )}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    
                    {job.status === 'running' && (
                      <button
                        onClick={() => pauseJob(job.id)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Pause job"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    
                    {job.status === 'pending' && (
                      <button
                        onClick={() => resumeJob(job.id)}
                        className="text-gray-400 hover:text-green-500 transition-colors"
                        title="Resume job"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    
                    {job.status === 'error' && (
                      <button
                        onClick={() => retryJob(job.id)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                        title="Retry job"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        job.status === 'completed' ? "bg-green-500" :
                        job.status === 'error' ? "bg-red-500" :
                        job.status === 'running' ? "bg-blue-500" :
                        "bg-gray-400"
                      )}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
                
                {/* Duration and Error */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Duration: {formatDuration(job.startTime, job.endTime)}
                  </span>
                  {job.error && (
                    <span className="text-red-600 text-xs">
                      Error: {job.error}
                    </span>
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

export default ProcessingTab;
