import React from 'react';

interface SystemStat {
  label: string;
  value: string;
  status?: string;
  statusColor?: 'green' | 'yellow' | 'red';
}

interface SystemStatusCardProps {
  title: string;
  stats: SystemStat[];
}

export const SystemStatusCard: React.FC<SystemStatusCardProps> = ({ title, stats }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2">
        {stats.map((stat, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{stat.label}</span>
            {stat.status ? (
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  stat.statusColor === 'green' ? 'bg-green-500' :
                  stat.statusColor === 'yellow' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></div>
                <span className={`text-sm font-medium ${
                  stat.statusColor === 'green' ? 'text-green-600' :
                  stat.statusColor === 'yellow' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {stat.value}
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium">{stat.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemStatusCard;
