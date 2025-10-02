// Authentication and Authorization Constants

import type { UserRole, Permission } from '../types/auth';
import { 
  Users, BarChart3, Briefcase, Database, ShoppingCart,
  Settings, FileText, Key, CreditCard, HelpCircle
} from 'lucide-react';

// System Modules with Icons and Descriptions
export const SYSTEM_MODULES = {
  dashboard: {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main dashboard and overview',
    icon: BarChart3,
    color: 'blue',
    path: '/dashboard'
  },
  satellite_data: {
    id: 'satellite_data',
    name: 'Satellite Data',
    description: 'Satellite imagery and geospatial data management',
    icon: Database,
    color: 'green',
    path: '/satellite-data'
  },
  analytics: {
    id: 'analytics',
    name: 'Analytics',
    description: 'Data analysis and processing tools',
    icon: BarChart3,
    color: 'purple',
    path: '/analytics'
  },
  business_intelligence: {
    id: 'business_intelligence',
    name: 'Business Intelligence',
    description: 'Business insights and reporting',
    icon: Briefcase,
    color: 'orange',
    path: '/business-intelligence'
  },
  data_store: {
    id: 'data_store',
    name: 'Data Store',
    description: 'Data marketplace and catalog',
    icon: Database,
    color: 'indigo',
    path: '/data-store'
  },
  shopping_cart: {
    id: 'shopping_cart',
    name: 'Shopping Cart',
    description: 'Purchase data products and services',
    icon: ShoppingCart,
    color: 'pink',
    path: '/cart'
  },
  user_management: {
    id: 'user_management',
    name: 'User Management',
    description: 'Manage users, roles, and permissions',
    icon: Users,
    color: 'red',
    path: '/admin/users'
  },
  system_admin: {
    id: 'system_admin',
    name: 'System Administration',
    description: 'System configuration and maintenance',
    icon: Settings,
    color: 'gray',
    path: '/admin/system'
  },
  reports: {
    id: 'reports',
    name: 'Reports',
    description: 'Generate and manage reports',
    icon: FileText,
    color: 'teal',
    path: '/reports'
  },
  api_access: {
    id: 'api_access',
    name: 'API Access',
    description: 'API keys and developer tools',
    icon: Key,
    color: 'yellow',
    path: '/api'
  },
  billing: {
    id: 'billing',
    name: 'Billing',
    description: 'Subscription and payment management',
    icon: CreditCard,
    color: 'emerald',
    path: '/billing'
  },
  support: {
    id: 'support',
    name: 'Support',
    description: 'Help desk and documentation',
    icon: HelpCircle,
    color: 'blue',
    path: '/support'
  }
} as const;

