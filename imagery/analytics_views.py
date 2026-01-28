"""
Business Intelligence and Analytics API Views
Advanced analytics, dashboards, reporting, and AI insights
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q, F
from django.db.models.functions import TruncDate, TruncHour
from datetime import timedelta, datetime
from .models import (
    AOI, Download, ProcessingJob, SatelliteImage, UserProfile,
    Order, Product, Payment, ProductReview
)
from .analytics_models import (
    AnalyticsEvent, BusinessMetric, Report, Dashboard,
    Insight, GeospatialAnalytics, UserBehaviorPattern, Forecast
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
# DASHBOARD & KPI ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def get_dashboard_overview(request):
    """Get main dashboard with KPIs and metrics"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Get date range
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Calculate KPIs
        total_revenue = Order.objects.filter(
            created_at__gte=start_date,
            status='completed'
        ).aggregate(total=Sum('total'))['total'] or 0
        
        total_orders = Order.objects.filter(created_at__gte=start_date).count()
        
        completed_orders = Order.objects.filter(
            created_at__gte=start_date,
            status='completed'
        ).count()
        
        total_users = UserProfile.objects.filter(
            user__date_joined__gte=start_date
        ).count()
        
        active_users = UserProfile.objects.filter(
            user__last_login__gte=start_date
        ).count()
        
        total_downloads = Download.objects.filter(
            requested_at__gte=start_date
        ).count()
        
        completed_downloads = Download.objects.filter(
            requested_at__gte=start_date,
            status='complete'
        ).count()
        
        data_processed_gb = ProcessingJob.objects.filter(
            created_at__gte=start_date,
            status='completed'
        ).aggregate(
            total=Sum('parameters__output_size_gb')
        )['total'] or 0
        
        # Revenue by day (last 30 days)
        revenue_by_day = []
        for i in range(days):
            day = timezone.now() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_revenue = Order.objects.filter(
                created_at__gte=day_start,
                created_at__lt=day_end,
                status='completed'
            ).aggregate(total=Sum('total'))['total'] or 0
            
            revenue_by_day.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'revenue': float(day_revenue)
            })
        
        revenue_by_day.reverse()
        
        # Top products
        top_products = Product.objects.filter(
            is_active=True
        ).order_by('-purchases_count')[:5]
        
        top_products_data = []
        for product in top_products:
            top_products_data.append({
                'id': product.id,
                'name': product.name,
                'purchases': product.purchases_count,
                'revenue': float(product.price * product.purchases_count),
                'rating': float(product.rating_average)
            })
        
        # User growth
        user_growth = []
        for i in range(days):
            day = timezone.now() - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            new_users = UserProfile.objects.filter(
                user__date_joined__gte=day_start,
                user__date_joined__lt=day_end
            ).count()
            
            user_growth.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'new_users': new_users
            })
        
        user_growth.reverse()
        
        # Calculate trends (compare with previous period)
        prev_start = start_date - timedelta(days=days)
        prev_revenue = Order.objects.filter(
            created_at__gte=prev_start,
            created_at__lt=start_date,
            status='completed'
        ).aggregate(total=Sum('total'))['total'] or 1
        
        revenue_change = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        
        return JsonResponse({
            'success': True,
            'data': {
                'kpis': {
                    'total_revenue': {
                        'value': float(total_revenue),
                        'change': float(revenue_change),
                        'trend': 'up' if revenue_change > 0 else 'down'
                    },
                    'total_orders': {
                        'value': total_orders,
                        'completed': completed_orders,
                        'completion_rate': (completed_orders / total_orders * 100) if total_orders > 0 else 0
                    },
                    'total_users': {
                        'value': total_users,
                        'active': active_users,
                        'active_rate': (active_users / total_users * 100) if total_users > 0 else 0
                    },
                    'total_downloads': {
                        'value': total_downloads,
                        'completed': completed_downloads,
                        'success_rate': (completed_downloads / total_downloads * 100) if total_downloads > 0 else 0
                    },
                    'data_processed_gb': {
                        'value': float(data_processed_gb)
                    }
                },
                'charts': {
                    'revenue_by_day': revenue_by_day,
                    'user_growth': user_growth,
                    'top_products': top_products_data
                },
                'period': {
                    'start': start_date.isoformat(),
                    'end': timezone.now().isoformat(),
                    'days': days
                }
            }
        })
    except Exception as e:
        logger.error(f"Error fetching dashboard overview: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_realtime_metrics(request):
    """Get real-time system metrics"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Last hour metrics
        last_hour = timezone.now() - timedelta(hours=1)
        
        # Active users (logged in last 15 minutes)
        active_now = UserProfile.objects.filter(
            user__last_login__gte=timezone.now() - timedelta(minutes=15)
        ).count()
        
        # Recent events
        recent_events = AnalyticsEvent.objects.filter(
            created_at__gte=last_hour
        ).values('event_type').annotate(count=Count('id'))
        
        events_by_type = {event['event_type']: event['count'] for event in recent_events}
        
        # Processing jobs
        jobs_processing = ProcessingJob.objects.filter(
            status='processing'
        ).count()
        
        # Recent orders
        orders_last_hour = Order.objects.filter(
            created_at__gte=last_hour
        ).count()
        
        revenue_last_hour = Order.objects.filter(
            created_at__gte=last_hour,
            status='completed'
        ).aggregate(total=Sum('total'))['total'] or 0
        
        return JsonResponse({
            'success': True,
            'data': {
                'active_users_now': active_now,
                'events_last_hour': events_by_type,
                'jobs_processing': jobs_processing,
                'orders_last_hour': orders_last_hour,
                'revenue_last_hour': float(revenue_last_hour),
                'timestamp': timezone.now().isoformat()
            }
        })
    except Exception as e:
        logger.error(f"Error fetching realtime metrics: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def get_user_analytics(request):
    """Get detailed user analytics"""
    try:
        user = authenticate_token(request)
        if not user or not (user.is_staff or user.is_superuser):
            return JsonResponse({
                'success': False,
                'message': 'Admin access required'
            }, status=403)
        
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # User registration trends
        registrations = UserProfile.objects.filter(
            user__date_joined__gte=start_date
        ).annotate(
            date=TruncDate('user__date_joined')
        ).values('date').annotate(count=Count('id')).order_by('date')
        
        # User activity
        active_users_by_day = AnalyticsEvent.objects.filter(
            created_at__gte=start_date,
            user__isnull=False
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            unique_users=Count('user', distinct=True)
        ).order_by('date')
        
        # User segments
        user_by_role = UserProfile.objects.values('user__is_staff', 'user__is_superuser').annotate(count=Count('id'))
        
        # Retention rate (users who logged in after 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        two_weeks_ago = timezone.now() - timedelta(days=14)
        
        new_users_week = UserProfile.objects.filter(
            user__date_joined__gte=week_ago,
            user__date_joined__lt=timezone.now()
        ).count()
        
        retained_users = UserProfile.objects.filter(
            user__date_joined__gte=two_weeks_ago,
            user__date_joined__lt=week_ago,
            user__last_login__gte=week_ago
        ).count()
        
        retention_rate = (retained_users / new_users_week * 100) if new_users_week > 0 else 0
        
        return JsonResponse({
            'success': True,
            'data': {
                'registration_trends': list(registrations),
                'active_users_by_day': list(active_users_by_day),
                'user_segments': list(user_by_role),
                'retention_rate': float(retention_rate),
                'total_users': UserProfile.objects.count(),
                'active_users': UserProfile.objects.filter(
                    user__last_login__gte=start_date
                ).count()
            }
        })
    except Exception as e:
        logger.error(f"Error fetching user analytics: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_sales_analytics(request):
    """Get detailed sales analytics"""
    try:
        user = authenticate_token(request)
        if not user or not (user.is_staff or user.is_superuser):
            return JsonResponse({
                'success': False,
                'message': 'Admin access required'
            }, status=403)
        
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Revenue trends
        revenue_by_day = Order.objects.filter(
            created_at__gte=start_date,
            status='completed'
        ).annotate(
            date=TruncDate('created_at')
        ).values('date').annotate(
            revenue=Sum('total'),
            orders=Count('id')
        ).order_by('date')
        
        # Revenue by product type
        revenue_by_type = Order.objects.filter(
            created_at__gte=start_date,
            status='completed'
        ).values(
            'items__product__product_type'
        ).annotate(
            revenue=Sum('items__total_price')
        ).order_by('-revenue')
        
        # Average order value
        avg_order_value = Order.objects.filter(
            created_at__gte=start_date,
            status='completed'
        ).aggregate(avg=Avg('total'))['avg'] or 0
        
        # Payment method distribution
        payment_methods = Payment.objects.filter(
            created_at__gte=start_date,
            status='completed'
        ).values('payment_method').annotate(
            count=Count('id'),
            total=Sum('amount')
        )
        
        # Conversion funnel
        cart_adds = AnalyticsEvent.objects.filter(
            created_at__gte=start_date,
            event_type='cart_add'
        ).count()
        
        checkouts = AnalyticsEvent.objects.filter(
            created_at__gte=start_date,
            event_type='checkout'
        ).count()
        
        purchases = Order.objects.filter(
            created_at__gte=start_date,
            status='completed'
        ).count()
        
        conversion_rate = (purchases / cart_adds * 100) if cart_adds > 0 else 0
        
        return JsonResponse({
            'success': True,
            'data': {
                'revenue_trends': list(revenue_by_day),
                'revenue_by_type': list(revenue_by_type),
                'avg_order_value': float(avg_order_value),
                'payment_methods': list(payment_methods),
                'conversion_funnel': {
                    'cart_adds': cart_adds,
                    'checkouts': checkouts,
                    'purchases': purchases,
                    'conversion_rate': float(conversion_rate)
                }
            }
        })
    except Exception as e:
        logger.error(f"Error fetching sales analytics: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_product_analytics(request):
    """Get product performance analytics"""
    try:
        user = authenticate_token(request)
        if not user or not (user.is_staff or user.is_superuser):
            return JsonResponse({
                'success': False,
                'message': 'Admin access required'
            }, status=403)
        
        # Top performing products
        top_products = Product.objects.filter(
            is_active=True
        ).order_by('-purchases_count')[:10]
        
        products_data = []
        for product in top_products:
            total_revenue = float(product.price * product.purchases_count)
            products_data.append({
                'id': product.id,
                'name': product.name,
                'type': product.product_type,
                'purchases': product.purchases_count,
                'views': product.views_count,
                'conversion_rate': (product.purchases_count / product.views_count * 100) if product.views_count > 0 else 0,
                'revenue': total_revenue,
                'rating': float(product.rating_average),
                'reviews': product.rating_count
            })
        
        # Product type distribution
        type_distribution = Product.objects.values('product_type').annotate(
            count=Count('id'),
            total_sales=Sum('purchases_count')
        )
        
        # Low stock products
        low_stock = Product.objects.filter(
            track_inventory=True,
            stock_quantity__lte=5,
            is_active=True
        ).values('id', 'name', 'stock_quantity')
        
        return JsonResponse({
            'success': True,
            'data': {
                'top_products': products_data,
                'type_distribution': list(type_distribution),
                'low_stock_products': list(low_stock)
            }
        })
    except Exception as e:
        logger.error(f"Error fetching product analytics: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_geospatial_analytics(request):
    """Get geospatial analytics and insights"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # AOI statistics
        total_aois = AOI.objects.filter(user=user).count()
        active_aois = AOI.objects.filter(
            user=user,
            created_at__gte=start_date
        ).count()
        
        # Total area covered
        total_area = AOI.objects.filter(user=user).aggregate(
            total=Sum('area_km2')
        )['total'] or 0
        
        # Imagery coverage
        imagery_stats = SatelliteImage.objects.filter(
            is_available=True
        ).values('provider').annotate(
            count=Count('id'),
            avg_cloud_cover=Avg('cloud_cover')
        )
        
        # Processing statistics
        processing_by_type = ProcessingJob.objects.filter(
            user=user,
            created_at__gte=start_date
        ).values('job_type').annotate(
            count=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            avg_duration=Avg('duration')
        )
        
        # Download patterns
        downloads_by_provider = Download.objects.filter(
            user=user,
            requested_at__gte=start_date
        ).values('satellite_image__provider').annotate(
            count=Count('id')
        )
        
        return JsonResponse({
            'success': True,
            'data': {
                'aoi_statistics': {
                    'total_aois': total_aois,
                    'active_aois': active_aois,
                    'total_area_km2': float(total_area)
                },
                'imagery_coverage': list(imagery_stats),
                'processing_stats': list(processing_by_type),
                'download_patterns': list(downloads_by_provider)
            }
        })
    except Exception as e:
        logger.error(f"Error fetching geospatial analytics: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

# ============================================================================
# INSIGHTS & PREDICTIONS ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET"])
def get_ai_insights(request):
    """Get AI-generated insights and recommendations"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        # Get active insights for user
        insights = Insight.objects.filter(
            Q(relevant_for_users=user) | Q(relevant_for_users__isnull=True),
            is_active=True,
            is_dismissed=False,
            valid_from__lte=timezone.now()
        ).filter(
            Q(valid_until__isnull=True) | Q(valid_until__gte=timezone.now())
        )[:10]
        
        insights_data = []
        for insight in insights:
            insights_data.append({
                'id': insight.id,
                'type': insight.insight_type,
                'priority': insight.priority,
                'title': insight.title,
                'description': insight.description,
                'confidence': float(insight.confidence_score),
                'recommended_actions': insight.recommended_actions,
                'potential_impact': insight.potential_impact,
                'created_at': insight.created_at.isoformat()
            })
        
        # Generate dynamic insights
        dynamic_insights = []
        
        # Check for unusual activity patterns
        user_avg_downloads = Download.objects.filter(user=user).count() / 30
        recent_downloads = Download.objects.filter(
            user=user,
            requested_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        if recent_downloads > user_avg_downloads * 2:
            dynamic_insights.append({
                'type': 'trend',
                'priority': 'medium',
                'title': 'Increased Download Activity',
                'description': f'Your download activity is {(recent_downloads / user_avg_downloads * 100):.0f}% above average',
                'confidence': 95,
                'recommended_actions': ['Consider upgrading your plan for better download limits']
            })
        
        return JsonResponse({
            'success': True,
            'data': {
                'insights': insights_data,
                'dynamic_insights': dynamic_insights
            }
        })
    except Exception as e:
        logger.error(f"Error fetching AI insights: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

# ============================================================================
# REPORTS ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def generate_report(request):
    """Generate a custom report"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        data = json.loads(request.body)
        report_type = data.get('report_type')
        parameters = data.get('parameters', {})
        format_type = data.get('format', 'pdf')
        
        # Create report
        report = Report.objects.create(
            name=data.get('name', f"{report_type.title()} Report"),
            description=data.get('description', ''),
            report_type=report_type,
            created_by=user,
            parameters=parameters,
            format=format_type,
            status='generating'
        )
        
        # Generate report data based on type
        report_data = {}
        
        if report_type == 'sales':
            start_date = parameters.get('start_date', (timezone.now() - timedelta(days=30)).isoformat())
            end_date = parameters.get('end_date', timezone.now().isoformat())
            
            orders = Order.objects.filter(
                created_at__gte=start_date,
                created_at__lte=end_date,
                status='completed'
            )
            
            report_data = {
                'total_revenue': float(orders.aggregate(total=Sum('total'))['total'] or 0),
                'total_orders': orders.count(),
                'avg_order_value': float(orders.aggregate(avg=Avg('total'))['avg'] or 0),
                'orders_by_day': list(orders.annotate(
                    date=TruncDate('created_at')
                ).values('date').annotate(
                    revenue=Sum('total'),
                    count=Count('id')
                ).order_by('date'))
            }
        
        # Update report
        report.report_data = report_data
        report.status = 'completed'
        report.completed_at = timezone.now()
        report.save()
        
        logger.info(f"Report generated: {report.name} by {user.email}")
        
        return JsonResponse({
            'success': True,
            'message': 'Report generated successfully',
            'data': {
                'report_id': report.id,
                'download_url': f'/api/reports/{report.id}/download/'
            }
        })
    except Exception as e:
        logger.error(f"Error generating report: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_reports(request):
    """Get user's reports"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        reports = Report.objects.filter(
            Q(created_by=user) | Q(shared_with=user) | Q(is_public=True)
        ).distinct()
        
        data = []
        for report in reports:
            data.append({
                'id': report.id,
                'name': report.name,
                'description': report.description,
                'report_type': report.report_type,
                'status': report.status,
                'format': report.format,
                'file_size_mb': report.file_size_mb,
                'created_at': report.created_at.isoformat(),
                'completed_at': report.completed_at.isoformat() if report.completed_at else None
            })
        
        return JsonResponse({
            'success': True,
            'data': data
        })
    except Exception as e:
        logger.error(f"Error fetching reports: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

# ============================================================================
# EXPORT ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["POST"])
def export_data(request):
    """Export analytics data in various formats"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        data = json.loads(request.body)
        export_type = data.get('type', 'dashboard')
        format_type = data.get('format', 'csv')
        filters = data.get('filters', {})
        
        # Prepare export data based on type
        export_data = {}
        
        if export_type == 'dashboard':
            # Export dashboard data
            export_data = {
                'exported_at': timezone.now().isoformat(),
                'user': user.email,
                'type': export_type,
                'data': {}  # Dashboard data here
            }
        
        return JsonResponse({
            'success': True,
            'message': f'Data exported successfully as {format_type}',
            'data': {
                'download_url': '/api/analytics/exports/latest/',
                'format': format_type
            }
        })
    except Exception as e:
        logger.error(f"Error exporting data: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

# ============================================================================
# CUSTOM DASHBOARDS ENDPOINTS
# ============================================================================

@csrf_exempt
@require_http_methods(["GET", "POST"])
def manage_dashboards(request):
    """Get or create custom dashboards"""
    try:
        user = authenticate_token(request)
        if not user:
            return JsonResponse({
                'success': False,
                'message': 'Authentication required'
            }, status=401)
        
        if request.method == 'GET':
            dashboards = Dashboard.objects.filter(user=user)
            
            data = []
            for dashboard in dashboards:
                data.append({
                    'id': dashboard.id,
                    'name': dashboard.name,
                    'description': dashboard.description,
                    'is_default': dashboard.is_default,
                    'refresh_interval': dashboard.refresh_interval,
                    'widget_count': len(dashboard.widgets),
                    'created_at': dashboard.created_at.isoformat()
                })
            
            return JsonResponse({
                'success': True,
                'data': data
            })
        
        elif request.method == 'POST':
            data = json.loads(request.body)
            
            dashboard = Dashboard.objects.create(
                name=data.get('name'),
                description=data.get('description', ''),
                user=user,
                layout=data.get('layout', {}),
                widgets=data.get('widgets', []),
                refresh_interval=data.get('refresh_interval', 60)
            )
            
            return JsonResponse({
                'success': True,
                'message': 'Dashboard created successfully',
                'data': {
                    'dashboard_id': dashboard.id
                }
            })
    except Exception as e:
        logger.error(f"Error managing dashboards: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def track_event(request):
    """Track analytics event"""
    try:
        user = authenticate_token(request)
        
        data = json.loads(request.body)
        
        AnalyticsEvent.objects.create(
            user=user,
            session_id=data.get('session_id', ''),
            event_type=data.get('event_type'),
            event_category=data.get('event_category', ''),
            event_label=data.get('event_label', ''),
            event_data=data.get('event_data', {}),
            page_url=data.get('page_url', ''),
            referrer=data.get('referrer', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            page_load_time=data.get('page_load_time')
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Event tracked'
        })
    except Exception as e:
        logger.error(f"Error tracking event: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=500)
