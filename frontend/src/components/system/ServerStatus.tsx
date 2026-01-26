import React, { useState, useEffect } from 'react';
import { Server, CheckCircle, AlertTriangle, Activity, RefreshCw } from 'lucide-react';
import { getApiBaseUrl, getAuthHeaders } from '@/lib/api';

interface ServerInfo {
  name: string;
  status: 'online' | 'offline' | 'warning';
  uptime: string;
  cpu: number;
  memory: number;
  disk: number;
}

const ServerStatus: React.FC = () => {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchServerStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchServerStatus = async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();
      
      const statusResponse = await fetch(`${apiBaseUrl}/system/status/`, { headers });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.success && statusData.data) {
          const data = statusData.data;
          
          // Transform service status to server info
          const serverList: ServerInfo[] = [];
          
          if (data.services && Array.isArray(data.services)) {
            data.services.forEach((service: any) => {
              // Extract performance metrics if available
              const performance = data.performance || {};
              
              serverList.push({
                name: service.name,
                status: service.status === 'healthy' ? 'online' : 'offline',
                uptime: service.metrics || 'N/A',
                cpu: performance.cpu || 0,
                memory: performance.memory || 0,
                disk: performance.disk || 0,
              });
            });
          }
          
          // Add system performance as a server entry if we have it
          if (data.performance) {
            serverList.push({
              name: 'System Performance',
              status: 'online',
              uptime: '100%',
              cpu: data.performance.cpu || 0,
              memory: data.performance.memory || 0,
              disk: data.performance.disk || 0,
            });
          }
          
          setServers(serverList.length > 0 ? serverList : []);
        } else {
          setServers([]);
        }
      } else {
        setServers([]);
      }
    } catch (error) {
      console.error('Error fetching server status:', error);
      setServers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6" style={{ paddingLeft: '10mm', paddingRight: '10mm' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full mr-4"></div>
            Server Status
          </h2>
          <p className="text-gray-600 mt-2">Monitor server health and performance</p>
        </div>
        <button 
          onClick={fetchServerStatus}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {isLoading && servers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            <p className="mt-2 text-sm text-gray-600">Loading server status...</p>
          </div>
        </div>
      ) : servers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Server className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">No server data available</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {servers.map((server, index) => (
          <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 rounded-lg p-3">
                  <Server className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{server.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(server.status)}`}>
                      {server.status.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">Uptime: {server.uptime}</span>
                  </div>
                </div>
              </div>
              {server.status === 'online' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">CPU</span>
                  <span className="text-sm font-bold text-gray-900">{server.cpu}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                    style={{ width: `${server.cpu}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Memory</span>
                  <span className="text-sm font-bold text-gray-900">{server.memory}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                    style={{ width: `${server.memory}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Disk</span>
                  <span className="text-sm font-bold text-gray-900">{server.disk}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                    style={{ width: `${server.disk}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};

export default ServerStatus;
