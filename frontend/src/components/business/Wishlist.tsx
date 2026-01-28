/**
 * Wishlist Component
 * Manage saved products for later
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
  Package,
  Loader2,
  Share2
} from 'lucide-react';
import { StoreAPI } from '@/lib/store.api';
import type { WishlistItem } from '@/lib/store.api';

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const data = await StoreAPI.getWishlist();
      setWishlistItems(data);
    } catch (err) {
      console.error('Error loading wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: number) => {
    try {
      await StoreAPI.toggleWishlist(productId);
      await loadWishlist();
    } catch (err) {
      console.error('Error removing from wishlist:', err);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const result = await StoreAPI.addToCart(productId, 1);
      if (result.success) {
        alert('Added to cart!');
      }
    } catch (err) {
      alert('Error adding to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-red-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-10 h-10 fill-current" />
            <h1 className="text-4xl font-bold">My Wishlist</h1>
          </div>
          <p className="text-pink-100">Save your favorite products for later</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-600 mb-6">Save products you love to easily find them later</p>
            <button
              onClick={() => navigate('/store')}
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{wishlistItems.length} Items in Your Wishlist</h2>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <Share2 className="w-5 h-5" />
                Share Wishlist
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map(item => (
                <div key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden group">
                  {/* Product Image */}
                  <div 
                    onClick={() => navigate(`/store/product/${item.product.id}`)}
                    className="relative aspect-video bg-gradient-to-br from-blue-50 to-purple-50 cursor-pointer"
                  >
                    {item.product.thumbnail ? (
                      <img
                        src={item.product.thumbnail}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.product.id);
                      }}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {item.product.discount_percentage > 0 && (
                      <div className="absolute top-3 left-3 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                        -{item.product.discount_percentage}%
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 
                      onClick={() => navigate(`/store/product/${item.product.id}`)}
                      className="font-bold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                    >
                      {item.product.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {item.product.rating_average.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">({item.product.rating_count})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-gray-900">${item.product.price.toFixed(2)}</span>
                      {item.product.compare_at_price && (
                        <span className="text-sm text-gray-400 line-through">
                          ${item.product.compare_at_price.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    {!item.product.in_stock && (
                      <div className="mb-3 px-3 py-1 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                        Out of Stock
                      </div>
                    )}

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => handleAddToCart(item.product.id)}
                      disabled={!item.product.in_stock}
                      className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                        item.product.in_stock
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
