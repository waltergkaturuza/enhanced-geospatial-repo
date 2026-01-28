# Generated migration for store models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('imagery', '0005_subscriptionplan_subscriptionquota_usersubscription_invoice_supportrequest_supportmessage'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Product Category
        migrations.CreateModel(
            name='ProductCategory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100)),
                ('slug', models.SlugField(unique=True)),
                ('description', models.TextField(blank=True)),
                ('icon', models.CharField(blank=True, help_text='Icon name from lucide-react', max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                ('display_order', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('parent', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='children', to='imagery.productcategory')),
            ],
            options={
                'verbose_name_plural': 'Product Categories',
                'ordering': ['display_order', 'name'],
            },
        ),
        
        # Product
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('slug', models.SlugField(unique=True)),
                ('description', models.TextField()),
                ('short_description', models.CharField(blank=True, max_length=255)),
                ('product_type', models.CharField(choices=[('imagery', 'Satellite Imagery'), ('analysis', 'Analysis Service'), ('subscription', 'Subscription Plan'), ('processing', 'Processing Service'), ('data', 'Geospatial Data'), ('report', 'Custom Report')], max_length=20)),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('compare_at_price', models.DecimalField(blank=True, decimal_places=2, help_text='Original price for showing discounts', max_digits=10, null=True)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('provider', models.CharField(blank=True, max_length=100)),
                ('thumbnail', models.CharField(blank=True, help_text='Image URL or path', max_length=500)),
                ('images', models.JSONField(blank=True, default=list, help_text='Additional product images')),
                ('specifications', models.JSONField(blank=True, default=dict, help_text='Product specs like size, format, area, date range, etc.')),
                ('is_digital', models.BooleanField(default=True)),
                ('stock_quantity', models.IntegerField(default=0, help_text='For physical products')),
                ('track_inventory', models.BooleanField(default=False)),
                ('meta_title', models.CharField(blank=True, max_length=255)),
                ('meta_description', models.TextField(blank=True)),
                ('keywords', models.JSONField(blank=True, default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('is_featured', models.BooleanField(default=False)),
                ('views_count', models.IntegerField(default=0)),
                ('purchases_count', models.IntegerField(default=0)),
                ('rating_average', models.DecimalField(decimal_places=2, default=0.00, max_digits=3)),
                ('rating_count', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='products', to='imagery.productcategory')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # Cart
        migrations.CreateModel(
            name='Cart',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_key', models.CharField(blank=True, help_text='For guest users', max_length=100)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='carts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        
        # CartItem
        migrations.CreateModel(
            name='CartItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.IntegerField(default=1, validators=[django.core.validators.MinValueValidator(1)])),
                ('price_at_addition', models.DecimalField(decimal_places=2, help_text='Price when added to cart', max_digits=10)),
                ('custom_options', models.JSONField(blank=True, default=dict, help_text='Custom options like area, date range, etc.')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('cart', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='imagery.cart')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='imagery.product')),
            ],
        ),
        
        # Order
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_number', models.CharField(max_length=50, unique=True)),
                ('status', models.CharField(choices=[('pending', 'Pending Payment'), ('paid', 'Paid'), ('processing', 'Processing'), ('ready', 'Ready for Download'), ('completed', 'Completed'), ('cancelled', 'Cancelled'), ('refunded', 'Refunded')], default='pending', max_length=20)),
                ('subtotal', models.DecimalField(decimal_places=2, max_digits=10)),
                ('tax_rate', models.DecimalField(decimal_places=2, default=0.00, max_digits=5)),
                ('tax_amount', models.DecimalField(decimal_places=2, default=0.00, max_digits=10)),
                ('processing_fee', models.DecimalField(decimal_places=2, default=0.00, max_digits=10)),
                ('total', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('billing_address', models.JSONField(blank=True, default=dict)),
                ('customer_notes', models.TextField(blank=True)),
                ('admin_notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # OrderItem
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_name', models.CharField(help_text='Store product name at time of purchase', max_length=255)),
                ('product_description', models.TextField(blank=True)),
                ('quantity', models.IntegerField(default=1)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('options', models.JSONField(blank=True, default=dict)),
                ('download_url', models.CharField(blank=True, max_length=500)),
                ('download_expires_at', models.DateTimeField(blank=True, null=True)),
                ('download_count', models.IntegerField(default=0)),
                ('max_downloads', models.IntegerField(default=5)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='imagery.order')),
                ('product', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='imagery.product')),
            ],
        ),
        
        # Payment
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('payment_method', models.CharField(choices=[('card', 'Credit/Debit Card'), ('paypal', 'PayPal'), ('bank_transfer', 'Bank Transfer'), ('mobile_money', 'Mobile Money'), ('crypto', 'Cryptocurrency')], max_length=20)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('failed', 'Failed'), ('refunded', 'Refunded'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('currency', models.CharField(default='USD', max_length=3)),
                ('transaction_id', models.CharField(blank=True, max_length=255)),
                ('gateway', models.CharField(blank=True, help_text='Payment gateway used', max_length=50)),
                ('gateway_response', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to='imagery.order')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # ProductReview
        migrations.CreateModel(
            name='ProductReview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.IntegerField(validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(5)])),
                ('title', models.CharField(blank=True, max_length=255)),
                ('review', models.TextField()),
                ('helpful_count', models.IntegerField(default=0)),
                ('not_helpful_count', models.IntegerField(default=0)),
                ('is_verified_purchase', models.BooleanField(default=False)),
                ('is_approved', models.BooleanField(default=True)),
                ('is_featured', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('order', models.ForeignKey(blank=True, help_text='Order this review is for', null=True, on_delete=django.db.models.deletion.SET_NULL, to='imagery.order')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='reviews', to='imagery.product')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # Wishlist
        migrations.CreateModel(
            name='Wishlist',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='imagery.product')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='wishlists', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        
        # Add indexes
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['product_type', 'is_active'], name='imagery_pro_product_idx1'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['category', 'is_active'], name='imagery_pro_categor_idx2'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['-created_at'], name='imagery_pro_created_idx3'),
        ),
        migrations.AddIndex(
            model_name='product',
            index=models.Index(fields=['-rating_average'], name='imagery_pro_rating__idx4'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['user', '-created_at'], name='imagery_ord_user_id_idx1'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['status', '-created_at'], name='imagery_ord_status_idx2'),
        ),
        migrations.AddIndex(
            model_name='order',
            index=models.Index(fields=['order_number'], name='imagery_ord_order_n_idx3'),
        ),
        migrations.AddIndex(
            model_name='productreview',
            index=models.Index(fields=['product', '-created_at'], name='imagery_pro_product_idx5'),
        ),
        migrations.AddIndex(
            model_name='productreview',
            index=models.Index(fields=['product', '-rating'], name='imagery_pro_product_idx6'),
        ),
        
        # Add unique constraints
        migrations.AddConstraint(
            model_name='cartitem',
            constraint=models.UniqueConstraint(fields=['cart', 'product'], name='unique_cart_product'),
        ),
        migrations.AddConstraint(
            model_name='productreview',
            constraint=models.UniqueConstraint(fields=['product', 'user', 'order'], name='unique_product_user_order_review'),
        ),
        migrations.AddConstraint(
            model_name='wishlist',
            constraint=models.UniqueConstraint(fields=['user', 'product'], name='unique_user_product_wishlist'),
        ),
    ]
