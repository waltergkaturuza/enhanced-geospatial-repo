import React from 'react';
import { CheckCircle, Info } from 'lucide-react';
import SystemStatusCard from './SystemStatusCard';

export const DatabaseTab: React.FC = () => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-medium text-gray-900 mb-6">Database Status</h2>
      
      {/* Database Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SystemStatusCard
          title="Imagery Data"
          stats={[
            { label: 'Total Scenes', value: '1,247' },
            { label: 'Storage Used', value: '2.4 TB' },
            { label: 'Last Updated', value: '2 hours ago' }
          ]}
        />

        <SystemStatusCard
          title="Boundaries"
          stats={[
            { label: 'Countries', value: '1' },
            { label: 'Provinces', value: '10' },
            { label: 'Districts', value: '63' }
          ]}
        />

        <SystemStatusCard
          title="System Health"
          stats={[
            { 
              label: 'Database', 
              value: 'Online', 
              status: 'online',
              statusColor: 'green'
            },
            { 
              label: 'Processing', 
              value: 'Active', 
              status: 'active',
              statusColor: 'green'
            },
            { 
              label: 'Storage', 
              value: '75% Full', 
              status: 'warning',
              statusColor: 'yellow'
            }
          ]}
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">Recent Database Activity</h3>
        </div>
        <div className="p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-500">15:30</span>
              <span>Added 23 new imagery scenes to database</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-500">14:15</span>
              <span>Updated administrative boundaries for Harare Province</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Info className="w-4 h-4 text-blue-500" />
              <span className="text-gray-500">13:45</span>
              <span>Database maintenance completed successfully</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-500">12:20</span>
              <span>Processed metadata for 15 Landsat scenes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
