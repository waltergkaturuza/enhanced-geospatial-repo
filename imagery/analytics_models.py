"""
Business Intelligence and Analytics Models
Advanced analytics, reporting, and insights for geospatial data platform
"""

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
import json

# ============================================================================
# ANALYTICS & METRICS MODELS
# ============================================================================

class AnalyticsEvent(models.Model):
    """Track user interactions and system events"""
    EVENT_TYPES = (
        ('page_view', 'Page View'),
        ('product_view', 'Product View'),
        ('search', 'Search'),
        ('download', 'Download'),
        ('upload', 'Upload'),
        ('analysis', 'Analysis Run'),
        ('cart_add', 'Add to Cart'),
        ('cart_remove', 'Remove from Cart'),
        ('checkout', 'Checkout'),
        ('purchase', 'Purchase'),
        ('review', 'Review Submitted'),
        ('login', 'Login'),
        ('signup', 'Signup'),
        ('error', 'Error Occurred'),
    )
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analytics_events'
    )
    session_id = models.CharField(max_length=100, blank=True)
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    event_category = models.CharField(max_length=50, blank=True)
    event_label = models.CharField(max_length=255, blank=True)
    
    # Event data
    event_data = models.JSONField(default=dict, blank=True)
    
    # Context
    page_url = models.CharField(max_length=500, blank=True)
    referrer = models.CharField(max_length=500, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    # Geographic data
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    # Performance metrics
    page_load_time = models.FloatField(null=True, blank=True, help_text="in milliseconds")
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['event_type', '-created_at']),
            models.Index(fields=['session_id', '-created_at']),
        ]
        verbose_name = "Analytics Event"
        verbose_name_plural = "Analytics Events"
    
    def __str__(self):
        return f"{self.event_type} - {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"

