#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Install Node.js dependencies and build frontend
cd frontend
npm ci
npm run build
cd ..

# Collect static files
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate