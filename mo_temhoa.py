"""Run Tem Hoa and its fixed template folder on this computer."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import json
import os
import secrets
import subprocess
import tempfile
import threading
import webbrowser
from background_ai import AIJobs, MAX_REQUEST

ROOT = Path(__file__).resolve().parent
HTML = ROOT / 'TemHoa-MinhDien.html'
TEMPLATES = Path(os.environ.get('TEMHOA_TEMPLATE_ROOT', str(ROOT / 'Mau-Tem-Hoa')))
TOKEN = secrets.token_hex(24)
MAX_BYTES = 32 * 1024 * 1024
AI_JOBS = AIJobs()
AI_LOCK = threading.Lock()

def template_path(name):
    if not isinstance(name, str) or not name.strip() or len(name) > 80:
        raise ValueError('Tên mẫu cần từ 1 đến 80 ký tự.')
    name = name.strip()
    if any(ord(c) < 32 or c in '/\\:*?"<>|' for c in name) or name.endswith('.'):
        raise ValueError('Tên mẫu không được chứa ký tự đặc biệt của tên tệp.')
    if name.upper().split('.')[0] in {'CON','PRN','AUX','NUL',*(f'COM{i}' for i in range(1,10)),*(f'LPT{i}' for i in range(1,10))}:
        raise ValueError('Tên mẫu này không được Windows hỗ trợ.')
    path = TEMPLATES / (name + '.json')
    if path.is_symlink():
        raise ValueError('Tệp mẫu không hợp lệ.')
    return path

def validate_template(data):
    if not isinstance(data, dict) or data.get('version') != 1 or not isinstance(data.get('settings'), dict) or not isinstance(data['settings'].get('text'), str):
        raise ValueError('Tệp mẫu không hợp lệ.')

class Handler(BaseHTTPRequestHandler):
    def reply(self, status, value, mime='application/json; charset=utf-8'):
        payload = value if isinstance(value, bytes) else json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(payload)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Permissions-Policy', 'local-fonts=(self)')
        self.end_headers()
        self.wfile.write(payload)

    def api_allowed(self):
        return secrets.compare_digest(self.headers.get('X-TemHoa-Token',''), TOKEN)

    def do_GET(self):
        route = urlsplit(self.path)
        if route.path in ('/', '/TemHoa-MinhDien.html'):
            html = HTML.read_text(encoding='utf-8')
            html = html.replace('<script>', '<script>window.TEMHOA_TOKEN=' + json.dumps(TOKEN) + ';</script><script>', 1)
            self.reply(200, html.encode('utf-8'), 'text/html; charset=utf-8')
        elif route.path in ('/studio.css', '/studio-core.js', '/studio.js', '/studio-objects.js', '/image-tools.js', '/image-tools.css'):
            asset = ROOT / route.path[1:]
            self.reply(200, asset.read_bytes(), 'text/css; charset=utf-8' if asset.suffix == '.css' else 'text/javascript; charset=utf-8')
        elif route.path == '/api/background':
            if not self.api_allowed():
                self.reply(403, {'error': 'Không có quyền truy cập AI.'}); return
            try:
                with AI_LOCK:
                    result = AI_JOBS.status(parse_qs(route.query).get('job', [None])[0])
                self.reply(200, result)
            except ValueError as error:
                self.reply(400, {'error': str(error)})
        elif route.path == '/api/templates':
            if not self.api_allowed():
                self.reply(403, {'error':'Không có quyền truy cập mẫu.'}); return
            try:
                TEMPLATES.mkdir(exist_ok=True)
                name = parse_qs(route.query).get('name', [None])[0]
                if name is None:
                    self.reply(200, {'names': sorted(p.stem for p in TEMPLATES.glob('*.json') if p.is_file() and not p.is_symlink())})
                else:
                    path = template_path(name)
                    if path.stat().st_size > MAX_BYTES:
                        raise ValueError('Tệp mẫu quá lớn.')
                    data = json.loads(path.read_text(encoding='utf-8-sig')); validate_template(data)
                    self.reply(200, data)
            except FileNotFoundError:
                self.reply(404, {'error':'Không tìm thấy mẫu.'})
            except (ValueError, OSError) as error:
                self.reply(400, {'error':str(error)})
        else:
            self.reply(404, {'error':'Không tìm thấy.'})

    def do_DELETE(self):
        route = urlsplit(self.path)
        if route.path != '/api/templates' or not self.api_allowed():
            self.reply(403, {'error': 'Không có quyền xóa mẫu.'}); return
        try:
            path = template_path(parse_qs(route.query).get('name', [''])[0])
            path.unlink()
            self.reply(200, {'name': path.stem})
        except (ValueError, OSError, TypeError) as error:
            self.reply(400, {'error': str(error)})

    def do_POST(self):
        if urlsplit(self.path).path == '/api/background':
            if not self.api_allowed():
                self.reply(403, {'error': 'Không có quyền truy cập AI.'}); return
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 < size <= MAX_REQUEST:
                    raise ValueError('Ảnh quá lớn hoặc rỗng.')
                request = json.loads(self.rfile.read(size))
                if not isinstance(request, dict):
                    raise ValueError('Yêu cầu không hợp lệ.')
                with AI_LOCK:
                    result = AI_JOBS.start(request)
                self.reply(200, result)
            except (ValueError, OSError, TypeError) as error:
                self.reply(400, {'error': str(error)})
            return
        if urlsplit(self.path).path != '/api/templates' or not self.api_allowed():
            self.reply(403, {'error':'Không có quyền lưu mẫu.'}); return
        try:
            size = int(self.headers.get('Content-Length','0'))
            if not 0 < size <= MAX_BYTES:
                raise ValueError('Tệp mẫu quá lớn hoặc rỗng.')
            request = json.loads(self.rfile.read(size)); path = template_path(request.get('name')); data = request.get('template'); validate_template(data)
            payload = json.dumps(data, ensure_ascii=False, indent=2)
            if len(payload.encode('utf-8')) > MAX_BYTES:
                raise ValueError('Tệp mẫu quá lớn.')
            TEMPLATES.mkdir(exist_ok=True)
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=TEMPLATES, delete=False, suffix='.tmp') as file:
                temporary = file.name; file.write(payload)
            try:
                os.replace(temporary, path)
            finally:
                if os.path.exists(temporary): os.unlink(temporary)
            self.reply(200, {'name':path.stem})
        except (ValueError, OSError, TypeError) as error:
            self.reply(400, {'error':str(error)})

    def log_message(self, *args):
        pass

def make_server():
    try: return ThreadingHTTPServer(('127.0.0.1', 8765), Handler)
    except OSError: return ThreadingHTTPServer(('127.0.0.1', 0), Handler)

def open_browser(url):
    for name in ('Google Chrome', 'Microsoft Edge'):
        if (Path('/Applications') / (name + '.app')).exists():
            subprocess.run(['open', '-a', name, url], check=False); return
    webbrowser.open(url)

if __name__ == '__main__':
    if not HTML.is_file(): raise SystemExit('Khong tim thay TemHoa-MinhDien.html. Hay giai nen day du bo phan mem.')
    with make_server() as server:
        url = f'http://localhost:{server.server_address[1]}/'
        threading.Timer(.5, open_browser, args=(url,)).start()
        print('Tem Hoa:', url, '\nMau luu trong:', TEMPLATES, '\nGiu cua so nay mo khi su dung.')
        try: server.serve_forever()
        except KeyboardInterrupt: pass
        finally: AI_JOBS.close()
