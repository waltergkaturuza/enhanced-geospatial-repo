"""
WSGI entry point for Render deployment.
This file provides the 'app' that gunicorn expects.
"""

import os
import sys
from pathlib import Path

# Add the project directory to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'geospatial_repo.settings')

# Import Django WSGI application
from geospatial_repo.wsgi import application

# This is what gunicorn will use
app = application