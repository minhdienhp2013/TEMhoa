# TEMhoa — tài nguyên offline, mẫu nhanh và dàn tem

Nhánh: `feat/studio-production-20261006`, nền `c82c99c`. Giữ toàn bộ mã bàn giao và tiếp tục sửa; không merge hoặc phát hành.

## Chức năng

- Kho ảnh PNG/JPG/WebP trong IndexedDB, thumbnail nhẹ, SHA-256 nhận diện file ảnh trùng. Giữ nguyên byte ảnh gốc. Tìm tiếng Việt có/không dấu và từ khóa, yêu thích, đổi tên, xóa. Tài nguyên đã chèn nằm trong dữ liệu thiết kế nên không phụ thuộc kho khi xuất hoặc xóa tài nguyên.
- Bộ hoa/trang trí SVG offline và mẫu điền nhanh cho khai trương, sinh nhật, tân gia, cưới, tri ân, kính viếng, ngày lễ. Không dùng API ảnh trực tuyến, không phục hồi 60 mẫu AI cũ. Không tự chèn họa tiết vào mẫu.
- Backup JSON, nhập kiểm tra ảnh/schema trước khi ghi trong một transaction; bỏ qua ID trùng, giữ tài nguyên đang có. Giới hạn 12 MB/ảnh, 40 triệu pixel và 64 MB/tệp backup. Ảnh hỏng, quota và quyền IndexedDB có phản hồi.
- Preview mẫu điền nhanh và thumbnail dựng bằng renderer của editor. Mẫu mặc định bố trí các trường trong vùng riêng, xuống dòng và co vừa theo kích thước thật. Mẫu cá nhân giữ ảnh/rich text; thay chữ co vào vùng cũ. Tạo thiết kế mới không ghi đè bản mẫu; có tự lưu và undo/redo.
- Nhóm ở cấp khối trang: chữ, ảnh/trang trí vẫn là đối tượng riêng; Shift-chọn trên canvas và Lớp, di chuyển, scale đồng đều, xoay chung, nhân bản, khóa, xóa và bỏ nhóm. Bỏ nhóm giữ các transform và thứ tự lớp. Góc mới lưu trong `labelAngle`; tài liệu cũ mặc định 0. Khối cũ chứa chữ và nhiều ảnh được giữ nguyên như một khối, không tự tách để tránh phá bố cục.
- Crop giữ `sourceOriginal` riêng sau nhiều lần crop, lưu/mở lại và khôi phục. Đối tượng khóa không crop hoặc tách nền. JPG được chuyển thành PNG khi gửi tới bộ tách nền cục bộ, vẫn giữ JPG gốc để khôi phục.
- PDF A5/A4/A3 ngang/dọc: toàn trang hoặc dàn toàn bộ nội dung thiết kế thành một tem, có rộng tem, số lượng, lề, khoảng cách và dấu cắt. Chọn xem mọi trang, gồm trang cuối. Giữ khổ editor và scale đồng đều. Một ảnh JPEG tái sử dụng trên các trang, khổ giấy/vị trí/dấu cắt là lệnh PDF.

## Kiểm tra

`studio-smoke.cjs` dùng HTTP server Python thật, thư mục mẫu tạm và profile Chromium riêng. Đã kiểm tra:

- Upload ảnh trùng/hỏng, tên và từ khóa tiếng Việt, yêu thích, nhập/xuất không ghi đè, lỗi quota; đóng và mở lại toàn bộ browser còn dữ liệu.
- Crop hai lần, xóa nền theo màu, khôi phục sau mở lại, undo/redo và khóa ảnh. Pipeline JPG → PNG → áp dụng kết quả AI → khôi phục JPG. Kết quả AI trong kiểm thử là ảnh dựng có alpha; **chưa chạy suy luận rembg/model thật**.
- Chọn bằng Shift trên canvas và panel; menu chuột phải tạo bản sao đúng nhóm; kéo, resize, xoay, khóa, bỏ nhóm, undo/redo và mở nhóm đã lưu.
- Nội dung dài, các recipe, preview trùng renderer sau tạo, hoàn tác tạo mẫu, mẫu cá nhân có ảnh và định dạng; ảnh còn trong thiết kế khi xóa khỏi kho.
- PDF 12 trường hợp (6 toàn trang, 6 dàn tem), khổ editor không đổi. `studio-pdf-check.py` dùng pypdf đọc MediaBox/số trang/số placement và PyMuPDF dựng lại mọi trang, kể cả trang sau/trang cuối.
- Giao diện thật 1440×1000 và 390×760, ảnh chụp ở `docs/studio-screenshots/`, không lỗi JS hay tài nguyên module tải thất bại.

Cả 5 bài smoke cũ (design, autosave, delete-template, output-paper, art-ui) được chạy cùng bộ kiểm tra mới. Kiểm tra cú pháp Python/shell/JS và đường dẫn extraResources của bốn module Electron.

## Giới hạn

PDF là raster JPEG trên nền trắng, mục tiêu 300 DPI. Renderer giới hạn 40 triệu pixel/toàn trang và tối đa 600 DPI nội bộ; giao diện báo DPI raster thực tế nếu bị giới hạn. Không phải PDF vector, không chuyển CMYK hoặc bảo đảm màu máy in. Độ nét nguồn ảnh/font vẫn phụ thuộc dữ liệu người dùng.

Nhận diện trùng dựa trên byte tệp; ảnh được nén lại có byte khác không được coi là cùng tệp. Kho IndexedDB thuộc profile và origin đang dùng; đổi trình duyệt/cổng/hostname hoặc chuyển máy cần backup JSON. Không có sync cloud. Với bản mẫu cá nhân phức tạp, chương trình giữ cấu trúc sẵn có; không tự thiết kế lại quan hệ chồng lấn do người dùng tạo trước đó.

Chưa build/chạy ứng dụng native Mac/Windows hoặc thực thi launcher PowerShell trên Windows. Không in ra máy thật. Kiểm tra hiện tại là Chromium/Linux và Python server thật; chỉ kiểm tra cấu hình tài nguyên Electron, không khẳng định đã build installer.

Chạy trên Mac: `bash Mo-TemHoa-Mac.command`.

## Chạy kiểm thử

```bash
npm install --no-save playwright
npx playwright install --with-deps chromium
python3 -m pip install pypdf PyMuPDF
node tests/studio-core.cjs
node tests/studio-smoke.cjs
python3 tests/studio-pdf-check.py
```

Các bài smoke cũ dùng `node tests/<tên>-smoke.cjs`. CI lưu ảnh vào artifact `temhoa-ui-screenshots`.
