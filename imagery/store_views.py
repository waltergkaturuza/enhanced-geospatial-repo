"""
Store/E-commerce API Views
Comprehensive endpoints for the geospatial data store
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db.models import Q, Avg, Count
from django.core.paginator import Paginator
from .models import (
    Product, ProductCategory, Cart, CartItem, Order, OrderItem,
    Payment, ProductReview, Wishlist
)
import json
import logging

logger = logging.getLogger(__name__)

# Helper function to authenticate token
def authenticate_token(request):
    """Extract and authenticate token from request headers"""
    from rest_framework.authtoken.models import Token
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if auth_header.startswith('Token '):
        token_key = auth_header.split(' ')[1]
        try:
            token = Token.objects.get(key=token_key)
            return token.user
        except Token.DoesNotExist:
            return None
    return None

# ============================================================================
# PRODUCT CATALOG ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def get_product_categories(request):
    """Get all product categories"""
    try:
        categories = ProductCategory.objects.filter(is_active=True)
        
        data = []
        for cat in categories:
            data.append({
                'id': cat.id,
                'name': cat.name,
                'slug': cat.slug,
                'description': cat.description,
                'icon': cat.icon,
                'parent_id': cat.parent_id,
                'product_count': cat.products.filter(is_active=True).count()
            })
        
        return JsonResponse({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching categories: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_products(request):
    """Get products with filtering, sorting, and pagination"""
    try:
        # Get query parameters
        category = request.GET.get('category')
        product_type = request.GET.get('type')
        search = request.GET.get('search')
        min_price = request.GET.get('min_price')
        max_price = request.GET.get('max_price')
        sort_by = request.GET.get('sort_by', '-created_at')
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 12))
        featured = request.GET.get('featured')
        
        # Build query
        products = Product.objects.filter(is_active=True)
        
        if category:
            products = products.filter(Q(category__slug=category) | Q(category__id=category))
        
        if product_type:
            products = products.filter(product_type=product_type)
        
        if search:
            products = products.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search) |
                Q(short_description__icontains=search)
            )
        
        if min_price:
            products = products.filter(price__gte=float(min_price))
        
        if max_price:
            products = products.filter(price__lte=float(max_price))
        
        if featured == 'true':
            products = products.filter(is_featured=True)
        
        # Sorting
        valid_sorts = ['-created_at', 'created_at', 'price', '-price', '-rating_average', 'name', '-purchases_count']
        if sort_by in valid_sorts:
            products = products.order_by(sort_by)
        
        # Pagination
        paginator = Paginator(products, per_page)
        page_obj = paginator.get_page(page)
        
        # Format products
        data = []
        for product in page_obj:
            data.append({
                'id': product.id,
                'name': product.name,
                'slug': product.slug,
                'description': product.description,
                'short_description': product.short_description,
                'product_type': product.product_type,
                'category': {
                    'id': product.category.id,
                    'name': product.category.name,
                    'slug': product.category.slug
                } if product.category else None,
                'price': float(product.price),
                'compare_at_price': float(product.compare_at_price) if product.compare_at_price else None,
                'discount_percentage': product.get_discount_percentage(),
                'currency': product.currency,
                'provider': product.provider,
                'thumbnail': product.thumbnail,
                'images': product.images,
                'specifications': product.specifications,
                'is_digital': product.is_digital,
                'in_stock': not product.track_inventory or product.stock_quantity > 0,
                'stock_quantity': product.stock_quantity if product.track_inventory else None,
                'rating_average': float(product.rating_average),
                'rating_count': product.rating_count,
                'purchases_count': product.purchases_count,
                'is_featured': product.is_featured
            })
        
        return JsonResponse({
            'success': True,
            'data': data,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total_items': paginator.count,
                'total_pages': paginator.num_pages,
                'has_next': page_obj.has_next(),
                'has_previous': page_obj.has_previous()
            }
        })
    except Exception as e:
        logger.error(f"Error fetching products: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching products: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_product_detail(request, product_id):
    """Get detailed information about a specific product"""
    try:
        product = Product.objects.get(id=product_id, is_active=True)
        
        # Increment views
        product.increment_views()
        
        # Get reviews
        reviews = ProductReview.objects.filter(product=product, is_approved=True).order_by('-created_at')[:10]
        reviews_data = []
        for review in reviews:
            reviews_data.append({
                'id': review.id,
                'user_name': f"{review.user.first_name} {review.user.last_name}",
                'rating': review.rating,
                'title': review.title,
                'review': review.review,
                'is_verified_purchase': review.is_verified_purchase,
                'helpful_count': review.helpful_count,
                'created_at': review.created_at.isoformat()
            })
        
        # Get related products
        related = Product.objects.filter(
            category=product.category,
            is_active=True
        ).exclude(id=product.id)[:4]
        
        related_data = []
        for rel in related:
            related_data.append({
                'id': rel.id,
                'name': rel.name,
                'slug': rel.slug,
                'price': float(rel.price),
                'thumbnail': rel.thumbnail,
                'rating_average': float(rel.rating_average)
            })
        
        data = {
            'id': product.id,
            'name': product.name,
            'slug': product.slug,
            'description': product.description,
            'short_description': product.short_description,
            'product_type': product.product_type,
            'category': {
                'id': product.category.id,
                'name': product.category.name,
                'slug': product.category.slug
            } if product.category else None,
            'price': float(product.price),
            'compare_at_price': float(product.compare_at_price) if product.compare_at_price else None,
            'discount_percentage': product.get_discount_percentage(),
            'currency': product.currency,
            'provider': product.provider,
            'thumbnail': product.thumbnail,
            'images': product.images,
            'specifications': product.specifications,
            'is_digital': product.is_digital,
            'in_stock': not product.track_inventory or product.stock_quantity > 0,
            'stock_quantity': product.stock_quantity if product.track_inventory else None,
            'rating_average': float(product.rating_average),
            'rating_count': product.rating_count,
            'purchases_count': product.purchases_count,
            'views_count': product.views_count,
            'reviews': reviews_data,
            'related_products': related_data,
            'created_at': product.created_at.isoformat()
        }
        
        return JsonResponse({
            'success': True,
            'data': data
        })
    except Product.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Product not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error fetching product detail: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching product: {str(e)}'
        }, status=500)

# ============================================================================
# CART MANAGEMENT ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def get_cart(request):
    """Get user's shopping cart"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Get or create cart
        cart, created = Cart.objects.get_or_create(user=user)
        
        # Get cart items
        items = []
        for item in cart.items.all():
            items.append({
                'id': item.id,
                'product': {
                    'id': item.product.id,
                    'name': item.product.name,
                    'slug': item.product.slug,
                    'thumbnail': item.product.thumbnail,
                    'product_type': item.product.product_type,
                    'current_price': float(item.product.price),
                    'in_stock': not item.product.track_inventory or item.product.stock_quantity > 0
                },
                'quantity': item.quantity,
                'price_at_addition': float(item.price_at_addition),
                'subtotal': float(item.get_subtotal()),
                'custom_options': item.custom_options
            })
        
        return JsonResponse({
            'success': True,
            'data': {
                'id': cart.id,
                'items': items,
                'item_count': cart.get_item_count(),
                'total': float(cart.get_total()),
                'updated_at': cart.updated_at.isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Error fetching cart: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching cart: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def add_to_cart(request):
    """Add item to cart"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        custom_options = data.get('custom_options', {})
        
        if quantity <= 0:
            return JsonResponse({
                'success': False,
                'message': 'Quantity must be positive'
            }, status=400)
        
        # Get product
        product = Product.objects.get(id=product_id, is_active=True)
        
        # Check stock
        if product.track_inventory and product.stock_quantity < quantity:
            return JsonResponse({
                'success': False,
                'message': 'Insufficient stock'
            }, status=400)
        
        # Get or create cart
        cart, _ = Cart.objects.get_or_create(user=user)
        
        # Add or update item
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={
                'quantity': quantity,
                'price_at_addition': product.price,
                'custom_options': custom_options
            }
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        logger.info(f"Added to cart: {user.email} - {product.name} x{quantity}")
        
        return JsonResponse({
            'success': True,
            'message': 'Item added to cart',
            'data': {
                'cart_item_count': cart.get_item_count(),
                'cart_total': float(cart.get_total())
            }
        })
    except Product.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Product not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error adding to cart: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error adding to cart: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def update_cart_item(request, item_id):
    """Update cart item quantity"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        data = json.loads(request.body)
        quantity = int(data.get('quantity', 1))
        
        cart_item = CartItem.objects.get(id=item_id, cart__user=user)
        
        if quantity <= 0:
            cart_item.delete()
            return JsonResponse({
                'success': True,
                'message': 'Item removed from cart'
            })
        
        # Check stock
        if cart_item.product.track_inventory and cart_item.product.stock_quantity < quantity:
            return JsonResponse({
                'success': False,
                'message': 'Insufficient stock'
            }, status=400)
        
        cart_item.quantity = quantity
        cart_item.save()
        
        return JsonResponse({
            'success': True,
            'message': 'Cart updated',
            'data': {
                'subtotal': float(cart_item.get_subtotal()),
                'cart_total': float(cart_item.cart.get_total())
            }
        })
    except CartItem.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Cart item not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error updating cart item: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error updating cart: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def remove_from_cart(request, item_id):
    """Remove item from cart"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        cart_item = CartItem.objects.get(id=item_id, cart__user=user)
        cart_item.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Item removed from cart'
        })
    except CartItem.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Cart item not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error removing from cart: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error removing from cart: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def clear_cart(request):
    """Clear all items from cart"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        cart = Cart.objects.get(user=user)
        cart.items.all().delete()
        
        return JsonResponse({
            'success': True,
            'message': 'Cart cleared'
        })
    except Exception as e:
        logger.error(f"Error clearing cart: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error clearing cart: {str(e)}'
        }, status=500)

# ============================================================================
# CHECKOUT AND ORDER ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def create_order(request):
    """Create order from cart"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        data = json.loads(request.body)
        billing_address = data.get('billing_address', {})
        payment_method = data.get('payment_method', 'card')
        customer_notes = data.get('customer_notes', '')
        
        # Get cart
        cart = Cart.objects.get(user=user)
        
        if not cart.items.exists():
            return JsonResponse({
                'success': False,
                'message': 'Cart is empty'
            }, status=400)
        
        # Calculate totals
        subtotal = cart.get_total()
        tax_rate = 0.08  # 8% tax
        tax_amount = subtotal * tax_rate
        processing_fee = 2.99
        total = subtotal + tax_amount + processing_fee
        
        # Create order
        order = Order.objects.create(
            user=user,
            order_number=Order().generate_order_number(),
            status='pending',
            subtotal=subtotal,
            tax_rate=tax_rate,
            tax_amount=tax_amount,
            processing_fee=processing_fee,
            total=total,
            billing_address=billing_address,
            customer_notes=customer_notes
        )
        
        # Create order items
        for cart_item in cart.items.all():
            OrderItem.objects.create(
                order=order,
                product=cart_item.product,
                product_name=cart_item.product.name,
                product_description=cart_item.product.description,
                quantity=cart_item.quantity,
                unit_price=cart_item.price_at_addition,
                total_price=cart_item.get_subtotal(),
                options=cart_item.custom_options
            )
        
        # Create payment record
        payment = Payment.objects.create(
            order=order,
            payment_method=payment_method,
            status='pending',
            amount=total,
            gateway='stripe'  # or other gateway
        )
        
        # Clear cart
        cart.items.all().delete()
        
        logger.info(f"Order created: {order.order_number} for {user.email}")
        
        return JsonResponse({
            'success': True,
            'message': 'Order created successfully',
            'data': {
                'order_id': order.id,
                'order_number': order.order_number,
                'total': float(order.total),
                'payment_id': payment.id
            }
        })
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error creating order: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_orders(request):
    """Get user's order history"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        orders = Order.objects.filter(user=user).order_by('-created_at')
        
        data = []
        for order in orders:
            items = []
            for item in order.items.all():
                items.append({
                    'product_name': item.product_name,
                    'quantity': item.quantity,
                    'unit_price': float(item.unit_price),
                    'total_price': float(item.total_price),
                    'download_url': item.download_url,
                    'download_expires_at': item.download_expires_at.isoformat() if item.download_expires_at else None
                })
            
            data.append({
                'id': order.id,
                'order_number': order.order_number,
                'status': order.status,
                'subtotal': float(order.subtotal),
                'tax_amount': float(order.tax_amount),
                'processing_fee': float(order.processing_fee),
                'total': float(order.total),
                'currency': order.currency,
                'items': items,
                'created_at': order.created_at.isoformat(),
                'completed_at': order.completed_at.isoformat() if order.completed_at else None
            })
        
        return JsonResponse({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Error fetching orders: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching orders: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_order_detail(request, order_id):
    """Get detailed order information"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        order = Order.objects.get(id=order_id, user=user)
        
        items = []
        for item in order.items.all():
            items.append({
                'id': item.id,
                'product_name': item.product_name,
                'product_description': item.product_description,
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'total_price': float(item.total_price),
                'options': item.options,
                'download_url': item.download_url,
                'download_expires_at': item.download_expires_at.isoformat() if item.download_expires_at else None,
                'download_count': item.download_count,
                'max_downloads': item.max_downloads
            })
        
        payments = []
        for payment in order.payments.all():
            payments.append({
                'id': payment.id,
                'payment_method': payment.payment_method,
                'status': payment.status,
                'amount': float(payment.amount),
                'transaction_id': payment.transaction_id,
                'created_at': payment.created_at.isoformat(),
                'completed_at': payment.completed_at.isoformat() if payment.completed_at else None
            })
        
        data = {
            'id': order.id,
            'order_number': order.order_number,
            'status': order.status,
            'subtotal': float(order.subtotal),
            'tax_rate': float(order.tax_rate),
            'tax_amount': float(order.tax_amount),
            'processing_fee': float(order.processing_fee),
            'total': float(order.total),
            'currency': order.currency,
            'billing_address': order.billing_address,
            'customer_notes': order.customer_notes,
            'items': items,
            'payments': payments,
            'created_at': order.created_at.isoformat(),
            'updated_at': order.updated_at.isoformat(),
            'completed_at': order.completed_at.isoformat() if order.completed_at else None
        }
        
        return JsonResponse({
            'success': True,
            'data': data
        })
    except Order.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Order not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error fetching order detail: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching order: {str(e)}'
        }, status=500)

# ============================================================================
# REVIEWS AND RATINGS ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def create_review(request):
    """Create a product review"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        data = json.loads(request.body)
        product_id = data.get('product_id')
        rating = int(data.get('rating'))
        title = data.get('title', '')
        review_text = data.get('review', '')
        order_id = data.get('order_id')
        
        if rating < 1 or rating > 5:
            return JsonResponse({
                'success': False,
                'message': 'Rating must be between 1 and 5'
            }, status=400)
        
        product = Product.objects.get(id=product_id)
        order = Order.objects.get(id=order_id, user=user) if order_id else None
        
        # Check if user already reviewed
        if ProductReview.objects.filter(product=product, user=user, order=order).exists():
            return JsonResponse({
                'success': False,
                'message': 'You have already reviewed this product'
            }, status=400)
        
        # Create review
        review = ProductReview.objects.create(
            product=product,
            user=user,
            order=order,
            rating=rating,
            title=title,
            review=review_text,
            is_verified_purchase=order is not None
        )
        
        # Update product rating
        ratings = ProductReview.objects.filter(product=product, is_approved=True)
        product.rating_average = ratings.aggregate(Avg('rating'))['rating__avg'] or 0
        product.rating_count = ratings.count()
        product.save(update_fields=['rating_average', 'rating_count'])
        
        logger.info(f"Review created: {user.email} - {product.name} - {rating}★")
        
        return JsonResponse({
            'success': True,
            'message': 'Review submitted successfully',
            'data': {
                'review_id': review.id
            }
        })
    except Product.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Product not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error creating review: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error creating review: {str(e)}'
        }, status=500)

# ============================================================================
# WISHLIST ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def get_wishlist(request):
    """Get user's wishlist"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        wishlist_items = Wishlist.objects.filter(user=user).select_related('product')
        
        data = []
        for item in wishlist_items:
            data.append({
                'id': item.id,
                'product': {
                    'id': item.product.id,
                    'name': item.product.name,
                    'slug': item.product.slug,
                    'price': float(item.product.price),
                    'compare_at_price': float(item.product.compare_at_price) if item.product.compare_at_price else None,
                    'thumbnail': item.product.thumbnail,
                    'rating_average': float(item.product.rating_average),
                    'in_stock': not item.product.track_inventory or item.product.stock_quantity > 0
                },
                'added_at': item.created_at.isoformat()
            })
        
        return JsonResponse({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Error fetching wishlist: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error fetching wishlist: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def toggle_wishlist(request):
    """Add or remove item from wishlist"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        data = json.loads(request.body)
        product_id = data.get('product_id')
        
        product = Product.objects.get(id=product_id, is_active=True)
        
        # Check if already in wishlist
        wishlist_item = Wishlist.objects.filter(user=user, product=product).first()
        
        if wishlist_item:
            wishlist_item.delete()
            message = 'Removed from wishlist'
            in_wishlist = False
        else:
            Wishlist.objects.create(user=user, product=product)
            message = 'Added to wishlist'
            in_wishlist = True
        
        return JsonResponse({
            'success': True,
            'message': message,
            'data': {
                'in_wishlist': in_wishlist
            }
        })
    except Product.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Product not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Error toggling wishlist: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)