class BusinessMetric(models.Model):
    """Store calculated business metrics"""
    METRIC_TYPES = (
        ('revenue', 'Revenue'),
        ('users', 'User Count'),
        ('orders', 'Order Count'),
        ('downloads', 'Download Count'),
        ('active_users', 'Active Users'),
        ('conversion_rate', 'Conversion Rate'),
        ('avg_order_value', 'Average Order Value'),
        ('customer_lifetime_value', 'Customer Lifetime Value'),
        ('churn_rate', 'Churn Rate'),
        ('data_processed', 'Data Processed (GB)'),
        ('api_calls', 'API Calls'),
        ('storage_used', 'Storage Used (GB)'),
        ('custom', 'Custom Metric'),
    )
    
    PERIOD_TYPES = (
        ('hourly', 'Hourly'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('yearly', 'Yearly'),
    )
    
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    metric_name = models.CharField(max_length=100)
    metric_value = models.DecimalField(max_digits=20, decimal_places=4)
    period_type = models.CharField(max_length=20, choices=PERIOD_TYPES)
    period_start = models.DateTimeField()
    period_end = models.DateTimeField()
    
    # Segmentation
    segment = models.CharField(max_length=100, blank=True, help_text="e.g., user_type, region, product_category")
    segment_value = models.CharField(max_length=100, blank=True)
    
    # Additional context
    metadata = models.JSONField(default=dict, blank=True)
    
    # Comparison
    previous_value = models.DecimalField(max_digits=20, decimal_places=4, null=True, blank=True)
    change_percentage = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-period_start']
        indexes = [
            models.Index(fields=['metric_type', '-period_start']),
            models.Index(fields=['period_type', '-period_start']),
            models.Index(fields=['segment', 'segment_value', '-period_start']),
        ]
        unique_together = ['metric_type', 'period_type', 'period_start', 'segment', 'segment_value']
        verbose_name = "Business Metric"
        verbose_name_plural = "Business Metrics"
    
    def __str__(self):
        return f"{self.metric_name} - {self.period_start.strftime('%Y-%m-%d')}: {self.metric_value}"

class Report(models.Model):
    """Saved reports and analytics"""
    REPORT_TYPES = (
        ('sales', 'Sales Report'),
        ('user_activity', 'User Activity Report'),
        ('product_performance', 'Product Performance'),
        ('geographic', 'Geographic Analysis'),
        ('revenue', 'Revenue Report'),
        ('usage', 'Platform Usage'),
        ('inventory', 'Inventory Report'),
        ('customer', 'Customer Analytics'),
        ('custom', 'Custom Report'),
    )
    
    FORMATS = (
        ('pdf', 'PDF'),
        ('excel', 'Excel (XLSX)'),
        ('csv', 'CSV'),
        ('json', 'JSON'),
    )
    
    STATUS = (
        ('generating', 'Generating'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('scheduled', 'Scheduled'),
    )
    
    # Report info
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    
    # Creator
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_created'
    )
    
    # Parameters
    parameters = models.JSONField(default=dict, help_text="Report parameters like date range, filters, etc.")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS, default='generating')
    
    # Output
    format = models.CharField(max_length=20, choices=FORMATS, default='pdf')
    file_path = models.CharField(max_length=500, blank=True)
    file_size_mb = models.FloatField(default=0.0)
    
    # Data
    report_data = models.JSONField(default=dict, blank=True, help_text="Report results and data")
    
    # Scheduling
    is_scheduled = models.BooleanField(default=False)
    schedule_frequency = models.CharField(max_length=20, blank=True, help_text="e.g., daily, weekly, monthly")
    next_run_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Sharing
    is_public = models.BooleanField(default=False)
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='shared_reports',
        blank=True
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['created_by', '-created_at']),
            models.Index(fields=['report_type', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
        verbose_name = "Report"
        verbose_name_plural = "Reports"
    
    def __str__(self):
        return f"{self.name} ({self.report_type})"

class Dashboard(models.Model):
    """Custom user dashboards"""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='dashboards'
    )
    
    # Dashboard configuration
    layout = models.JSONField(default=dict, help_text="Dashboard layout and widget positions")
    widgets = models.JSONField(default=list, help_text="List of widgets and their configurations")
    
    # Settings
    refresh_interval = models.IntegerField(default=60, help_text="Auto-refresh interval in seconds")
    is_default = models.BooleanField(default=False)
    is_public = models.BooleanField(default=False)
    
    # Sharing
    shared_with = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='shared_dashboards',
        blank=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['user', 'name']
        verbose_name = "Dashboard"
        verbose_name_plural = "Dashboards"
    
    def __str__(self):
        return f"{self.name} - {self.user.email}"

class Insight(models.Model):
    """AI-generated insights and recommendations"""
    INSIGHT_TYPES = (
        ('trend', 'Trend Identified'),
        ('anomaly', 'Anomaly Detected'),
        ('opportunity', 'Business Opportunity'),
        ('recommendation', 'Recommendation'),
        ('prediction', 'Prediction'),
        ('alert', 'Alert'),
        ('optimization', 'Optimization Suggestion'),
    )
    
    PRIORITY = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    
    insight_type = models.CharField(max_length=30, choices=INSIGHT_TYPES)
    priority = models.CharField(max_length=20, choices=PRIORITY, default='medium')
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    
    # Data backing the insight
    data_points = models.JSONField(default=list)
    confidence_score = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Confidence percentage (0-100)"
    )
    
    # Actionability
    recommended_actions = models.JSONField(default=list)
    potential_impact = models.TextField(blank=True)
    
    # Targeting
    relevant_for_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='insights',
        blank=True
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    is_dismissed = models.BooleanField(default=False)
    dismissed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='dismissed_insights'
    )
    
    # Temporal
    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['insight_type', '-created_at']),
            models.Index(fields=['priority', '-created_at']),
            models.Index(fields=['is_active', '-created_at']),
        ]
        verbose_name = "AI Insight"
        verbose_name_plural = "AI Insights"
    
    def __str__(self):
        return f"{self.get_insight_type_display()}: {self.title}"

