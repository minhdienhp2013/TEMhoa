# Màu trực tiếp và màu đã dùng — 2026-10-06

Phạm vi: màu chữ (tem mây và chữ tự do), nền/viền mây, tô/viền hình dạng, gradient và màu tô/viền/bóng của ảnh. Giữ Tem mây/Tem thường, ảnh nguồn, dữ liệu cũ, tách nền và tự lưu. Không tạo mẫu AI.

## Cách xử lý

color-tools.js cache mask thân mây/viền và các lớp không thay đổi. Trong cử chỉ chỉ tô lại mask hoặc lớp chữ/hình tương ứng ở requestAnimationFrame; không chạy lại giãn viền/lấp lỗ, font/layout, thước hoặc panel lớp. Bộ đệm bitmap được tái sử dụng. Thuộc tính vẫn cập nhật vào dữ liệu thiết kế. Khi change, thả chuột, kết thúc bàn phím, chọn swatch, nhập HEX, đóng panel, hoàn tác hoặc lưu: dựng lại bản đầy đủ, chốt lịch sử và tự lưu. Tạm hoãn tạo thumbnail/lưu nháp giữa cử chỉ; tác vụ lưu cũ đang chờ IndexedDB cũng phải chờ cử chỉ kết thúc trước khi sao chép dữ liệu hoặc serialize/gửi mạng. Gate dùng promise, không polling; có giải phóng khi lỗi/pagehide. Ảnh tiếp tục dùng live renderer riêng, mở rộng cho màu viền/bóng.

## Màu đã dùng

Tự nhớ màu đã áp dụng vào bảng màu chung, gồm màu đơn và gradient (hai màu/kiểu/góc), tối đa 24 mục; màu trùng được đưa lên đầu. Không ghi từng màu trung gian khi rê. Đặt Màu đã dùng ở đầu bảng màu chữ/mây, cạnh màu tô/viền hình và trong popover ảnh. Có dùng lại gradient, focus bàn phím, Escape/click ngoài và vùng bấm touch 44 px. Không tự tô lên thiết kế khi chỉ mở bảng.

Lưu bằng localStorage của trình duyệt/profile trên máy. Đóng/mở lại cùng profile và địa chỉ vẫn còn. Khởi chạy bình thường dùng cổng 8765; nếu cổng bận dẫn đến địa chỉ/cổng khác, hoặc dùng trình duyệt/profile khác/xóa dữ liệu web, bảng màu riêng của địa chỉ cũ không tự chuyển theo. Nếu bộ nhớ bị chặn/đầy, thao tác màu vẫn hoạt động với bộ nhớ trong phiên; không đảm bảo nhớ sau khi đóng. Không sửa màu giao diện hoặc màu file nguồn.

## Kiểm chứng

PASS all-colors-smoke trên Chromium Linux: 40 input liên tục cho mỗi màu chữ/nền/viền mây, không full preview trong cử chỉ, đúng một full preview khi chốt; toàn bộ pixel canvas live bằng renderer. P95 sau bước chuẩn bị 17–24 ms qua các lượt chạy. Chữ tự do gradient và tô/viền hình cũng so canvas live bằng renderer. Thử solid/linear/radial/clear, khóa, undo/redo, tự lưu/mở lại, palette bền qua đóng browser, dùng lại gradient, cửa sổ 390 px. Palette giới hạn 24 và không trùng; JSON hỏng và lỗi QuotaExceeded không làm hỏng ứng dụng.

PNG được mở bằng Pillow; PDF được đọc bằng pypdf/PyMuPDF (trang, ảnh nhúng, render màu). PASS lại shapes-smoke: 57 vector, tô/viền/gradient, undo/nhóm/khóa, PNG/SVG/PDF màu, autosave và hẹp. PASS image-tools-smoke: crop/nguồn/alpha, các hiệu ứng, khóa/backend contract/xóa/undo, PNG so toàn bộ pixel và PDF so ảnh JPEG nhúng, lưu/mở lại và mobile. PASS image-color-performance: 60 live input (P50 17 ms, P95 19 ms, cao nhất 22 ms sau bước chuẩn bị), kiểm tra chủ động gọi lưu nháp/gửi mẫu giữa cử chỉ đều chờ kết thúc rồi lưu được; không full preview mỗi lượt, bitmap so renderer, undo trong cử chỉ, lưu trong cử chỉ/mở lại và nhớ gradient ảnh. PASS art-ui-smoke: shell, dữ liệu không đổi, focus/Escape, 6 tem gần đây, reduced-motion và cửa sổ hẹp. PASS autosave-smoke: tự lưu im lặng, tên thiết kế ổn định, chuyển tem/chủ đề và phục hồi nháp.

Tài nguyên mới phục vụ qua Python: HTTP 200; đã thêm whitelist PowerShell và extraResources Electron, kiểm tra đường dẫn cấu hình. JS syntax, Python compile và git diff --check đạt. Chưa build/chạy native Mac hoặc Windows; số đo không phải cam kết mọi máy đều 60 FPS. PDF vẫn raster. Tách nền thử hợp đồng backend bằng fixture, không chạy mô hình AI thật. Không in ra máy thật.

Ảnh giao diện thật: color-memory-screenshots/mau-da-dung-tem-may.png và mau-da-dung-cua-so-nho.png.
