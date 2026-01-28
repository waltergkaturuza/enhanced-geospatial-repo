/**
 * Product Detail Page
 * Comprehensive product view with reviews, specifications, and recommendations
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Heart,
  Star,
  Package,
  MapPin,
  Calendar,
  Download,
  Share2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  Users,
  Eye,
  Plus,
  Minus
} from 'lucide-react';
import { StoreAPI } from '@/lib/store.api';
import type { ProductDetail as ProductDetailType, ProductReview } from '@/lib/store.api';

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Review form
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: '',
    review: ''
  });

  useEffect(() => {
    if (productId) {
      loadProduct(parseInt(productId));
    }
  }, [productId]);

  const loadProduct = async (id: number) => {
    try {
      setLoading(true);
      const data = await StoreAPI.getProductDetail(id);
      setProduct(data);
    } catch (err) {
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      const result = await StoreAPI.addToCart(product.id, quantity);
      if (result.success) {
        alert('Added to cart!');
      }
    } catch (err) {
      alert('Error adding to cart');
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      const result = await StoreAPI.toggleWishlist(product.id);
      if (result.success) {
        setInWishlist(result.data.in_wishlist);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      const result = await StoreAPI.createReview(
        product.id,
        reviewData.rating,
        reviewData.title,
        reviewData.review
      );
      
      if (result.success) {
        alert('Review submitted successfully!');
        setShowReviewForm(false);
        setReviewData({ rating: 5, title: '', review: '' });
        loadProduct(product.id);
      } else {
        alert(result.message);
      }
    } catch (err) {
      alert('Error submitting review');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <button
            onClick={() => navigate('/store')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Store
          </button>
        </div>
      </div>
    );
  }

  const allImages = [product.thumbnail, ...product.images].filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <button onClick={() => navigate('/store')} className="hover:text-blue-600">Store</button>
            <ChevronRight className="w-4 h-4" />
            {product.category && (
              <>
                <span>{product.category.name}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Images */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-4">
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                {allImages[selectedImage] ? (
                  <img
                    src={allImages[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-32 h-32 text-gray-300" />
                )}
              </div>
            </div>

            {/* Image Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImage === idx ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              {product.is_featured && (
                <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-bold rounded-full">
                  Featured
                </span>
              )}
              {product.discount_percentage > 0 && (
                <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                  Save {product.discount_percentage}%
                </span>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full capitalize">
                {product.product_type}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Rating & Stats */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= product.rating_average
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="font-semibold text-gray-900">{product.rating_average.toFixed(1)}</span>
                <span className="text-gray-600">({product.rating_count} reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="text-sm">{product.purchases_count} purchases</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Eye className="w-4 h-4" />
                <span className="text-sm">{product.views_count} views</span>
              </div>
            </div>

            {/* Provider */}
            {product.provider && (
              <div className="flex items-center gap-2 mb-6 text-gray-600">
                <Package className="w-5 h-5" />
                <span>Provided by <strong>{product.provider}</strong></span>
              </div>
            )}

            {/* Description */}
            <p className="text-gray-700 text-lg mb-8 leading-relaxed">{product.description}</p>

            {/* Price */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                {product.compare_at_price && (
                  <span className="text-xl text-gray-400 line-through">${product.compare_at_price.toFixed(2)}</span>
                )}
                <span className="text-lg text-gray-600">{product.currency}</span>
              </div>
              {product.discount_percentage > 0 && (
                <p className="text-green-600 font-semibold">
                  You save ${(product.compare_at_price! - product.price).toFixed(2)}!
                </p>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-4 py-3 text-center border border-gray-300 rounded-lg font-bold text-lg"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleAddToCart}
                disabled={!product.in_stock}
                className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                  product.in_stock
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="w-6 h-6" />
                {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`p-4 rounded-xl border-2 transition-all ${
                  inWishlist
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-600'
                }`}
              >
                <Heart className={`w-6 h-6 ${inWishlist ? 'fill-current' : ''}`} />
              </button>
              <button className="p-4 rounded-xl border-2 border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all">
                <Share2 className="w-6 h-6" />
              </button>
            </div>

            {/* Stock Status */}
            {product.in_stock ? (
              <div className="flex items-center gap-2 text-green-600 mb-6">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">In Stock - Ready for Download</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600 mb-6">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Currently Out of Stock</span>
              </div>
            )}

            {/* Specifications */}
            {Object.keys(product.specifications).length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Specifications
                </h3>
                <dl className="grid grid-cols-2 gap-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</dt>
                      <dd className="font-semibold text-gray-900">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Write a Review
            </button>
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-gray-900 mb-4">Share Your Experience</h3>
              
              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewData({...reviewData, rating: star})}
                      className="p-1"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
                <input
                  type="text"
                  required
                  value={reviewData.title}
                  onChange={(e) => setReviewData({...reviewData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Summarize your experience"
                />
              </div>

              {/* Review */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
                <textarea
                  required
                  value={reviewData.review}
                  onChange={(e) => setReviewData({...reviewData, review: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={5}
                  placeholder="Share details about your experience with this product..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Review
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {product.reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No reviews yet. Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {product.reviews.map(review => (
                <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        {review.is_verified_purchase && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900">{review.title}</h4>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{review.review}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>by {review.user_name}</span>
                    {review.helpful_count > 0 && (
                      <>
                        <span>•</span>
                        <span>{review.helpful_count} found this helpful</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Products */}
        {product.related_products && product.related_products.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.related_products.map(relatedProduct => (
                <div
                  key={relatedProduct.id}
                  onClick={() => navigate(`/store/product/${relatedProduct.id}`)}
                  className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all"
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                    {relatedProduct.thumbnail ? (
                      <img src={relatedProduct.thumbnail} alt={relatedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{relatedProduct.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{relatedProduct.rating_average.toFixed(1)}</span>
                    </div>
                    <div className="text-xl font-bold text-blue-600">${relatedProduct.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
