/**
 * Business Intelligence Dashboard
 * World-class analytics, insights, and reporting platform
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Download,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
  Brain,
  FileText,
  Calendar,
  RefreshCw,
  Filter,
  Download as DownloadIcon,
  Sparkles,
  AlertCircle,
  Target,
  Eye,
  ShoppingCart,
  CreditCard,
  Loader2,
  Map,
  Database,
  Clock
} from 'lucide-react';
import { AnalyticsAPI } from '@/lib/analytics.api';
import type { DashboardOverview, RealtimeMetrics, AIInsight } from '@/lib/analytics.api';

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}> = ({ title, value, change, trend, icon, color, subtitle }) => {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl shadow-lg p-6 text-white`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-lg">
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
            trend === 'up' ? 'bg-green-500/30' : trend === 'down' ? 'bg-red-500/30' : 'bg-gray-500/30'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-bold">{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-white/80 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold mb-1">{value}</p>
        {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
      </div>
    </div>
  );
};

// Simple Line Chart Component
const SimpleLineChart: React.FC<{
  data: Array<{ date: string; value: number }>;
  color: string;
  label: string;
}> = ({ data, color, label }) => {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / maxValue) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="font-bold text-gray-900 mb-4">{label}</h3>
      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.2"
            />
          ))}
          
          {/* Area fill */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill={`url(#gradient-${color})`}
            opacity="0.3"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

// AI Insight Card
const InsightCard: React.FC<{ insight: AIInsight }> = ({ insight }) => {
  const priorityColors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-blue-500 bg-blue-50'
  };

  const iconColors = {
    critical: 'text-red-600',
    high: 'text-orange-600',
    medium: 'text-yellow-600',
    low: 'text-blue-600'
  };

  return (
    <div className={`border-l-4 rounded-lg p-4 ${priorityColors[insight.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Brain className={`w-5 h-5 ${iconColors[insight.priority as keyof typeof iconColors]}`} />
          <h4 className="font-bold text-gray-900">{insight.title}</h4>
        </div>
        <span className="text-xs font-semibold text-gray-600 px-2 py-1 bg-white rounded-full">
          {insight.confidence}% confidence
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
      {insight.recommended_actions && insight.recommended_actions.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Recommended Actions:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {insight.recommended_actions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Main BI Dashboard
const BusinessIntelligence: React.FC = () => {
  const { user, hasModuleAccess } = useAuthContext();
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetrics | null>(null);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'users' | 'products' | 'geospatial'>('overview');

  useEffect(() => {
    loadDashboardData();
    
    // Setup realtime updates every 30 seconds
    const interval = setInterval(loadRealtimeMetrics, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, insightsData] = await Promise.all([
        AnalyticsAPI.getDashboardOverview(selectedPeriod),
        AnalyticsAPI.getAIInsights()
      ]);

      setDashboard(dashboardData);
      setInsights(insightsData);
      await loadRealtimeMetrics();
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeMetrics = async () => {
    const metrics = await AnalyticsAPI.getRealtimeMetrics();
    setRealtimeMetrics(metrics);
  };

  if (!user || !hasModuleAccess('analytics')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Access Required</h2>
          <p className="text-gray-600">You need analytics module access to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg">
                  <BarChart3 className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold">Business Intelligence</h1>
              </div>
              <p className="text-indigo-100">Advanced analytics, insights, and predictive intelligence</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:ring-2 focus:ring-white/50"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={365}>Last year</option>
              </select>
              
              <button
                onClick={loadDashboardData}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Realtime Bar */}
      {realtimeMetrics && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                  <span className="font-semibold">LIVE</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{realtimeMetrics.active_users_now} active now</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>{realtimeMetrics.orders_last_hour} orders (last hour)</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>${realtimeMetrics.revenue_last_hour.toFixed(2)} revenue (last hour)</span>
                </div>
              </div>
              <span className="text-xs opacity-75">
                Updated: {new Date(realtimeMetrics.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'sales', label: 'Sales', icon: DollarSign },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'geospatial', label: 'Geospatial', icon: Map }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && dashboard && (
          <div className="space-y-6">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Total Revenue"
                value={`$${dashboard.kpis.total_revenue.value.toLocaleString()}`}
                change={dashboard.kpis.total_revenue.change}
                trend={dashboard.kpis.total_revenue.trend}
                icon={<DollarSign className="w-6 h-6" />}
                color="from-green-500 to-emerald-600"
              />
              
              <KPICard
                title="Total Orders"
                value={dashboard.kpis.total_orders.value.toLocaleString()}
                subtitle={`${dashboard.kpis.total_orders.completion_rate.toFixed(0)}% completion rate`}
                icon={<ShoppingCart className="w-6 h-6" />}
                color="from-blue-500 to-cyan-600"
              />
              
              <KPICard
                title="Active Users"
                value={dashboard.kpis.total_users.active.toLocaleString()}
                subtitle={`of ${dashboard.kpis.total_users.value} total`}
                icon={<Users className="w-6 h-6" />}
                color="from-purple-500 to-pink-600"
              />
              
              <KPICard
                title="Data Processed"
                value={`${dashboard.kpis.data_processed_gb.value.toFixed(1)} GB`}
                icon={<Database className="w-6 h-6" />}
                color="from-orange-500 to-red-600"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SimpleLineChart
                data={dashboard.charts.revenue_by_day.map(d => ({ date: d.date, value: d.revenue }))}
                color="#3B82F6"
                label="Revenue Trend"
              />
              
              <SimpleLineChart
                data={dashboard.charts.user_growth.map(d => ({ date: d.date, value: d.new_users }))}
                color="#8B5CF6"
                label="User Growth"
              />
            </div>

            {/* Top Products & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Top Performing Products
                </h3>
                <div className="space-y-3">
                  {dashboard.charts.top_products.map((product, idx) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                          <p className="text-xs text-gray-600">{product.purchases} purchases</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">${product.revenue.toFixed(0)}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-1 h-3 rounded-full ${
                                i < product.rating ? 'bg-yellow-400' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-Powered Insights
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {insights.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No insights available yet</p>
                      <p className="text-sm mt-1">AI is analyzing your data...</p>
                    </div>
                  ) : (
                    insights.map((insight, idx) => (
                      <InsightCard key={idx} insight={insight} />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Downloads</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="font-bold text-gray-900">{dashboard.kpis.total_downloads.value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-bold text-green-600">{dashboard.kpis.total_downloads.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-bold text-blue-600">{dashboard.kpis.total_downloads.success_rate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">User Activity</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Users</span>
                    <span className="font-bold text-gray-900">{dashboard.kpis.total_users.value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active</span>
                    <span className="font-bold text-green-600">{dashboard.kpis.total_users.active}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Rate</span>
                    <span className="font-bold text-purple-600">{dashboard.kpis.total_users.active_rate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Order Status</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-bold text-gray-900">{dashboard.kpis.total_orders.value}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="font-bold text-green-600">{dashboard.kpis.total_orders.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completion</span>
                    <span className="font-bold text-blue-600">{dashboard.kpis.total_orders.completion_rate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export & Actions Footer */}
      <div className="fixed bottom-6 right-6" style={{ zIndex: 100 }}>
        <div className="flex flex-col gap-3">
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
            <DownloadIcon className="w-5 h-5" />
            Export Dashboard
          </button>
          <button className="px-6 py-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessIntelligence;
