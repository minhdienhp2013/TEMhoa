# Clipboard và kéo thả TEMhoa

Nhánh feat/clipboard-drop-20261006, dựa trên main 8a1e57d; không thay dữ liệu mẫu. Module clipboard-tools.js được phục vụ qua launcher Python/PowerShell và thêm vào extraResources Electron.

## Đã triển khai

- Dán ảnh/chữ từ clipboard máy tính bằng Cmd+V / Ctrl+V; nút Dán dùng Clipboard API khi trình duyệt cấp quyền. Không bắt phím dán của input, textarea hoặc dialog. Văn bản trong temEditor dùng pipeline dán hiện có và định dạng đích. Đối tượng khóa không bị thay đổi.
- Native copy/paste trong TEMhoa giữ dữ liệu nội bộ qua marker riêng; ghi plain text và HTML vào clipboard, ưu tiên clipboard hiện tại khi người dùng đã sao chép bên ngoài. Không dùng clipboard nội bộ cũ đè ảnh/chữ ngoài.
- Kéo file ảnh và đoạn chữ vào canvas; outline chỉ trong lúc kéo. Tạo đối tượng thật, không dùng ảnh preview giả. Vị trí thả chuyển từ màn hình về cm thiết kế. Trong khối có chữ/ảnh khác, chỉ di chuyển ảnh mới.
- Dữ liệu đầu vào đọc xong/kiểm tra trước khi chèn, queue tuần tự; chuyển thiết kế trong lúc chờ thì hủy nhập với lỗi rõ. Không nhập ảnh trùng cả bản file và bản HTML trong cùng paste.
- PNG/JPG/WebP, giới hạn 12 MB và 40 triệu pixel từ bộ đọc ảnh kho hiện có; byte nguồn nằm trong thiết kế nên mở lại vẫn còn ảnh. HTML chỉ lấy chữ/ảnh data URI hợp lệ; không nhập script/iframe hoặc tải liên kết web.

## Kiểm chứng thực tế

Chromium trên Linux với HTTP server Python thật và profile riêng. tests/clipboard-smoke.cjs dùng navigator.clipboard.write/writeText và phím Control+V/C để đi qua clipboard native thật, không mock Clipboard API. Ảnh clipboard được đối chiếu pixel RGBA (OS có thể mã hóa lại PNG nên không đối chiếu byte). Copy đối tượng rồi paste/undo khôi phục đúng nguồn.

Drop dùng DataTransfer/DragEvent trong trình duyệt với bytes ảnh thật: kiểm vị trí dưới một pixel, text nhiều dòng, HTML có script/iframe không thực thi, ảnh hỏng/sai định dạng/quá 12 MB không đổi thiết kế, dán khi đang nhập, bảo vệ chữ khóa, nút Dán, tự lưu rồi đóng/mở profile, cửa sổ 390×760. Không có lỗi JS/module. Kiểm nhánh Meta+V không ngăn hành vi paste native; chưa chạy trực tiếp trên macOS.

PASS clipboard-smoke, editor-interactions-smoke (giữ bản sửa kéo/resize/Aa), art-ui-smoke, autosave-smoke và image-tools-smoke (PNG/PDF parser/pixel). JS/Python/shell cú pháp và tài nguyên Electron được kiểm. Chưa build installer Mac/Windows và chưa thử kéo từ Finder/Explorer thật.

Nút đọc clipboard có thể bị trình duyệt từ chối quyền; phím dán native không cần API read. Dán trực tiếp đường dẫn ảnh từ Finder hoặc URL web không được coi là ảnh: kéo file, sao chép nội dung ảnh hoặc screenshot vào clipboard. Không hỗ trợ GIF động/HEIC/SVG trong bộ đọc ảnh hiện tại.

Chạy Mac: bash Mo-TemHoa-Mac.command. Test: node tests/clipboard-smoke.cjs (Playwright Chromium). CI lưu ảnh thật bằng TEMHOA_SCREENSHOTS.