// Predefined User Roles
export const USER_ROLES: Record<string, Omit<UserRole, 'id' | 'createdAt'>> = {
  super_admin: {
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    level: 10,
    isActive: true,
    permissions: [], // Will be populated with all permissions
    modules: Object.keys(SYSTEM_MODULES).map(moduleId => ({
      moduleId,
      access: 'owner' as const,
      features: ['*']
    }))
  },
  admin: {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrative access to most system functions',
    level: 8,
    isActive: true,
    permissions: [],
    modules: [
      { moduleId: 'dashboard', access: 'admin', features: ['*'] },
      { moduleId: 'satellite_data', access: 'admin', features: ['*'] },
      { moduleId: 'analytics', access: 'admin', features: ['*'] },
      { moduleId: 'business_intelligence', access: 'admin', features: ['*'] },
      { moduleId: 'data_store', access: 'admin', features: ['*'] },
      { moduleId: 'user_management', access: 'write', features: ['view_users', 'edit_users', 'manage_roles'] },
      { moduleId: 'reports', access: 'admin', features: ['*'] },
      { moduleId: 'api_access', access: 'write', features: ['manage_keys'] },
      { moduleId: 'billing', access: 'read', features: ['view_billing'] },
      { moduleId: 'support', access: 'admin', features: ['*'] }
    ]
  },
  analyst: {
    name: 'analyst',
    displayName: 'Data Analyst',
    description: 'Data analysis and processing specialist',
    level: 6,
    isActive: true,
    permissions: [],
    modules: [
      { moduleId: 'dashboard', access: 'write', features: ['*'] },
      { moduleId: 'satellite_data', access: 'write', features: ['upload', 'process', 'analyze', 'export'] },
      { moduleId: 'analytics', access: 'admin', features: ['*'] },
      { moduleId: 'business_intelligence', access: 'write', features: ['create_reports', 'analyze_data'] },
      { moduleId: 'data_store', access: 'write', features: ['browse', 'purchase'] },
      { moduleId: 'shopping_cart', access: 'write', features: ['*'] },
      { moduleId: 'reports', access: 'write', features: ['create', 'export'] },
      { moduleId: 'api_access', access: 'read', features: ['view_docs'] },
      { moduleId: 'support', access: 'read', features: ['view_docs', 'submit_tickets'] }
    ]
  },
  business_user: {
    name: 'business_user',
    displayName: 'Business User',
    description: 'Business intelligence and reporting user',
    level: 5,
    isActive: true,
    permissions: [],
    modules: [
      { moduleId: 'dashboard', access: 'read', features: ['view_dashboards'] },
      { moduleId: 'satellite_data', access: 'read', features: ['view', 'download'] },
      { moduleId: 'analytics', access: 'read', features: ['view_results'] },
      { moduleId: 'business_intelligence', access: 'write', features: ['*'] },
      { moduleId: 'data_store', access: 'write', features: ['browse', 'purchase'] },
      { moduleId: 'shopping_cart', access: 'write', features: ['*'] },
      { moduleId: 'reports', access: 'write', features: ['create', 'view', 'export'] },
      { moduleId: 'billing', access: 'read', features: ['view_billing'] },
      { moduleId: 'support', access: 'read', features: ['view_docs', 'submit_tickets'] }
    ]
  },
  researcher: {
    name: 'researcher',
    displayName: 'Researcher',
    description: 'Academic and research user with data access',
    level: 4,
    isActive: true,
    permissions: [],
    modules: [
      { moduleId: 'dashboard', access: 'read', features: ['view_dashboards'] },
      { moduleId: 'satellite_data', access: 'write', features: ['upload', 'process', 'analyze', 'export'] },
      { moduleId: 'analytics', access: 'write', features: ['analyze', 'export'] },
      { moduleId: 'data_store', access: 'read', features: ['browse', 'download_free'] },
      { moduleId: 'reports', access: 'write', features: ['create', 'export'] },
      { moduleId: 'api_access', access: 'read', features: ['view_docs', 'limited_api'] },
      { moduleId: 'support', access: 'read', features: ['view_docs', 'submit_tickets'] }
    ]
  },
  viewer: {
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to data and reports',
    level: 2,
    isActive: true,
    permissions: [],
    modules: [
      { moduleId: 'dashboard', access: 'read', features: ['view_dashboards'] },
      { moduleId: 'satellite_data', access: 'read', features: ['view'] },
      { moduleId: 'analytics', access: 'read', features: ['view_results'] },
      { moduleId: 'business_intelligence', access: 'read', features: ['view_reports'] },
      { moduleId: 'data_store', access: 'read', features: ['browse'] },
      { moduleId: 'reports', access: 'read', features: ['view'] },
      { moduleId: 'support', access: 'read', features: ['view_docs'] }
    ]
  },
  pending_user: {
    name: 'pending_user',
    displayName: 'Pending User',
    description: 'New user awaiting approval - has access to free features',
    level: 2,
    isActive: true,
    permissions: [],
    modules: [
      { moduleId: 'dashboard', access: 'read', features: ['view_public', 'view_personal'] },
      { moduleId: 'satellite_data', access: 'read', features: ['view_free_data', 'download_small'] },
      { moduleId: 'data_store', access: 'read', features: ['browse_free', 'download_free'] },
      { moduleId: 'analytics', access: 'read', features: ['basic_analytics'] },
      { moduleId: 'reports', access: 'read', features: ['view_basic'] },
      { moduleId: 'support', access: 'read', features: ['view_docs', 'submit_tickets'] }
    ]
  },
  guest: {
    name: 'guest',
    displayName: 'Guest',
    description: 'Limited access for trial users',
    level: 1,
    isActive: true,
    permissions: [],
    modules: [
      { moduleId: 'dashboard', access: 'read', features: ['view_public'] },
      { moduleId: 'data_store', access: 'read', features: ['browse_public'] },
      { moduleId: 'support', access: 'read', features: ['view_docs'] }
    ]
  }
};

