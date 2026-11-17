import base64
import http.client
import json
import os
import re
import subprocess
import sys
import tempfile
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import mo_temhoa


PAPERS = {
    'A5': ('iso_a5_148x210mm', 210, 148),
    'A4': ('iso_a4_210x297mm', 297, 210),
    'A3': ('iso_a3_297x420mm', 420, 297),
}


def page_pdf(paper):
    _, width_mm, height_mm = PAPERS[paper]
    width_pt = width_mm * 72 / 25.4
    height_pt = height_mm * 72 / 25.4
    return f'%PDF-1.4\n1 0 obj << /MediaBox [0 0 {width_pt:.4f} {height_pt:.4f}] >>\n%%EOF'.encode()


class PrintApiSmoke(unittest.TestCase):
    def setUp(self):
        self.old_enabled = mo_temhoa.CUPS_PRINT_ENABLED
        mo_temhoa.CUPS_PRINT_ENABLED = True
        self.calls = []
        self.temp_paths = []
        self.server = ThreadingHTTPServer(('127.0.0.1', 0), mo_temhoa.Handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.fake = patch.object(mo_temhoa, '_cups_run', self.cups_run)
        self.fake.start()
        self.port = self.server.server_address[1]
        status, html = self.request('GET', '/')
        self.assertEqual(status, 200)
        match = re.search(rb'window\.TEMHOA_TOKEN="([^"]+)"', html)
        self.assertIsNotNone(match)
        self.token = match.group(1).decode()

    def tearDown(self):
        self.fake.stop()
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)
        mo_temhoa.CUPS_PRINT_ENABLED = self.old_enabled

    def cups_run(self, command, timeout):
        self.calls.append((list(command), timeout))
        if command[:2] == ['lpstat', '-e']:
            return subprocess.CompletedProcess(command, 0, 'Other_Printer\nCanon_iX6770\n', '')
        if command[:2] == ['lpstat', '-d']:
            return subprocess.CompletedProcess(command, 0, 'system default destination: Other_Printer\n', '')
        if command[0] == 'lp':
            path = command[-1]
            with open(path, 'rb') as source:
                self.assertTrue(source.read().startswith(b'%PDF-1.4'))
            self.temp_paths.append(path)
            return subprocess.CompletedProcess(command, 0, 'request id is Canon_iX6770-42 (1 file(s))\n', '')
        raise AssertionError('Unexpected CUPS command: ' + repr(command))

    def request(self, method, path, body=None, token=None):
        headers = {}
        if token is not None:
            headers['X-TemHoa-Token'] = token
        if body is not None:
            body = json.dumps(body).encode()
            headers['Content-Type'] = 'application/json'
        connection = http.client.HTTPConnection('127.0.0.1', self.port, timeout=5)
        connection.request(method, path, body=body, headers=headers)
        response = connection.getresponse()
        result = response.status, response.read()
        connection.close()
        return result

    def test_lists_and_prefers_canon(self):
        status, body = self.request('GET', '/api/printers', token=self.token)
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body), {
            'names': ['Canon_iX6770', 'Other_Printer'],
            'default': 'Other_Printer',
            'preferred': 'Canon_iX6770',
        })

    def test_submits_exact_landscape_media_without_scaling(self):
        for paper, (media, width, height) in PAPERS.items():
            with self.subTest(paper=paper):
                payload = {
                    'printer': 'Canon_iX6770', 'paper': paper,
                    'copies': 2, 'color': False,
                    'pdf': base64.b64encode(page_pdf(paper)).decode(),
                }
                status, body = self.request('POST', '/api/print', payload, self.token)
                self.assertEqual(status, 200, body.decode())
                result = json.loads(body)
                self.assertEqual(result['paper'], paper)
                self.assertEqual(result['scale'], 'none')
                self.assertEqual(result['jobId'], 'Canon_iX6770-42')
                command, timeout = self.calls[-1]
                self.assertEqual(command[0:4], ['lp', '-d', 'Canon_iX6770', '-n'])
                self.assertEqual(command[4], '2')
                for option in ['media=' + media, 'orientation-requested=4', 'print-scaling=none',
                               'print-color-mode=monochrome', 'sides=one-sided', 'job-sheets=none']:
                    self.assertIn(option, command)
                self.assertEqual(timeout, 60)
                self.assertFalse(os.path.exists(self.temp_paths[-1]))

    def test_rejects_wrong_paper_and_missing_authorization(self):
        payload = {'printer': 'Canon_iX6770', 'paper': 'A4', 'copies': 1, 'color': True,
                   'pdf': base64.b64encode(page_pdf('A5')).decode()}
        before = sum(command[0] == 'lp' for command, _ in self.calls)
        status, _ = self.request('POST', '/api/print', payload, self.token)
        self.assertEqual(status, 400)
        status, _ = self.request('POST', '/api/print', payload)
        self.assertEqual(status, 403)
        after = sum(command[0] == 'lp' for command, _ in self.calls)
        self.assertEqual(before, after)

    def test_template_name_ending_in_period_is_valid(self):
        name = 'Word-38 CÁC EM · CÔNG TY G.TECH.'
        path = mo_temhoa.template_path(name)
        self.assertEqual(path.name, name + '.json')
        self.assertTrue(path.is_file())

    def test_post_saves_template_on_windows_path(self):
        template = {'version': 1, 'settings': {'text': 'Tem hoa'}}
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(mo_temhoa, 'TEMPLATES', Path(directory)):
                status, body = self.request('POST', '/api/templates',
                                           {'name': 'Windows template', 'template': template}, self.token)
                self.assertEqual(status, 200, body.decode())
                self.assertEqual(json.loads(body), {'name': 'Windows template'})
                saved = Path(directory) / 'Windows template.json'
                self.assertEqual(json.loads(saved.read_text(encoding='utf-8')), template)

    def test_serves_cloud_cut_static_allowlist(self):
        cloud_cut = mo_temhoa.ROOT / 'cloud-cut-core.js'
        status, body = self.request('GET', '/cloud-cut-core.js')
        if cloud_cut.is_file():
            self.assertEqual(status, 200)
            self.assertEqual(body, cloud_cut.read_bytes())
        else:
            self.assertEqual(status, 404)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ('cloud-cut-core.js', 'cloud-cut-tools.js', 'cloud-cut-tools.css'):
                (root / name).write_text(f'/* {name} */', encoding='utf-8')
            with patch.object(mo_temhoa, 'ROOT', root):
                for name in ('cloud-cut-core.js', 'cloud-cut-tools.js', 'cloud-cut-tools.css'):
                    status, body = self.request('GET', '/' + name)
                    self.assertEqual(status, 200)
                    self.assertEqual(body.decode('utf-8'), f'/* {name} */')

    def test_blocks_assets_directory_traversal(self):
        status, _ = self.request('GET', '/assets/../mo_temhoa.py')
        self.assertEqual(status, 404)
        favicon_status, _ = self.request('GET', '/favicon.ico')
        self.assertEqual(favicon_status, 200)

    def test_cutters_requires_token_and_reports_non_windows_status(self):
        status, _ = self.request('GET', '/api/cutters')
        self.assertEqual(status, 403)
        status, _ = self.request('GET', '/api/cutters', token='invalid-token')
        self.assertEqual(status, 403)
        status, body = self.request('GET', '/api/cutters', token=self.token)
        self.assertEqual(status, 200)
        self.assertEqual(json.loads(body), {
            'ports': [],
            'supported': False,
            'reason': 'Kết nối cổng COM trực tiếp hỗ trợ trên Windows; trên máy này hãy tải file .PLT hoặc .SVG.',
        })


if __name__ == '__main__':
    unittest.main(verbosity=2)
