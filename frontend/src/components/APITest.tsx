import React, { useState, useEffect } from 'react';
import { GeospatialAPI } from '../lib/api.ts';

const APITest: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testAPI = async () => {
      try {
        setStatus('Fetching AOIs...');
        const aois = await GeospatialAPI.getAOIs();
        setStatus(`API working! Found ${aois.length} AOIs`);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('API test failed');
      }
    };

    testAPI();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">API Connection Test</h3>
      <p className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
        {status}
      </p>
      {error && (
        <p className="text-xs text-red-500 mt-1">
          Error: {error}
        </p>
      )}
    </div>
  );
};

export default APITest;
