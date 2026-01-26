import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Shield, 
  Settings, 
  FileText, 
  Key, 
  Database, 
  Server 
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import UserManagement from './UserManagement';
import RoleManagement from '../admin/RoleManagement';
import SystemSettings from './SystemSettings';
import AuditLogs from './AuditLogs';
import APIKeys from './APIKeys';
import DatabaseManagement from './DatabaseManagement';
import ServerStatus from './ServerStatus';

type SystemTab = 'dashboard' | 'users' | 'roles' | 'settings' | 'audit' | 'api-keys' | 'database' | 'server';

interface NavItem {
  id: SystemTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Admin Dashboard', icon: BarChart3 },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'roles', label: 'Role Management', icon: Shield },
  { id: 'settings', label: 'System Settings', icon: Settings },
  { id: 'audit', label: 'Audit Logs', icon: FileText },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'database', label: 'Database Management', icon: Database },
  { id: 'server', label: 'Server Status', icon: Server },
];

const SystemManagement: React.FC = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SystemTab>('dashboard');

  // Detect URL path and set appropriate tab
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/roles')) {
      setActiveTab('roles');
    } else if (path.includes('/admin/approvals')) {
      setActiveTab('users'); // User Approvals is part of User Management
    } else if (path.includes('/admin/system')) {
      setActiveTab('dashboard');
    } else if (path === '/admin') {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'roles':
        return <RoleManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'audit':
        return <AuditLogs />;
      case 'api-keys':
        return <APIKeys />;
      case 'database':
        return <DatabaseManagement />;
      case 'server':
        return <ServerStatus />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-2">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GeoSpatial</h1>
                <p className="text-xs text-gray-500">System Admin</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg transform scale-105'
                      : 'bg-green-50 text-gray-700 hover:bg-green-100 hover:shadow-md'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-green-600'}`} />
                  <span className="text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-screen-2xl mx-auto" style={{ paddingLeft: '10mm', paddingRight: '10mm' }}>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SystemManagement;
