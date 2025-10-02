import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Simple test component
const TestApp: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Application</h1>
      <p>If you can see this, the basic React app is working.</p>
      <div className="mt-4 p-4 bg-blue-100 rounded">
        <h2 className="font-semibold">Next Steps:</h2>
        <ul className="list-disc list-inside mt-2">
          <li>Check browser console for errors</li>
          <li>Verify API endpoints are working</li>
          <li>Test individual components</li>
        </ul>
      </div>
    </div>
  );
};

// Create a simple query client for testing
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function TestAppWithProvider() {
  return (
    <QueryClientProvider client={queryClient}>
      <TestApp />
    </QueryClientProvider>
  );
}

export default TestAppWithProvider;
