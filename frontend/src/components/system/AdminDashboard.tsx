import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Database, 
  HardDrive, 
  Activity,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Shield,
  Settings,
  FileText,
  Key,
  Server,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react';
import { getApiBaseUrl, getAuthHeaders } from '@/lib/api';

interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  databaseResponseTime: number;
  storageUsed: number;
  storageTotal: number;
  apiCalls: number;
  errorRate: number;
}

interface SystemPerformance {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
}

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  details: string;
  metrics?: string;
}

interface SecurityEvent {
  id: string;
  type: string;
  action: string;
  ipAddress: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

interface SystemAlert {
  id: string;
  level: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalUsers: 0,
    activeUsers: 0,
    databaseResponseTime: 0,
    storageUsed: 0,
    storageTotal: 100,
    apiCalls: 0,
    errorRate: 0
  });

  const [performance, setPerformance] = useState<SystemPerformance>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkUsage: 0
  });

  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Django Backend',
      status: 'healthy',
      details: '8 connections',
      metrics: '122ms'
    },
    {
      name: 'PostgreSQL Database',
      status: 'healthy',
      details: '44 sessions',
      metrics: '99.9% uptime'
    },
    {
      name: 'Static Storage',
      status: 'healthy',
      details: '19.0% used',
      metrics: '0.1 GB / 100GB'
    },
    {
      name: 'API Gateway',
      status: 'healthy',
      details: '132 requests',
      metrics: '0.34% errors'
    }
  ]);

  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  const fetchSystemData = async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      // Fetch system status
      const statusResponse = await fetch(`${apiBaseUrl}/system/status/`, { headers });
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        if (statusData.success) {
          // Update metrics from API response
          setMetrics(prev => ({
            ...prev,
            totalUsers: statusData.data?.total_users || 0,
            activeUsers: statusData.data?.active_users || 0,
            databaseResponseTime: statusData.data?.db_response_time || 0,
            storageUsed: statusData.data?.storage_used || 0,
            storageTotal: statusData.data?.storage_total || 100,
            apiCalls: statusData.data?.api_calls || 0,
            errorRate: statusData.data?.error_rate || 0
          }));

          // Update performance metrics
          if (statusData.data?.performance) {
            setPerformance({
              cpuUsage: statusData.data.performance.cpu || 0,
              memoryUsage: statusData.data.performance.memory || 0,
              diskUsage: statusData.data.performance.disk || 0,
              networkUsage: statusData.data.performance.network || 0
            });
          }
        }
      }

      // Mock security events (replace with actual API call)
      setSecurityEvents([
        {
          id: 'e5eb3c1e-30cd-4966-928e-9b9a15b8e0f5',
          type: 'LOGIN',
          action: 'LOGIN SUCCESS',
          ipAddress: '41.174.184.62',
          timestamp: new Date().toLocaleTimeString(),
          status: 'success'
        },
        {
          id: 'a1b2c3d4-5678-90ef-ghij-klmnopqrstuv',
          type: 'LOGIN',
          action: 'LOGIN SUCCESS',
          ipAddress: '192.168.1.100',
          timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
          status: 'success'
        }
      ]);

      // Mock alerts (replace with actual API call)
      setAlerts([
        {
          id: '1',
          level: 'success',
          title: 'Database Online',
          message: 'PostgreSQL database is operational with 8 active connections',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'error':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 rounded-lg p-3">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{metrics.totalUsers}</div>
              <div className="text-sm text-gray-500">{metrics.activeUsers} active users</div>
            </div>
          </div>
        </div>

        {/* Database Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 rounded-lg p-3">
              <Database className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{metrics.databaseResponseTime}</div>
              <div className="text-sm text-gray-500">{metrics.databaseResponseTime}ms avg response</div>
            </div>
          </div>
        </div>

        {/* Storage Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 rounded-lg p-3">
              <HardDrive className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{metrics.storageUsed.toFixed(1)} GB</div>
              <div className="text-sm text-gray-500">{metrics.storageTotal}GB total</div>
            </div>
          </div>
        </div>

        {/* API Calls Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 rounded-lg p-3">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">{metrics.apiCalls}</div>
              <div className="text-sm text-gray-500">{metrics.errorRate.toFixed(2)}% error rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Performance and Service Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Performance Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">System Performance</h3>
              <p className="text-sm text-gray-500">Real-time resource usage</p>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4 mt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">CPU Usage</span>
              <span className="text-sm font-bold text-gray-900">{performance.cpuUsage.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${performance.cpuUsage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Memory Usage</span>
              <span className="text-sm font-bold text-gray-900">{performance.memoryUsage.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${performance.memoryUsage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Disk Usage</span>
              <span className="text-sm font-bold text-gray-900">{performance.diskUsage.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${performance.diskUsage}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Network Usage</span>
              <span className="text-sm font-bold text-gray-900">{performance.networkUsage.toFixed(2)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${performance.networkUsage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Service Status Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Service Status</h3>
              <p className="text-sm text-gray-500">Live platform service health</p>
            </div>
            <Server className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4 mt-6">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{service.name}</div>
                    <div className="text-xs text-gray-500">{service.details}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-700">{service.metrics}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Events and Alerts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Security Events Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recent Security Events</h3>
              <p className="text-sm text-gray-500">Live audit logs</p>
            </div>
            <Shield className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3 mt-6 max-h-64 overflow-y-auto">
            {securityEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className={`h-2 w-2 rounded-full ${getStatusBgColor(event.status)}`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{event.action}</div>
                    <div className="text-xs text-gray-500">{event.id.substring(0, 8)}... • {event.ipAddress}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{event.timestamp}</div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">System Alerts</h3>
              <p className="text-sm text-gray-500">Platform health notifications</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3 mt-6 max-h-64 overflow-y-auto">
            {alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                alert.level === 'success' ? 'bg-green-50 border-green-500' :
                alert.level === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                'bg-red-50 border-red-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`text-sm font-bold ${
                      alert.level === 'success' ? 'text-green-800' :
                      alert.level === 'warning' ? 'text-yellow-800' :
                      'text-red-800'
                    }`}>
                      {alert.level.toUpperCase()}
                    </div>
                    <div className="text-sm font-medium text-gray-900 mt-1">{alert.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{alert.message}</div>
                  </div>
                  <div className="text-xs text-gray-500 ml-4">{alert.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
