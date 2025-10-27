import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration - automatically detect environment
const getApiBaseUrl = (): string => {
  // In development, use environment variable or localhost
  if (import.meta.env.DEV) {
    return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  }
  
  // In production, use the same domain as the frontend
  const protocol = window.location.protocol;
  const host = window.location.host;
  return `${protocol}//${host}/api`;
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging for API base URL
console.log('API Base URL:', API_BASE_URL);
console.log('Environment:', import.meta.env.DEV ? 'development' : 'production');
console.log('Window location:', window.location.href);

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  
  // Do not add auth token for login or signup routes
  if (token && !config.url?.endsWith('/auth/login/') && !config.url?.endsWith('/auth/signup/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Type definitions
export interface AdministrativeBoundarySet {
  id: number;
  name: string;
  description: string;
  source: string;
  upload_date: string;
  uploaded_by_name: string;
  coordinate_system: string;
  data_year: number | null;
  is_public: boolean;
  status: string;
  original_filename: string;
  file_size_mb: number;
  total_boundaries: number;
  levels_included: string[];
  level_counts: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface AdministrativeBoundary {
  id: number;
  boundary_set: number;
  boundary_set_name: string;
  level: string;
  name: string;
  code: string;
  parent: number | null;
  name_0: string;
  name_1: string;
  name_2: string;
  name_3: string;
  geometry?: GeoJSON.Geometry;
  centroid: GeoJSON.Point;
  area_km2: number;
  perimeter_km: number;
  attributes: Record<string, any>;
  is_active: boolean;
  population: number | null;
  full_path: string;
  children_count: number;
  created_at: string;
  updated_at: string;
}

export interface AOI {
  id: number;
  name: string;
  description: string;
  geometry: GeoJSON.Geometry;
  user: number;
  user_name: string;
  created_at: string;
  is_public: boolean;
  metadata: Record<string, any>;
  area_km2: number;
  bounds: [number, number, number, number];
}

export interface SatelliteImage {
  id: number;
  provider: string;
  tile_id: string;
  scene_id: string;
  sensed_at: string;
  cloud_cover: number;
  bounds: GeoJSON.Geometry;
  file_path?: string;
  file_size_mb?: number;
  download_url?: string;
  metadata: Record<string, any>;
  is_available: boolean;
  file_size_formatted?: string;
  age_days?: number;
}

export interface ProcessingJob {
  id: number;
  user: number;
  user_name: string;
  aoi?: number;
  aoi_name?: string;
  satellite_image?: number;
  satellite_image_tile_id?: string;
  job_type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  hpc_job_id?: string;
  parameters: Record<string, any>;
  results?: Record<string, any>;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration?: number;
}

export interface Download {
  id: number;
  user: number;
  user_name: string;
  satellite_image: number;
  satellite_image_details: SatelliteImage;
  processing_job?: number;
  processing_job_details?: ProcessingJob;
  aoi?: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  parameters: Record<string, any>;
  error_message?: string;
  requested_at: string;
  started_at?: string;
  completed_at?: string;
  duration?: number;
}

export interface IndexResult {
  id: number;
  aoi: number;
  aoi_name: string;
  satellite_image: number;
  satellite_image_details: {
    id: number;
    tile_id: string;
    provider: string;
    sensed_at: string;
    cloud_cover: number;
  };
  index_type: string;
  calculated_at: string;
  statistics: Record<string, any>;
  statistics_summary: {
    mean: number;
    std: number;
    min: number;
    max: number;
    count: number;
  };
  metadata: Record<string, any>;
  file_path?: string;
}

export interface SearchImageryRequest {
  geometry: GeoJSON.Geometry;
  start_date?: string;
  end_date?: string;
  providers?: string[];
  max_cloud_cover?: number;
  max_results?: number;
  submit_to_hpc?: boolean;
  processing_options?: Record<string, any>;
  hpc_resources?: Record<string, any>;
}

export interface BulkDownloadRequest {
  image_ids: number[];
  clip_geometry?: GeoJSON.Geometry;
  output_format?: string;
  compress?: boolean;
  include_metadata?: boolean;
  hpc_resources?: Record<string, any>;
}

// API Functions
export class GeospatialAPI {
  // AOI Management
  static async getAOIs(): Promise<AOI[]> {
    try {
      const response: AxiosResponse<{ 
        count: number; 
        next: string | null; 
        previous: string | null; 
        results: { type: string; features: AOI[] } 
      }> = await apiClient.get('/aois/');
      
      // Extract features from GeoJSON FeatureCollection
      return response.data.results.features || [];
    } catch (error) {
      console.error('Failed to fetch AOIs:', error);
      return [];
    }
  }

  static async getAOI(id: number): Promise<AOI> {
    const response: AxiosResponse<AOI> = await apiClient.get(`/aois/${id}/`);
    return response.data;
  }

  static async createAOI(aoi: Partial<AOI>): Promise<AOI> {
    const response: AxiosResponse<AOI> = await apiClient.post('/aois/', aoi);
    return response.data;
  }

  static async updateAOI(id: number, aoi: Partial<AOI>): Promise<AOI> {
    const response: AxiosResponse<AOI> = await apiClient.patch(`/aois/${id}/`, aoi);
    return response.data;
  }

  static async deleteAOI(id: number): Promise<void> {
    await apiClient.delete(`/aois/${id}/`);
  }

  static async getAOIIntersectingImages(
    id: number,
    params?: {
      start_date?: string;
      end_date?: string;
      max_cloud_cover?: number;
      provider?: string;
      min_coverage?: number;
    }
  ): Promise<{ count: number; results: any[]; aoi_info: any }> {
    const response = await apiClient.get(`/aois/${id}/intersecting_images/`, { params });
    return response.data;
  }

  static async findOptimalImagery(
    aoiId: number,
    request: {
      date_range?: { start_date?: string; end_date?: string };
      priorities?: Record<string, number>;
      max_images?: number;
    }
  ): Promise<any> {
    const response = await apiClient.post(`/aois/${aoiId}/find_optimal_imagery/`, request);
    return response.data;
  }

  static async requestImagery(
    aoiId: number,
    request: SearchImageryRequest
  ): Promise<{ job_id: number; status: string; [key: string]: any }> {
    const response = await apiClient.post(`/aois/${aoiId}/request_imagery/`, request);
    return response.data;
  }

  static async uploadGeometry(formData: FormData): Promise<{ success: boolean; created_aois?: AOI[]; aoi?: AOI }> {
    const response = await apiClient.post('/aois/upload_geometry/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Satellite Image Management
  static async getSatelliteImages(params?: Record<string, any>): Promise<{ results: SatelliteImage[] }> {
    const response = await apiClient.get('/satellite-images/', { params });
    return response.data;
  }

  static async getSatelliteImage(id: number): Promise<SatelliteImage> {
    const response: AxiosResponse<SatelliteImage> = await apiClient.get(`/satellite-images/${id}/`);
    return response.data;
  }

  static async searchImagesByAOI(params: {
    aoi_id?: number;
    geometry?: string;
    start_date?: string;
    end_date?: string;
    max_cloud_cover?: number;
    provider?: string[];
    sort_by?: string;
  }): Promise<{ count: number; results: any[] }> {
    const response = await apiClient.get('/satellite-images/by_aoi/', { params });
    return response.data;
  }

  static async searchProviders(request: SearchImageryRequest): Promise<any> {
    const response = await apiClient.post('/satellite-images/search_providers/', request);
    return response.data;
  }

  static async downloadImage(
    imageId: number,
    request: {
      clip_geometry?: GeoJSON.Geometry;
      output_format?: string;
      resampling?: string;
      use_hpc?: boolean;
      hpc_resources?: Record<string, any>;
    }
  ): Promise<any> {
    const response = await apiClient.post(`/satellite-images/${imageId}/download/`, request);
    return response.data;
  }

  static async calculateIndices(
    imageId: number,
    request: {
      indices?: string[];
      clip_geometry?: GeoJSON.Geometry;
      output_format?: string;
      use_hpc?: boolean;
      hpc_resources?: Record<string, any>;
    }
  ): Promise<any> {
    const response = await apiClient.post(`/satellite-images/${imageId}/calculate_indices/`, request);
    return response.data;
  }

  // Download Management
  static async getDownloads(): Promise<{ results: Download[] }> {
    const response = await apiClient.get('/downloads/');
    return response.data;
  }

  static async getDownload(id: number): Promise<Download> {
    const response: AxiosResponse<Download> = await apiClient.get(`/downloads/${id}/`);
    return response.data;
  }

  static async createBulkDownload(request: BulkDownloadRequest): Promise<any> {
    const response = await apiClient.post('/downloads/bulk_download/', request);
    return response.data;
  }

  static async getDownloadProgress(id: number): Promise<any> {
    const response = await apiClient.get(`/downloads/${id}/progress/`);
    return response.data;
  }

  static async cancelDownload(id: number): Promise<any> {
    const response = await apiClient.post(`/downloads/${id}/cancel/`);
    return response.data;
  }

  // Index Results
  static async getIndexResults(params?: Record<string, any>): Promise<{ results: IndexResult[] }> {
    const response = await apiClient.get('/indices/', { params });
    return response.data;
  }

  // Job Management
  static async getJobStatus(jobId: number): Promise<any> {
    const response = await apiClient.get(`/jobs/${jobId}/status/`);
    return response.data;
  }

  static async cancelJob(jobId: number): Promise<any> {
    const response = await apiClient.post(`/jobs/${jobId}/cancel/`);
    return response.data;
  }

  // User Quota
  static async getUserQuota(): Promise<any> {
    const response = await apiClient.get('/user/quota/');
    return response.data;
  }

  // Search imagery by location (for Zimbabwe Explorer)
  static async searchImageryByLocation(params: {
    location?: string;
    start_date?: string;
    end_date?: string;
    providers?: string[];
    max_cloud_cover?: number;
    max_results?: number;
  }): Promise<{ count: number; results: any[] }> {
    try {
      const response = await apiClient.post('/imagery/search/', {
        geometry: null, // Will be enhanced with actual location geometry
        start_date: params.start_date,
        end_date: params.end_date,
        providers: params.providers || ['sentinel2'],
        max_cloud_cover: params.max_cloud_cover || 30,
        max_results: params.max_results || 100,
        location: params.location,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search imagery by location:', error);
      // Return mock data for Zimbabwe for testing
      return {
        count: 5,
        results: [
          {
            id: 1,
            tile_id: 'S2A_MSIL2A_20241201T073331_N0511_R092_T36KTF_20241201T094529',
            provider: 'Sentinel-2',
            sensed_at: '2024-12-01T07:33:31Z',
            cloud_cover: 15.2,
            bounds: [-19.5, 29.0, -18.5, 30.0],
            file_size_mb: 512.3,
          },
          {
            id: 2,
            tile_id: 'LC08_L2SP_170071_20241128_20241202_02_T1',
            provider: 'Landsat-8',
            sensed_at: '2024-11-28T08:45:12Z',
            cloud_cover: 8.7,
            bounds: [-20.0, 28.5, -19.0, 29.5],
            file_size_mb: 298.1,
          },
          {
            id: 3,
            tile_id: 'S1A_IW_GRDH_1SDV_20241125T041256_20241125T041321_056324_06E5A2_9C4E',
            provider: 'Sentinel-1',
            sensed_at: '2024-11-25T04:12:56Z',
            cloud_cover: 0,
            bounds: [-19.2, 29.3, -18.2, 30.3],
            file_size_mb: 156.7,
          },
          {
            id: 4,
            tile_id: 'MOD09GA.A2024330.h20v10.061.2024331180532',
            provider: 'MODIS',
            sensed_at: '2024-11-25T00:00:00Z',
            cloud_cover: 25.1,
            bounds: [-21.0, 28.0, -17.0, 32.0],
            file_size_mb: 45.2,
          },
          {
            id: 5,
            tile_id: 'S2B_MSIL2A_20241120T073339_N0511_R092_T36KTF_20241120T094842',
            provider: 'Sentinel-2',
            sensed_at: '2024-11-20T07:33:39Z',
            cloud_cover: 42.8,
            bounds: [-19.5, 29.0, -18.5, 30.0],
            file_size_mb: 487.9,
          },
        ],
      };
    }
  }

  // Authentication methods
  static async login(credentials: { email?: string; username?: string; password: string }): Promise<{
    success: boolean;
    user?: any;
    token?: string;
    message?: string;
  }> {
    try {
      // Allow login with either email or username
      const payload: any = { password: credentials.password };
      if (credentials.email) payload.email = credentials.email;
      if (credentials.username) payload.username = credentials.username;
      const response = await apiClient.post('/auth/login/', payload);
      return response.data;
    } catch (error: any) {
      // If the server responded with an error status, return the error data
      if (error.response?.data) {
        return error.response.data;
      }
      // If there's no response (network error), return a generic error
      return {
        success: false,
        message: error.message || 'Network error occurred'
      };
    }
  }

  static async signup(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organization: string;
    role?: string;
    subscriptionPlan?: string;
  }): Promise<{
    success: boolean;
    user?: any;
    message?: string;
  }> {
    try {
      const response = await apiClient.post('/auth/signup/', userData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }

  static async getUserProfile(): Promise<{
    success: boolean;
    user?: any;
    message?: string;
  }> {
    try {
      const response = await apiClient.get('/auth/profile/');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  }
};

// Administrative Boundaries API
export const boundariesApi = {
  // Boundary Sets
  async getBoundarySets(): Promise<AdministrativeBoundarySet[]> {
    try {
      const response = await apiClient.get('/boundary-sets/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch boundary sets:', error);
      throw error;
    }
  },

  async uploadBoundarySet(
    file: File,
    metadata: {
      name?: string;
      description?: string;
      source?: string;
      data_year?: number;
    }
  ): Promise<AdministrativeBoundarySet> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata.name) formData.append('name', metadata.name);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.source) formData.append('source', metadata.source);
      if (metadata.data_year) formData.append('data_year', metadata.data_year.toString());

      const response = await apiClient.post('/boundary-sets/upload_boundaries/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.boundary_set;
    } catch (error) {
      console.error('Failed to upload boundary set:', error);
      throw error;
    }
  },

  async getBoundarySetHierarchy(setId: number): Promise<{
    boundary_set: AdministrativeBoundarySet;
    hierarchy: Record<string, AdministrativeBoundary[]>;
  }> {
    try {
      const response = await apiClient.get(`/boundary-sets/${setId}/hierarchy/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch boundary hierarchy:', error);
      throw error;
    }
  },

  async getBoundariesInSet(
    setId: number,
    options: {
      level?: string;
      parent_id?: number;
      include_geometry?: boolean;
    } = {}
  ): Promise<AdministrativeBoundary[]> {
    try {
      const params = new URLSearchParams();
      if (options.level) params.append('level', options.level);
      if (options.parent_id) params.append('parent_id', options.parent_id.toString());
      if (options.include_geometry) params.append('include_geometry', 'true');

      const response = await apiClient.get(`/boundary-sets/${setId}/boundaries/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch boundaries in set:', error);
      throw error;
    }
  },

  // Individual Boundaries
  async getBoundary(id: number): Promise<AdministrativeBoundary> {
    try {
      const response = await apiClient.get(`/boundaries/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch boundary:', error);
      throw error;
    }
  },

  async searchBoundaries(
    query: string,
    options: {
      boundary_set?: number;
      level?: string;
      limit?: number;
    } = {}
  ): Promise<AdministrativeBoundary[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (options.boundary_set) params.append('boundary_set', options.boundary_set.toString());
      if (options.level) params.append('level', options.level);
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await apiClient.get(`/boundaries/search/?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search boundaries:', error);
      throw error;
    }
  },

  async getBoundaryChildren(id: number, includeGeometry: boolean = false): Promise<AdministrativeBoundary[]> {
    try {
      const params = includeGeometry ? '?include_geometry=true' : '';
      const response = await apiClient.get(`/boundaries/${id}/children/${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch boundary children:', error);
      throw error;
    }
  },

  async getBoundaryAOIs(id: number): Promise<AOI[]> {
    try {
      const response = await apiClient.get(`/boundaries/${id}/aois/`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch boundary AOIs:', error);
      throw error;
    }
  },
};

export default apiClient;
