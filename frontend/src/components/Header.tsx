import React from 'react';

interface HeaderProps {
  activeTab: 'search' | 'datasets' | 'additional' | 'results';
  onTabChange: (tab: 'search' | 'datasets' | 'additional' | 'results') => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
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
            onClick={() => onTabChange('search')}
            className={`px-3 py-1.5 rounded-t text-xs font-medium ${
              activeTab === 'search' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Search Criteria
          </button>
          <button 
            onClick={() => onTabChange('datasets')}
            className={`px-3 py-1.5 rounded-t text-xs font-medium ${
              activeTab === 'datasets' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Data Sets
          </button>
          <button 
            onClick={() => onTabChange('additional')}
            className={`px-3 py-1.5 rounded-t text-xs font-medium ${
              activeTab === 'additional' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Additional Criteria
          </button>
          <button 
            onClick={() => onTabChange('results')}
            className={`px-3 py-1.5 rounded-t text-xs font-medium ${
              activeTab === 'results' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
            }`}
          >
            Results
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
