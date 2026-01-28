/**
 * Order Management Component
 * View order details, track status, and download products
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package,
  Download,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle,
  FileDown,
  RefreshCw,
  ChevronLeft,
  MapPin,
  Mail,
  Phone
} from 'lucide-react';
import { StoreAPI } from '@/lib/store.api';
import type { Order as OrderType } from '@/lib/store.api';

const OrderManagement: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      loadOrder(parseInt(orderId));
    }
  }, [orderId]);

  const loadOrder = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await StoreAPI.getOrderDetail(id);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'processing':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'cancelled':
      case 'refunded':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
          <button
            onClick={() => navigate('/store/cart')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/store/cart')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Orders
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Order #{order.order_number}</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                {getStatusIcon(order.status)}
                <span className="uppercase">{order.status}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6" />
                Order Items
              </h2>

              <div className="space-y-4">
                {order.items.map(item => (
                  <div key={item.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{item.product_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.product_description}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>Quantity: {item.quantity}</span>
                          <span>•</span>
                          <span>${item.unit_price.toFixed(2)} each</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">${item.total_price.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Download Section */}
                    {item.download_url && (
                      <div className="mt-4 bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <FileDown className="w-4 h-4 text-blue-600" />
                            <span>Downloads: {item.download_count}/{item.max_downloads}</span>
                            {item.download_expires_at && (
                              <>
                                <span>•</span>
                                <span>Expires: {new Date(item.download_expires_at).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                          <a
                            href={item.download_url}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Order Timeline</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Order Placed</h4>
                    <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                {order.status !== 'pending' && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Payment Confirmed</h4>
                      <p className="text-sm text-gray-600">Your payment has been processed</p>
                    </div>
                  </div>
                )}

                {order.status === 'completed' && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Order Completed</h4>
                      <p className="text-sm text-gray-600">
                        {order.completed_at ? new Date(order.completed_at).toLocaleString() : 'Recently completed'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8 space-y-6">
              {/* Price Summary */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Processing Fee</span>
                    <span>${order.processing_fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${order.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-blue-600">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address */}
              {order.billing_address && Object.keys(order.billing_address).length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3">Billing Information</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    {order.billing_address.fullName && <p className="font-medium">{order.billing_address.fullName}</p>}
                    {order.billing_address.email && (
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {order.billing_address.email}
                      </p>
                    )}
                    {order.billing_address.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {order.billing_address.phone}
                      </p>
                    )}
                    {order.billing_address.address && (
                      <p className="flex items-start gap-2 mt-2">
                        <MapPin className="w-4 h-4 mt-0.5" />
                        <span>
                          {order.billing_address.address}<br />
                          {order.billing_address.city}, {order.billing_address.country}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-6 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => loadOrder(order.id)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Status
                </button>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
