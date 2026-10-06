/* Pure helpers shared by the editor and Node tests. No network dependencies. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TemStudioCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  function packing({paperWidth, paperHeight, width, height, margin = 5, gap = 3, copies = 1}) {
    const values = [paperWidth, paperHeight, width, height, margin, gap, copies];
    if (!values.every(Number.isFinite) || width <= 0 || height <= 0 || margin < 0 || gap < 0 || !Number.isInteger(copies) || copies < 1 || copies > 500) throw Error('Kích thước không hợp lệ; số lượng từ 1 đến 500.');
    const cols = Math.floor((paperWidth - 2 * margin + gap + 1e-8) / (width + gap));
    const rows = Math.floor((paperHeight - 2 * margin + gap + 1e-8) / (height + gap));
    if (cols < 1 || rows < 1) throw Error('Tem không vừa vùng in. Hãy giảm chiều rộng tem, lề hoặc chọn giấy lớn hơn.');
    const perPage = cols * rows, pages = Math.ceil(copies / perPage);
    if (pages > 50) throw Error('Tối đa 50 trang mỗi lần xuất. Hãy chia thành các đợt nhỏ.');
    return {cols, rows, perPage, pages, slots: Array.from({length: copies}, (_, i) => ({page: Math.floor(i / perPage), x: margin + (i % cols) * (width + gap), y: margin + Math.floor((i % perPage) / cols) * (height + gap), width, height}))};
  }
  function dataBytes(url) {
    const base64 = url.slice(url.indexOf(',') + 1);
    if (typeof atob === 'function') return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    return Uint8Array.from(Buffer.from(base64, 'base64'));
  }
  // One JPEG image is reused on every PDF page and every packed copy.
  // PDF dimensions/placement are vector; artwork is a high-resolution raster.
  function pdf({jpeg, pixelWidth, pixelHeight, paperWidth, paperHeight, pages}) {
    if (!(jpeg instanceof Uint8Array) || !jpeg.length || !Number.isInteger(pixelWidth) || !Number.isInteger(pixelHeight) || pixelWidth <= 0 || pixelHeight <= 0 || !(paperWidth > 0 && paperHeight > 0) || !Array.isArray(pages) || pages.length < 1 || pages.length > 50) throw Error('Dữ liệu PDF không hợp lệ.');
    const enc = new TextEncoder(), parts = [], offsets = [0]; let length = 0;
    const add = data => {const bytes = typeof data === 'string' ? enc.encode(data) : data; parts.push(bytes); length += bytes.length;};
    const object = (id, body, bytes) => {offsets[id] = length; add(id + ' 0 obj\n'); add(body); if (bytes) {add('\nstream\n'); add(bytes); add('\nendstream');} add('\nendobj\n');};
    const pt = n => (n * 72 / 25.4).toFixed(4), height = paperHeight;
    add('%PDF-1.4\n%TEMhoa\n');
    object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    object(2, '<< /Type /Pages /Count ' + pages.length + ' /Kids [' + pages.map((_, i) => (4 + i * 2) + ' 0 R').join(' ') + '] >>');
    object(3, '<< /Type /XObject /Subtype /Image /Width ' + pixelWidth + ' /Height ' + pixelHeight + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>', jpeg);
    pages.forEach((placements, i) => {
      const commands = placements.map(p => {
        if (![p.x, p.y, p.width, p.height].every(Number.isFinite) || p.width <= 0 || p.height <= 0) throw Error('Vị trí PDF không hợp lệ.');
        let s = 'q ' + pt(p.width) + ' 0 0 ' + pt(p.height) + ' ' + pt(p.x) + ' ' + pt(height - p.y - p.height) + ' cm /Im0 Do Q\n';
        if (p.marks) for (const x of [p.x, p.x + p.width]) for (const y of [p.y, p.y + p.height]) {
          const dx = x === p.x ? -1 : 1, dy = y === p.y ? -1 : 1;
          s += '0 G 0.25 w ' + pt(x + dx * .5) + ' ' + pt(height - y) + ' m ' + pt(x + dx * 2) + ' ' + pt(height - y) + ' l S\n';
          s += pt(x) + ' ' + pt(height - y - dy * .5) + ' m ' + pt(x) + ' ' + pt(height - y - dy * 2) + ' l S\n';
        }
        return s;
      }).join('');
      object(4 + i * 2, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pt(paperWidth) + ' ' + pt(paperHeight) + '] /Resources << /XObject << /Im0 3 0 R >> >> /Contents ' + (5 + i * 2) + ' 0 R >>');
      const bytes = enc.encode(commands); object(5 + i * 2, '<< /Length ' + bytes.length + ' >>', bytes);
    });
    const xref = length, count = 4 + pages.length * 2;
    add('xref\n0 ' + count + '\n0000000000 65535 f \n');
    for (let i = 1; i < count; i++) add(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
    add('trailer\n<< /Size ' + count + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    const out = new Uint8Array(length); let cursor = 0; for (const part of parts) {out.set(part, cursor); cursor += part.length;} return out;
  }
  return {normalize, escape, packing, pdf, dataBytes};
});
