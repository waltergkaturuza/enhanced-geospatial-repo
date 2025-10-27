import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

// Utility function to combine class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Date formatting utilities
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    return 'Invalid date';
  }
}

export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'N/A';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
}

// File size formatting
export function formatFileSize(sizeInMB: number): string {
  if (sizeInMB < 1024) {
    return `${sizeInMB.toFixed(1)} MB`;
  }
  return `${(sizeInMB / 1024).toFixed(1)} GB`;
}

// Number formatting
export function formatNumber(num: number, decimals: number = 2): string {
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
}

export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

// Coordinate formatting
export function formatCoordinate(coord: number, type: 'lat' | 'lon'): string {
  const abs = Math.abs(coord);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  const sec = ((abs - deg - min / 60) * 3600).toFixed(1);
  
  let direction = '';
  if (type === 'lat') {
    direction = coord >= 0 ? 'N' : 'S';
  } else {
    direction = coord >= 0 ? 'E' : 'W';
  }
  
  return `${deg}°${min}'${sec}"${direction}`;
}

// Bounds formatting
export function formatBounds(bounds: [number, number, number, number]): string {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  return `${formatCoordinate(minLat, 'lat')} to ${formatCoordinate(maxLat, 'lat')}, ${formatCoordinate(minLon, 'lon')} to ${formatCoordinate(maxLon, 'lon')}`;
}

// Area calculation and formatting
export function calculatePolygonArea(geometry: GeoJSON.Polygon): number {
  // Simple area calculation for small polygons (not accurate for large areas)
  // In a real app, you'd use a proper geospatial library like Turf.js
  const coords = geometry.coordinates[0];
  let area = 0;
  
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    area += (x1 * y2) - (x2 * y1);
  }
  
  // Convert to approximate km² (very rough approximation)
  const areaKm2 = Math.abs(area) * 12365; // Very rough conversion factor
  return areaKm2;
}

export function formatArea(areaKm2: number): string {
  if (areaKm2 < 1) {
    return `${(areaKm2 * 1000000).toFixed(0)} m²`;
  } else if (areaKm2 < 1000) {
    return `${areaKm2.toFixed(2)} km²`;
  } else {
    return `${(areaKm2 / 1000).toFixed(1)}k km²`;
  }
}

// Status badge utilities
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
    case 'available':
      return 'status-success';
    case 'processing':
    case 'running':
    case 'queued':
      return 'status-processing';
    case 'failed':
    case 'error':
      return 'status-error';
    case 'warning':
    case 'partial':
      return 'status-warning';
    default:
      return 'status-info';
  }
}

// Progress utilities
export function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}

// Cloud cover utilities
export function getCloudCoverColor(cloudCover: number): string {
  if (cloudCover <= 10) return 'text-green-600';
  if (cloudCover <= 30) return 'text-yellow-600';
  if (cloudCover <= 60) return 'text-orange-600';
  return 'text-red-600';
}

export function getCloudCoverDescription(cloudCover: number): string {
  if (cloudCover <= 10) return 'Excellent';
  if (cloudCover <= 30) return 'Good';
  if (cloudCover <= 60) return 'Fair';
  return 'Poor';
}

// Provider utilities
export function getProviderName(provider: string): string {
  const providers: Record<string, string> = {
    'sentinel2': 'Sentinel-2',
    'landsat8': 'Landsat 8',
    'landsat9': 'Landsat 9',
    'modis': 'MODIS',
    'planet': 'Planet Labs'
  };
  return providers[provider.toLowerCase()] || provider;
}

export function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    'sentinel2': 'bg-blue-100 text-blue-800',
    'landsat8': 'bg-green-100 text-green-800',
    'landsat9': 'bg-green-100 text-green-800',
    'modis': 'bg-purple-100 text-purple-800',
    'planet': 'bg-pink-100 text-pink-800'
  };
  return colors[provider.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

// Index utilities
export function getIndexName(indexType: string): string {
  const indices: Record<string, string> = {
    'NDVI': 'Normalized Difference Vegetation Index',
    'NDWI': 'Normalized Difference Water Index',
    'NDBI': 'Normalized Difference Built-up Index',
    'EVI': 'Enhanced Vegetation Index',
    'SAVI': 'Soil Adjusted Vegetation Index',
    'MSAVI': 'Modified Soil Adjusted Vegetation Index',
    'NBR': 'Normalized Burn Ratio'
  };
  return indices[indexType] || indexType;
}

export function getIndexRange(indexType: string): [number, number] {
  const ranges: Record<string, [number, number]> = {
    'NDVI': [-1, 1],
    'NDWI': [-1, 1],
    'NDBI': [-1, 1],
    'EVI': [-1, 1],
    'SAVI': [-1, 1],
    'MSAVI': [-1, 1],
    'NBR': [-1, 1]
  };
  return ranges[indexType] || [-1, 1];
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidCoordinate(coord: number, type: 'lat' | 'lon'): boolean {
  if (type === 'lat') {
    return coord >= -90 && coord <= 90;
  } else {
    return coord >= -180 && coord <= 180;
  }
}

// Geometry utilities
export function isValidGeoJSON(geojson: any): boolean {
  try {
    if (!geojson || typeof geojson !== 'object') return false;
    if (!geojson.type || !geojson.coordinates) return false;
    
    const validTypes = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon'];
    return validTypes.includes(geojson.type);
  } catch {
    return false;
  }
}

export function getBounds(geometry: GeoJSON.Geometry): [number, number, number, number] {
  let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
  
  function processCoords(coords: any) {
    if (Array.isArray(coords[0])) {
      coords.forEach(processCoords);
    } else {
      const [lon, lat] = coords;
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }
  }
  
  if ('coordinates' in geometry) {
    processCoords(geometry.coordinates);
  }
  return [minLon, minLat, maxLon, maxLat];
}

// Error handling utilities
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.message) return error.message;
  return 'An unexpected error occurred';
}

// Local storage utilities
export function saveToLocalStorage(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
    return defaultValue;
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
}

// URL utilities
export function buildQueryString(params: Record<string, any>): string {
  const filteredParams = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  
  return filteredParams.length > 0 ? `?${filteredParams.join('&')}` : '';
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as any;
  };
}
