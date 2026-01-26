import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { getApiBaseUrl, getAuthHeaders } from '../../lib/api';
import { 
  Users, 
  Shield, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Ban, 
  CheckCircle, 
  X,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { USER_ROLES } from '../../constants/auth';
import type { SimpleUser as User } from '../../types/auth';

/**
 * RoleManagement Component
 * 
 * Admin interface for managing user roles, permissions, and access control.
 * Allows viewing, editing, and updating user roles and permissions.
 */
export const RoleManagement: React.FC = () => {
  const { hasPermission } = useAuthContext();
  
  // Mock data - in real app, this would come from API
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Check if user has permission to manage roles
  const canManageRoles = hasPermission('manage_users') || hasPermission('admin_access');

  useEffect(() => {
    // Fetch users from backend API
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const apiBaseUrl = getApiBaseUrl();
        const headers = getAuthHeaders();

        const response = await fetch(`${apiBaseUrl}/admin/users/`, { headers });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.users) {
            // Transform backend user data to frontend format
            const transformedUsers: User[] = data.data.users.map((user: any) => ({
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              organization: user.organization || '',
              role: user.role,
              subscriptionPlan: user.subscriptionPlan,
              isActive: user.isActive,
              emailVerified: user.emailVerified !== undefined ? user.emailVerified : true,
              isApproved: user.isApproved !== undefined ? user.isApproved : true,
              approvalStatus: user.approvalStatus || 'approved',
              createdAt: user.createdAt,
              lastLoginAt: user.lastLoginAt || null,
              modules: user.modules || ['dashboard']
            }));
            
            setUsers(transformedUsers);
            setFilteredUsers(transformedUsers);
          } else {
            console.error('Failed to fetch users:', data.message);
            setUsers([]);
            setFilteredUsers([]);
          }
        } else {
          console.error('Error fetching users:', response.statusText);
          setUsers([]);
          setFilteredUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole]);

  if (!canManageRoles) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to manage user roles.
          </p>
        </div>
      </div>
    );
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleUpdateUser = async (updatedUser: Partial<User>) => {
    if (!selectedUser) return;
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      const response = await fetch(`${apiBaseUrl}/admin/users/update-role/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: selectedUser.id,
          role: updatedUser.role,
          isActive: updatedUser.isActive
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setUsers(prev => prev.map(u => 
            u.id === selectedUser.id ? { ...u, ...updatedUser } : u
          ));
          setShowEditModal(false);
          setSelectedUser(null);
          
          // Refresh filtered users
          setFilteredUsers(prev => prev.map(u => 
            u.id === selectedUser.id ? { ...u, ...updatedUser } : u
          ));
        } else {
          console.error('Failed to update user:', data.message);
          alert('Failed to update user: ' + data.message);
        }
      } else {
        const errorData = await response.json();
        console.error('Error updating user:', errorData.message);
        alert('Error updating user: ' + (errorData.message || response.statusText));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error updating user. Please try again.');
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      const response = await fetch(`${apiBaseUrl}/admin/users/update-role/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: userId,
          isActive: !user.isActive
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local state
          setUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, isActive: !u.isActive } : u
          ));
          setFilteredUsers(prev => prev.map(u => 
            u.id === userId ? { ...u, isActive: !u.isActive } : u
          ));
        } else {
          console.error('Failed to toggle user status:', data.message);
          alert('Failed to update user status: ' + data.message);
        }
      } else {
        const errorData = await response.json();
        console.error('Error toggling user status:', errorData.message);
        alert('Error updating user status: ' + (errorData.message || response.statusText));
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('Error updating user status. Please try again.');
    }
  };

  return (
    <div className="max-w-screen-2xl mx-auto py-8" style={{ paddingLeft: '10mm', paddingRight: '10mm' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage user roles, permissions, and access control
            </p>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400 mr-2" />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Roles</option>
                  {Object.entries(USER_ROLES).map(([key, role]) => (
                    <option key={key} value={key}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(u => u.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {users.filter(u => !u.isActive).length}
              </div>
              <div className="text-sm text-gray-600">Inactive Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {users.filter(u => !u.emailVerified).length}
              </div>
              <div className="text-sm text-gray-600">Unverified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Users ({filteredUsers.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
              <p className="mt-2 text-sm text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-sm text-gray-500">{user.organization}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {USER_ROLES[user.role]?.name || user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {!user.emailVerified && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={`${
                            user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onSave={handleUpdateUser}
          onCancel={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
};

/**
 * EditUserModal Component
 * 
 * Modal for editing user information and role assignments
 */
interface EditUserModalProps {
  user: User;
  onSave: (user: Partial<User>) => void;
  onCancel: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    role: user.role,
    isActive: user.isActive,
    modules: user.modules || []
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Edit User: {user.firstName} {user.lastName}
            </h3>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                {Object.entries(USER_ROLES).map(([key, role]) => (
                  <option key={key} value={key}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Active User
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