class GeospatialAnalytics(models.Model):
    """Geospatial-specific analytics"""
    ANALYSIS_TYPES = (
        ('coverage', 'Coverage Analysis'),
        ('hotspot', 'Hotspot Analysis'),
        ('temporal', 'Temporal Analysis'),
        ('change_detection', 'Change Detection'),
        ('density', 'Density Analysis'),
        ('proximity', 'Proximity Analysis'),
        ('clustering', 'Spatial Clustering'),
        ('prediction', 'Predictive Modeling'),
    )
    
    analysis_type = models.CharField(max_length=30, choices=ANALYSIS_TYPES)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='geospatial_analytics'
    )
    
    # Input parameters
    parameters = models.JSONField(default=dict)
    
    # Geographic bounds
    bounds = models.JSONField(default=dict, help_text="Geographic bounding box")
    
    # Results
    results = models.JSONField(default=dict)
    visualization_url = models.CharField(max_length=500, blank=True)
    
    # Statistics
    statistics = models.JSONField(default=dict)
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed')],
        default='pending'
    )
    error_message = models.TextField(blank=True)
    
    # Performance
    processing_time_seconds = models.FloatField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['analysis_type', '-created_at']),
            models.Index(fields=['status', '-created_at']),
        ]
        verbose_name = "Geospatial Analytics"
        verbose_name_plural = "Geospatial Analytics"
    
    def __str__(self):
        return f"{self.name} - {self.get_analysis_type_display()}"

class UserBehaviorPattern(models.Model):
    """ML-detected user behavior patterns"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='behavior_patterns'
    )
    
    pattern_type = models.CharField(max_length=50)
    pattern_name = models.CharField(max_length=255)
    description = models.TextField()
    
    # Pattern characteristics
    frequency = models.CharField(max_length=50, help_text="e.g., daily, weekly, occasional")
    confidence = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Pattern data
    pattern_data = models.JSONField(default=dict)
    
    # Recommendations based on pattern
    recommendations = models.JSONField(default=list)
    
    # Temporal
    first_detected = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    occurrences = models.IntegerField(default=1)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-last_seen']
        indexes = [
            models.Index(fields=['user', '-last_seen']),
            models.Index(fields=['pattern_type', '-last_seen']),
        ]
        verbose_name = "User Behavior Pattern"
        verbose_name_plural = "User Behavior Patterns"
    
    def __str__(self):
        return f"{self.pattern_name} - {self.user.email}"

class PredictiveModel(models.Model):
    """Predictive analytics models"""
    MODEL_TYPES = (
        ('demand_forecast', 'Demand Forecasting'),
        ('churn_prediction', 'Churn Prediction'),
        ('revenue_forecast', 'Revenue Forecasting'),
        ('usage_prediction', 'Usage Prediction'),
        ('anomaly_detection', 'Anomaly Detection'),
        ('recommendation', 'Recommendation Engine'),
    )
    
    model_type = models.CharField(max_length=30, choices=MODEL_TYPES)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Model configuration
    algorithm = models.CharField(max_length=100)
    parameters = models.JSONField(default=dict)
    
    # Training
    training_data_start = models.DateTimeField()
    training_data_end = models.DateTimeField()
    trained_at = models.DateTimeField(null=True, blank=True)
    
    # Performance metrics
    accuracy = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    precision = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    recall = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    f1_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Model file
    model_file_path = models.CharField(max_length=500, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    version = models.IntegerField(default=1)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Predictive Model"
        verbose_name_plural = "Predictive Models"
    
    def __str__(self):
        return f"{self.name} v{self.version}"

class Forecast(models.Model):
    """Generated forecasts and predictions"""
    model = models.ForeignKey(
        PredictiveModel,
        on_delete=models.CASCADE,
        related_name='forecasts'
    )
    
    forecast_type = models.CharField(max_length=50)
    target_metric = models.CharField(max_length=100)
    
    # Forecast data
    forecast_data = models.JSONField(default=list, help_text="Time series forecast data")
    
    # Time range
    forecast_start = models.DateTimeField()
    forecast_end = models.DateTimeField()
    
    # Confidence intervals
    confidence_level = models.DecimalField(max_digits=5, decimal_places=2, default=95.0)
    upper_bound = models.JSONField(default=list)
    lower_bound = models.JSONField(default=list)
    
    # Accuracy (if actuals are available)
    actual_data = models.JSONField(default=list, blank=True)
    mean_absolute_error = models.DecimalField(max_digits=10, decimal_places=4, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Forecast"
        verbose_name_plural = "Forecasts"
    
    def __str__(self):
        return f"{self.target_metric} forecast - {self.forecast_start.strftime('%Y-%m-%d')}"
