import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Download, RefreshCw, Shield, User, Lock, AlertTriangle } from 'lucide-react';
import { getApiBaseUrl, getAuthHeaders } from '@/lib/api';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  ipAddress: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      setLogs([
        {
          id: 'e5eb3c1e-30cd-4966-928e-9b9a15b8e0f5',
          action: 'LOGIN SUCCESS',
          user: 'user@example.com',
          ipAddress: '41.174.184.62',
          timestamp: new Date().toLocaleString(),
          status: 'success',
        },
        {
          id: 'a1b2c3d4-5678-90ef-ghij-klmnopqrstuv',
          action: 'FILE_UPLOAD',
          user: 'admin@example.com',
          ipAddress: '192.168.1.100',
          timestamp: new Date(Date.now() - 3600000).toLocaleString(),
          status: 'success',
        },
        {
          id: 'b2c3d4e5-6789-01fg-hijk-lmnopqrstuvw',
          action: 'LOGIN_FAILED',
          user: 'unknown@example.com',
          ipAddress: '10.0.0.1',
          timestamp: new Date(Date.now() - 7200000).toLocaleString(),
          status: 'error',
        },
      ]);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesAction;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <Lock className="h-4 w-4" />;
    if (action.includes('USER')) return <User className="h-4 w-4" />;
    if (action.includes('SECURITY')) return <Shield className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full mr-4"></div>
            Audit Logs
          </h2>
          <p className="text-gray-600 mt-2">Live audit logs from system</p>
        </div>
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="LOGIN">Login Events</option>
            <option value="FILE_UPLOAD">File Uploads</option>
            <option value="USER">User Actions</option>
            <option value="SECURITY">Security Events</option>
          </select>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-12 text-center">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No logs found
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-lg ${getStatusColor(log.status)}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-gray-900">{log.action}</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">{log.user}</span>
                        <span className="mx-2">•</span>
                        <span>{log.ipAddress}</span>
                        <span className="mx-2">•</span>
                        <span>{log.id.substring(0, 8)}...</span>
                      </div>
                      {log.details && (
                        <div className="mt-2 text-xs text-gray-500">{log.details}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 ml-4">
                    {log.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