// System Permissions
export const SYSTEM_PERMISSIONS: Permission[] = [
  // User Management
  { id: 'user.create', name: 'Create Users', resource: 'user', action: 'create' },
  { id: 'user.read', name: 'View Users', resource: 'user', action: 'read' },
  { id: 'user.update', name: 'Update Users', resource: 'user', action: 'update' },
  { id: 'user.delete', name: 'Delete Users', resource: 'user', action: 'delete' },
  { id: 'user.manage', name: 'Manage Users', resource: 'user', action: 'manage' },
  { id: 'user.approve', name: 'Approve Users', resource: 'user', action: 'approve' },
  { id: 'user.reject', name: 'Reject Users', resource: 'user', action: 'approve' },
  
  // Role Management
  { id: 'role.create', name: 'Create Roles', resource: 'role', action: 'create' },
  { id: 'role.read', name: 'View Roles', resource: 'role', action: 'read' },
  { id: 'role.update', name: 'Update Roles', resource: 'role', action: 'update' },
  { id: 'role.delete', name: 'Delete Roles', resource: 'role', action: 'delete' },
  { id: 'role.assign', name: 'Assign Roles', resource: 'role', action: 'manage' },
  
  // Data Management
  { id: 'data.create', name: 'Create Data', resource: 'data', action: 'create' },
  { id: 'data.read', name: 'View Data', resource: 'data', action: 'read' },
  { id: 'data.update', name: 'Update Data', resource: 'data', action: 'update' },
  { id: 'data.delete', name: 'Delete Data', resource: 'data', action: 'delete' },
  { id: 'data.import', name: 'Import Data', resource: 'data', action: 'import' },
  { id: 'data.export', name: 'Export Data', resource: 'data', action: 'export' },
  { id: 'data.process', name: 'Process Data', resource: 'data', action: 'process' },
  { id: 'data.analyze', name: 'Analyze Data', resource: 'data', action: 'analyze' },
  
  // System Administration
  { id: 'system.read', name: 'View System Settings', resource: 'system', action: 'read' },
  { id: 'system.update', name: 'Update System Settings', resource: 'system', action: 'update' },
  { id: 'system.manage', name: 'Manage System', resource: 'system', action: 'manage' },
  
  // Billing and Commerce
  { id: 'billing.read', name: 'View Billing', resource: 'billing', action: 'read' },
  { id: 'billing.manage', name: 'Manage Billing', resource: 'billing', action: 'manage' },
  { id: 'order.create', name: 'Create Orders', resource: 'order', action: 'create' },
  { id: 'order.read', name: 'View Orders', resource: 'order', action: 'read' },
  { id: 'order.update', name: 'Update Orders', resource: 'order', action: 'update' },
  
  // Reports
  { id: 'report.create', name: 'Create Reports', resource: 'report', action: 'create' },
  { id: 'report.read', name: 'View Reports', resource: 'report', action: 'read' },
  { id: 'report.update', name: 'Update Reports', resource: 'report', action: 'update' },
  { id: 'report.delete', name: 'Delete Reports', resource: 'report', action: 'delete' },
  { id: 'report.publish', name: 'Publish Reports', resource: 'report', action: 'publish' }
];

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  free_pending: {
    id: 'free_pending',
    name: 'Free (Pending Approval)',
    description: 'Limited access while awaiting account approval',
    price: 0,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Access to sample datasets',
      'Basic analytics (limited)',
      'Community support',
      '500 MB storage',
      '50 API calls/month',
      'Download restrictions apply'
    ],
    limits: {
      storage: 0.5, // GB
      apiCalls: 50,
      users: 1,
      projects: 1
    }
  },
  free: {
    id: 'free',
    name: 'Free',
    description: 'Basic access for getting started',
    price: 0,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Access to public datasets',
      'Basic analytics',
      'Community support',
      '1 GB storage',
      '100 API calls/month'
    ],
    limits: {
      storage: 1, // GB
      apiCalls: 100,
      users: 1,
      projects: 3
    }
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams and projects',
    price: 29,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Everything in Free',
      'Premium datasets',
      'Advanced analytics',
      'Email support',
      '10 GB storage',
      '1,000 API calls/month',
      'Basic reporting'
    ],
    limits: {
      storage: 10,
      apiCalls: 1000,
      users: 3,
      projects: 10
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced features for professionals',
    price: 99,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Everything in Starter',
      'All datasets',
      'Advanced processing',
      'Priority support',
      '100 GB storage',
      '10,000 API calls/month',
      'Custom reports',
      'Team collaboration'
    ],
    limits: {
      storage: 100,
      apiCalls: 10000,
      users: 10,
      projects: 50
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full-featured solution for large organizations',
    price: 299,
    currency: 'USD',
    billing: 'monthly',
    features: [
      'Everything in Professional',
      'Custom integrations',
      'Dedicated support',
      'Unlimited storage',
      'Unlimited API calls',
      'White labeling',
      'Advanced security',
      'SLA guarantee'
    ],
    limits: {
      storage: -1, // Unlimited
      apiCalls: -1, // Unlimited
      users: -1, // Unlimited
      projects: -1 // Unlimited
    }
  }
} as const;

// Default User Preferences
export const DEFAULT_USER_PREFERENCES = {
  theme: 'light' as const,
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: true,
    sms: false,
    types: ['system', 'security', 'data_processing'] as const
  },
  dashboard: {
    layout: 'grid' as const,
    widgets: ['overview', 'recent_data', 'analytics'],
    defaultView: 'dashboard'
  }
};

// Authentication Messages
export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in',
  LOGIN_FAILED: 'Invalid email or password',
  LOGOUT_SUCCESS: 'Successfully logged out',
  SIGNUP_SUCCESS: 'Account created successfully. Please verify your email.',
  SIGNUP_FAILED: 'Failed to create account',
  EMAIL_VERIFICATION_SENT: 'Verification email sent',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email',
  PASSWORD_CHANGED: 'Password changed successfully',
  ACCESS_DENIED: 'Access denied. Insufficient permissions.',
  SESSION_EXPIRED: 'Session expired. Please log in again.',
  ACCOUNT_SUSPENDED: 'Account suspended. Contact support.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address first.'
} as const;
