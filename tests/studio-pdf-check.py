"""Parse and render the actual browser downloads, including later pages."""
import json, os
from pathlib import Path
from pypdf import PdfReader
import fitz
root=Path(os.environ.get('TEMHOA_PDF_FIXTURES',Path('/tmp/temhoa-studio-fixtures').read_text().strip()))
for filename in root.glob('*.pdf'):
 plan=json.loads(Path(str(filename)+'.json').read_text())
 reader=PdfReader(filename)
 assert len(reader.pages)==plan['pages'],filename
 for i,page in enumerate(reader.pages):
  assert abs(float(page.mediabox.width)-plan['width']*72/25.4)<.01
  assert abs(float(page.mediabox.height)-plan['height']*72/25.4)<.01
  stream=page.get_contents().get_data()
  assert stream.count(b'/Im0 Do')==sum(slot['page']==i for slot in plan['slots'])
  image=page['/Resources']['/XObject']['/Im0'].get_object()
  assert image['/Filter']=='/DCTDecode' and image['/Width']>0
 doc=fitz.open(filename)
 for page in doc:
  pix=page.get_pixmap(matrix=fitz.Matrix(.5,.5))
  assert min(pix.samples)<200,'Empty PDF page'
 print('PASS',filename.name,len(reader.pages),'pages, physical size and all copies rendered')
assert len(list(root.glob('*.pdf')))==12
