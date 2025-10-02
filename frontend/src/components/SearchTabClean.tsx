import React from 'react';
import { ZIMBABWE_PROVINCES, ZIMBABWE_DISTRICTS } from '../constants';

interface SearchTabProps {
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (district: string) => void;
  searchCriteria: any;
  setSearchCriteria: (criteria: any) => void;
}

const SearchTab: React.FC<SearchTabProps> = ({
  selectedProvince,
  setSelectedProvince,
  selectedDistrict,
  setSelectedDistrict,
  searchCriteria,
  setSearchCriteria,
}) => {
  
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedDistrict('');
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
  };

  return (
    <div>
      <div className="bg-gray-200 border-b border-gray-300 px-3 py-2">
        <h2 className="text-xs font-semibold text-gray-700">
          1. Enter Search Criteria
        </h2>
        <p className="text-xs text-gray-600 mt-1 leading-tight">
          To narrow your search area, type in an address or place name, 
          enter coordinates or click the map to define your search area.
        </p>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select a Geocoding Method
          </label>
          <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500">
            <option>Feature (GNIS)</option>
            <option>Coordinates</option>
            <option>Path/Row</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Province/Region Name
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            {ZIMBABWE_PROVINCES.map(province => (
              <option key={province} value={province}>{province}</option>
            ))}
          </select>
        </div>

        {selectedProvince !== 'All Zimbabwe' && ZIMBABWE_DISTRICTS[selectedProvince as keyof typeof ZIMBABWE_DISTRICTS]?.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              District (Optional)
            </label>
            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Districts in {selectedProvince}</option>
              {ZIMBABWE_DISTRICTS[selectedProvince as keyof typeof ZIMBABWE_DISTRICTS].map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Feature Name (use % as wildcard)
          </label>
          <input
            type="text"
            placeholder="Search Zimbabwe features..."
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Range */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-700">Date Range</span>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Search from:</label>
              <input
                type="date"
                value={searchCriteria.dateRange.start}
                onChange={(e) => setSearchCriteria((prev: any) => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, start: e.target.value }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">to:</label>
              <input
                type="date"
                value={searchCriteria.dateRange.end}
                onChange={(e) => setSearchCriteria((prev: any) => ({
                  ...prev,
                  dateRange: { ...prev.dateRange, end: e.target.value }
                }))}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTab;
