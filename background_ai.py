"""Local background-removal worker and launcher. No image leaves this computer."""
import base64
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import uuid

ROOT = Path(__file__).resolve().parent
PYTHON = ROOT / '.temhoa-ai' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
MODELS = {'fast': 'u2netp', 'quality': 'birefnet-general-lite'}
MAX_REQUEST = 16 * 1024 * 1024

def write_result(folder, value):
    temporary = folder / 'result.tmp'
    temporary.write_text(json.dumps(value, ensure_ascii=False), encoding='utf-8')
    temporary.replace(folder / 'result.json')

def process_image(request):
    mode = request.get('mode', 'fast')
    if mode not in MODELS:
        raise ValueError('Chế độ AI không hợp lệ.')
    raw = request.get('image', '')
    if not isinstance(raw, str) or not raw.startswith('data:image/png;base64,') or len(raw) > MAX_REQUEST:
        raise ValueError('Ảnh cần là PNG và nhỏ hơn 12 MB.')
    from PIL import Image, ImageOps, ImageChops
    from rembg import new_session, remove
    Image.MAX_IMAGE_PIXELS = 20_000_000
    image = Image.open(io.BytesIO(base64.b64decode(raw.split(',', 1)[1], validate=True)))
    if image.width * image.height > 20_000_000:
        raise ValueError('Ảnh quá lớn; hãy giảm xuống dưới 20 megapixel.')
    image = ImageOps.exif_transpose(image).convert('RGBA')
    image.thumbnail((2400, 2400), Image.Resampling.LANCZOS)
    # CPU works on Windows and Apple Silicon without GPU-specific dependencies.
    session = new_session(MODELS[mode], providers=['CPUExecutionProvider'])
    result = remove(image.convert('RGB'), session=session, alpha_matting=False).convert('RGBA')
    result.putalpha(ImageChops.multiply(result.getchannel('A'), image.getchannel('A')))
    output = io.BytesIO()
    result.save(output, format='PNG')
    return {'state': 'done', 'image': 'data:image/png;base64,' + base64.b64encode(output.getvalue()).decode('ascii'), 'width': result.width, 'height': result.height}

class AIJobs:
    def __init__(self):
        self.folder = Path(tempfile.mkdtemp(prefix='temhoa-ai-'))
        self.jobs = {}

    def status(self, job=None):
        if not job:
            return {'available': PYTHON.is_file() and (ROOT / '.temhoa-ai' / 'ready').is_file(), 'models': list(MODELS)}
        if job not in self.jobs:
            raise ValueError('Không tìm thấy tác vụ AI.')
        process, folder, started = self.jobs[job]
        result = folder / 'result.json'
        if result.is_file():
            return json.loads(result.read_text(encoding='utf-8'))
        if time.monotonic() - started > 600:
            process.kill()
            return {'state': 'error', 'error': 'AI quá thời gian xử lý. Hãy chọn chế độ Nhanh hoặc ảnh nhỏ hơn.'}
        if process.poll() is not None:
            return {'state': 'error', 'error': 'Bộ AI chưa chạy được. Chạy lại tệp Cài AI dành cho máy của bạn.'}
        return {'state': 'running'}

    def start(self, request):
        if not self.status()['available']:
            raise ValueError('Chưa cài AI. Chạy Cai-AI-Mac.command hoặc Cai-AI-Windows.bat trong thư mục phần mềm.')
        if any(process.poll() is None for process, _, _ in self.jobs.values()):
            raise ValueError('Một ảnh khác đang xử lý. Đợi hoàn tất rồi thử lại.')
        if request.get('mode') not in MODELS:
            raise ValueError('Chế độ AI không hợp lệ.')
        # Retain only the latest completed job; never accumulate private photos.
        import shutil
        for _, folder, _ in self.jobs.values():
            shutil.rmtree(folder, ignore_errors=True)
        self.jobs.clear()
        job = uuid.uuid4().hex
        folder = self.folder / job
        folder.mkdir()
        (folder / 'request.json').write_text(json.dumps(request), encoding='utf-8')
        process = subprocess.Popen([str(PYTHON), str(ROOT / 'background_ai.py'), '--job', str(folder)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        self.jobs[job] = (process, folder, time.monotonic())
        return {'job': job}

    def close(self):
        import shutil
        for process, _, _ in self.jobs.values():
            if process.poll() is None:
                process.kill()
            process.wait()
        shutil.rmtree(self.folder, ignore_errors=True)

def main():
    os.environ.setdefault('OMP_NUM_THREADS', str(min(4, os.cpu_count() or 2)))
    if len(sys.argv) == 3 and sys.argv[1] == '--prepare':
        from rembg import new_session
        new_session(MODELS[sys.argv[2]], providers=['CPUExecutionProvider'])
        return
    folder = Path(sys.argv[2])
    try:
        request_path = folder / 'request.json'
        if request_path.stat().st_size > MAX_REQUEST:
            raise ValueError('Ảnh gửi lên quá lớn.')
        result = process_image(json.loads(request_path.read_text(encoding='utf-8-sig')))
        write_result(folder, result)
    except Exception:
        write_result(folder, {'state': 'error', 'error': 'Không xử lý được ảnh. Nếu mới dùng mô hình này, hãy kiểm tra Internet để tải mô hình, hoặc chạy lại tệp Cài AI. Có thể thử chế độ Nhanh.'})
    finally:
        (folder / 'request.json').unlink(missing_ok=True)

if __name__ == '__main__':
    main()
