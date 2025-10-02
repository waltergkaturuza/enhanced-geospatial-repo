#!/usr/bin/env python3
"""
Simple test server for the geospatial system management API.
This bypasses Django to test the frontend functionality.
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.parse
import os
import sys
from pathlib import Path

# Add the project directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Import our satellite data manager
from imagery.satellite_data_manager import SatelliteDataManager
from imagery.system_management import parse_landsat_metadata

class APIHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.manager = SatelliteDataManager()
        super().__init__(*args, **kwargs)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests."""
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        self.send_response(200)
        self._set_cors_headers()
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        if path == '/api/system/status/':
            response = {
                'success': True,
                'status': {
                    'database': {
                        'status': 'online',
                        'tables': {
                            'imagery_scenes': 1247,
                            'administrative_boundaries': 74,
                            'processing_jobs': 523
                        }
                    },
                    'storage': {
                        'total_space': '5TB',
                        'used_space': '2.4TB',
                        'free_space': '2.6TB',
                        'usage_percentage': 48
                    },
                    'processing': {
                        'status': 'active',
                        'queue_length': 3,
                        'active_jobs': 1,
                        'completed_today': 23
                    }
                }
            }
        elif path == '/api/system/processing-queue/':
            response = {
                'success': True,
                'queue': [],
                'stats': {
                    'active_jobs': 0,
                    'queued_jobs': 0,
                    'completed_today': 23
                }
            }
        else:
            response = {'error': 'Not found', 'path': path}
        
        self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        """Handle POST requests."""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path
        
        self.send_response(200)
        self._set_cors_headers()
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        if path == '/api/system/parse-metadata/':
            try:
                data = json.loads(post_data.decode())
                metadata_text = data.get('metadata_text', '')
                
                if not metadata_text:
                    response = {'error': 'No metadata text provided'}
                else:
                    # Use our actual metadata parser
                    parsed_data = parse_landsat_metadata(metadata_text)
                    response = {
                        'success': True,
                        'parsed_metadata': parsed_data,
                        'total_fields': len(parsed_data['metadata']),
                        'groups': list(parsed_data['groups'].keys())
                    }
            except Exception as e:
                response = {'error': str(e)}
        
        elif path == '/api/system/upload-files/':
            # Simple file upload handler
            response = {
                'success': True,
                'message': 'File upload functionality - use drag and drop in frontend',
                'supported_formats': ['.tar', '.tar.gz', '.tgz', '.zip', '.tif', '.txt']
            }
        
        else:
            response = {'error': 'Not found', 'path': path}
        
        self.wfile.write(json.dumps(response).encode())
    
    def _set_cors_headers(self):
        """Set CORS headers to allow frontend access."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def log_message(self, format, *args):
        """Custom log format."""
        print(f"[{self.date_time_string()}] {format % args}")

def run_server(port=8000):
    """Run the test server."""
    server_address = ('', port)
    httpd = HTTPServer(server_address, APIHandler)
    print(f"🚀 Test API Server running on http://localhost:{port}")
    print("📍 Available endpoints:")
    print("   • GET  /api/system/status/")
    print("   • POST /api/system/parse-metadata/")
    print("   • POST /api/system/upload-files/")
    print("   • GET  /api/system/processing-queue/")
    print("\n🌐 Frontend should be accessible at: http://localhost:5180")
    print("👥 This server supports CORS for frontend integration")
    print("\n⏹️  Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n📴 Server stopped")

if __name__ == '__main__':
    run_server()
