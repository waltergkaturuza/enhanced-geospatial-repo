import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  Globe, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut, 
  Shield, 
  Bell,
  ChevronDown,
  FolderTree,
  LayoutDashboard,
  Satellite,
  BarChart3,
  Briefcase,
  ShoppingCart
} from 'lucide-react';

/**
 * MainNavigation Component
 * 
 * Main navigation header with authentication-aware menu items,
 * user profile dropdown, and role-based navigation.
 */
export const MainNavigation: React.FC = () => {
  const { user, logout, hasPermission, hasModuleAccess } = useAuthContext();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // Navigation items based on user role and permissions
  const getNavigationItems = () => {
    const items = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        show: !!user
      },
      {
        name: 'Imagery',
        href: '/imagery',
        icon: Satellite,
        show: user && hasModuleAccess('imagery')
      },
      {
        name: 'Files',
        href: '/files',
        icon: FolderTree,
        show: user && hasModuleAccess('imagery')
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        show: user && hasModuleAccess('analytics')
      },
      {
        name: 'Business',
        href: '/business',
        icon: Briefcase,
        show: user && hasModuleAccess('business')
      },
      {
        name: 'Store',
        href: '/store',
        icon: ShoppingCart,
        show: user && hasModuleAccess('business')
      },
      {
        name: 'Admin',
        href: '/admin',
        icon: Shield,
        show: user && (hasPermission('admin_access') || hasPermission('manage_users'))
      }
    ];

    return items.filter(item => item.show);
  };

  const navigationItems = getNavigationItems();

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileDropdownOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActiveRoute = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <nav className="shadow-lg" style={{ backgroundColor: '#1877F2' }}>
      <div style={{ paddingLeft: '10mm', paddingRight: '10mm' }}>
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
                <Globe className="h-8 w-8 text-white" />
                <span className="text-xl font-bold text-white">
                  GeoSpatial
                </span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-semibold transition-colors duration-200 ${
                    isActiveRoute(item.href)
                      ? 'border-white text-white'
                      : 'border-transparent text-white/90 hover:border-white/50 hover:text-white'
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <button className="p-2 text-white/90 hover:text-white relative">
                  <Bell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#1877F2]" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                  >
                    <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-semibold text-white">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-white/80">{user.role}</div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-white/90" />
                  </button>

                  {/* Dropdown menu */}
                  {isProfileDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                        
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <User className="h-4 w-4 mr-3" />
                          Your Profile
                        </Link>
                        
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings className="h-4 w-4 mr-3" />
                          Settings
                        </Link>

                        {(hasPermission('admin_access') || hasPermission('manage_users')) && (
                          <Link
                            to="/admin"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <Shield className="h-4 w-4 mr-3" />
                            Admin Panel
                          </Link>
                        )}
                        
                        <div className="border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Auth buttons for non-logged-in users */
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-white/90 hover:text-white px-3 py-2 rounded-md text-sm font-semibold"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="bg-white hover:bg-white/90 text-[#1877F2] px-4 py-2 rounded-md text-sm font-semibold"
                >
                  Sign up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" style={{ backgroundColor: '#1877F2' }}>
          <div className="pt-2 pb-3 space-y-1 border-t border-white/20">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center pl-3 pr-4 py-2 border-l-4 text-base font-semibold ${
                  isActiveRoute(item.href)
                    ? 'bg-white/20 border-white text-white'
                    : 'border-transparent text-white/90 hover:text-white hover:bg-white/10 hover:border-white/50'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>

          {user && (
            <div className="pt-4 pb-3 border-t border-white/20">
              <div className="flex items-center px-4">
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div className="ml-3">
                  <div className="text-base font-semibold text-white">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm font-medium text-white/80">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <User className="h-5 w-5 mr-3" />
                  Your Profile
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(isProfileDropdownOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileDropdownOpen(false);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </nav>
  );
};

export default MainNavigation;
