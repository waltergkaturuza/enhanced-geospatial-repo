import React, { useState } from 'react';

const DebugDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('test');

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h1 className="text-lg font-semibold text-gray-900">Debug Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex p-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('test')}
            className={`px-3 py-2 rounded-lg text-sm font-medium mr-2 ${
              activeTab === 'test'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Test
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'debug'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Debug
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {activeTab === 'test' && (
            <div className="space-y-4">
              <h2 className="text-md font-medium text-gray-900">Basic Test</h2>
              <p className="text-gray-600">React components are rendering correctly.</p>
              <button
                onClick={() => alert('Button works!')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Test Button
              </button>
            </div>
          )}

          {activeTab === 'debug' && (
            <div className="space-y-4">
              <h2 className="text-md font-medium text-gray-900">Debug Info</h2>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">Frontend is running on port 5174</p>
                <p className="text-sm text-gray-700">Backend should be on port 8000</p>
                <p className="text-sm text-gray-700">Tailwind CSS is loaded</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Geospatial Dashboard Debug
          </h1>
          <p className="text-gray-600 mb-8">
            Testing basic React and Tailwind functionality
          </p>
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
            <h3 className="text-lg font-semibold mb-4">Status Check</h3>
            <div className="space-y-2 text-left">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">React Rendering</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Tailwind CSS</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm">Component State</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugDashboard;
