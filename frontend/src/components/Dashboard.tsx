import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { ApprovalStatusBanner } from './ApprovalStatusBanner';
import { 
  Globe, 
  BarChart3, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  Activity,
  MapPin,
  Database,
  Download,
  Upload,
  Settings,
  FolderTree
} from 'lucide-react';

/**
 * Dashboard Component
 * 
 * Main dashboard view that provides an overview of the user's access,
 * recent activity, and quick navigation to different modules.
 */
export const Dashboard: React.FC = () => {
  const { user, hasModuleAccess, hasPermission } = useAuthContext();

  console.log('Dashboard render - User state:', {
    hasUser: !!user,
    userRole: user?.role,
    userModules: user?.modules
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            Please log in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // Quick stats - in real app, these would come from API
  const stats = [
    {
      title: 'Active Projects',
      value: '12',
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Data Downloads',
      value: '48',
      icon: Download,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Analysis Jobs',
      value: '6',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Storage Used',
      value: '2.4 GB',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  // Module cards with access control
  const moduleCards = [
    {
      title: 'Imagery Explorer',
      description: 'Search and explore satellite imagery datasets',
      icon: Globe,
      href: '/imagery',
      hasAccess: hasModuleAccess('imagery'),
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Upload Images',
      description: 'Upload satellite imagery and UAV data',
      icon: Upload,
      href: '/files',
      hasAccess: hasModuleAccess('imagery'),
      color: 'from-teal-500 to-cyan-600'
    },
    {
      title: 'Analytics Suite',
      description: 'Advanced geospatial analysis and processing',
      icon: BarChart3,
      href: '/analytics',
      hasAccess: hasModuleAccess('analytics'),
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Process Imagery',
      description: 'Process and analyze uploaded imagery data',
      icon: Settings,
      href: '/analytics?tab=process',
      hasAccess: hasModuleAccess('analytics'),
      color: 'from-indigo-500 to-purple-600'
    },
    {
      title: 'File Manager',
      description: 'Browse and manage uploaded imagery files',
      icon: FolderTree,
      href: '/files',
      hasAccess: hasModuleAccess('imagery'),
      color: 'from-emerald-500 to-teal-600'
    },
    {
      title: 'Business Intelligence',
      description: 'Business insights and reporting tools',
      icon: TrendingUp,
      href: '/business',
      hasAccess: hasModuleAccess('business'),
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Data Store',
      description: 'Purchase and manage geospatial data products',
      icon: ShoppingCart,
      href: '/store',
      hasAccess: hasModuleAccess('business'),
      color: 'from-orange-500 to-red-600'
    },
    {
      title: 'System Management',
      description: 'System administration and user management',
      icon: Users,
      href: '/admin',
      hasAccess: (() => {
        const adminAccess = hasPermission('admin_access');
        const manageUsers = hasPermission('manage_users');
        console.log('System Management Access Check:', {
          user: user,
          adminAccess,
          manageUsers,
          finalAccess: adminAccess || manageUsers
        });
        return adminAccess || manageUsers;
      })(),
      color: 'from-gray-500 to-gray-700'
    }
  ];

  // Recent activity - mock data
  const recentActivity = [
    {
      id: 1,
      type: 'download',
      title: 'Downloaded Landsat 8 imagery for Zimbabwe',
      timestamp: '2 hours ago',
      icon: Download
    },
    {
      id: 2,
      type: 'analysis',
      title: 'Completed NDVI analysis job',
      timestamp: '5 hours ago',
      icon: BarChart3
    },
    {
      id: 3,
      type: 'upload',
      title: 'Uploaded custom boundary data',
      timestamp: '1 day ago',
      icon: MapPin
    },
    {
      id: 4,
      type: 'purchase',
      title: 'Purchased high-resolution imagery',
      timestamp: '2 days ago',
      icon: ShoppingCart
    }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Approval Status Banner */}
      <ApprovalStatusBanner />
      
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Here's what's happening with your geospatial data today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.bgColor} rounded-md p-3`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.title}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Access Cards */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Available Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {moduleCards.map((module) => (
              <div
                key={module.title}
                className={`relative bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-105 ${
                  module.hasAccess 
                    ? 'cursor-pointer hover:shadow-lg' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (module.hasAccess) {
                    window.location.href = module.href;
                  }
                }}
              >
                <div className={`h-32 bg-gradient-to-br ${module.color} p-6 text-white`}>
                  <module.icon className="h-8 w-8 mb-3" />
                  <h3 className="text-lg font-semibold">{module.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    {module.description}
                  </p>
                  {module.hasAccess ? (
                    <div className="flex items-center text-sm font-medium text-indigo-600">
                      Access Available
                      <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm font-medium text-gray-400">
                      Upgrade Required
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Activity
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <activity.icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50">
              <button className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">
                View all activity
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="px-6 py-4 space-y-3">
              {hasModuleAccess('imagery') && (
                <button 
                  onClick={() => window.location.href = '/imagery'}
                  className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <span className="flex items-center">
                    <Globe className="h-4 w-4 mr-2" />
                    Search Imagery
                  </span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {hasModuleAccess('imagery') && (
                <button 
                  onClick={() => window.location.href = '/files'}
                  className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <span className="flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Images
                  </span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {hasModuleAccess('analytics') && (
                <button 
                  onClick={() => window.location.href = '/analytics'}
                  className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <span className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Run Analysis
                  </span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {hasModuleAccess('analytics') && (
                <button 
                  onClick={() => window.location.href = '/analytics?tab=process'}
                  className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <span className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Process Images
                  </span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {hasModuleAccess('business') && (
                <button className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  <span className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Browse Store
                  </span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Account Summary */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Account Summary</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Subscription:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {user.subscriptionPlan}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Role:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <button className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-indigo-700">
                  Manage Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
