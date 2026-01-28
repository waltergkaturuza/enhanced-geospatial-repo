/**
 * Modern Shopping Cart & Checkout Component
 * Complete cart management with checkout flow
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  ArrowRight,
  Package,
  CheckCircle,
  Loader2,
  AlertCircle,
  Download,
  Calendar,
  MapPin,
  X
} from 'lucide-react';
import { StoreAPI } from '@/lib/store.api';
import type { Cart, Order } from '@/lib/store.api';

const ShoppingCartNew: React.FC = () => {
  const { user, hasModuleAccess } = useAuthContext();
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [showCheckout, setShowCheckout] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  // Checkout form
  const [billingInfo, setBillingInfo] = useState({
    fullName: '',
    email: '',
    organization: '',
    address: '',
    city: '',
    country: 'Zimbabwe',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [customerNotes, setCustomerNotes] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cartData, ordersData] = await Promise.all([
        StoreAPI.getCart(),
        StoreAPI.getOrders()
      ]);
      setCart(cartData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Error loading cart data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await StoreAPI.removeFromCart(itemId);
      } else {
        await StoreAPI.updateCartItem(itemId, newQuantity);
      }
      await loadData();
    } catch (err) {
      console.error('Error updating cart:', err);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await StoreAPI.removeFromCart(itemId);
      await loadData();
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Are you sure you want to clear your cart?')) return;
    try {
      await StoreAPI.clearCart();
      await loadData();
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingCheckout(true);

    try {
      const result = await StoreAPI.createOrder(billingInfo, paymentMethod, customerNotes);
      
      if (result.success) {
        alert(`Order ${result.data.order_number} created successfully! Order ID: ${result.data.order_id}`);
        setShowCheckout(false);
        setActiveTab('orders');
        await loadData();
      } else {
        alert(result.message || 'Failed to create order');
      }
    } catch (err: any) {
      alert('Error processing checkout');
    } finally {
      setProcessingCheckout(false);
    }
  };

  if (!user || !hasModuleAccess('business')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Access Required</h2>
          <p className="text-gray-600">You need business module access to use the store.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate totals
  const subtotal = cart?.total || 0;
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  const processingFee = cart && cart.item_count > 0 ? 2.99 : 0;
  const total = subtotal + taxAmount + processingFee;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Store & Cart</h1>
          <p className="text-blue-100">Manage your geospatial data purchases and subscriptions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('cart')}
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'cart'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shopping Cart ({cart?.item_count || 0})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-4 font-semibold border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order History ({orders.length})
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {!cart || cart.items.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Add some products to get started</p>
                  <a
                    href="/store"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
                  >
                    Browse Products
                  </a>
                </div>
              ) : (
                <>
                  {/* Clear Cart Button */}
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Shopping Cart</h2>
                    <button
                      onClick={handleClearCart}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Cart
                    </button>
                  </div>

                  {/* Cart Items */}
                  {cart.items.map(item => (
                    <div key={item.id} className="bg-white rounded-xl shadow-md p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          {item.product.thumbnail ? (
                            <img
                              src={item.product.thumbnail}
                              alt={item.product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Package className="w-12 h-12 text-gray-300" />
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">{item.product.name}</h3>
                              <span className="text-sm text-gray-500 capitalize">{item.product.product_type}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Price & Quantity */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600">Quantity:</span>
                              <div className="flex items-center border border-gray-300 rounded-lg">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                  className="p-2 hover:bg-gray-100"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 font-semibold">{item.quantity}</span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                  className="p-2 hover:bg-gray-100"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">${item.subtotal.toFixed(2)}</div>
                              <div className="text-sm text-gray-500">${item.price_at_addition.toFixed(2)} each</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Order Summary */}
            {cart && cart.items.length > 0 && (
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({cart.item_count} items)</span>
                      <span className="font-semibold">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Processing Fee</span>
                      <span className="font-semibold">${processingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                      <span className="font-semibold">${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-baseline">
                        <span className="text-lg font-bold text-gray-900">Total</span>
                        <span className="text-3xl font-bold text-blue-600">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Proceed to Checkout
                  </button>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                      Free shipping on orders over $100
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
            
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600">Your completed orders will appear here</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">Order #{order.order_number}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{order.items.length} items</div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-t border-gray-100">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{item.product_name}</div>
                          <div className="text-sm text-gray-500">Quantity: {item.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">${item.total_price.toFixed(2)}</div>
                          {item.download_url && (
                            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1">
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Details
                    </button>
                    {order.status === 'completed' && (
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                        Reorder
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Checkout Modal */}
      {showCheckout && cart && cart.items.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Checkout</h2>
                  <p className="text-blue-100">Complete your purchase</p>
                </div>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCheckout} className="p-6">
              {/* Step 1: Billing Information */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  Billing Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={billingInfo.fullName}
                      onChange={(e) => setBillingInfo({...billingInfo, fullName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={billingInfo.email}
                      onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={billingInfo.phone}
                      onChange={(e) => setBillingInfo({...billingInfo, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+263 XXX XXX XXX"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                    <input
                      type="text"
                      value={billingInfo.organization}
                      onChange={(e) => setBillingInfo({...billingInfo, organization: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Company Name"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      required
                      value={billingInfo.address}
                      onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      required
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Harare"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input
                      type="text"
                      required
                      value={billingInfo.country}
                      onChange={(e) => setBillingInfo({...billingInfo, country: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Payment Method */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  Payment Method
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
                    { value: 'paypal', label: 'PayPal', icon: Package },
                    { value: 'mobile_money', label: 'Mobile Money', icon: Package },
                    { value: 'bank_transfer', label: 'Bank Transfer', icon: Package }
                  ].map(method => (
                    <label
                      key={method.value}
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        paymentMethod === method.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.value}
                        checked={paymentMethod === method.value}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-blue-600"
                      />
                      <method.icon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Notes (Optional)</label>
                <textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any special instructions or requirements..."
                />
              </div>

              {/* Order Summary in Checkout */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-gray-900 mb-4">Order Total</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Processing Fee</span>
                    <span>${processingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Cart
                </button>
                <button
                  type="submit"
                  disabled={processingCheckout}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingCheckout ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCartNew;
