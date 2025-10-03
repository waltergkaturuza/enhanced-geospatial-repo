#!/usr/bin/env bash
# Exit on error
set -o errexit

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
    cd frontend
    npm ci
    npm run build
    cd ..
else
    echo "Frontend package.json not found, skipping frontend build"
fi

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# Run database migrations
echo "Running database migrations..."
python manage.py migrate

echo "Build completed successfully!"