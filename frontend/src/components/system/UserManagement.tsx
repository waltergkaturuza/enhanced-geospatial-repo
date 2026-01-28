import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Mail,
  Calendar,
  Shield,
  RefreshCw,
  Plus,
  Eye,
  Ban,
  CheckCircle,
  X,
  Lock,
  User,
  Building,
  Activity
} from 'lucide-react';
import { getApiBaseUrl, getAuthHeaders } from '@/lib/api';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: string;
  lastLoginAt?: string;
  organization?: string;
}

interface UserDetails extends User {
  loginHistory?: Array<{
    timestamp: string;
    ip_address: string;
  }>;
  activityLog?: Array<{
    action: string;
    timestamp: string;
    details: string;
  }>;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [viewUserDetails, setViewUserDetails] = useState<UserDetails | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    organization: '',
    role: 'user'
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      // Fetch pending users (for approval)
      const pendingResponse = await fetch(`${apiBaseUrl}/admin/pending-users/`, { headers });
      const pendingData = pendingResponse.ok ? await pendingResponse.json() : { results: [] };

      // Fetch all users (if endpoint exists)
      const allUsersResponse = await fetch(`${apiBaseUrl}/admin/users/`, { headers }).catch(() => null);
      const allUsersData = allUsersResponse?.ok ? await allUsersResponse.json() : null;

      // Use all users data if available, otherwise use pending users
      if (allUsersData && allUsersData.success && allUsersData.data && allUsersData.data.users) {
        // Transform backend user data to frontend format
        const transformedUsers = allUsersData.data.users.map((user: any) => ({
          id: parseInt(user.id) || 0,
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || 'user',
          isActive: user.isActive !== undefined ? user.isActive : true,
          isApproved: user.isApproved !== undefined ? user.isApproved : true,
          createdAt: user.createdAt || new Date().toISOString(),
          lastLoginAt: user.lastLoginAt || undefined,
          organization: user.organization || ''
        }));
        setUsers(transformedUsers);
      } else if (pendingData.results && pendingData.results.length > 0) {
        // Fallback to pending users if available
        setUsers(pendingData.results);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: number) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      const response = await fetch(`${apiBaseUrl}/admin/approve-user/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleReject = async (userId: number) => {
    if (!confirm('Are you sure you want to reject this user?')) return;
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      const response = await fetch(`${apiBaseUrl}/admin/reject-user/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const handleSuspend = async (userId: number, suspend: boolean) => {
    const action = suspend ? 'suspend' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      const response = await fetch(`${apiBaseUrl}/admin/users/update-status/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          user_id: userId, 
          is_active: !suspend 
        }),
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      const response = await fetch(`${apiBaseUrl}/admin/users/delete/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      const response = await fetch(`${apiBaseUrl}/admin/users/create/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddUserModal(false);
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          organization: '',
          role: 'user'
        });
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      const response = await fetch(`${apiBaseUrl}/admin/users/update/`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: selectedUser.id,
          ...formData
        }),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedUser(null);
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleViewUser = async (user: User) => {
    try {
      const apiBaseUrl = getApiBaseUrl();
      const headers = getAuthHeaders();

      const response = await fetch(`${apiBaseUrl}/admin/users/${user.id}/details/`, { headers });
      const data = await response.json();

      if (data.success) {
        setViewUserDetails(data.data);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Fallback to basic info
      setViewUserDetails(user as UserDetails);
      setShowViewModal(true);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      organization: user.organization || '',
      role: user.role
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.isActive && user.isApproved) ||
      (filterStatus === 'pending' && !user.isApproved) ||
      (filterStatus === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6" style={{ paddingLeft: '10mm', paddingRight: '10mm' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center">
            <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full mr-4"></div>
            User Management
          </h2>
          <p className="text-gray-600 mt-2">Comprehensive user administration and monitoring</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff</span>
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
            <option value="power_user">Power User</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending Approval</option>
            <option value="inactive">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-purple-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'staff' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!user.isApproved ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      ) : user.isActive ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {!user.isApproved && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve User"
                            >
                              <UserCheck className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject User"
                            >
                              <UserX className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {user.isApproved && (
                          <button
                            onClick={() => handleSuspend(user.id, user.isActive)}
                            className={`${
                              user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                            } p-2 hover:bg-gray-50 rounded-lg transition-colors`}
                            title={user.isActive ? 'Suspend User' : 'Activate User'}
                          >
                            {user.isActive ? <Ban className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Users</p>
              <p className="text-3xl font-bold mt-2">{users.length}</p>
            </div>
            <Users className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Users</p>
              <p className="text-3xl font-bold mt-2">{users.filter(u => u.isActive && u.isApproved).length}</p>
            </div>
            <UserCheck className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Pending Approval</p>
              <p className="text-3xl font-bold mt-2">{users.filter(u => !u.isApproved).length}</p>
            </div>
            <Shield className="h-12 w-12 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Admins</p>
              <p className="text-3xl font-bold mt-2">{users.filter(u => u.role === 'admin').length}</p>
            </div>
            <Shield className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add New Staff Member</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Edit User</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {showViewModal && viewUserDetails && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">User Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {viewUserDetails.firstName.charAt(0)}{viewUserDetails.lastName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{viewUserDetails.firstName} {viewUserDetails.lastName}</h4>
                    <p className="text-gray-600">{viewUserDetails.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{viewUserDetails.role}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        viewUserDetails.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {viewUserDetails.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Member Since</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{new Date(viewUserDetails.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Activity className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Last Login</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {viewUserDetails.lastLoginAt ? new Date(viewUserDetails.lastLoginAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Building className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Organization</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">{viewUserDetails.organization || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Account Status</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {viewUserDetails.isApproved ? 'Approved' : 'Pending'}
                  </p>
                </div>
              </div>

              {/* Activity Log */}
              {viewUserDetails.activityLog && viewUserDetails.activityLog.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {viewUserDetails.activityLog.map((activity, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-600">{activity.details}</p>
                        </div>
                        <span className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Login History */}
              {viewUserDetails.loginHistory && viewUserDetails.loginHistory.length > 0 && (
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-4">Login History</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {viewUserDetails.loginHistory.map((login, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-sm text-gray-700">{login.ip_address}</span>
                        <span className="text-xs text-gray-500">{new Date(login.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
