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

interface PendingUserDetails extends User {
  organizationType?: string;
  intendedUse?: string;
  intendedUseDetails?: string;
  country?: string;
  userPath?: string;
}

/**
 * UserApproval Component
 * 
 * Admin interface for approving or rejecting pending user accounts.
 * Shows pending users and allows admins to approve/reject with reasons.
 */
export const UserApproval: React.FC = () => {
  const { hasPermission } = useAuthContext();
  
  const [pendingUsers, setPendingUsers] = useState<PendingUserDetails[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<PendingUserDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<PendingUserDetails | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignedRole, setAssignedRole] = useState('viewer');
  const [assignedSubscription, setAssignedSubscription] = useState('free');

  // Check if user has permission to approve users
  const canApproveUsers = hasPermission('approve_users') || hasPermission('admin_access');

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${apiBaseUrl}/admin/pending-users/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending users');
      }

      const data = await response.json();
      
      if (data.success && data.results) {
        setPendingUsers(data.results);
        setFilteredUsers(data.results);
      } else {
        setPendingUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setPendingUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleApprovalAction = (user: PendingUserDetails, action: 'approve' | 'reject') => {
    setSelectedUser(user);
    setApprovalAction(action);
    setRejectionReason('');
    
    // Set default role based on organization type
    if (action === 'approve') {
      if (user.organizationType?.includes('university') || user.organizationType?.includes('school')) {
        setAssignedRole('researcher');
        setAssignedSubscription('free');
      } else if (user.organizationType?.includes('government') || user.organizationType?.includes('council')) {
        setAssignedRole('analyst');
        setAssignedSubscription('professional');
      } else if (user.organizationType?.includes('private') || user.organizationType?.includes('company')) {
        setAssignedRole('business_user');
        setAssignedSubscription('professional');
      } else {
        setAssignedRole('viewer');
        setAssignedSubscription('free');
      }
    }
    
    setShowApprovalModal(true);
  };

  const getOrganizationTypeLabel = (type?: string): string => {
    const labels: Record<string, string> = {
      'local_council': 'Local Council',
      'provincial_government': 'Provincial Government',
      'national_government': 'National Government',
      'ministry': 'Ministry',
      'private_company': 'Private Company',
      'ngo': 'NGO',
      'university': 'University',
      'college': 'College',
      'high_school': 'High School',
      'independent_researcher': 'Independent Researcher',
      'student': 'Student'
    };
    return labels[type || ''] || type || 'Not specified';
  };

  const getIntendedUseLabel = (use?: string): string => {
    const labels: Record<string, string> = {
      'research': 'Academic Research',
      'planning': 'Urban/Regional Planning',
      'policy': 'Policy Development',
      'education': 'Education/Teaching',
      'analysis': 'Commercial Analysis',
      'monitoring': 'Environmental Monitoring',
      'mapping': 'Mapping/Cartography',
      'agriculture': 'Agriculture',
      'disaster': 'Disaster Management'
    };
    return labels[use || ''] || use || 'Not specified';
  };

  const handleConfirmApproval = async () => {
    if (!selectedUser) return;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const token = localStorage.getItem('token');

      if (approvalAction === 'approve') {
        // Approve user with assigned role and subscription
        const response = await fetch(`${apiBaseUrl}/admin/approve-user/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: selectedUser.id,
            role: assignedRole,
            subscription_plan: assignedSubscription
          })
        });

        if (!response.ok) {
          throw new Error('Failed to approve user');
        }

        const data = await response.json();
        if (data.success) {
          // Refresh the pending users list
          await fetchPendingUsers();
        } else {
          throw new Error(data.message || 'Approval failed');
        }
      } else {
        // Reject user with reason
        const response = await fetch(`${apiBaseUrl}/admin/reject-user/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: selectedUser.id,
            reason: rejectionReason
          })
        });

        if (!response.ok) {
          throw new Error('Failed to reject user');
        }

        const data = await response.json();
        if (data.success) {
          // Refresh the pending users list
          await fetchPendingUsers();
        } else {
          throw new Error(data.message || 'Rejection failed');
        }
      }

      // Close modal and reset state
      setShowApprovalModal(false);
      setSelectedUser(null);
      setRejectionReason('');
      setAssignedRole('viewer');
      setAssignedSubscription('free');
    } catch (error) {
      console.error(`Error ${approvalAction}ing user:`, error);
      alert(`Failed to ${approvalAction} user. Please try again.`);
    }
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
                      
                      {/* Application Details */}
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {user.organizationType && (
                          <div className="flex items-start">
                            <span className="text-xs font-medium text-gray-700 mr-1">Type:</span>
                            <span className="text-xs text-gray-600">{getOrganizationTypeLabel(user.organizationType)}</span>
                          </div>
                        )}
                        {user.intendedUse && (
                          <div className="flex items-start">
                            <span className="text-xs font-medium text-gray-700 mr-1">Use:</span>
                            <span className="text-xs text-gray-600">{getIntendedUseLabel(user.intendedUse)}</span>
                          </div>
                        )}
                        {user.country && (
                          <div className="flex items-start">
                            <span className="text-xs font-medium text-gray-700 mr-1">Country:</span>
                            <span className="text-xs text-gray-600">{user.country}</span>
                          </div>
                        )}
                      </div>
                      
                      {user.intendedUseDetails && (
                        <div className="mt-2 text-xs text-gray-600 italic bg-gray-50 p-2 rounded">
                          "{user.intendedUseDetails}"
                        </div>
                      )}
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
            
            <div className="mb-4 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-2">
                {approvalAction === 'approve' 
                  ? `Approve ${selectedUser.firstName} ${selectedUser.lastName}?`
                  : `Reject ${selectedUser.firstName} ${selectedUser.lastName}?`
                }
              </p>
              <div className="space-y-1 text-xs text-gray-600">
                <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                <p><span className="font-medium">Organization:</span> {selectedUser.organization}</p>
                {selectedUser.organizationType && (
                  <p><span className="font-medium">Type:</span> {getOrganizationTypeLabel(selectedUser.organizationType)}</p>
                )}
                {selectedUser.intendedUse && (
                  <p><span className="font-medium">Intended Use:</span> {getIntendedUseLabel(selectedUser.intendedUse)}</p>
                )}
                {selectedUser.country && (
                  <p><span className="font-medium">Country:</span> {selectedUser.country}</p>
                )}
                {selectedUser.intendedUseDetails && (
                  <p className="italic mt-2 bg-white p-2 rounded border border-gray-200">
                    "{selectedUser.intendedUseDetails}"
                  </p>
                )}
              </div>
            </div>

            {approvalAction === 'approve' && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Role *
                  </label>
                  <select
                    value={assignedRole}
                    onChange={(e) => setAssignedRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="viewer">Viewer - Read-only access</option>
                    <option value="researcher">Researcher - Data access + analysis</option>
                    <option value="analyst">Analyst - Advanced analytics</option>
                    <option value="business_user">Business User - Commercial access</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Role determines data access and feature availability
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Tier *
                  </label>
                  <select
                    value={assignedSubscription}
                    onChange={(e) => setAssignedSubscription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="free">Educational/Trial Access (10 AOIs, 50GB)</option>
                    <option value="professional">Government/Institutional Access (50 AOIs, 500GB)</option>
                    <option value="enterprise">Commercial Access (Unlimited)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Access tier determines storage quotas and download limits
                  </p>
                </div>
              </div>
            )}

            {approvalAction === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason *
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
