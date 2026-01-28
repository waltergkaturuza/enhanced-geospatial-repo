/**
 * Business Intelligence API Client
 * Analytics, dashboards, reports, and insights
 */

import { getApiBaseUrl, getAuthHeaders } from './api';

export interface KPIMetric {
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  label?: string;
}

export interface DashboardOverview {
  kpis: {
    total_revenue: KPIMetric;
    total_orders: KPIMetric & { completed: number; completion_rate: number };
    total_users: KPIMetric & { active: number; active_rate: number };
    total_downloads: KPIMetric & { completed: number; success_rate: number };
    data_processed_gb: KPIMetric;
  };
  charts: {
    revenue_by_day: Array<{ date: string; revenue: number }>;
    user_growth: Array<{ date: string; new_users: number }>;
    top_products: Array<{
      id: number;
      name: string;
      purchases: number;
      revenue: number;
      rating: number;
    }>;
  };
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export interface RealtimeMetrics {
  active_users_now: number;
  events_last_hour: Record<string, number>;
  jobs_processing: number;
  orders_last_hour: number;
  revenue_last_hour: number;
  timestamp: string;
}

export interface AIInsight {
  id?: number;
  type: string;
  priority: string;
  title: string;
  description: string;
  confidence: number;
  recommended_actions: string[];
  potential_impact?: string;
  created_at?: string;
}

export interface Report {
  id: number;
  name: string;
  description: string;
  report_type: string;
  status: string;
  format: string;
  file_size_mb: number;
  created_at: string;
  completed_at: string | null;
}

export interface UserAnalytics {
  registration_trends: Array<{ date: string; count: number }>;
  active_users_by_day: Array<{ date: string; unique_users: number }>;
  user_segments: any[];
  retention_rate: number;
  total_users: number;
  active_users: number;
}

export interface SalesAnalytics {
  revenue_trends: Array<{ date: string; revenue: number; orders: number }>;
  revenue_by_type: Array<{ items__product__product_type: string; revenue: number }>;
  avg_order_value: number;
  payment_methods: Array<{ payment_method: string; count: number; total: number }>;
  conversion_funnel: {
    cart_adds: number;
    checkouts: number;
    purchases: number;
    conversion_rate: number;
  };
}

export interface ProductAnalytics {
  top_products: Array<{
    id: number;
    name: string;
    type: string;
    purchases: number;
    views: number;
    conversion_rate: number;
    revenue: number;
    rating: number;
    reviews: number;
  }>;
  type_distribution: Array<{ product_type: string; count: number; total_sales: number }>;
  low_stock_products: Array<{ id: number; name: string; stock_quantity: number }>;
}

export interface GeospatialAnalytics {
  aoi_statistics: {
    total_aois: number;
    active_aois: number;
    total_area_km2: number;
  };
  imagery_coverage: Array<{ provider: string; count: number; avg_cloud_cover: number }>;
  processing_stats: Array<{
    job_type: string;
    count: number;
    completed: number;
    avg_duration: number;
  }>;
  download_patterns: Array<{ satellite_image__provider: string; count: number }>;
}

export class AnalyticsAPI {
  // Dashboard & KPIs
  static async getDashboardOverview(days: number = 30): Promise<DashboardOverview | null> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/dashboard/?days=${days}`,
        { headers }
      );
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      return null;
    }
  }

  static async getRealtimeMetrics(): Promise<RealtimeMetrics | null> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/realtime/`,
        { headers }
      );
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Error fetching realtime metrics:', err);
      return null;
    }
  }

  // Analytics
  static async getUserAnalytics(days: number = 30): Promise<UserAnalytics | null> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/users/?days=${days}`,
        { headers }
      );
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Error fetching user analytics:', err);
      return null;
    }
  }

  static async getSalesAnalytics(days: number = 30): Promise<SalesAnalytics | null> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/sales/?days=${days}`,
        { headers }
      );
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Error fetching sales analytics:', err);
      return null;
    }
  }

  static async getProductAnalytics(): Promise<ProductAnalytics | null> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/products/`,
        { headers }
      );
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Error fetching product analytics:', err);
      return null;
    }
  }

  static async getGeospatialAnalytics(days: number = 30): Promise<GeospatialAnalytics | null> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/geospatial/?days=${days}`,
        { headers }
      );
      const data = await response.json();
      return data.success ? data.data : null;
    } catch (err) {
      console.error('Error fetching geospatial analytics:', err);
      return null;
    }
  }

  // AI Insights
  static async getAIInsights(): Promise<AIInsight[]> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/insights/`,
        { headers }
      );
      const data = await response.json();
      return data.success ? [...data.data.insights, ...data.data.dynamic_insights] : [];
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      return [];
    }
  }

  // Reports
  static async getReports(): Promise<Report[]> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/reports/`,
        { headers }
      );
      const data = await response.json();
      return data.success ? data.data : [];
    } catch (err) {
      console.error('Error fetching reports:', err);
      return [];
    }
  }

  static async generateReport(
    reportType: string,
    name: string,
    parameters: Record<string, any>,
    format: string = 'pdf'
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/reports/generate/`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            report_type: reportType,
            name,
            parameters,
            format
          })
        }
      );
      return await response.json();
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error generating report'
      };
    }
  }

  // Event Tracking
  static async trackEvent(
    eventType: string,
    eventData: Record<string, any> = {},
    eventCategory: string = '',
    eventLabel: string = ''
  ): Promise<void> {
    try {
      const headers = getAuthHeaders();
      await fetch(
        `${getApiBaseUrl()}/analytics/track-event/`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            event_type: eventType,
            event_category: eventCategory,
            event_label: eventLabel,
            event_data: eventData,
            page_url: window.location.href,
            referrer: document.referrer,
            page_load_time: performance.now()
          })
        }
      );
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  }

  // Export
  static async exportData(
    type: string,
    format: string = 'csv',
    filters: Record<string, any> = {}
  ): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `${getApiBaseUrl()}/analytics/export/`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            type,
            format,
            filters
          })
        }
      );
      return await response.json();
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Error exporting data'
      };
    }
  }
}
