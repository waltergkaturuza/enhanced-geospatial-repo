import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { GeospatialAPI } from '@/lib';
import type { 
  SimpleUser, 
  LoginCredentials,
  SignupCredentials,
  PasswordResetRequest,
  AuthContextType
} from '../types/auth';

// Create the AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

// AuthProvider Props
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 * 
 * Provides authentication context to the entire application.
 * Contains all authentication state and methods.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Authentication state - using SimpleUser and aligned with AuthContextType
  const [user, setUser] = useState<SimpleUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('userData');
      
      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          setUser(user);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials & { username?: string }): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // Accept either email or username
      const { email, username, password } = credentials;
      const loginPayload: any = { password };
      if (email) loginPayload.email = email;
      if (username) loginPayload.username = username;
      console.log('Attempting login with credentials:', { email, username, password: '***' });
      const response = await GeospatialAPI.login(loginPayload);
      console.log('Login response:', response);

      if (response.success && response.user && response.token) {
        // Store auth data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));

        if ('rememberMe' in credentials && credentials.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        // Transform backend user data to frontend format
        const user: SimpleUser = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          organization: response.user.organization,
          role: response.user.role,
          subscriptionPlan: response.user.subscriptionPlan,
          isActive: response.user.isActive,
          emailVerified: response.user.emailVerified,
          isApproved: true, // Backend doesn't provide this yet, default to true for existing users
          approvalStatus: 'approved', // Backend doesn't provide this yet, default to approved
          createdAt: response.user.createdAt,
          lastLoginAt: new Date().toISOString(), // Set current time as last login
          modules: response.user.modules || ['dashboard']
        };

        console.log('Setting user in context:', user);
        setUser(user);
        // Note: In a real app, you'd also manage isAuthenticated state
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error details:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 404) {
        errorMessage = 'Login endpoint not found. Please check your server configuration.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Signup function
  const signup = useCallback(async (credentials: SignupCredentials): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call backend API
      const response = await GeospatialAPI.signup({
        email: credentials.email,
        password: credentials.password,
        firstName: credentials.firstName,
        lastName: credentials.lastName,
        organization: credentials.organization,
        role: credentials.role || 'viewer',
        subscriptionPlan: credentials.subscriptionPlan || 'free'
      });
      
      if (response.success && response.user) {
        // Transform backend user data to frontend format
        const newUser: SimpleUser = {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          organization: response.user.organization,
          role: response.user.role || 'pending_user',
          subscriptionPlan: response.user.subscriptionPlan || 'free_pending',
          isActive: response.user.isActive || true,
          emailVerified: response.user.emailVerified || false,
          isApproved: response.user.isApproved || false, // New users need approval
          approvalStatus: response.user.approvalStatus || 'pending',
          createdAt: response.user.createdAt,
          lastLoginAt: response.user.lastLoginAt,
          modules: response.user.modules || ['dashboard', 'data_store'] // Limited modules for pending users
        };
        
        // Store user data locally (no token until approved and logged in)
        localStorage.setItem('userData', JSON.stringify(newUser));
        
        // Set the user (they can access limited features immediately)
        setUser(newUser);
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Signup failed. Please try again.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
    setError(null);
  }, []);

  // Reset password function
  const requestPasswordReset = useCallback(async (_request: PasswordResetRequest): Promise<void> => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      throw error;
    }
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (updates: Partial<SimpleUser>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  }, [user]);

  // Permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    console.log('hasPermission called:', { permission, user: user?.role, hasUser: !!user });
    if (!user) return false;
    
    // Admin users have all permissions
    if (user.role === 'admin') {
      console.log('Admin user detected, granting permission:', permission);
      return true;
    }
    
    // Check specific permissions for different roles
    const result = (() => {
      switch (permission) {
        case 'admin_access':
        case 'manage_users':
        case 'system_management':
          return user.role === 'admin';
        case 'view_data':
        case 'download_data':
          return ['admin', 'user', 'viewer'].includes(user.role);
        default:
          return false;
      }
    })();
    
    console.log('Permission check result:', { permission, userRole: user.role, result });
    return result;
  }, [user]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!user) return false;
    return user.role === roleName;
  }, [user]);

  const hasModuleAccess = useCallback((moduleId: string): boolean => {
    if (!user) return false;
    
    // Admin users have access to all modules
    if (user.role === 'admin') return true;
    
    // Check if user has explicit access to the module
    return user.modules.includes(moduleId);
  }, [user]);

  // Check approval status functions
  const isUserApproved = useCallback(() => {
    return user?.isApproved || false;
  }, [user]);

  const isPendingApproval = useCallback(() => {
    return user?.approvalStatus === 'pending';
  }, [user]);

  const canAccessFullFeatures = useCallback(() => {
    return !!(user?.isApproved && user?.emailVerified);
  }, [user]);

  const getAccessLevelMessage = useCallback(() => {
    if (!user) return null;
    
    if (!user.emailVerified) {
      return 'Please verify your email address to continue.';
    }
    
    if (!user.isApproved) {
      return 'Your account is pending approval. You have access to limited features.';
    }
    
    return null;
  }, [user]);

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    error,
    login,
    signup,
    logout,
    requestPasswordReset,
    updateProfile,
    hasPermission,
    hasModuleAccess,
    hasRole,
    isUserApproved,
    isPendingApproval,
    canAccessFullFeatures,
    getAccessLevelMessage
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuthContext Hook
 * 
 * Custom hook to access the authentication context.
 * Must be used within an AuthProvider.
 * 
 * @returns AuthContextType - Authentication state and methods
 * @throws Error if used outside of AuthProvider
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Higher-Order Component for Route Protection
 * 
 * @param Component - The component to protect
 * @param requiredPermissions - Array of required permissions
 * @param requiredModules - Array of required modules
 * @returns Protected component
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions?: string[],
  requiredModules?: string[]
) => {
  return (props: P) => {
    const { user, hasPermission, hasModuleAccess } = useAuthContext();

    // Check if user is authenticated
    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please log in to access this page.
            </p>
          </div>
        </div>
      );
    }

    // Check permissions if required
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every(permission => 
        hasPermission(permission)
      );
      
      if (!hasAllPermissions) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have the required permissions to access this page.
              </p>
            </div>
          </div>
        );
      }
    }

    // Check module access if required
    if (requiredModules && requiredModules.length > 0) {
      const hasAllModules = requiredModules.every(module => 
        hasModuleAccess(module)
      );
      
      if (!hasAllModules) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">
                Module Access Required
              </h2>
              <p className="text-gray-600">
                You don't have access to the required modules for this page.
              </p>
            </div>
          </div>
        );
      }
    }

    return <Component {...props} />;
  };
};

export default AuthProvider;
