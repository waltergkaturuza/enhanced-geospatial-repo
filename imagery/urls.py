from django.urls import path
from . import views_simple
from . import upload_handler
from . import file_manager_api
from . import ai_metadata_extractor
from . import enhanced_views
from . import auth_views
from . import store_views
from . import analytics_views

# API URL patterns for the geospatial application
urlpatterns = [
    # Authentication endpoints
    path('auth/login/', auth_views.login_view, name='auth-login'),
    path('auth/signup/', auth_views.signup_view, name='auth-signup'),
    path('auth/logout/', auth_views.logout_view, name='auth-logout'),
    path('auth/profile/', auth_views.user_profile, name='auth-profile'),
    
    # System management endpoints
    path('system/parse-metadata/', views_simple.parse_metadata, name='system-parse-metadata'),
    path('system/upload-files/', views_simple.upload_files, name='system-upload-files'),
    path('system/status/', views_simple.system_status, name='system-status'),
    path('system/processing-queue/', views_simple.processing_queue, name='system-processing-queue'),
    
    # Dashboard endpoints
    path('dashboard/stats/', views_simple.dashboard_stats, name='dashboard-stats'),
    path('dashboard/activity/', views_simple.dashboard_activity, name='dashboard-activity'),
    
    # Enhanced upload endpoints
    path('upload/satellite-imagery/', upload_handler.upload_satellite_imagery, name='upload-satellite-imagery'),
    path('upload/status/', upload_handler.get_upload_status, name='upload-status'),
    path('upload/supported-formats/', upload_handler.get_supported_formats, name='upload-supported-formats'),
    path('upload/advanced-satellite-imagery/', ai_metadata_extractor.advanced_upload_satellite_imagery, name='upload-advanced-satellite-imagery'),
    
    # AI-powered metadata extraction
    path('ai/extract-metadata/', ai_metadata_extractor.extract_metadata_ai, name='ai-extract-metadata'),
    path('ai/capabilities/', ai_metadata_extractor.ai_capabilities, name='ai-capabilities'),
    
    # Enhanced geospatial endpoints
    path('enhanced/upload/', enhanced_views.enhanced_geospatial_upload, name='enhanced-geospatial-upload'),
    path('enhanced/status/', enhanced_views.enhanced_geospatial_status, name='enhanced-geospatial-status'),
    path('enhanced/files/tree/', enhanced_views.enhanced_file_tree, name='enhanced-file-tree'),
    
    # File management endpoints
    path('files/tree/', file_manager_api.get_file_tree, name='files-tree'),
    path('files/search/', file_manager_api.search_files, name='files-search'),
    path('files/stats/', file_manager_api.get_file_stats, name='files-stats'),
    path('files/delete/<path:file_id>/', file_manager_api.delete_file, name='files-delete'),
    
    # Authentication endpoints
    path('auth/login/', views_simple.user_login, name='user-login'),
    path('auth/signup/', views_simple.user_signup, name='user-signup'),
    path('auth/profile/', views_simple.user_profile, name='user-profile'),
    
    # User approval endpoints
    path('admin/pending-users/', views_simple.pending_users, name='admin-pending-users'),
    path('admin/approve-user/', views_simple.approve_user, name='admin-approve-user'),
    path('admin/reject-user/', views_simple.reject_user, name='admin-reject-user'),
    
    # TEMPORARY: Emergency migration fix endpoint (visit in browser to fix columns)
    path('admin/emergency-fix-columns/', views_simple.emergency_fix_columns, name='admin-emergency-fix'),
    
    # User management endpoints
    path('admin/users/', views_simple.admin_users, name='admin-users'),
    path('admin/users/update-role/', views_simple.update_user_role, name='admin-update-user-role'),
    
    # Database management endpoints
    path('admin/database-stats/', views_simple.database_stats, name='admin-database-stats'),
    
    # Subscription management endpoints
    path('subscriptions/plans/', views_simple.subscription_plans, name='subscription-plans'),
    path('subscriptions/current/', views_simple.current_subscription, name='current-subscription'),
    path('subscriptions/invoices/', views_simple.user_invoices, name='user-invoices'),
    
    # Support request endpoints
    path('support/requests/', views_simple.support_requests, name='support-requests'),
    path('support/requests/<int:request_id>/', views_simple.support_request_detail, name='support-request-detail'),
    
    # Feedback endpoint
    path('feedback/submit/', views_simple.submit_feedback, name='submit-feedback'),
    
    # Additional criteria endpoints
    path('additional/products/', views_simple.get_available_products, name='additional-products'),
    path('additional/formats/', views_simple.get_available_formats, name='additional-formats'),
    
    # User management endpoints
    path('admin/users/create/', views_simple.create_user, name='admin-create-user'),
    path('admin/users/update/', views_simple.update_user, name='admin-update-user'),
    path('admin/users/update-status/', views_simple.update_user_status, name='admin-update-user-status'),
    path('admin/users/delete/', views_simple.delete_user, name='admin-delete-user'),
    path('admin/users/<int:user_id>/details/', views_simple.get_user_details, name='admin-user-details'),
    
    # Store/E-commerce endpoints
    # Product catalog
    path('store/categories/', store_views.get_product_categories, name='store-categories'),
    path('store/products/', store_views.get_products, name='store-products'),
    path('store/products/<int:product_id>/', store_views.get_product_detail, name='store-product-detail'),
    
    # Cart management
    path('store/cart/', store_views.get_cart, name='store-cart'),
    path('store/cart/add/', store_views.add_to_cart, name='store-cart-add'),
    path('store/cart/update/<int:item_id>/', store_views.update_cart_item, name='store-cart-update'),
    path('store/cart/remove/<int:item_id>/', store_views.remove_from_cart, name='store-cart-remove'),
    path('store/cart/clear/', store_views.clear_cart, name='store-cart-clear'),
    
    # Orders
    path('store/checkout/', store_views.create_order, name='store-checkout'),
    path('store/orders/', store_views.get_orders, name='store-orders'),
    path('store/orders/<int:order_id>/', store_views.get_order_detail, name='store-order-detail'),
    
    # Reviews
    path('store/reviews/create/', store_views.create_review, name='store-review-create'),
    
    # Wishlist
    path('store/wishlist/', store_views.get_wishlist, name='store-wishlist'),
    path('store/wishlist/toggle/', store_views.toggle_wishlist, name='store-wishlist-toggle'),
    
    # Business Intelligence & Analytics
    path('analytics/dashboard/', analytics_views.get_dashboard_overview, name='analytics-dashboard'),
    path('analytics/realtime/', analytics_views.get_realtime_metrics, name='analytics-realtime'),
    path('analytics/users/', analytics_views.get_user_analytics, name='analytics-users'),
    path('analytics/sales/', analytics_views.get_sales_analytics, name='analytics-sales'),
    path('analytics/products/', analytics_views.get_product_analytics, name='analytics-products'),
    path('analytics/geospatial/', analytics_views.get_geospatial_analytics, name='analytics-geospatial'),
    path('analytics/insights/', analytics_views.get_ai_insights, name='analytics-insights'),
    path('analytics/track-event/', analytics_views.track_event, name='analytics-track-event'),
    path('analytics/reports/', analytics_views.get_reports, name='analytics-reports'),
    path('analytics/reports/generate/', analytics_views.generate_report, name='analytics-generate-report'),
    path('analytics/export/', analytics_views.export_data, name='analytics-export'),
    path('analytics/dashboards/', analytics_views.manage_dashboards, name='analytics-dashboards'),
]
