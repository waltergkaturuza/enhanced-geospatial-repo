import { useState } from 'react';
import { ZIMBABWE_COORDINATES } from '../constants';

export const useSearchHandlers = (appState: any) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleProvinceChange = (province: string) => {
    appState.setSelectedProvince(province);
    appState.setSelectedDistrict('');
    appState.setSearchCriteria((prev: any) => ({ ...prev, location: province }));
    
    const coordinates = ZIMBABWE_COORDINATES[province];
    if (coordinates) {
      // This would need to be passed from the map state hook
      // setMapViewState(coordinates);
    }
  };

  const handleDistrictChange = (district: string) => {
    appState.setSelectedDistrict(district);
    const location = district ? `${district}, ${appState.selectedProvince}` : appState.selectedProvince;
    appState.setSearchCriteria((prev: any) => ({ ...prev, location }));
  };

  const handleSearch = async () => {
    if (appState.selectedDatasets.length === 0) {
      setSearchError('Please select at least one dataset');
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      // The actual search is handled by the useQuery in ZimbabweExplorerClean
      // This is just for UI state management
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    appState.setSelectedProvince('All Zimbabwe');
    appState.setSelectedDistrict('');
    appState.setSearchCriteria({
      location: 'All Zimbabwe',
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      datasets: ['zimsat2', 'sentinel2_msi', 'landsat9'],
      cloudCover: 30,
      resultsLimit: 100,
      selectedFormats: {},
      selectedProducts: {}
    });
    appState.setSelectedDatasets(['zimsat2', 'sentinel2_msi', 'landsat9']);
    setSearchError(null);
  };

  return {
    handleProvinceChange,
    handleDistrictChange,
    handleSearch,
    handleClearSearch,
    isSearching,
    searchError
  };
};
