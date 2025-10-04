from django.shortcuts import render
from django.http import HttpResponse, Http404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
import os

@never_cache
@csrf_exempt
def index(request):
    """Serve the React app for all routes (React Router handles client-side routing)"""
    # In production, serve the built React app
    if not settings.DEBUG:
        try:
            index_file_path = os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html')
            with open(index_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Set proper content type for HTML
                response = HttpResponse(content, content_type='text/html')
                # Add headers for React Router
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                return response
        except FileNotFoundError:
            return HttpResponse("""
            <h1>Frontend Not Built</h1>
            <p>The React frontend has not been built yet.</p>
            <p>API is available at <a href="/api/">/api/</a></p>
            <p>Admin is available at <a href="/admin/">/admin/</a></p>
            """, content_type='text/html')
    else:
        # In development, show a helpful message
        return HttpResponse("""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Enhanced Geospatial Repository</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
                .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .links { margin-top: 20px; }
                .links a { display: inline-block; margin-right: 15px; padding: 10px 15px; background: #007cba; color: white; text-decoration: none; border-radius: 4px; }
                .links a:hover { background: #005a87; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🌍 Enhanced Geospatial Repository</h1>
                <p>Django backend is running in development mode.</p>
                <p><strong>For the frontend:</strong> Run <code>cd frontend && npm run dev</code> in a separate terminal.</p>
                <div class="links">
                    <a href="/api/">API Endpoints</a>
                    <a href="/admin/">Django Admin</a>
                </div>
            </div>
        </body>
        </html>
        """, content_type='text/html')