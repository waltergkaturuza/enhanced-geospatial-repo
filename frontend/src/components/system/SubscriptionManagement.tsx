import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  CreditCard, 
  Check, 
  Download, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import axios from 'axios';

interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  description: string;
  pricing: {
    monthly: number;
    yearly: number;
    is_free: boolean;
    annual_savings: number;
  };
  quotas: {
    max_aois: number;
    max_download_size_gb: number;
    max_concurrent_downloads: number;
    max_users: number | null;
  };
  features: string[];
  capabilities: {
    analytics: boolean;
    api_access: boolean;
    priority_support: boolean;
    custom_processing: boolean;
  };
  target_user_types: string[];
}

interface CurrentSubscription {
  id: number;
  plan: {
    name: string;
    slug: string;
    description: string;
  };
  status: string;
  billing_cycle: string;
  dates: {
    starts_at: string | null;
    expires_at: string | null;
    trial_ends_at: string | null;
    cancelled_at: string | null;
    next_payment_date: string | null;
  };
  auto_renew: boolean;
  is_valid: boolean;
}

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amounts: {
    subtotal: number;
    tax_rate: number;
    tax_amount: number;
    total: number;
    currency: string;
  };
  status: string;
  paid_at: string | null;
  payment_method: string;
  items: any[];
}

const SubscriptionManagement: React.FC = () => {
  const { token } = useAuthContext();
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'plans' | 'invoices'>('current');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = { Authorization: `Token ${token}` };
      
      const [subscriptionRes, plansRes, invoicesRes] = await Promise.all([
        axios.get('/api/subscriptions/current/', { headers }).catch(() => ({ data: { data: null } })),
        axios.get('/api/subscriptions/plans/', { headers }).catch(() => ({ data: { data: [] } })),
        axios.get('/api/subscriptions/invoices/', { headers }).catch(() => ({ data: { data: [] } }))
      ]);
      
      setCurrentSubscription(subscriptionRes.data.data);
      setPlans(plansRes.data.data || []);
      setInvoices(invoicesRes.data.data || []);
    } catch (error: any) {
      console.error('Error loading subscription data:', error);
      setError(error.response?.data?.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      suspended: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Subscriptions</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadData}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Management</h2>
        <p className="text-gray-600">Manage your subscription plan and billing information</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'current'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Current Subscription
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'plans'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available Plans
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'invoices'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Invoices
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'current' && (
            <div className="space-y-6">
              {currentSubscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{currentSubscription.plan.name}</h3>
                      <p className="text-gray-600 mt-1">{currentSubscription.plan.description}</p>
                    </div>
                    {getStatusBadge(currentSubscription.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">Billing Cycle</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900 capitalize">{currentSubscription.billing_cycle}</p>
                    </div>

                    {currentSubscription.dates.next_payment_date && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">Next Payment</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(currentSubscription.dates.next_payment_date)}</p>
                      </div>
                    )}

                    {currentSubscription.dates.expires_at && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-gray-600 mb-1">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Expires On</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{formatDate(currentSubscription.dates.expires_at)}</p>
                      </div>
                    )}

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Auto Renew</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">{currentSubscription.auto_renew ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Upgrade Plan
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Update Payment Method
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                  <p className="text-gray-600 mb-6">Choose a plan to get started with GeoSpatial services</p>
                  <button
                    onClick={() => setActiveTab('plans')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View Available Plans
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'plans' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                    
                    <div className="mb-6">
                      {plan.pricing.is_free ? (
                        <div className="text-3xl font-bold text-gray-900">Free</div>
                      ) : (
                        <>
                          <div className="text-3xl font-bold text-gray-900">
                            ${plan.pricing.monthly}
                            <span className="text-lg font-normal text-gray-600">/month</span>
                          </div>
                          {plan.pricing.annual_savings > 0 && (
                            <p className="text-sm text-green-600 mt-1">
                              Save ${plan.pricing.annual_savings.toFixed(2)} with annual billing
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-600 mr-2" />
                        <span>{plan.quotas.max_aois} Areas of Interest</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-600 mr-2" />
                        <span>{plan.quotas.max_download_size_gb} GB Downloads</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-600 mr-2" />
                        <span>{plan.quotas.max_concurrent_downloads} Concurrent Downloads</span>
                      </div>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm">
                          <Check className="h-4 w-4 text-green-600 mr-2" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      {plan.pricing.is_free ? 'Get Started' : 'Subscribe Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {invoices.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.invoice_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(invoice.invoice_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            ${invoice.amounts.total.toFixed(2)} {invoice.amounts.currency}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(invoice.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-blue-600 hover:text-blue-800 flex items-center">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices Yet</h3>
                  <p className="text-gray-600">Your invoices will appear here once you have a subscription</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
