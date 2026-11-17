"""Run Tem Hoa and its fixed template folder on this computer."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, parse_qs
import base64
import json
import os
import re
import shutil
import secrets
import subprocess
import sys
import tempfile
import threading
import webbrowser
from background_ai import AIJobs, MAX_REQUEST

ROOT = Path(__file__).resolve().parent
HTML = ROOT / 'TemHoa-MinhDien.html'
TEMPLATES = Path(os.environ.get('TEMHOA_TEMPLATE_ROOT', str(ROOT / 'Mau-Tem-Hoa')))
TOKEN = secrets.token_hex(24)
MAX_BYTES = 32 * 1024 * 1024
MAX_PRINT_PDF_BYTES = 64 * 1024 * 1024
MAX_PRINT_REQUEST_BYTES = 92 * 1024 * 1024
CUPS_PAPERS = {
    'A5': ('iso_a5_148x210mm', 210, 148),
    'A4': ('iso_a4_210x297mm', 297, 210),
    'A3': ('iso_a3_297x420mm', 420, 297),
}
CUPS_PRINT_ENABLED = False
AI_JOBS = AIJobs()
AI_LOCK = threading.Lock()

def _cups_run(command, timeout):
    return subprocess.run(command, capture_output=True, text=True, timeout=timeout)

def cups_printers():
    if not CUPS_PRINT_ENABLED:
        raise RuntimeError('In trực tiếp chưa khả dụng trên máy này.')
    result = _cups_run(['lpstat', '-e'], timeout=8)
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or 'Không đọc được hàng đợi máy in.')
    names = sorted({line.strip() for line in result.stdout.splitlines() if line.strip()})
    default_result = _cups_run(['lpstat', '-d'], timeout=8)
    default = default_result.stdout.rsplit(':', 1)[-1].strip() if default_result.returncode == 0 and ':' in default_result.stdout else ''
    default = default if default in names else ''
    canonical = lambda value: re.sub(r'[^a-z0-9]', '', value.casefold())
    preferred = next((name for name in names if canonical(name) == 'canonix6770'), default or (names[0] if names else ''))
    return {'names': names, 'default': default, 'preferred': preferred}

def validate_print_pdf(pdf, paper):
    if not isinstance(pdf, bytes) or not 8 <= len(pdf) <= MAX_PRINT_PDF_BYTES or not pdf.startswith(b'%PDF-'):
        raise ValueError('Tệp PDF in không hợp lệ hoặc quá lớn.')
    media, width_mm, height_mm = CUPS_PAPERS[paper]
    match = re.search(rb'/MediaBox\s*\[\s*0\s+0\s+([0-9.]+)\s+([0-9.]+)\s*\]', pdf)
    if not match:
        raise ValueError('PDF không khai báo đúng khổ trang.')
    width_pt, height_pt = (float(value) for value in match.groups())
    if abs(width_pt - width_mm * 72 / 25.4) > .1 or abs(height_pt - height_mm * 72 / 25.4) > .1:
        raise ValueError('Khổ PDF không khớp khổ giấy đã chọn.')
    return media

def template_path(name):
    if not isinstance(name, str) or not name.strip() or len(name) > 80:
        raise ValueError('Tên mẫu cần từ 1 đến 80 ký tự.')
    name = name.strip()
    if any(ord(c) < 32 or c in '/\\:*?"<>|' for c in name):
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
    protocol_version = 'HTTP/1.1'

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
            flags = 'window.TEMHOA_NATIVE_PRINT=true;window.TEMHOA_CUPS_PRINT=true;' if CUPS_PRINT_ENABLED else ''
            html = html.replace('<script>', '<script>window.TEMHOA_TOKEN=' + json.dumps(TOKEN) + ';' + flags + '</script><script>', 1)
            self.reply(200, html.encode('utf-8'), 'text/html; charset=utf-8')
        elif route.path in (
            '/studio.css', '/studio-core.js', '/studio.js', '/studio-objects.js',
            '/image-tools.js', '/image-tools.css', '/clipboard-tools.js',
            '/shape-tools.js', '/color-tools.js',
            '/cloud-cut-core.js', '/cloud-cut-tools.js', '/cloud-cut-tools.css',
        ):
            asset = ROOT / route.path[1:]
            if not asset.is_file():
                self.reply(404, {'error': 'Không tìm thấy.'}); return
            self.reply(200, asset.read_bytes(), 'text/css; charset=utf-8' if asset.suffix == '.css' else 'text/javascript; charset=utf-8')
        elif route.path == '/favicon.ico' or route.path.startswith('/assets/'):
            rel = 'assets/temhoa.ico' if route.path == '/favicon.ico' else route.path.lstrip('/')
            try:
                asset = (ROOT / rel).resolve()
                if asset.is_file() and (ROOT / 'assets') in asset.parents:
                    mime = 'image/x-icon' if asset.suffix == '.ico' else ('image/png' if asset.suffix == '.png' else ('image/svg+xml' if asset.suffix == '.svg' else 'application/octet-stream'))
                    self.reply(200, asset.read_bytes(), mime)
                else:
                    self.reply(404, {'error': 'Không tìm thấy.'})
            except (ValueError, OSError):
                self.reply(404, {'error': 'Không tìm thấy.'})
        elif route.path == '/api/background':
            if not self.api_allowed():
                self.reply(403, {'error': 'Không có quyền truy cập AI.'}); return
            try:
                with AI_LOCK:
                    result = AI_JOBS.status(parse_qs(route.query).get('job', [None])[0])
                self.reply(200, result)
            except ValueError as error:
                self.reply(400, {'error': str(error)})
        elif route.path == '/api/printers':
            if not self.api_allowed():
                self.reply(403, {'error': 'Không có quyền truy cập máy in.'}); return
            try:
                self.reply(200, cups_printers())
            except (OSError, RuntimeError, subprocess.TimeoutExpired) as error:
                self.reply(503, {'error': str(error) or 'Không đọc được danh sách máy in.'})
        elif route.path == '/api/cutters':
            if not self.api_allowed():
                self.reply(403, {'error': 'Không có quyền truy cập máy cắt.'}); return
            self.reply(200, {
                'ports': [],
                'supported': False,
                'reason': 'Kết nối cổng COM trực tiếp hỗ trợ trên Windows; trên máy này hãy tải file .PLT hoặc .SVG.',
            })
        elif route.path == '/api/cut-status':
            if not self.api_allowed():
                self.reply(403, {'error': 'Không có quyền truy cập máy cắt.'}); return
            self.reply(200, {'running': False, 'idle': True})
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
        route = urlsplit(self.path).path
        if route == '/api/print':
            self.handle_cups_print(); return
        if route == '/api/cut-control':
            if not self.api_allowed():
                self.reply(403, {'error': 'Không có quyền truy cập máy cắt.'}); return
            self.reply(200, {'running': False, 'stopped': True}); return
        if route == '/api/background':
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
        if route != '/api/templates' or not self.api_allowed():
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

    def handle_cups_print(self):
        if not self.api_allowed():
            self.reply(403, {'error': 'Không có quyền in.'}); return
        if not CUPS_PRINT_ENABLED:
            self.reply(503, {'error': 'In trực tiếp chưa khả dụng trên máy này.'}); return
        temporary = None
        try:
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= MAX_PRINT_REQUEST_BYTES:
                raise ValueError('Tệp in quá lớn hoặc rỗng.')
            request = json.loads(self.rfile.read(size))
            if not isinstance(request, dict):
                raise ValueError('Yêu cầu in không hợp lệ.')
            paper = request.get('paper')
            if paper not in CUPS_PAPERS:
                raise ValueError('Chỉ hỗ trợ A5, A4 hoặc A3 ngang.')
            printer = request.get('printer')
            if not isinstance(printer, str) or printer not in cups_printers()['names']:
                raise ValueError('Hãy chọn máy in đã cài trên máy này.')
            copies = request.get('copies', 1)
            if isinstance(copies, bool) or not isinstance(copies, int) or not 1 <= copies <= 99:
                raise ValueError('Số bản in phải từ 1 đến 99.')
            if not isinstance(request.get('color'), bool):
                raise ValueError('Chế độ màu không hợp lệ.')
            pdf = base64.b64decode(request.get('pdf', ''), validate=True)
            media = validate_print_pdf(pdf, paper)
            with tempfile.NamedTemporaryFile(mode='wb', suffix='.pdf', delete=False) as file:
                temporary = file.name
                file.write(pdf)
            # lp options precede the file so CUPS applies them to this job.
            command = ['lp', '-d', printer, '-n', str(copies), '-o', 'media=' + media,
                       '-o', 'orientation-requested=4', '-o', 'print-scaling=none',
                       '-o', 'print-color-mode=' + ('color' if request['color'] else 'monochrome'),
                       '-o', 'sides=one-sided', '-o', 'job-sheets=none', '--', temporary]
            result = _cups_run(command, timeout=60)
            if result.returncode:
                raise RuntimeError(result.stderr.strip() or result.stdout.strip() or 'Hàng đợi máy in không nhận lệnh.')
            match = re.search(r'(?:request id is|id yêu cầu là)\s+([^\s(]+)', result.stdout, re.IGNORECASE)
            self.reply(200, {'printer': printer, 'paper': paper, 'jobId': match.group(1) if match else '', 'scale': 'none'})
        except (ValueError, TypeError, json.JSONDecodeError) as error:
            self.reply(400, {'error': str(error) or 'Yêu cầu in không hợp lệ.'})
        except (OSError, RuntimeError, subprocess.TimeoutExpired) as error:
            self.reply(503, {'error': str(error) or 'Không gửi được lệnh in.'})
        finally:
            if temporary and os.path.exists(temporary):
                os.unlink(temporary)

    def log_message(self, *args):
        pass

class TemHoaHTTPServer(ThreadingHTTPServer):
    request_queue_size = 64
    daemon_threads = True

ThreadingHTTPServer.request_queue_size = max(ThreadingHTTPServer.request_queue_size, 64)

def make_server():
    try: return TemHoaHTTPServer(('127.0.0.1', 8765), Handler)
    except OSError: return TemHoaHTTPServer(('127.0.0.1', 0), Handler)

def open_browser(url):
    for name in ('Google Chrome', 'Microsoft Edge'):
        if (Path('/Applications') / (name + '.app')).exists():
            subprocess.run(['open', '-a', name, url], check=False); return
    webbrowser.open(url)

if __name__ == '__main__':
    if not HTML.is_file(): raise SystemExit('Khong tim thay TemHoa-MinhDien.html. Hay giai nen day du bo phan mem.')
    CUPS_PRINT_ENABLED = sys.platform == 'darwin' and bool(shutil.which('lp') and shutil.which('lpstat'))
    with make_server() as server:
        url = f'http://localhost:{server.server_address[1]}/'
        threading.Timer(.5, open_browser, args=(url,)).start()
        print('Tem Hoa:', url, '\nMau luu trong:', TEMPLATES, '\nGiu cua so nay mo khi su dung.')
        try: server.serve_forever()
        except KeyboardInterrupt: pass
        finally: AI_JOBS.close()
