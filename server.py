#!/usr/bin/env python3
"""
Simple HTTP server to serve the chatbot admin interface.
Run this script and visit http://localhost:8081
"""

import http.server
import socketserver
import os
from pathlib import Path

PORT = 8081
DIRECTORY = Path(__file__).parent

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)

    def end_headers(self):
        # Add CORS headers for API calls
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

def run_server():
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print("🚀 Chatbot Admin server running!")
        print(f"📁 Serving files from: {DIRECTORY}")
        print(f"🌐 Open your browser to: http://localhost:{PORT}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")
            httpd.shutdown()

if __name__ == "__main__":
    run_server()
