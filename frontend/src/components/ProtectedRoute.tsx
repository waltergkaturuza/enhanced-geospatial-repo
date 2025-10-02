import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredModules?: string[];
  fallbackPath?: string;
}

/**
 * ProtectedRoute Component
 * 
 * Wrapper component that protects routes based on authentication status,
 * permissions, and module access. Redirects unauthorized users.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredModules = [],
  fallbackPath = '/login'
}) => {
  const { user, isLoading, hasPermission, hasModuleAccess } = useAuthContext();
  const location = useLocation();

  // Debug logging
  console.log('ProtectedRoute Debug:', {
    path: location.pathname,
    user: user ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role } : null,
    isLoading,
    requiredPermissions,
    requiredModules
  });

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check required permissions
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => {
      const hasIt = hasPermission(permission);
      console.log(`ProtectedRoute permission check: ${permission} = ${hasIt}`);
      return hasIt;
    });
    
    console.log(`ProtectedRoute: All required permissions (${requiredPermissions.join(', ')}) = ${hasAllPermissions}`);
    
    if (!hasAllPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have the required permissions to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required permissions: {requiredPermissions.join(', ')}
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Check required modules
  if (requiredModules.length > 0) {
    const hasAllModules = requiredModules.every(module => {
      const hasIt = hasModuleAccess(module);
      console.log(`ProtectedRoute module check: ${module} = ${hasIt}`);
      return hasIt;
    });
    
    console.log(`ProtectedRoute: All required modules (${requiredModules.join(', ')}) = ${hasAllModules}`);
    
    if (!hasAllModules) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Module Access Required
            </h2>
            <p className="text-gray-600 mb-4">
              You need access to additional modules to view this page.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Required modules: {requiredModules.join(', ')}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.history.back()}
                className="block w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                onClick={() => {/* Navigate to subscription page */}}
                className="block w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Upgrade Subscription
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default ProtectedRoute;
