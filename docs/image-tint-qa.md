# Đổi màu ảnh trong Kiểu dáng — 2026-10-06

Chọn một ảnh → Kiểu dáng → Kiểu tô ảnh: Giữ màu gốc, Một màu, Chuyển sắc thẳng hoặc Chuyển sắc tỏa tròn. Chuyển sắc có hai màu; dạng thẳng có góc. Nút Giữ màu ảnh gốc chỉ bỏ tô màu, giữ crop, mask, hình học và các hiệu ứng khác.

Màu tô thay toàn bộ RGB của pixel nhìn thấy, giữ alpha nguồn (kể cả bán trong suốt). Áp dụng source-in trên frame đã crop/mask; không ghi đè src/sourceOriginal. Gradient bám theo khung ảnh và cùng xoay/lật. Mẫu cũ mặc định giữ màu gốc. Thuộc tính imageTint được chuẩn hóa, tự lưu, đưa vào cache key và sao chép/dán kiểu.

## Kiểm chứng thực tế

PASS `tests/image-tools-smoke.cjs` trong Chromium trên Linux, phục vụ bằng launcher Python:
- Ảnh có hai màu, vùng trong suốt và alpha 50%: tô một màu đúng RGB; so sánh toàn bộ alpha trước/sau bằng nhau.
- Gradient thẳng, thay góc và gradient tỏa tròn đổi pixel thực; đặt lại phục hồi ảnh trước khi tô.
- Nguồn ảnh giữ nguyên; undo/redo và sao chép/dán khôi phục kiểu tô.
- Crop áp dụng/hủy; xoay/lật; tự lưu, đóng browser, mở lại giữ imageTint và ảnh nguồn.
- Ảnh khóa từ chối thay đổi; xóa đúng ảnh và undo khôi phục.
- PNG xuất so sánh toàn bộ pixel với renderer chung; PDF đọc bằng pypdf, so ảnh JPEG nhúng với renderer và kích thước trang; PyMuPDF đọc/render được.
- Tách nền kiểm tra hợp đồng backend bằng fixture thành công/lỗi, không phải chạy mô hình AI thật.
- Thanh đổi theo vùng chọn, cửa sổ 390 px: bảng Kiểu dáng nằm trong màn hình, cuộn tới nút cuối; Escape đóng, reduced-motion, không lỗi console/tài nguyên.

PASS `node tests/studio-core.cjs`; PASS `node --check image-tools.js`; PASS `git diff --check`.

Ảnh chụp thật: image-tint-screenshots/image-tint-solid.png, image-tint-gradient.png, image-tint-small.png.

Giới hạn: PDF ảnh raster, không vector. Chưa build hoặc kiểm thử ứng dụng native Mac/Windows trong lượt này. Tô màu cũng tô vùng trắng đục của ảnh; muốn giữ trắng thành trong suốt cần tách nền trước. Đổi màu không tự tách nền.
