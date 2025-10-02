import React, { useState } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  Download,
  Eye,
  Star,
  MapPin,
  Calendar,
  Layers,
  Package
} from 'lucide-react';

// Mock data types
interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  type: 'imagery' | 'analysis' | 'subscription';
  provider: string;
  thumbnail?: string;
  size?: string;
  format?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  area?: number; // in sq km
}

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  downloadLinks?: string[];
}

/**
 * ShoppingCartComponent
 * 
 * E-commerce functionality for purchasing geospatial data products,
 * including cart management, checkout, and order history.
 */
export const ShoppingCartComponent: React.FC = () => {
  const { user, hasModuleAccess } = useAuthContext();
  
  // Mock cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 'item-1',
      name: 'Landsat 9 Imagery - Zimbabwe',
      description: 'High-resolution multispectral imagery covering Harare region',
      price: 25.00,
      quantity: 1,
      type: 'imagery',
      provider: 'USGS',
      thumbnail: '/api/placeholder/200/150',
      size: '1.2 GB',
      format: 'GeoTIFF',
      dateRange: {
        start: '2024-01-01',
        end: '2024-01-31'
      },
      area: 1500
    },
    {
      id: 'item-2',
      name: 'NDVI Analysis Service',
      description: 'Automated vegetation index calculation and reporting',
      price: 15.00,
      quantity: 2,
      type: 'analysis',
      provider: 'GeoAnalytics Inc',
      area: 500
    },
    {
      id: 'item-3',
      name: 'Professional Subscription - Monthly',
      description: 'Access to premium datasets and advanced analytics',
      price: 99.00,
      quantity: 1,
      type: 'subscription',
      provider: 'GeoSpatial Platform'
    }
  ]);

  const [orders] = useState<Order[]>([
    {
      id: 'order-1',
      items: [],
      total: 156.50,
      status: 'completed',
      createdAt: '2024-01-15T10:30:00Z',
      downloadLinks: [
        '/downloads/landsat9_harare_202401.zip',
        '/downloads/ndvi_analysis_202401.pdf'
      ]
    },
    {
      id: 'order-2',
      items: [],
      total: 75.00,
      status: 'processing',
      createdAt: '2024-01-20T14:45:00Z'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'cart' | 'orders'>('cart');
  const [showCheckout, setShowCheckout] = useState(false);

  if (!user || !hasModuleAccess('business')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Store Access Required
          </h2>
          <p className="text-gray-600">
            You need business module access to use the store.
          </p>
        </div>
      </div>
    );
  }

  // Cart functions
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'imagery':
        return <Layers className="h-5 w-5" />;
      case 'analysis':
        return <Eye className="h-5 w-5" />;
      case 'subscription':
        return <Star className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Store & Cart</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your geospatial data purchases and subscriptions
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('cart')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cart'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShoppingCart className="h-5 w-5 inline mr-2" />
            Shopping Cart ({cartItems.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Package className="h-5 w-5 inline mr-2" />
            Order History ({orders.length})
          </button>
        </nav>
      </div>

      {/* Cart Tab */}
      {activeTab === 'cart' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-4">Start shopping for geospatial data and services</p>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      {/* Item Icon/Thumbnail */}
                      <div className="flex-shrink-0">
                        {item.thumbnail ? (
                          <img
                            src={item.thumbnail}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getItemIcon(item.type)}
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Package className="h-3 w-3 mr-1" />
                                {item.provider}
                              </span>
                              {item.size && (
                                <span className="flex items-center">
                                  <Download className="h-3 w-3 mr-1" />
                                  {item.size}
                                </span>
                              )}
                              {item.area && (
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {item.area} km²
                                </span>
                              )}
                              {item.dateRange && (
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {new Date(item.dateRange.start).toLocaleDateString()} - 
                                  {new Date(item.dateRange.end).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              ${item.price.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-500">per item</p>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-700">Quantity:</span>
                            <div className="flex items-center border border-gray-300 rounded">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 hover:bg-gray-50"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="px-3 py-1 text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 hover:bg-gray-50"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-semibold text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary */}
          {cartItems.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cartItems.length} items)</span>
                    <span>${getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Processing Fee</span>
                    <span>$2.99</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${(getCartTotal() * 0.08).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span>${(getCartTotal() + 2.99 + (getCartTotal() * 0.08)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md font-medium hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Proceed to Checkout
                  </button>
                  <button
                    onClick={clearCart}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-sm text-blue-800">
                    <strong>Free shipping</strong> on orders over $100
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600">Your order history will appear here</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Order #{order.id}</h3>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <p className="text-lg font-semibold text-gray-900 mt-1">
                      ${order.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                {order.downloadLinks && order.downloadLinks.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Downloads</h4>
                    <div className="space-y-2">
                      {order.downloadLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {link.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Checkout</h3>
                <button 
                  onClick={() => setShowCheckout(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="text-center py-8">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Checkout Integration</h4>
                <p className="text-gray-600 mb-4">
                  Payment processing would be integrated here with services like Stripe, PayPal, or other payment gateways.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      alert('Order placed successfully!');
                      setCartItems([]);
                      setShowCheckout(false);
                    }}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
                  >
                    Complete Order
                  </button>
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCartComponent;
