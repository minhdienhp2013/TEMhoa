"""Serve only Tem Hoa on the loopback interface; standard library only."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import subprocess
import threading
import webbrowser

HTML = Path(__file__).resolve().with_name('TemHoa-MinhDien.html')

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?', 1)[0] not in ('/', '/TemHoa-MinhDien.html'):
            self.send_error(404)
            return
        payload = HTML.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Permissions-Policy', 'local-fonts=(self)')
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *args):
        pass

def make_server():
    try:
        return ThreadingHTTPServer(('127.0.0.1', 8765), Handler)
    except OSError:
        return ThreadingHTTPServer(('127.0.0.1', 0), Handler)

def open_browser(url):
    for name in ('Google Chrome', 'Microsoft Edge'):
        if (Path('/Applications') / (name + '.app')).exists():
            subprocess.run(['open', '-a', name, url], check=False)
            return
    webbrowser.open(url)

if __name__ == '__main__':
    if not HTML.is_file():
        raise SystemExit('Khong tim thay TemHoa-MinhDien.html. Hay giai nen day du bo phan mem.')
    with make_server() as server:
        url = f'http://localhost:{server.server_address[1]}/'
        threading.Timer(.5, open_browser, args=(url,)).start()
        print('Tem Hoa:', url, '\nGiu cua so nay mo khi su dung. Dong cua so de dung phan mem.')
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
