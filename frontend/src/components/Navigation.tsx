import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';

interface NavigationProps {
  activeTab: 'search' | 'datasets' | 'additional' | 'upload' | 'results';
  setActiveTab: (tab: 'search' | 'datasets' | 'additional' | 'upload' | 'results') => void;
  handleClearSearch: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  handleClearSearch
}) => {
  const { hasModuleAccess } = useAuthContext();
  return (
    <header className="bg-gray-800 text-white">
      <div className="px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">ZimbabweExplorer</h1>
          <div className="flex items-center space-x-3 text-xs">
            <a href="/help" className="text-gray-300 hover:text-white">Help</a>
            <a href="/feedback" className="text-gray-300 hover:text-white">Feedback</a>
          </div>
        </div>
      </div>
      {/* Navigation Tabs */}
      <div className="px-4 py-1">
        <nav className="flex space-x-4">
          <button 
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-t text-xs font-medium ${
              activeTab === 'search' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Search Criteria
          </button>
          <button 
            onClick={() => setActiveTab('datasets')}
            className={`px-3 py-1.5 rounded-t text-xs font-medium ${
              activeTab === 'datasets' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Data Sets
          </button>
          <button 
            onClick={() => setActiveTab('additional')}
            className={`px-3 py-1.5 rounded-t text-xs font-medium ${
              activeTab === 'additional' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Additional Criteria
          </button>
          {hasModuleAccess('upload') && (
            <button 
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-t text-xs font-medium ${
                activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
              }`}
            >
              Upload Imagery
            </button>
          )}
          <button 
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-t text-sm font-medium ${
              activeTab === 'results' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Results
          </button>
          <div className="ml-auto flex items-center space-x-2">
            <span className="text-gray-300 text-sm">
              Search Criteria Summary (Show)
            </span>
            <button 
              onClick={handleClearSearch}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-red-700"
            >
              Clear Search Criteria
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
