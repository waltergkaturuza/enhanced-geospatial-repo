from django.apps import AppConfig


class ImageryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'imagery'

    def ready(self):
        # Ensure analytics models are registered with Django's app registry
        from . import analytics_models  # noqa: F401
