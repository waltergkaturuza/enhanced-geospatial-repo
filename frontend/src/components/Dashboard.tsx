import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { ApprovalStatusBanner } from './ApprovalStatusBanner';
import { getApiBaseUrl, getAuthHeaders } from '@/lib/api';
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
  const [stats, setStats] = useState([
    {
      title: 'Active Projects',
      value: '0',
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Data Downloads',
      value: '0',
      icon: Download,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Analysis Jobs',
      value: '0',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Storage Used',
      value: '0 GB',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]);
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: string;
    type: string;
    title: string;
    timestamp: string;
    icon: any;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      // Fetch stats
      const statsResponse = await fetch(`${apiBaseUrl}/dashboard/stats/`, { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats([
            {
              title: 'Active Projects',
              value: statsData.data.active_projects.toString(),
              icon: Globe,
              color: 'text-blue-600',
              bgColor: 'bg-blue-100'
            },
            {
              title: 'Data Downloads',
              value: statsData.data.data_downloads.toString(),
              icon: Download,
              color: 'text-green-600',
              bgColor: 'bg-green-100'
            },
            {
              title: 'Analysis Jobs',
              value: statsData.data.analysis_jobs.toString(),
              icon: BarChart3,
              color: 'text-purple-600',
              bgColor: 'bg-purple-100'
            },
            {
              title: 'Storage Used',
              value: statsData.data.storage_used,
              icon: Database,
              color: 'text-orange-600',
              bgColor: 'bg-orange-100'
            }
          ]);
        }
      }

      // Fetch recent activity
      const activityResponse = await fetch(`${apiBaseUrl}/dashboard/activity/`, { headers });
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success) {
          const iconMap: Record<string, any> = {
            'download': Download,
            'analysis': BarChart3,
            'upload': MapPin,
            'purchase': ShoppingCart
          };
          
          const formattedActivity = activityData.data.map((activity: any) => ({
            id: activity.id,
            type: activity.type,
            title: activity.title,
            timestamp: activity.timestamp,
            icon: iconMap[activity.icon] || Activity
          }));
          
          setRecentActivity(formattedActivity);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
        // Superusers always have access
        const isSuperuser = (user as any)?.isSuperuser || user.role === 'admin' || user.role === 'super_admin';
        if (isSuperuser) return true;
        
        const adminAccess = hasPermission('admin_access');
        const manageUsers = hasPermission('manage_users');
        console.log('System Management Access Check:', {
          user: user,
          isSuperuser,
          adminAccess,
          manageUsers,
          finalAccess: adminAccess || manageUsers
        });
        return adminAccess || manageUsers;
      })(),
      color: 'from-gray-500 to-gray-700'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-screen-2xl mx-auto py-8" style={{ paddingLeft: '10mm', paddingRight: '10mm' }}>
        {/* Approval Status Banner */}
        <ApprovalStatusBanner />
        
        {/* Welcome Header with Facebook Blue Top Bar */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-3xl"></div>
          <div className="relative backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            {/* Facebook Blue Top Bar */}
            <div className="w-full h-2" style={{ backgroundColor: '#1877F2' }}></div>
            <div className="bg-white/60 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Welcome back, {user.firstName}!
                  </h1>
                  <p className="mt-2 text-base text-gray-600 flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-blue-500" />
                    Here's what's happening with your geospatial data today.
                  </p>
                </div>
                <div className="hidden lg:flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {user.firstName.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Futuristic Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {isLoading ? (
            <div className="col-span-4 text-center py-8 text-gray-500">
              Loading statistics...
            </div>
          ) : (
            stats.map((stat, index) => (
            <div 
              key={stat.title} 
              className="group relative bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100/50 hover:border-blue-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                   style={{ background: `linear-gradient(135deg, ${stat.color.replace('text-', 'rgba(').replace('-600', ', 0.05)')} 0%, transparent 100%)` }}>
              </div>
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.bgColor} rounded-lg p-3 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">{stat.title}</div>
                
                {/* Subtle bottom accent */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 ${stat.bgColor} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
              </div>
            </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Module Access Cards - Wider Layout */}
          <div className="xl:col-span-3">
            <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full mr-4"></div>
              Available Modules
            </h2>
              <div className="text-sm text-gray-500">
                {moduleCards.filter(m => m.hasAccess).length} of {moduleCards.length} modules available
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {moduleCards.map((module, index) => (
              <div
                key={module.title}
                className={`group relative rounded-2xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 ${
                  module.hasAccess 
                    ? 'cursor-pointer hover:shadow-2xl' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => {
                  if (module.hasAccess) {
                    window.location.href = module.href;
                  }
                }}
              >
                {/* Glowing border effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl`}></div>
                
                <div className="relative bg-white rounded-2xl border border-gray-200/50 group-hover:border-transparent transition-all duration-300 h-full">
                  {/* Icon Header with Gradient */}
                  <div className={`relative h-36 bg-gradient-to-br ${module.color} p-6 overflow-hidden`}>
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent_50%)]"></div>
                    </div>
                    
                    <div className="relative z-10">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 w-fit mb-3 group-hover:scale-110 transition-transform duration-300">
                        <module.icon className="h-7 w-7 text-white drop-shadow-lg" />
                      </div>
                      <h3 className="text-lg font-bold text-white drop-shadow-md">{module.title}</h3>
                    </div>
                    
                    {/* Decorative corner element */}
                    <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-500"></div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-5">
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {module.description}
                    </p>
                    
                    {module.hasAccess ? (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-green-600 flex items-center">
                          <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                          Active
                        </span>
                        <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs font-medium text-gray-400">
                        <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Upgrade Required
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>

          {/* Sidebar - Modern Design */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              {/* Decorative element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2 mr-3">
                    <Activity className="h-4 w-4 text-white" />
                  </div>
                  Recent Activity
                </h3>
              </div>
              
              <div className="divide-y divide-gray-100">
                {isLoading ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    Loading activity...
                  </div>
                ) : recentActivity.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    No recent activity
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div 
                      key={activity.id} 
                      className="px-6 py-4 hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer group"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="bg-gray-100 group-hover:bg-blue-100 rounded-lg p-2 transition-colors">
                            <activity.icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium group-hover:text-blue-900">{activity.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="px-6 py-3 bg-gradient-to-r from-blue-50/50 to-purple-50/50 backdrop-blur-sm">
                <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center group">
                  View all activity
                  <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Actions - Modern Design */}
            <div className="relative bg-gradient-to-br from-white to-blue-50/30 rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-2 mr-3">
                    <Settings className="h-4 w-4 text-white" />
                  </div>
                  Quick Actions
                </h3>
              </div>
              
              <div className="px-6 py-4 space-y-2">
              {hasModuleAccess('imagery') && (
                <button 
                  onClick={() => window.location.href = '/imagery'}
                  className="w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-gradient-to-r from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 border border-gray-200/50 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="flex items-center">
                    <Globe className="h-4 w-4 mr-3 text-blue-600" />
                    Search Imagery
                  </span>
                  <svg className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {hasModuleAccess('imagery') && (
                <button 
                  onClick={() => window.location.href = '/files'}
                  className="w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-gradient-to-r from-white to-teal-50 hover:from-teal-50 hover:to-teal-100 border border-gray-200/50 hover:border-teal-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="flex items-center">
                    <Upload className="h-4 w-4 mr-3 text-teal-600" />
                    Upload Images
                  </span>
                  <svg className="h-4 w-4 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {hasModuleAccess('analytics') && (
                <button 
                  onClick={() => window.location.href = '/analytics'}
                  className="w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-gradient-to-r from-white to-purple-50 hover:from-purple-50 hover:to-purple-100 border border-gray-200/50 hover:border-purple-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-3 text-purple-600" />
                    Run Analysis
                  </span>
                  <svg className="h-4 w-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {hasModuleAccess('analytics') && (
                <button 
                  onClick={() => window.location.href = '/analytics?tab=process'}
                  className="w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-gradient-to-r from-white to-indigo-50 hover:from-indigo-50 hover:to-indigo-100 border border-gray-200/50 hover:border-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="flex items-center">
                    <Settings className="h-4 w-4 mr-3 text-indigo-600" />
                    Process Images
                  </span>
                  <svg className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {hasModuleAccess('business') && (
                <button 
                  onClick={() => window.location.href = '/store'}
                  className="w-full group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-gray-700 bg-gradient-to-r from-white to-green-50 hover:from-green-50 hover:to-green-100 border border-gray-200/50 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="flex items-center">
                    <ShoppingCart className="h-4 w-4 mr-3 text-green-600" />
                    Browse Store
                  </span>
                  <svg className="h-4 w-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>

            {/* Account Summary - Premium Card */}
            <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.3),transparent_50%)]"></div>
              
              <div className="relative px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  Account Summary
                </h3>
              </div>
              
              <div className="relative px-6 py-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-300">Subscription:</span>
                <span className="font-bold text-white capitalize px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-xs">
                  {(user as any)?.isSuperuser || user.role === 'admin' || user.role === 'super_admin' 
                    ? 'Enterprise (Superuser)' 
                    : user.subscriptionPlan}
                </span>
              </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Role:</span>
                  <span className="font-semibold text-white capitalize">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-300">Member Since:</span>
                  <span className="font-semibold text-white">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                  <button 
                    onClick={() => window.location.href = '/profile'}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Manage Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
