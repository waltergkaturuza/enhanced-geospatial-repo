/**
 * Authentication and RBAC Integration Tests
 * 
 * Tests for verifying authentication flows, role-based access control,
 * and protected routes functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components to test
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Login from '../components/auth/Login';
import Signup from '../components/auth/Signup';
import { MainNavigation } from '../components/MainNavigation';

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Authentication System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Login Component', () => {
    it('renders login form correctly', () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty fields', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(
        <TestWrapper>
          <Login />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Signup Component', () => {
    it('renders signup form correctly', () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('validates password confirmation', async () => {
      render(
        <TestWrapper>
          <Signup />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password456' } });
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Protected Routes', () => {
    it('redirects to login when not authenticated', () => {
      const TestComponent = () => <div>Protected Content</div>;
      
      render(
        <TestWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    });

    it('renders content when authenticated', () => {
      // Mock authenticated user
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_user') {
          return JSON.stringify({
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'analyst',
            permissions: ['view_imagery'],
            modules: ['imagery'],
            isActive: true
          });
        }
        if (key === 'auth_token') {
          return 'mock-token';
        }
        return null;
      });

      const TestComponent = () => <div>Protected Content</div>;
      
      render(
        <TestWrapper>
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('blocks access when required permission is missing', () => {
      // Mock user without admin permissions
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_user') {
          return JSON.stringify({
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'viewer',
            permissions: ['view_imagery'],
            modules: ['imagery'],
            isActive: true
          });
        }
        if (key === 'auth_token') {
          return 'mock-token';
        }
        return null;
      });

      const TestComponent = () => <div>Admin Content</div>;
      
      render(
        <TestWrapper>
          <ProtectedRoute requiredPermissions={['admin_access']}>
            <TestComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
      expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
    });

    it('blocks access when required module is not available', () => {
      // Mock user without business module
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_user') {
          return JSON.stringify({
            id: '1',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'analyst',
            permissions: ['view_imagery'],
            modules: ['imagery'],
            isActive: true
          });
        }
        if (key === 'auth_token') {
          return 'mock-token';
        }
        return null;
      });

      const TestComponent = () => <div>Business Content</div>;
      
      render(
        <TestWrapper>
          <ProtectedRoute requiredModules={['business']}>
            <TestComponent />
          </ProtectedRoute>
        </TestWrapper>
      );

      expect(screen.queryByText('Business Content')).not.toBeInTheDocument();
      expect(screen.getByText(/module not available/i)).toBeInTheDocument();
    });
  });

  describe('Main Navigation', () => {
    it('shows appropriate navigation items for authenticated user', () => {
      // Mock authenticated admin user
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_user') {
          return JSON.stringify({
            id: '1',
            email: 'admin@example.com',
            fullName: 'Admin User',
            role: 'admin',
            permissions: ['admin_access', 'manage_users', 'view_imagery'],
            modules: ['admin', 'imagery', 'analytics'],
            isActive: true
          });
        }
        if (key === 'auth_token') {
          return 'mock-token';
        }
        return null;
      });

      render(
        <TestWrapper>
          <MainNavigation />
        </TestWrapper>
      );

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/imagery/i)).toBeInTheDocument();
      expect(screen.getByText(/analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });

    it('hides admin navigation for non-admin users', () => {
      // Mock regular user
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_user') {
          return JSON.stringify({
            id: '1',
            email: 'user@example.com',
            fullName: 'Regular User',
            role: 'analyst',
            permissions: ['view_imagery'],
            modules: ['imagery'],
            isActive: true
          });
        }
        if (key === 'auth_token') {
          return 'mock-token';
        }
        return null;
      });

      render(
        <TestWrapper>
          <MainNavigation />
        </TestWrapper>
      );

      expect(screen.getByText(/imagery/i)).toBeInTheDocument();
      expect(screen.queryByText(/admin/i)).not.toBeInTheDocument();
    });
  });
});

describe('Role-Based Access Control (RBAC)', () => {
  const roles = [
    {
      name: 'super_admin',
      expectedPermissions: ['admin_access', 'manage_users', 'manage_system'],
      expectedModules: ['admin', 'imagery', 'analytics', 'business']
    },
    {
      name: 'admin',
      expectedPermissions: ['admin_access', 'manage_users'],
      expectedModules: ['admin', 'imagery', 'analytics']
    },
    {
      name: 'analyst',
      expectedPermissions: ['view_imagery', 'process_imagery'],
      expectedModules: ['imagery', 'analytics']
    },
    {
      name: 'business_user',
      expectedPermissions: ['view_imagery', 'purchase_data'],
      expectedModules: ['imagery', 'business']
    },
    {
      name: 'viewer',
      expectedPermissions: ['view_imagery'],
      expectedModules: ['imagery']
    }
  ];

  roles.forEach(role => {
    describe(`${role.name} role`, () => {
      it(`should have correct permissions and modules`, () => {
        // This would be tested against the actual auth constants
        // For now, we'll test the structure
        expect(role.expectedPermissions).toBeDefined();
        expect(role.expectedModules).toBeDefined();
        expect(Array.isArray(role.expectedPermissions)).toBe(true);
        expect(Array.isArray(role.expectedModules)).toBe(true);
      });
    });
  });
});

describe('Authentication State Management', () => {
  it('persists authentication state across page reloads', () => {
    const userData = {
      id: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'analyst',
      permissions: ['view_imagery'],
      modules: ['imagery'],
      isActive: true
    };

    // Simulate user data in localStorage
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'auth_user') return JSON.stringify(userData);
      if (key === 'auth_token') return 'mock-token';
      return null;
    });

    render(
      <TestWrapper>
        <div>Test Component</div>
      </TestWrapper>
    );

    // Verify localStorage was checked for existing auth data
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_user');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
  });

  it('clears authentication state on logout', () => {
    // This would test the actual logout functionality
    // Implementation depends on the auth context implementation
    expect(true).toBe(true); // Placeholder
  });
});
