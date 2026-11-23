"""Preview with explicit module MIME types on Windows registry configurations."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=5173)
args = parser.parse_args()
SimpleHTTPRequestHandler.extensions_map.update({'.js': 'text/javascript', '.mjs': 'text/javascript'})
root = Path(__file__).resolve().parents[1]

class PreviewServer(ThreadingHTTPServer):
    # A native ES-module graph opens many connections during a cold start.
    # The default five pending sockets can refuse imports on Windows.
    request_queue_size = 128

PreviewServer(('127.0.0.1', args.port), partial(SimpleHTTPRequestHandler, directory=str(root))).serve_forever()
