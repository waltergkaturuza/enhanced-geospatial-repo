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
    import logging
    logger = logging.getLogger(__name__)
    
    # Debug logging
    logger.info(f"Index view called for path: {request.path}")
    logger.info(f"DEBUG setting: {settings.DEBUG}")
    logger.info(f"BASE_DIR: {settings.BASE_DIR}")
    
    # In production, serve the built React app
    if not settings.DEBUG:
        try:
            index_file_path = os.path.join(settings.BASE_DIR, 'frontend', 'dist', 'index.html')
            logger.info(f"Looking for index.html at: {index_file_path}")
            logger.info(f"File exists: {os.path.exists(index_file_path)}")
            
            # Check if frontend directory exists
            frontend_dir = os.path.join(settings.BASE_DIR, 'frontend')
            logger.info(f"Frontend directory exists: {os.path.exists(frontend_dir)}")
            
            if os.path.exists(frontend_dir):
                dist_dir = os.path.join(frontend_dir, 'dist')
                logger.info(f"Dist directory exists: {os.path.exists(dist_dir)}")
                if os.path.exists(dist_dir):
                    dist_contents = os.listdir(dist_dir)
                    logger.info(f"Dist directory contents: {dist_contents}")
            
            with open(index_file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                # Set proper content type for HTML
                response = HttpResponse(content, content_type='text/html')
                # Add headers for React Router
                response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
                response['Pragma'] = 'no-cache'
                response['Expires'] = '0'
                logger.info(f"Successfully serving React app for path: {request.path}")
                return response
        except FileNotFoundError as e:
            logger.error(f"FileNotFoundError: {e}")
            return HttpResponse(f"""
            <!DOCTYPE html>
            <html>
            <head><title>Frontend Not Built</title></head>
            <body>
                <h1>Frontend Not Built</h1>
                <p>The React frontend has not been built yet.</p>
                <p><strong>Looking for:</strong> {index_file_path}</p>
                <p><strong>BASE_DIR:</strong> {settings.BASE_DIR}</p>
                <p>This usually means the build script didn't complete successfully during deployment.</p>
                <hr>
                <p>API is available at <a href="/api/">/api/</a></p>
                <p>Admin is available at <a href="/admin/">/admin/</a></p>
            </body>
            </html>
            """, content_type='text/html', status=500)
        except Exception as e:
            logger.error(f"Unexpected error: {e}", exc_info=True)
            return HttpResponse(f"""
            <!DOCTYPE html>
            <html>
            <head><title>Error Loading Frontend</title></head>
            <body>
                <h1>Error Loading Frontend</h1>
                <p><strong>Error:</strong> {str(e)}</p>
                <p><strong>Error Type:</strong> {type(e).__name__}</p>
                <hr>
                <p>API is available at <a href="/api/">/api/</a></p>
                <p>Admin is available at <a href="/admin/">/admin/</a></p>
            </body>
            </html>
            """, content_type='text/html', status=500)
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