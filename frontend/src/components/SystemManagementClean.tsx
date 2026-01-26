import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  Shield, 
  Settings, 
  FileText, 
  Key, 
  Database, 
  Server,
  RefreshCw
} from 'lucide-react';
import AdminDashboard from './system/AdminDashboard';
import UploadTab from './system/UploadTab';
import MetadataTab from './system/MetadataTab';
import ProcessingTab from './system/ProcessingTab';
import { DatabaseTab } from './system/DatabaseTab';
import { useSystemState } from '../hooks/useSystemState';
import { useFileUpload } from '../hooks/useFileUpload';
import { useMetadataParser } from '../hooks/useMetadataParser';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Admin Dashboard', icon: BarChart3 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'roles', label: 'Role Management', icon: Shield },
  { id: 'settings', label: 'System Settings', icon: Settings },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
  { id: 'apikeys', label: 'API Keys', icon: Key },
  { id: 'database', label: 'Database Management', icon: Database },
  { id: 'server', label: 'Server Status', icon: Server },
];

const SystemManagementClean: React.FC = () => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const { activeTab, setActiveTab } = useSystemState();
  const fileUploadHook = useFileUpload();
  const metadataHook = useMetadataParser();

  const renderContent = () => {
    switch (activeNav) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
            <p className="text-gray-600">User management interface coming soon...</p>
          </div>
        );
      case 'roles':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Role Management</h2>
            <p className="text-gray-600">Role management interface coming soon...</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h2>
            <p className="text-gray-600">System settings interface coming soon...</p>
          </div>
        );
      case 'audit':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h2>
            <p className="text-gray-600">Audit logs interface coming soon...</p>
          </div>
        );
      case 'apikeys':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">API Keys</h2>
            <p className="text-gray-600">API keys management interface coming soon...</p>
          </div>
        );
      case 'database':
        return <DatabaseTab />;
      case 'server':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Server Status</h2>
            <p className="text-gray-600">Server status monitoring coming soon...</p>
          </div>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-white shadow-xl border-r border-gray-200 min-h-screen">
          {/* Brand Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-2">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GeoSpatial</h1>
                <p className="text-xs text-gray-500">System Admin</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105'
                      : 'bg-green-50 text-gray-700 hover:bg-green-100 hover:shadow-md'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-green-600'}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Top Header */}
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Comprehensive system management and monitoring
                  </p>
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <RefreshCw className="h-4 w-4" />
                  <span className="font-medium">Refresh Stats</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemManagementClean;
