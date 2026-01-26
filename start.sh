#!/bin/bash
# Startup script for Render deployment
echo "Starting Django application..."

# Run migrations on startup (ensures they're always applied)
echo "Running database migrations..."
python manage.py migrate --no-input

# Start the application
exec gunicorn geospatial_repo.wsgi:application --host 0.0.0.0 --port ${PORT:-8000} --workers 2