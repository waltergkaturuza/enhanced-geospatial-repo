/**
 * Store API Client
 * Comprehensive API functions for the e-commerce store
 */

import { getApiBaseUrl, getAuthHeaders } from './api';

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  product_type: 'imagery' | 'analysis' | 'subscription' | 'processing' | 'data' | 'report';
  category: {
    id: number;
    name: string;
    slug: string;
  } | null;
  price: number;
  compare_at_price: number | null;
  discount_percentage: number;
  currency: string;
  provider: string;
  thumbnail: string;
  images: string[];
  specifications: Record<string, any>;
  is_digital: boolean;
  in_stock: boolean;
  stock_quantity: number | null;
  rating_average: number;
  rating_count: number;
  purchases_count: number;
  is_featured: boolean;
}

export interface ProductDetail extends Product {
  views_count: number;
  reviews: ProductReview[];
  related_products: Product[];
  created_at: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  parent_id: number | null;
  product_count: number;
}

export interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    slug: string;
    thumbnail: string;
    product_type: string;
    current_price: number;
    in_stock: boolean;
  };
  quantity: number;
  price_at_addition: number;
  subtotal: number;
  custom_options: Record<string, any>;
}

export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  total: number;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: 'pending' | 'paid' | 'processing' | 'ready' | 'completed' | 'cancelled' | 'refunded';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  processing_fee: number;
  total: number;
  currency: string;
  billing_address: Record<string, any>;
  customer_notes: string;
  items: OrderItem[];
  payments?: any[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface OrderItem {
  id: number;
  product_name: string;
  product_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  options: Record<string, any>;
  download_url: string;
  download_expires_at: string | null;
  download_count: number;
  max_downloads: number;
}

export interface ProductReview {
  id: number;
  user_name: string;
  rating: number;
  title: string;
  review: string;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
}

export interface WishlistItem {
  id: number;
  product: Product;
  added_at: string;
}

export class StoreAPI {
  // Product Catalog
  static async getCategories(): Promise<ProductCategory[]> {
    const response = await fetch(`${getApiBaseUrl()}/store/categories/`);
    const data = await response.json();
    return data.success ? data.data : [];
  }

  static async getProducts(params: {
    category?: string;
    type?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
    sort_by?: string;
    page?: number;
    per_page?: number;
    featured?: boolean;
  } = {}): Promise<{ products: Product[]; pagination: any }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await fetch(`${getApiBaseUrl()}/store/products/?${queryParams}`);
    const data = await response.json();
    return {
      products: data.success ? data.data : [],
      pagination: data.pagination || {}
    };
  }

  static async getProductDetail(productId: number): Promise<ProductDetail | null> {
    const response = await fetch(`${getApiBaseUrl()}/store/products/${productId}/`);
    const data = await response.json();
    return data.success ? data.data : null;
  }

  // Cart Management
  static async getCart(): Promise<Cart | null> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/cart/`, { headers });
    const data = await response.json();
    return data.success ? data.data : null;
  }

  static async addToCart(productId: number, quantity: number = 1, customOptions: Record<string, any> = {}): Promise<{ success: boolean; message: string; data?: any }> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/cart/add/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        product_id: productId,
        quantity,
        custom_options: customOptions
      })
    });
    return await response.json();
  }

  static async updateCartItem(itemId: number, quantity: number): Promise<{ success: boolean; data?: any }> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/cart/update/${itemId}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ quantity })
    });
    return await response.json();
  }

  static async removeFromCart(itemId: number): Promise<{ success: boolean }> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/cart/remove/${itemId}/`, {
      method: 'POST',
      headers
    });
    return await response.json();
  }

  static async clearCart(): Promise<{ success: boolean }> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/cart/clear/`, {
      method: 'POST',
      headers
    });
    return await response.json();
  }

  // Checkout & Orders
  static async createOrder(billingAddress: any, paymentMethod: string, customerNotes: string = ''): Promise<{ success: boolean; data?: any; message?: string }> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/checkout/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        billing_address: billingAddress,
        payment_method: paymentMethod,
        customer_notes: customerNotes
      })
    });
    return await response.json();
  }

  static async getOrders(): Promise<Order[]> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/orders/`, { headers });
    const data = await response.json();
    return data.success ? data.data : [];
  }

  static async getOrderDetail(orderId: number): Promise<Order | null> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/orders/${orderId}/`, { headers });
    const data = await response.json();
    return data.success ? data.data : null;
  }

  // Reviews
  static async createReview(productId: number, rating: number, title: string, review: string, orderId?: number): Promise<{ success: boolean; message: string }> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/reviews/create/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        product_id: productId,
        rating,
        title,
        review,
        order_id: orderId
      })
    });
    return await response.json();
  }

  // Wishlist
  static async getWishlist(): Promise<WishlistItem[]> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/wishlist/`, { headers });
    const data = await response.json();
    return data.success ? data.data : [];
  }

  static async toggleWishlist(productId: number): Promise<{ success: boolean; message: string; data: { in_wishlist: boolean } }> {
    const headers = getAuthHeaders();
    const response = await fetch(`${getApiBaseUrl()}/store/wishlist/toggle/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ product_id: productId })
    });
    return await response.json();
  }
}
