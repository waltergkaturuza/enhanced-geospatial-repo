#!/bin/bash
# Startup script for Render deployment
echo "Starting Django application..."
exec gunicorn geospatial_repo.wsgi:application --host 0.0.0.0 --port ${PORT:-8000} --workers 2