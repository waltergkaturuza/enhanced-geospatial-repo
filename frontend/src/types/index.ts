export interface MapViewState {
  center: [number, number];
  zoom: number;
}

export interface CoordinateSystem {
  id: string;
  name: string;
  code: string;
  type: 'geographic' | 'utm' | 'projected';
  zone?: string;
  description: string;
}

export interface AreaOfInterest {
  id: string;
  name: string;
  type: 'polygon' | 'rectangle' | 'circle' | 'freehand' | 'file';
  coordinates: number[][];
  coordinateSystem: string;
  area: number; // in square kilometers
  bounds: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  metadata?: {
    filename?: string;
    uploadDate?: string;
    source?: string;
  };
}

export interface SearchCriteria {
  location: string;
  coordinates?: [number, number, number, number]; // bbox
  areaOfInterest?: AreaOfInterest;
  dateRange: {
    start: string;
    end: string;
  };
  datasets: string[];
  cloudCover: number;
  resultsLimit: number;
  selectedFormats: Record<string, string[]>; // datasetId -> formats[]
  selectedProducts: Record<string, string[]>; // datasetId -> products[]
}

export interface DatasetMetadata {
  datasetId: string;
  formats: {
    [format: string]: {
      description: string;
      fileSize: string;
      processing: string;
      applications: string[];
    };
  };
  products: {
    [product: string]: {
      description: string;
      units: string;
      range: string;
      accuracy: string;
      applications: string[];
    };
  };
}

export interface ZimbabweDataset {
  id: string;
  name: string;
  description: string;
  provider: string;
  resolution: string;
  bands: string[];
  temporalCoverage: string;
  spatialCoverage: string;
  dataProducts: string[];
  formats: string[];
  category: 'Optical' | 'Radar' | 'Elevation' | 'Derived' | 'Hyperspectral' | 'Thermal' | 'UAV' | 'Atmospheric';
  enabled: boolean;
}
