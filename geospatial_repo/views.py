from django.shortcuts import render
from django.http import HttpResponse
from django.conf import settings
import os

def index(request):
    """Serve the React app"""
    # In production, serve the built React app
    if not settings.DEBUG:
        try:
            with open(os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html'), 'r') as f:
                return HttpResponse(f.read())
        except FileNotFoundError:
            return HttpResponse("Frontend not built. Please run 'npm run build' in the frontend directory.")
    else:
        # In development, show a simple message
        return HttpResponse("""
        <h1>Enhanced Geospatial Repository</h1>
        <p>API is running at <a href="/api/">/api/</a></p>
        <p>Admin is available at <a href="/admin/">/admin/</a></p>
        <p>For development, run the frontend separately with: <code>cd frontend && npm run dev</code></p>
        """)