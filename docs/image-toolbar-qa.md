# Thanh công cụ ảnh TEMhoa

Nhánh `feat/image-toolbar-20261006`, tiếp nối commit `ce2f36a` của đợt nâng cấp studio (PR #3). Không merge hoặc phát hành. Đã đọc mã hiện tại và kiểm tra workspace; không có AGENTS.md. Thay đổi trên nhánh studio được giữ nguyên.

## Giao diện và dữ liệu

Thanh thứ hai cao 48 px, icon SVG cùng hệ thống Minh Điến, chỉ hiện cho một ảnh. Chỉnh sửa, Thay thế, Xóa nền, Xóa ảnh, Viền, Bo góc/mask, Cắt, Lật, Độ mờ, Vị trí, Kiểu dáng. Ảnh raster không có màu tô. Cửa sổ nhỏ chuyển các thao tác ít dùng sang Thêm; vùng bấm ảnh 44 px trên touch. Nút có tooltip và aria-label. Popover chỉ mở một bảng, giới hạn trong viewport, đóng bằng Escape/click ngoài và trả focus. Motion dùng tokens và reduced-motion hiện có.

Không chọn/khối trang trống hiện công cụ khổ thiết kế, chọn chữ hiện thanh chữ, chọn nhiều hiện nhóm/bỏ nhóm, vị trí/căn chỉnh và khóa. Chọn ảnh khóa có Mở khóa; crop/chỉnh sửa/xóa/thay thế bị chặn cả ở handler. Biểu mẫu ảnh dài và các nút trùng không còn hiển thị; DOM tương thích các handler cũ được giữ trong vùng hidden/inert. Bộ chọn thành phần và nhập ảnh vẫn hoạt động. Xóa nền theo màu chuyển vào phần mở rộng trong Chỉnh sửa; có lấy màu trên canvas.

Các thuộc tính mới được chuẩn hóa bởi `safeGraphic`, mặc định an toàn khi mở thiết kế cũ. Tự lưu/undo/redo dùng dữ liệu đối tượng, không lưu trạng thái UI. Không tạo mẫu AI mới hoặc đổi dữ liệu người dùng.

## Xử lý thật

- Sáng, tương phản, bão hòa và blur bằng Canvas filter; nhiệt độ bằng thay kênh màu pixel. Giữ `src`/`sourceOriginal`, tính cache theo nội dung và thuộc tính, không sửa byte gốc. Cache có giới hạn pixel/số phần tử. Renderer dùng chung cho canvas, thumbnail, PNG, PDF; SVG chứa raster riêng cho ảnh đã xử lý.
- Thay thế kiểm tra/đọc ảnh thật bằng pipeline kho ảnh. Giữ vị trí, kích thước khung, góc, thứ tự lớp, độ mờ, mask và kiểu ảnh. Tính vùng cover theo tỷ lệ nguồn; không kéo méo ảnh mới. File hỏng không đổi ảnh cũ.
- Crop trên canvas với ảnh nguồn, vùng giữ lại, phần ngoài tối, bốn góc và kéo ảnh/vùng crop; khóa tỷ lệ, phím mũi tên, Áp dụng/Hủy/Escape. Dữ liệu `imageCrop` là tọa độ nguồn chuẩn hóa. Không ghi crop trước Áp dụng; mở lại vùng cắt đã lưu. Crop tự do cập nhật chiều cao theo tỷ lệ nguồn để không kéo méo. Crop mới không flatten nguồn; crop cũ vẫn đọc được. Khôi phục ảnh gốc trả toàn ảnh và tỷ lệ nguồn.
- Viền liền/đứt/chấm nằm trong khung; radius và mask elip được clip thật. Độ mờ, lật và bóng màu/alpha/blur/offset phản ánh trong renderer. Sao chép/dán các thuộc tính kiểu ảnh không đổi nguồn/hình học.
- Vị trí có X/Y cm theo trang, kích thước, góc, khóa tỷ lệ, căn trang, khóa và thứ tự lớp. Ảnh độc lập có thể đổi lớp cùng các khối trang; ảnh cùng khối chữ đổi lớp trên/dưới chữ. Nhóm dùng menu căn chỉnh vùng chọn hiện có.
- Xóa ảnh chỉ xóa ID ảnh, giữ khối chữ và các đối tượng khác; hoàn tác khôi phục.
- Xóa nền nối backend hiện có, chờ trạng thái job và kết quả ảnh hợp lệ, xem lại rồi Áp dụng. Lỗi không ghi đè ảnh. Đóng cửa sổ dừng polling/apply; backend hiện không có endpoint hủy job đang suy luận, nên không đưa nút hủy giả.

## Kiểm chứng

`tests/image-tools-smoke.cjs` dùng HTTP server Python thật và profile Chromium riêng; đóng browser rồi mở lại. Kiểm tra thanh ảnh/thanh chữ, hình học thay ảnh khác tỷ lệ, undo/redo, hiệu ứng/pixel alpha, copy/paste kiểu, crop dùng pointer và keyboard, hủy giữ dữ liệu, mở crop sau lưu/mở, khóa chống sửa/xóa, vị trí và đổi lớp, khôi phục nguồn, xóa đúng ảnh trong khối chữ, xóa nền thủ công, popover 390×760 và reduced-motion. Chụp UI thực tế 1600×1000 và 390×760 tại `docs/image-toolbar-screenshots/`.

PNG tải thực tế được Pillow so sánh từng pixel với raster renderer; canvas thật đối chiếu với render. PDF tải thực tế được pypdf đọc và đối chiếu byte JPEG nhúng với renderer trên nền trắng; PyMuPDF dựng trang và kiểm khổ A4. Không có tay nắm hoặc UI trong file xuất.

Backend AI được kiểm theo hợp đồng HTTP/job bằng phản hồi thành công/lỗi có kiểm soát; **chưa chạy model/rembg suy luận thật**. Dịch vụ Python thật được kiểm tải đủ JS/CSS. Các bài cũ design/autosave/delete-template/output-paper/art-ui và studio/core/PDF được chạy lại, gồm parser dựng 12 PDF toàn bộ các trang.

## Sửa lỗi preview và Aa ưu tiên

`tests/editor-interactions-smoke.cjs` đã chạy trong Chromium thật ở 1600×1000 và 390×760. Kéo ảnh từng bước, dừng 65 ms giữa bước để bắt lỗi debounce cũ: vị trí bám con trỏ dưới 1 px, không tăng `previewRevision` trong lúc kéo. Resize tăng đều; thả chuột giữ hình học dưới 1 px. Tay nắm resize cả khối tem cũng đã kiểm tra bằng pointer thật: không tự scrollIntoView khi thả, giữ vị trí/kích thước dưới 1 px. Kéo vượt mép trái rồi chờ 250 ms sau thả vẫn giữ vị trí dưới 1 px. Zoom 30/100/150% không dao động kích thước trang sau khi ổn định. Không có lỗi console/tải module.

Trong gesture, giữ đơn vị giấy/origin và dựng lớp tạm bằng requestAnimationFrame ở độ phân giải màn hình. Khi thả dùng renderer đầy đủ, tự lưu/undo hiện có. Lớp tạm không nằm trong dữ liệu hoặc file xuất; PNG/PDF vẫn dùng renderer độ phân giải xuất. Pasteboard mở đủ phạm vi cuộn để tránh scroll bị clamp khi vượt mép giấy. Không dùng timeout để điều khiển gesture; delay trong test chỉ để tái hiện lỗi cũ.

Menu Aa được chuyển ra body, đặt cố định sát nút và giới hạn trong viewport; không bị cắt bởi overflow thanh ribbon. Đã chọn CHỮ HOA/chữ thường với tiếng Việt; kiểm ArrowDown, End, Escape và focus trả về Aa. Ảnh kiểm chứng: `text-aa-menu.png`, `text-aa-small.png`, `image-drag-live.png`, `image-resize-live.png`.

Các bài design, art-ui và image-tools được chạy lại sau sửa lỗi này và đều PASS. Các bài autosave/delete-template/output-paper/studio/core/PDF đã PASS ở bước triển khai thanh ảnh trước đó.

## Giới hạn

Chuyển động chưa triển khai vì chưa có chế độ trình chiếu; không có nút giả và không thêm animation vào hình học/file in. PDF vẫn raster JPEG, không vector/CMYK. Không có recolor SVG nhiều vùng: kho SVG hiện raster hóa khi chèn, vì vậy không hiện màu tô giả. Không xuất/build/chạy installer Mac/Windows trong môi trường Linux này; chỉ kiểm launcher Python, cú pháp shell và cấu hình tài nguyên Electron. Không in ra máy thật.

Chạy trên Mac trong thư mục repository: `bash Mo-TemHoa-Mac.command`.

## Chạy kiểm thử

```bash
npm install --no-save playwright
npx playwright install --with-deps chromium
python3 -m pip install Pillow pypdf PyMuPDF
node tests/image-tools-smoke.cjs
node tests/editor-interactions-smoke.cjs
```

Đặt `TEMHOA_SCREENSHOTS` để chọn nơi lưu screenshot. CI chạy cùng các bài regression và lưu artifact ảnh.
