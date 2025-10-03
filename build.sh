#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install --upgrade pip

# Try to install requirements, continuing on failures for optional packages
pip install -r requirements.txt || echo "Some optional packages failed to install, continuing..."

# Install Node.js dependencies and build frontend
cd frontend
npm ci --production
npm run build
cd ..

# Collect static files
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate