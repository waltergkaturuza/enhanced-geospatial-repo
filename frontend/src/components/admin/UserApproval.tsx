import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  User as UserIcon, 
  Mail, 
  Building, 
  Calendar,
  MessageSquare,
  Filter,
  Search,
  AlertTriangle,
  Shield
} from 'lucide-react';
import type { SimpleUser as User } from '../../types/auth';

/**
 * UserApproval Component
 * 
 * Admin interface for approving or rejecting pending user accounts.
 * Shows pending users and allows admins to approve/reject with reasons.
 */
export const UserApproval: React.FC = () => {
  const { hasPermission } = useAuthContext();
  
  // Mock data - in real app, this would come from API
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');

  // Check if user has permission to approve users
  const canApproveUsers = hasPermission('approve_users') || hasPermission('admin_access');

  useEffect(() => {
    // Mock API call to fetch pending users
    const fetchPendingUsers = async () => {
      setIsLoading(true);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock pending user data
      const mockPendingUsers: User[] = [
        {
          id: '5',
          email: 'john.doe@company.com',
          firstName: 'John',
          lastName: 'Doe',
          organization: 'Tech Solutions Inc',
          role: 'pending_user',
          subscriptionPlan: 'free_pending',
          isActive: true,
          emailVerified: true,
          isApproved: false,
          approvalStatus: 'pending',
          createdAt: '2024-01-16T09:00:00Z',
          modules: ['dashboard', 'data_store']
        },
        {
          id: '6',
          email: 'sarah.wilson@research.edu',
          firstName: 'Sarah',
          lastName: 'Wilson',
          organization: 'University Research Lab',
          role: 'pending_user',
          subscriptionPlan: 'free_pending',
          isActive: true,
          emailVerified: true,
          isApproved: false,
          approvalStatus: 'pending',
          createdAt: '2024-01-15T14:30:00Z',
          modules: ['dashboard', 'data_store']
        },
        {
          id: '7',
          email: 'mike.johnson@startup.io',
          firstName: 'Mike',
          lastName: 'Johnson',
          organization: 'GeoStartup',
          role: 'pending_user',
          subscriptionPlan: 'free_pending',
          isActive: true,
          emailVerified: false,
          isApproved: false,
          approvalStatus: 'pending',
          createdAt: '2024-01-14T11:15:00Z',
          modules: ['dashboard', 'data_store']
        }
      ];
      
      setPendingUsers(mockPendingUsers);
      setFilteredUsers(mockPendingUsers);
      setIsLoading(false);
    };

    fetchPendingUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    const filtered = pendingUsers.filter(user =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.organization.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, pendingUsers]);

  const handleApprovalAction = (user: User, action: 'approve' | 'reject') => {
    setSelectedUser(user);
    setApprovalAction(action);
    setRejectionReason('');
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedUser) return;

    // Mock API call
    console.log(`${approvalAction} user:`, selectedUser.id, rejectionReason);
    
    // Update user status
    const updatedUsers = pendingUsers.filter(user => user.id !== selectedUser.id);
    setPendingUsers(updatedUsers);
    setFilteredUsers(updatedUsers);
    
    setShowApprovalModal(false);
    setSelectedUser(null);
    setRejectionReason('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!canApproveUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-sm text-gray-500">
            You don't have permission to approve users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Approval</h1>
          <p className="text-sm text-gray-600 mt-1">
            Review and approve pending user accounts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium text-gray-900">
            {filteredUsers.length} pending
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Pending Users List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading pending users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
          <p className="text-sm text-gray-500">
            No pending user approvals at the moment.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pending Users</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-500" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        {!user.emailVerified && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <Mail className="h-4 w-4 mr-1" />
                          {user.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Building className="h-4 w-4 mr-1" />
                          {user.organization}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApprovalAction(user, 'reject')}
                      className="flex items-center px-3 py-1 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleApprovalAction(user, 'approve')}
                      className="flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              {approvalAction === 'approve' ? (
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500 mr-2" />
              )}
              <h3 className="text-lg font-medium text-gray-900">
                {approvalAction === 'approve' ? 'Approve User' : 'Reject User'}
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {approvalAction === 'approve' 
                  ? `Approve ${selectedUser.firstName} ${selectedUser.lastName}?`
                  : `Reject ${selectedUser.firstName} ${selectedUser.lastName}?`
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedUser.email} • {selectedUser.organization}
              </p>
            </div>

            {approvalAction === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={approvalAction === 'reject' && !rejectionReason.trim()}
                className={`flex-1 px-4 py-2 rounded-md text-white ${
                  approvalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {approvalAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
