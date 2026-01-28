import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  MessageSquare, 
  Plus, 
  X, 
  Send,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';
import axios from 'axios';

interface SupportRequest {
  id: number;
  request_type: string;
  request_type_display: string;
  subject: string;
  description: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
  assigned_to: {
    id: number;
    email: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  message_count: number;
  last_message_at: string | null;
}

interface Message {
  id: number;
  user: {
    id: number;
    email: string;
    name: string;
  };
  message: string;
  is_staff_reply: boolean;
  is_internal: boolean;
  created_at: string;
}

interface RequestDetail extends SupportRequest {
  messages: Message[];
}

const SupportRequests: React.FC = () => {
  const { token, user } = useAuthContext();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  
  // New request form
  const [newRequest, setNewRequest] = useState({
    request_type: 'general',
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const headers = { Authorization: `Token ${token}` };
      const params = statusFilter ? { status: statusFilter } : {};
      
      const response = await axios.get('/api/support/requests/', { headers, params });
      setRequests(response.data.data || []);
    } catch (error: any) {
      console.error('Error loading support requests:', error);
      setError(error.response?.data?.message || 'Failed to load support requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRequestDetail = async (requestId: number) => {
    try {
      const headers = { Authorization: `Token ${token}` };
      const response = await axios.get(`/api/support/requests/${requestId}/`, { headers });
      setSelectedRequest(response.data.data);
    } catch (error) {
      console.error('Error loading request detail:', error);
    }
  };

  const createRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Token ${token}` };
      await axios.post('/api/support/requests/', newRequest, { headers });
      
      setShowNewRequestModal(false);
      setNewRequest({
        request_type: 'general',
        subject: '',
        description: '',
        priority: 'medium'
      });
      loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newMessage.trim()) return;

    try {
      const headers = { Authorization: `Token ${token}` };
      await axios.post(
        `/api/support/requests/${selectedRequest.id}/`,
        { message: newMessage },
        { headers }
      );
      
      setNewMessage('');
      loadRequestDetail(selectedRequest.id);
      loadRequests();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const updateRequestStatus = async (requestId: number, status: string) => {
    try {
      const headers = { Authorization: `Token ${token}` };
      await axios.put(
        `/api/support/requests/${requestId}/`,
        { status },
        { headers }
      );
      
      loadRequestDetail(requestId);
      loadRequests();
    } catch (error) {
      console.error('Error updating request status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      new: 'bg-blue-100 text-blue-800',
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-purple-100 text-purple-800',
      waiting_user: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      low: 'text-gray-500',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Support Requests</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadRequests}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Support Requests</h2>
            <p className="text-gray-600">Manage and track customer support requests</p>
          </div>
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            New Request
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_user">Waiting for User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {requests.map((request) => (
              <div
                key={request.id}
                onClick={() => loadRequestDetail(request.id)}
                className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedRequest?.id === request.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-1">{request.subject}</h3>
                  {getStatusBadge(request.status)}
                </div>
                
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{request.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className={`font-medium ${getPriorityColor(request.priority)}`}>
                    {request.priority_display}
                  </span>
                  <div className="flex items-center">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    <span>{request.message_count}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  {formatDate(request.created_at)}
                </div>
              </div>
            ))}
            
            {requests.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No support requests found</p>
              </div>
            )}
          </div>
        </div>

        {/* Request Detail */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          {selectedRequest ? (
            <div className="flex flex-col h-[700px]">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">{selectedRequest.subject}</h2>
                    <p className="text-sm text-gray-600">{selectedRequest.request_type_display}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(selectedRequest.status)}
                    <span className={`text-sm font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                      {selectedRequest.priority_display}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    <span>{selectedRequest.user.name || selectedRequest.user.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{formatDate(selectedRequest.created_at)}</span>
                  </div>
                </div>

                {(user?.is_staff || user?.is_superuser) && (
                  <div className="mt-4 flex space-x-2">
                    <select
                      value={selectedRequest.status}
                      onChange={(e) => updateRequestStatus(selectedRequest.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="new">New</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="waiting_user">Waiting for User</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {selectedRequest.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.is_staff_reply ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.is_staff_reply ? 'bg-blue-100' : 'bg-gray-100'} rounded-lg p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {message.user.name || message.user.email}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">{formatDate(message.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.message}</p>
                      {message.is_internal && (
                        <span className="inline-block mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                          Internal Note
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p>Select a request to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">New Support Request</h3>
                <button
                  onClick={() => setShowNewRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={createRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
                  <select
                    value={newRequest.request_type}
                    onChange={(e) => setNewRequest({ ...newRequest, request_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical_support">Technical Support</option>
                    <option value="custom_job">Custom Job Request</option>
                    <option value="business_inquiry">Business Inquiry</option>
                    <option value="data_request">Data Request</option>
                    <option value="billing_question">Billing Question</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={newRequest.subject}
                    onChange={(e) => setNewRequest({ ...newRequest, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewRequestModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportRequests;
