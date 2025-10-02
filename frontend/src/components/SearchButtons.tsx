import React from 'react';
import { Search } from 'lucide-react';

interface SearchButtonsProps {
  onSearch: () => void;
  onClearSearch: () => void;
  isLoading: boolean;
  selectedDatasets: string[];
  resultsLimit: number;
}

const SearchButtons: React.FC<SearchButtonsProps> = ({
  onSearch,
  onClearSearch,
  isLoading,
  selectedDatasets,
  resultsLimit
}) => {
  return (
    <div className="border-t border-gray-300 p-3 bg-gray-50 flex-shrink-0">
      <div className="text-center text-xs text-gray-600 mb-3 leading-tight">
        The search result limit is {resultsLimit} records; select a Country, 
        Feature Class, and/or Feature Type to reduce your chances of exceeding this limit.
      </div>
      <div className="flex justify-center space-x-2">
        <button
          onClick={onSearch}
          disabled={isLoading || selectedDatasets.length === 0}
          className="bg-blue-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          <Search className="h-3 w-3 mr-1" />
          {isLoading ? 'Searching...' : 'Search'}
        </button>
        <button
          onClick={onClearSearch}
          className="bg-red-600 text-white px-4 py-1.5 rounded text-xs font-medium hover:bg-red-700 flex items-center"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SearchButtons;
