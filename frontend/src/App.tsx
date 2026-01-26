import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainNavigation } from './components/MainNavigation';

// Authentication Components
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import UserProfile from './components/auth/UserProfile';
import UserProfileManagement from './components/auth/UserProfileManagement';

// Main Components
import Dashboard from './components/Dashboard';
import ZimbabweExplorer from './components/ZimbabweExplorer';
import ImageFileManager from './components/ImageFileManager';

// Business Components
import ShoppingCartComponent from './components/business/ShoppingCart';

// Admin Components
import RoleManagement from './components/admin/RoleManagement';
import { UserApproval } from './components/admin/UserApproval';

// System Components
import SystemManagement from './components/system/SystemManagement';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Placeholder components for routes that don't exist yet
const AnalyticsPage = () => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Analytics Suite</h1>
    <p className="text-gray-600">Advanced geospatial analysis and processing tools will be available here.</p>
  </div>
);

const BusinessPage = () => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Business Intelligence</h1>
    <p className="text-gray-600">Business insights and reporting tools will be available here.</p>
  </div>
);

const SettingsPage = () => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings</h1>
    <p className="text-gray-600">Account and application settings will be available here.</p>
  </div>
);

const AdminDashboard = () => (
  <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">User Management</h3>
        <p className="text-gray-600 text-sm mb-4">Manage user accounts and permissions</p>
        <Link to="/admin/roles" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
          Manage Roles →
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">User Approvals</h3>
        <p className="text-gray-600 text-sm mb-4">Review and approve pending user accounts</p>
        <Link to="/admin/approvals" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
          Approve Users →
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">System Management</h3>
        <p className="text-gray-600 text-sm mb-4">System configuration and monitoring</p>
        <Link to="/admin/system" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
          System Settings →
        </Link>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-2">Analytics</h3>
        <p className="text-gray-600 text-sm mb-4">View usage analytics and reports</p>
        <span className="text-gray-400 text-sm">Coming Soon</span>
      </div>
    </div>
  </div>
);

// Landing page for non-authenticated users
const LandingPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
          Welcome to GeoSpatial Platform
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Powerful geospatial data analysis and visualization tools
        </p>
        <div className="mt-8 space-x-4">
          <Link
            to="/signup"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Sign In
          </Link>
        </div>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Satellite Imagery</h3>
            <p className="text-gray-600">Access comprehensive satellite datasets including Landsat, Sentinel, and more.</p>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics</h3>
            <p className="text-gray-600">Powerful analysis tools for vegetation indices, change detection, and more.</p>
          </div>
        </div>
        <div className="text-center">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Business Intelligence</h3>
            <p className="text-gray-600">Transform geospatial data into actionable business insights.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Main App Component
 * 
 * Root application component that sets up routing, authentication,
 * and the overall application structure with React Query integration.
 */
function App() {
  console.log('App component loaded');
  console.log('Current location:', window.location.href);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected routes with navigation */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MainNavigation />
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/imagery"
                element={
                  <ProtectedRoute requiredModules={['imagery']}>
                    <MainNavigation />
                    <ZimbabweExplorer />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/files"
                element={
                  <ProtectedRoute requiredModules={['imagery']}>
                    <MainNavigation />
                    <ImageFileManager />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute requiredModules={['analytics']}>
                    <MainNavigation />
                    <AnalyticsPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/business"
                element={
                  <ProtectedRoute requiredModules={['business']}>
                    <MainNavigation />
                    <BusinessPage />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/store"
                element={
                  <ProtectedRoute requiredModules={['business']}>
                    <MainNavigation />
                    <ShoppingCartComponent />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfileManagement />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainNavigation />
                    <SettingsPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Admin routes - All integrated into SystemManagement */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute 
                    requiredPermissions={['admin_access']}
                    requiredModules={['admin']}
                  >
                    <SystemManagement />
                  </ProtectedRoute>
                }
              />
              
              {/* Legacy routes redirect to SystemManagement with appropriate tab */}
              <Route
                path="/admin/roles"
                element={
                  <ProtectedRoute 
                    requiredPermissions={['manage_users']}
                    requiredModules={['admin']}
                  >
                    <SystemManagement />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/approvals"
                element={
                  <ProtectedRoute 
                    requiredPermissions={['approve_users', 'admin_access']}
                    requiredModules={['admin']}
                  >
                    <SystemManagement />
                  </ProtectedRoute>
                }
              />
              
              <Route
                path="/admin/system"
                element={
                  <ProtectedRoute 
                    requiredPermissions={['admin_access']}
                    requiredModules={['admin']}
                  >
                    <SystemManagement />
                  </ProtectedRoute>
                }
              />
              
              {/* Redirect unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;
