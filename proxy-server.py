#!/usr/bin/env python3
import http.server
import subprocess
import threading
import time
import urllib.request
import os

NODE_PORT = 3000
PROXY_PORT = 3000

node_process = None
node_lock = threading.Lock()

def ensure_node_running():
    global node_process
    with node_lock:
        if node_process is None or node_process.poll() is not None:
            print("Starting Node server...")
            env = os.environ.copy()
            env['PORT'] = str(NODE_PORT)
            env['HOSTNAME'] = '0.0.0.0'
            node_process = subprocess.Popen(
                ['node', '/home/z/my-project/.next/standalone/server.js'],
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            # Wait for server to be ready
            for _ in range(30):
                try:
                    urllib.request.urlopen(f'http://localhost:{NODE_PORT}/', timeout=1)
                    print("Node server is ready!")
                    break
                except:
                    time.sleep(0.5)

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.handle_request('GET')
    
    def do_POST(self):
        self.handle_request('POST')
    
    def handle_request(self, method):
        ensure_node_running()
        try:
            url = f'http://localhost:{NODE_PORT}{self.path}'
            req = urllib.request.Request(url, method=method)
            if method == 'POST' and self.headers.get('Content-Length'):
                data = self.rfile.read(int(self.headers['Content-Length']))
                req.data = data
            resp = urllib.request.urlopen(req, timeout=30)
            self.send_response(resp.status)
            for key, val in resp.getheaders():
                if key.lower() not in ('transfer-encoding', 'connection'):
                    self.send_header(key, val)
            self.end_headers()
            self.wfile.write(resp.read())
        except Exception as e:
            self.send_error(502, f'Bad Gateway: {e}')
    
    def log_message(self, format, *args):
        pass  # Suppress logging

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PROXY_PORT), ProxyHandler)
    print(f'Proxy server running on port {PROXY_PORT}')
    server.serve_forever()
