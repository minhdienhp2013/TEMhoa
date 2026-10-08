# Chia mã TEMhoa thành các module — 07/10/2026

Đợt này giữ HTML/JavaScript thuần và các global đang được dùng bởi kho tài nguyên, ảnh, clipboard, hình và màu. Các script vẫn là classic script, tải tuần tự; không đổi thành ES module hoặc thêm bundler. Điều này giữ các khai báo và các lớp ghi đè hàm hiện có tương thích.

| Module | Phạm vi |
| --- | --- |
| editor-core.js | State nền tảng, màu và tiện ích canvas |
| editor-render.js | Font, rich text, layout, canvas và pipeline xuất/in |
| editor-objects.js | Khối trang, ảnh, nhóm, tách nền và panel lớp |
| editor-documents.js | Thiết kế, trang chính, chủ đề, lưu/phục hồi, đầu ra và menu ngữ cảnh |
| editor-shell.js | Giao diện editor và nhận diện |
| editor-topbar.js | Thanh công cụ thuộc tính phía trên |
| editor-actions.js | Hành động editor bổ sung |
| editor-text-transform.js | Biến đổi khối chữ |
| editor-performance.js | Giữ DOM lớp, gộp cập nhật hình học, giao dịch gõ chữ, cache ảnh và bộ đếm tùy chọn |
| editor-selection-tools.js | Điều khiển vùng chọn và công cụ lớp |
| editor-precise-selection.js | Chọn và điều khiển từng lớp chính xác |
| editor-canvas-interactions.js | Thao tác canvas |
| editor-layer-scroll.js | Cuộn danh sách lớp |
| editor-font-size.js | Cập nhật kích thước chữ |

Thứ tự tải trong HTML là một phần của giao diện tích hợp: module hiệu năng tải sau module màu và ảnh, trước các module sửa thao tác chọn/lớp/cỡ chữ trên main mới nhất. Module cỡ chữ tải cuối. Giữ nguyên thứ tự của các khối script trước khi tách để không ghi đè nhầm các bản sửa mới. Dịch vụ Python, PowerShell Windows và cấu hình tài nguyên Electron cần phân phối cùng các module mới.

## Tác động thực tế

Chia file giúp đọc, sửa, kiểm tra phạm vi trách nhiệm và làm việc song song dễ hơn. Nó **không tự giảm số đối tượng vẽ, thời gian render canvas hoặc lượng snapshot lịch sử**. Trình duyệt vẫn tải và thực thi tổng lượng JavaScript tương đương; lần mở đầu có thêm các yêu cầu file cục bộ. Các cải tiến RAF, giao dịch slider/gõ chữ, pool lịch sử và cache ảnh từ đợt trước được giữ nguyên, không phải bằng chứng rằng tách file làm phần mềm nhanh hơn. Đợt này có một sửa đường render cụ thể: bản preview dùng lại layout mà render đã tính, thay vì tính lại. Test bọc hàm layout trên đường oneLabelPreview thực tế xác nhận đúng một lần tính layout; chưa dùng kết quả này để tuyên bố tăng FPS hoặc giảm lag trên máy người dùng.

Số đo trước/sau tối ưu và các giới hạn nằm trong `Bao-cao-toi-uu-hieu-nang-TEMhoa.md`, `hieu-nang-truoc-toi-uu.json` và `hieu-nang-sau-toi-uu.json`. Chỉ so sánh tốc độ của đợt chia file khi chạy lại benchmark trong cùng môi trường và dữ liệu; không suy ra từ kích thước HTML giảm.

## Kiểm tra

`node tests/module-loading-smoke.cjs` khởi động chính Handler của `mo_temhoa.py` trên cổng tạm, dùng thư mục mẫu riêng. Test yêu cầu toàn bộ local script/style trong HTML trả HTTP 200, MIME đúng và nội dung không rỗng. Sau đó dùng Chromium kiểm tra global của các module, tạo/sửa chữ tiếng Việt, undo/redo, tự lưu và mở lại, PNG/SVG/PDF, cùng lỗi trang và HTTP. Nó cũng đếm trực tiếp hàm layout trong base preview, yêu cầu một lần để ngăn tính lại cùng layout sau render.

Nếu có Chromium ngoài cache Playwright, dùng `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/duong/dan/chrome node tests/module-loading-smoke.cjs`. `TEMHOA_MODULES_HTTP_ONLY=1` chỉ kiểm tra launcher và tài nguyên; kết quả chế độ này không chứng minh editor hoạt động trong trình duyệt.

Kết quả thực tế: PASS HTTP và browser trên Linux với `/tmp/temhoa-chromium`: cả 23 URL JS/CSS được phục vụ đúng bởi Python launcher; đủ global module; tạo và sửa chữ tiếng Việt; undo/redo; tự lưu và mở lại từ tệp mẫu; xuất PNG có chữ ký hợp lệ, SVG và PDF tải xuống có header PDF. Không có pageerror hoặc HTTP thất bại trong luồng kiểm tra. `node --check` PASS cho module hiệu năng và test. Chưa xác nhận bộ cài native Windows/macOS hoặc máy in thật.

## Nền mã và kiểm tra hồi quy

Đã lấy lại main mới nhất `b8eb888` trước khi trích module, giữ các sửa thao tác canvas và font mới hơn workspace ban đầu. HTML chính từ 2.443 dòng còn 371 dòng; tổng mã JavaScript vẫn tương đương, không coi giảm số dòng HTML là giảm RAM.

Các kiểm thử layer chính xác, workflow canvas, font lớn, resize chữ, một ô chữ nhiều dòng, cuộn lớp, chữ cong, giao diện, slider/cache/history, ảnh, tự lưu, xóa mẫu và khổ xuất đã được chạy trên runtime đã tách module. Test kéo riêng một ảnh trong nhóm được sửa để kiểm tra vị trí hiển thị sau khi chuẩn hóa tọa độ khối; cùng test đạt trên main gốc và bản tách module. Không đổi hành vi sản phẩm để làm test đạt. Test biến đổi chữ chọn đúng khối chữ gốc và theo dõi ảnh trong khối ảnh riêng, thay giả định cũ rằng thêm ảnh vẫn giữ activeLabelId. Fixture đặt ảnh không che tay nắm để kiểm tra biến đổi lớp riêng. Test kho mẫu dùng nút nhóm/bỏ nhóm gọn đang hiện trên giao diện, thay nút cũ đã bị ẩn.

CI nhận thay đổi `editor-*.js` và chạy kiểm thử tải module với Python launcher thật. Mac vẫn chạy `bash Mo-TemHoa-Mac.command`; Windows vẫn chạy `Mo-TemHoa-Windows.bat`. Cần phân phối toàn bộ module cùng HTML. Chưa build installer hoặc đo hiệu năng native Mac/Windows; không tuyên bố mức tăng FPS.

PDF: 12 file tải thực từ browser đã qua pypdf/PyMuPDF; đúng A5/A4/A3, chiều ngang/dọc, số trang và số bản tem; các trang sau có nội dung (đến 17 trang). Không in máy thật.
