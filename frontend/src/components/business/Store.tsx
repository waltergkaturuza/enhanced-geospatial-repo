/**
 * Main Store Component
 * Modern e-commerce interface for geospatial data products
 */

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import {
  ShoppingCart,
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Package,
  Star,
  TrendingUp,
  Sparkles,
  X,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { StoreAPI } from '@/lib/store.api';
import type { Product, Cart, ProductCategory } from '@/lib/store.api';

// Product Card Component
const ProductCard: React.FC<{ 
  product: Product;
  onAddToCart: (id: number) => void;
  onToggleWishlist: (id: number) => void;
  inWishlist: boolean;
}> = ({ product, onAddToCart, onToggleWishlist, inWishlist }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Product Image */}
      <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
        {!imageError && product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-300" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_featured && (
            <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
          {product.discount_percentage > 0 && (
            <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
              -{product.discount_percentage}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={() => onToggleWishlist(product.id)}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all ${
            inWishlist 
              ? 'bg-red-500 text-white' 
              : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
        >
          <Heart className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
        </button>

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100">
            Quick View
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Category & Type */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500">{product.product_type.toUpperCase()}</span>
          {product.category && (
            <>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-blue-600">{product.category.name}</span>
            </>
          )}
        </div>

        {/* Product Name */}
        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 min-h-[3.5rem]">
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.short_description || product.description}
        </p>

        {/* Rating & Provider */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-gray-900">
              {product.rating_average.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">({product.rating_count})</span>
          </div>
          {product.provider && (
            <span className="text-xs text-gray-500">{product.provider}</span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-2xl font-bold text-gray-900">
            ${product.price.toFixed(2)}
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-400 line-through">
              ${product.compare_at_price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        {!product.in_stock && (
          <div className="mb-3 px-3 py-1 bg-red-50 text-red-600 text-sm rounded-lg text-center">
            Out of Stock
          </div>
        )}

        {/* Add to Cart Button */}
        <button
          onClick={() => onAddToCart(product.id)}
          disabled={!product.in_stock}
          className={`w-full py-3 rounded-lg font-semibold transition-all ${
            product.in_stock
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:scale-105'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
};

// Main Store Component
const Store: React.FC = () => {
  const { user, hasModuleAccess } = useAuthContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState('-created_at');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<any>({});

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Load products when filters change
  useEffect(() => {
    loadProducts();
  }, [searchQuery, selectedCategory, selectedType, sortBy, currentPage]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, cartData, wishlistData] = await Promise.all([
        StoreAPI.getCategories(),
        StoreAPI.getCart().catch(() => null),
        StoreAPI.getWishlist().catch(() => [])
      ]);

      setCategories(categoriesData);
      setCart(cartData);
      setWishlist(new Set(wishlistData.map(item => item.product.id)));
      
      await loadProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const { products: productsData, pagination: paginationData } = await StoreAPI.getProducts({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        type: selectedType || undefined,
        min_price: priceRange[0],
        max_price: priceRange[1],
        sort_by: sortBy,
        page: currentPage,
        per_page: 12
      });

      setProducts(productsData);
      setPagination(paginationData);
    } catch (err: any) {
      console.error('Error loading products:', err);
    }
  };

  const handleAddToCart = async (productId: number) => {
    try {
      const result = await StoreAPI.addToCart(productId, 1);
      if (result.success) {
        // Reload cart
        const cartData = await StoreAPI.getCart();
        setCart(cartData);
        // Show success message (you can add a toast notification here)
        alert('Added to cart!');
      } else {
        alert(result.message || 'Failed to add to cart');
      }
    } catch (err: any) {
      alert('Error adding to cart');
    }
  };

  const handleToggleWishlist = async (productId: number) => {
    try {
      const result = await StoreAPI.toggleWishlist(productId);
      if (result.success) {
        setWishlist(prev => {
          const newSet = new Set(prev);
          if (result.data.in_wishlist) {
            newSet.add(productId);
          } else {
            newSet.delete(productId);
          }
          return newSet;
        });
      }
    } catch (err: any) {
      console.error('Error toggling wishlist:', err);
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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Store</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">GeoSpatial Store</h1>
                <p className="text-sm text-gray-600">Premium data products & services</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, imagery, analysis services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Cart & Wishlist */}
            <div className="flex items-center gap-3">
              <button className="relative p-3 hover:bg-gray-100 rounded-lg transition-colors">
                <Heart className="w-6 h-6 text-gray-600" />
                {wishlist.size > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {wishlist.size}
                  </span>
                )}
              </button>
              <button className="relative p-3 hover:bg-gray-100 rounded-lg transition-colors">
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                {cart && cart.item_count > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {cart.item_count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-64 flex-shrink-0`}>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filters
                </h3>
                <button
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedType('');
                    setPriceRange([0, 1000]);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Clear All
                </button>
              </div>

              {/* Categories */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Categories</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === ''}
                      onChange={() => setSelectedCategory('')}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">All Categories</span>
                  </label>
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() => setSelectedCategory(cat.slug)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{cat.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{cat.product_count}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Product Type */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Product Type</h4>
                <div className="space-y-2">
                  {['imagery', 'analysis', 'subscription', 'processing', 'data', 'report'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedType === type}
                        onChange={() => setSelectedType(selectedType === type ? '' : type)}
                        className="text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Price Range</h4>
                <div className="space-y-3">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                  <span className="text-sm text-gray-600">
                    {pagination.total_items || 0} products found
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="-created_at">Newest First</option>
                    <option value="price">Price: Low to High</option>
                    <option value="-price">Price: High to Low</option>
                    <option value="-rating_average">Highest Rated</option>
                    <option value="-purchases_count">Most Popular</option>
                    <option value="name">Name A-Z</option>
                  </select>

                  {/* View Mode */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
                <p className="text-gray-600">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <>
                <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onToggleWishlist={handleToggleWishlist}
                      inWishlist={wishlist.has(product.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.has_previous}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {currentPage} of {pagination.total_pages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={!pagination.has_next}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Store;
