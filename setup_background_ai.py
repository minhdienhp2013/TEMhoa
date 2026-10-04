"""Install the optional local AI into its own virtual environment."""
from pathlib import Path
import os
import subprocess
import sys
import venv

def main():
    if not (3, 11) <= sys.version_info[:2] < (3, 14):
        raise SystemExit('Can Python 3.11, 3.12 hoac 3.13. Tai Python 3.12 tai https://www.python.org/downloads/')
    root = Path(__file__).resolve().parent
    environment = root / '.temhoa-ai'
    print('Dang cai AI vao thu muc rieng. Lan dau can Internet.', flush=True)
    venv.EnvBuilder(with_pip=True).create(environment)
    python = environment / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
    subprocess.run([str(python), '-m', 'pip', 'install', 'rembg[cpu]==2.0.67'], check=True)
    (environment / 'ready').write_text('rembg==2.0.67', encoding='utf-8')
    print('Dang tai mo hinh Nhanh...', flush=True)
    subprocess.run([str(python), str(root / 'background_ai.py'), '--prepare', 'fast'], check=True)
    print('Da cai xong. Quay lai Tem Hoa > Emoji / Anh > Xoa nen AI.', flush=True)

if __name__ == '__main__':
    main()
