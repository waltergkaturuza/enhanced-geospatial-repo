from django.shortcuts import render
from django.http import HttpResponse, Http404
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import never_cache
from django.views.static import serve
import os

@never_cache
@csrf_exempt
def index(request):
    """Serve the React app for all routes (React Router handles client-side routing)"""
    # Debug logging
    print(f"Index view called for path: {request.path}")
    print(f"DEBUG setting: {settings.DEBUG}")
    print(f"DEBUG type: {type(settings.DEBUG)}")
    print(f"Environment DEBUG: {os.environ.get('DEBUG', 'Not set')}")
    
    # In production, serve the built React app
    if not settings.DEBUG:
        try:
            index_file_path = os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html')
            print(f"Looking for index.html at: {index_file_path}")
            print(f"File exists: {os.path.exists(index_file_path)}")
            
            with open(index_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Set proper content type for HTML
                response = HttpResponse(content, content_type='text/html')
                # Add headers for React Router
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                print(f"Serving React app for path: {request.path}")
                return response
        except FileNotFoundError as e:
            print(f"FileNotFoundError: {e}")
            return HttpResponse(f"""
            <h1>Frontend Not Built</h1>
            <p>The React frontend has not been built yet.</p>
            <p>Looking for: {index_file_path}</p>
            <p>API is available at <a href="/api/">/api/</a></p>
            <p>Admin is available at <a href="/admin/">/admin/</a></p>
            """, content_type='text/html')
        except Exception as e:
            print(f"Unexpected error: {e}")
            return HttpResponse(f"""
            <h1>Error Loading Frontend</h1>
            <p>Error: {str(e)}</p>
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

def serve_static_files(request, path):
    """Serve static files from frontend dist directory"""
    if not settings.DEBUG:
        # In production, serve from staticfiles
        return serve(request, path, document_root=settings.STATIC_ROOT)
    else:
        # In development, serve from frontend dist
        frontend_dist = os.path.join(settings.BASE_DIR, 'frontend', 'dist')
        return serve(request, path, document_root=frontend_dist)