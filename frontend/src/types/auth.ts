// Authentication and Authorization Types

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  isApproved: boolean; // New approval status
  approvalStatus: 'pending' | 'approved' | 'rejected'; // Detailed approval status
  approvedBy?: string; // ID of admin who approved
  approvedAt?: Date; // When approved
  rejectionReason?: string; // Reason for rejection if rejected
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  roles: UserRole[];
  permissions: Permission[];
  profile: UserProfile;
}

export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  level: number; // 1-10, higher = more access
  isActive: boolean;
  permissions: Permission[];
  modules: ModuleAccess[];
  createdAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: PermissionAction;
  conditions?: PermissionCondition[];
}

export interface ModuleAccess {
  moduleId: string;
  access: AccessLevel;
  features: string[];
}

export interface UserProfile {
  organization?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  location?: string;
  bio?: string;
  preferences: UserPreferences;
  subscription?: Subscription;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: NotificationType[];
}

export interface DashboardSettings {
  layout: 'grid' | 'list' | 'cards';
  widgets: string[];
  defaultView: string;
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  storage: number; // GB
  apiCalls: number; // per month
  users: number;
  projects: number;
}

export type PermissionAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'import' | 'export' | 'process' | 'analyze'
  | 'manage' | 'approve' | 'publish';

export type AccessLevel = 'none' | 'read' | 'write' | 'admin' | 'owner';

export type UserRoleType = 
  | 'super_admin' | 'admin' | 'analyst' | 'business_user' 
  | 'researcher' | 'viewer' | 'guest';

export type SystemModule = 
  | 'dashboard' | 'satellite_data' | 'analytics' | 'business_intelligence'
  | 'data_store' | 'shopping_cart' | 'user_management' | 'system_admin'
  | 'reports' | 'api_access' | 'billing' | 'support';

export type NotificationType = 
  | 'system' | 'security' | 'data_processing' | 'billing' | 'updates';

export type SubscriptionPlan = 
  | 'free' | 'starter' | 'professional' | 'enterprise' | 'custom';

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains';
  value: any;
}

// Authentication State
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

// Additional types for authentication context and simplified user structure

export interface SimpleUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organization: string;
  role: string;
  subscriptionPlan: string;
  isActive: boolean;
  emailVerified: boolean;
  isApproved: boolean; // New approval status
  approvalStatus: 'pending' | 'approved' | 'rejected'; // Detailed approval status
  approvedBy?: string; // ID of admin who approved
  approvedAt?: string; // When approved (ISO string)
  rejectionReason?: string; // Reason for rejection if rejected
  createdAt: string;
  lastLoginAt?: string;
  modules: string[];
  bio?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  organization: string;
  role: string;
  subscriptionPlan: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface AuthContextType {
  user: SimpleUser | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials, rememberMe?: boolean) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  requestPasswordReset: (request: PasswordResetRequest) => Promise<void>;
  updateProfile: (updates: Partial<SimpleUser>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasModuleAccess: (module: string) => boolean;
  hasRole: (role: string) => boolean;
  isUserApproved: () => boolean;
  isPendingApproval: () => boolean;
  canAccessFullFeatures: () => boolean;
  getAccessLevelMessage: () => string | null;
}
