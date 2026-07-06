import { useState } from 'react';
import type { SearchCriteria } from '@/types';
import { LASAC_SATELLITE_IDS } from '@/constants';

export const useAppState = () => {
  const [activeTab, setActiveTab] = useState<'search' | 'datasets' | 'upload' | 'results'>('search');
  const [selectedProvince, setSelectedProvince] = useState<string>('All Zimbabwe');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedCoordinates, setSelectedCoordinates] = useState<string>('');
  
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    location: 'All Zimbabwe',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    datasets: LASAC_SATELLITE_IDS,
    cloudCover: 30,
    resultsLimit: 100,
    selectedFormats: {},
    selectedProducts: {}
  });

  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([...LASAC_SATELLITE_IDS]);
  const [expandedDataset, setExpandedDataset] = useState<string | null>(null);
  const [selectedMetadataItem, setSelectedMetadataItem] = useState<{type: 'format' | 'product', item: string, datasetId: string} | null>(null);

  return {
    activeTab,
    setActiveTab,
    selectedProvince,
    setSelectedProvince,
    selectedDistrict,
    setSelectedDistrict,
    selectedCoordinates,
    setSelectedCoordinates,
    searchCriteria,
    setSearchCriteria,
    selectedDatasets,
    setSelectedDatasets,
    expandedDataset,
    setExpandedDataset,
    selectedMetadataItem,
    setSelectedMetadataItem
  };
};
