import React from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';

const SystemHeader: React.FC = () => {
  const { uploadedFiles } = useFileUpload();
  const completedFiles = uploadedFiles.filter(f => f.status === 'completed').length;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload and manage satellite imagery, boundaries, and metadata
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {completedFiles} files processed
          </span>
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default SystemHeader;
