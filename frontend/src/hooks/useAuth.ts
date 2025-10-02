import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { 
  User, AuthState, LoginCredentials, SignupCredentials, 
  SystemModule, AccessLevel 
} from '../types/auth';
import { AUTH_MESSAGES } from '../constants/auth';

// Authentication Context
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  signup: (data: SignupCredentials) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  refreshAuth: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasModuleAccess: (moduleId: SystemModule, level?: AccessLevel) => boolean;
  canAccess: (resource: string, action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export the context for use in AuthProvider
export { AuthContext };

// Authentication Hook Implementation
export const useAuthState = (): AuthContextType => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    loading: true,
    error: null
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const userData = localStorage.getItem('user_data');

        if (token && userData) {
          const user = JSON.parse(userData) as User;
          setAuthState({
            isAuthenticated: true,
            user,
            token,
            refreshToken,
            loading: false,
            error: null
          });
          
          // Validate token with server
          await validateToken(token);
        } else {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          refreshToken: null,
          loading: false,
          error: 'Failed to initialize authentication'
        });
      }
    };

    initAuth();
  }, []);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      logout();
      return false;
    }
  };

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || AUTH_MESSAGES.LOGIN_FAILED);
      }

      const { user, token, refreshToken } = data;

      // Store auth data
      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_data', JSON.stringify(user));

      if (credentials.rememberMe) {
        localStorage.setItem('remember_me', 'true');
      }

      setAuthState({
        isAuthenticated: true,
        user,
        token,
        refreshToken,
        loading: false,
        error: null
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : AUTH_MESSAGES.LOGIN_FAILED;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  const signup = useCallback(async (data: SignupCredentials): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || AUTH_MESSAGES.SIGNUP_FAILED);
      }

      setAuthState(prev => ({ ...prev, loading: false, error: null }));
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : AUTH_MESSAGES.SIGNUP_FAILED;
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('remember_me');

    // Reset auth state
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null
    });

    // Call logout endpoint
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authState.token}` }
    }).catch(console.error);
  }, [authState.token]);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      return response.ok;
    } catch (error) {
      console.error('Password reset error:', error);
      return false;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      return response.ok;
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  }, [authState.token]);

  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      return response.ok;
    } catch (error) {
      console.error('Email verification error:', error);
      return false;
    }
  }, []);

  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      if (!authState.refreshToken) return;

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: authState.refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const { token, refreshToken, user } = await response.json();

      localStorage.setItem('auth_token', token);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('user_data', JSON.stringify(user));

      setAuthState(prev => ({
        ...prev,
        token,
        refreshToken,
        user
      }));
    } catch (error) {
      console.error('Auth refresh error:', error);
      logout();
    }
  }, [authState.refreshToken, logout]);

  // Permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!authState.user) return false;
    
    return authState.user.permissions.some(p => p.id === permission) ||
           authState.user.roles.some(role => 
             role.permissions.some(p => p.id === permission)
           );
  }, [authState.user]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!authState.user) return false;
    
    return authState.user.roles.some(role => role.name === roleName);
  }, [authState.user]);

  const hasModuleAccess = useCallback((moduleId: SystemModule, level: AccessLevel = 'read'): boolean => {
    if (!authState.user) return false;
    
    const accessLevels = ['none', 'read', 'write', 'admin', 'owner'];
    const requiredLevel = accessLevels.indexOf(level);
    
    return authState.user.roles.some(role => {
      const moduleAccess = role.modules.find(m => m.moduleId === moduleId);
      if (!moduleAccess) return false;
      
      const userLevel = accessLevels.indexOf(moduleAccess.access);
      return userLevel >= requiredLevel;
    });
  }, [authState.user]);

  const canAccess = useCallback((resource: string, action: string): boolean => {
    if (!authState.user) return false;
    
    // Check direct permissions
    const hasDirectPermission = authState.user.permissions.some(p => 
      p.resource === resource && p.action === action
    );
    
    if (hasDirectPermission) return true;
    
    // Check role permissions
    return authState.user.roles.some(role =>
      role.permissions.some(p => p.resource === resource && p.action === action)
    );
  }, [authState.user]);

  return {
    ...authState,
    login,
    signup,
    logout,
    resetPassword,
    changePassword,
    verifyEmail,
    refreshAuth,
    hasPermission,
    hasRole,
    hasModuleAccess,
    canAccess
  };
};
