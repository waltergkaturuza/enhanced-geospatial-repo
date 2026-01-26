import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Activity, HardDrive, TrendingUp } from 'lucide-react';
import { getApiBaseUrl, getAuthHeaders } from '@/lib/api';

const DatabaseManagement: React.FC = () => {
  const [stats, setStats] = useState({
    totalSize: 0,
    usedSize: 0,
    tableCount: 0,
    connectionCount: 0,
    queryTime: 0,
  });

  const [tables, setTables] = useState([
    { name: 'imagery_satelliteimage', rows: 1247, size: '2.4 GB' },
    { name: 'imagery_administrativeboundary', rows: 63, size: '45 MB' },
    { name: 'auth_user', rows: 49, size: '12 KB' },
    { name: 'imagery_aoi', rows: 12, size: '8 MB' },
  ]);

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();
      
      // Fetch database stats from dedicated endpoint
      const statsResponse = await fetch(`${apiBaseUrl}/admin/database-stats/`, { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          const data = statsData.data;
          setStats({
            totalSize: data.total_size_gb || 100,
            usedSize: data.database_size_gb || 0,
            tableCount: data.tables?.length || 0,
            connectionCount: data.connection_count || 0,
            queryTime: data.avg_query_time_ms || 0,
          });
          
          // Update tables with real data
          if (data.tables && data.tables.length > 0) {
            setTables(data.tables);
          }
        }
      } else {
        console.error('Failed to fetch database stats:', statsResponse.status);
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
    }
  };

  return (
    <div className="p-6 space-y-6" style={{ paddingLeft: '10mm', paddingRight: '10mm' }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full mr-4"></div>
            Database Management
          </h2>
          <p className="text-gray-600 mt-2">Monitor and manage database operations</p>
        </div>
        <button
          onClick={fetchDatabaseStats}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Database Size</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.usedSize.toFixed(1)} GB</p>
              <p className="text-xs text-gray-500 mt-1">of {stats.totalSize} GB</p>
            </div>
            <HardDrive className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tables</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.tableCount}</p>
            </div>
            <Database className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Connections</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.connectionCount}</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Query Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.queryTime}ms</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Database Tables</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {tables.map((table, index) => (
            <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">{table.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{table.rows.toLocaleString()} rows</div>
                </div>
                <div className="text-sm font-medium text-gray-700">{table.size}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatabaseManagement;
