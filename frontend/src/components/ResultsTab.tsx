import React, { useState } from 'react';
import { Download, Eye, MapPin, Calendar, CloudRain, Image, FileText, Settings } from 'lucide-react';

interface SearchResult {
  id: string;
  dataset: string;
  title: string;
  date: string;
  cloudCover: number;
  resolution: string;
  format: string;
  size: string;
  preview: string;
  downloadUrl: string;
  metadata: any;
}

interface ResultsTabProps {
  searchResults: SearchResult[];
  isLoading: boolean;
  searchError: string | null;
  onDownload: (result: SearchResult) => void;
  onPreview: (result: SearchResult) => void;
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  searchResults = [],
  isLoading = false,
  searchError = null,
  onDownload = () => {},
  onPreview = () => {}
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'cloudCover' | 'dataset'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [showMetadata, setShowMetadata] = useState<string | null>(null);

  const sortedResults = [...searchResults].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'cloudCover':
        comparison = a.cloudCover - b.cloudCover;
        break;
      case 'dataset':
        comparison = a.dataset.localeCompare(b.dataset);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const toggleSelectResult = (id: string) => {
    setSelectedResults(prev =>
      prev.includes(id)
        ? prev.filter(resultId => resultId !== id)
        : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedResults.length === searchResults.length) {
      setSelectedResults([]);
    } else {
      setSelectedResults(searchResults.map(r => r.id));
    }
  };

  const downloadSelected = () => {
    const selected = searchResults.filter(r => selectedResults.includes(r.id));
    selected.forEach(result => onDownload(result));
  };

  if (isLoading) {
    return (
      <div>
        <div className="bg-gray-200 border-b border-gray-300 px-3 py-2">
          <h2 className="text-xs font-semibold text-gray-700">4. Results</h2>
          <p className="text-xs text-gray-600 mt-1 leading-tight">
            Searching for imagery...
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading search results...</p>
        </div>
      </div>
    );
  }

  if (searchError) {
    return (
      <div>
        <div className="bg-gray-200 border-b border-gray-300 px-3 py-2">
          <h2 className="text-xs font-semibold text-gray-700">4. Results</h2>
          <p className="text-xs text-gray-600 mt-1 leading-tight">
            Search completed with errors
          </p>
        </div>
        <div className="p-4 text-center">
          <div className="text-red-600 text-sm">
            <p className="font-medium">Search Error</p>
            <p className="mt-1">{searchError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gray-200 border-b border-gray-300 px-3 py-2">
        <h2 className="text-xs font-semibold text-gray-700">
          4. Search Results
        </h2>
        <p className="text-xs text-gray-600 mt-1 leading-tight">
          {searchResults.length} images found. Select and download your data.
        </p>
      </div>

      {searchResults.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          <Image className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No results found</p>
          <p className="text-xs mt-1">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {/* Results Controls */}
          <div className="flex items-center justify-between bg-gray-50 p-2 rounded">
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedResults.length === searchResults.length}
                  onChange={toggleSelectAll}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span>Select All ({searchResults.length})</span>
              </label>
              
              {selectedResults.length > 0 && (
                <button
                  onClick={downloadSelected}
                  className="flex items-center space-x-1 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                >
                  <Download className="h-3 w-3" />
                  <span>Download Selected ({selectedResults.length})</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-1 py-0.5 border border-gray-300 rounded text-xs"
              >
                <option value="date">Date</option>
                <option value="cloudCover">Cloud Cover</option>
                <option value="dataset">Dataset</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-1 py-0.5 border border-gray-300 rounded text-xs hover:bg-gray-100"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sortedResults.map(result => (
              <div key={result.id} className="border border-gray-200 rounded hover:bg-gray-50">
                <div className="p-3">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedResults.includes(result.id)}
                      onChange={() => toggleSelectResult(result.id)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </h4>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => onPreview(result)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                            title="Preview"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setShowMetadata(showMetadata === result.id ? null : result.id)}
                            className="text-xs text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                            title="Metadata"
                          >
                            <FileText className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => onDownload(result)}
                            className="text-xs text-green-600 hover:text-green-800 flex items-center space-x-1"
                            title="Download"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{result.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CloudRain className="h-3 w-3" />
                          <span>{result.cloudCover}% clouds</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{result.resolution}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Settings className="h-3 w-3" />
                          <span>{result.format}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {result.dataset}
                        </span>
                        <span className="text-xs text-gray-500">
                          {result.size}
                        </span>
                      </div>

                      {/* Metadata Panel */}
                      {showMetadata === result.id && (
                        <div className="mt-3 p-2 bg-gray-50 rounded border text-xs">
                          <h5 className="font-medium text-gray-700 mb-2">Metadata</h5>
                          <div className="space-y-1">
                            <p><strong>ID:</strong> {result.id}</p>
                            <p><strong>Dataset:</strong> {result.dataset}</p>
                            <p><strong>Acquisition Date:</strong> {result.date}</p>
                            <p><strong>Cloud Cover:</strong> {result.cloudCover}%</p>
                            <p><strong>Resolution:</strong> {result.resolution}</p>
                            <p><strong>Format:</strong> {result.format}</p>
                            <p><strong>File Size:</strong> {result.size}</p>
                            <p><strong>Download URL:</strong> <span className="break-all text-blue-600">{result.downloadUrl}</span></p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Footer */}
          <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Total Results: {searchResults.length}</span>
              <span>Selected: {selectedResults.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsTab;
