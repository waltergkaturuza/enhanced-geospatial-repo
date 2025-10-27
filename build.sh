#!/usr/bin/env bash
# Exit on error
set -o errexit

# Make start script executable
chmod +x start.sh

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Install Node.js dependencies and build frontend
echo "Building frontend..."
if [ -f "frontend/package.json" ]; then
    echo "Frontend package.json found, building frontend..."
    
    # Check if Node.js is available
    if command -v node >/dev/null 2>&1; then
        echo "Node.js version: $(node --version)"
        echo "NPM version: $(npm --version)"
        
        cd frontend
        echo "Installing frontend dependencies..."
        npm ci
        
        echo "Building frontend..."
        npm run build
        
        echo "Frontend build completed. Checking if dist directory exists..."
        if [ -d "dist" ]; then
            echo "✅ Frontend dist directory created successfully"
            ls -la dist/
        else
            echo "❌ Frontend dist directory not found!"
            exit 1
        fi
        
        cd ..
    else
        echo "❌ Node.js not found! Cannot build frontend."
        echo "Please ensure Node.js is available in the build environment."
        exit 1
    fi
else
    echo "❌ Frontend package.json not found, skipping frontend build"
    exit 1
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

echo "Build completed successfully!"