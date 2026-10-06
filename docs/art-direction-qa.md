# TEMhoa — giao diện Minh Điến và chuyển động

Thanh chính và thanh định dạng cao tổng cộng 102 px ở desktop. Công cụ thêm chữ, ảnh, thành phần, hoàn tác/làm lại, panel, In và Xuất dùng nút thật với nhãn trợ năng. Định dạng chữ và thao tác ảnh hiện theo vùng chọn; các công cụ phụ được chuyển sang Thuộc tính, vẫn dùng các handler chỉnh sửa cũ.

Màu và chuyển động dùng các biến CSS trong `style#artDirection` của `TemHoa-MinhDien.html`. Nền giấy ấm, công cụ trắng, chữ than, đỏ dành cho In/hành động chính, vàng chỉ có trong icon ứng dụng. Vùng chọn màu xanh, độc lập với màu tem. Icon SVG được tạo theo hướng nhận diện Minh Điến; chưa đối chiếu file Figma do giới hạn MCP Starter.

## Chuyển động đã triển khai

- Nút: đổi màu 120 ms; thumbnail nâng 1 px và đổi viền.
- Menu Xuất, menu chuột phải và font: fade/dịch 6 px, 160 ms.
- Panel: opacity/dịch 8 px, 210 ms. Desktop giữ chỗ panel khi thu gọn để canvas không đổi kích cỡ; cửa sổ nhỏ dùng overlay, dưới 540 px dùng sheet phía dưới.
- Dialog: fade/dịch 6 px, 210 ms, backdrop nhẹ; focus và Escape do dialog thật quản lý.
- Trang chính/editor: fade 260 ms, header dịch nhẹ; quay lại khôi phục cuộn và focus mẫu đã mở.
- Đổi loại mẫu: nội dung fade nhanh. Animation bị ngắt được hủy trước khi chạy lại; reduced-motion bỏ chuyển động.
- Canvas kéo, resize, xoay và undo/redo tiếp tục cập nhật ngay, không thêm easing.

Không thêm phần trăm tải giả hoặc animation trang trí lặp. Không dùng animation để quyết định thời điểm lưu, mở trang hoặc xử lý dữ liệu.

## Kiểm tra thực tế

Playwright/Chromium trên Linux, cửa sổ 1440×1000 và 390×760. Đã chụp trang chính, editor trống/chữ/ảnh/nhóm, Lớp, Thuộc tính, menu chuột phải, Xuất PNG, In và cửa sổ nhỏ. Ảnh test và các mẫu mùa trong bài kiểm tra chỉ là fixture, không được thêm vào thư viện mẫu người dùng.

Các bài kiểm tra đạt:

- `design-smoke.cjs`: chữ, kéo tự do, nhóm/bỏ nhóm, lớp, khóa và tem mây; không có layer nền/viền.
- `delete-template-smoke.cjs`: hủy, lỗi máy chủ và xóa thành công.
- `autosave-smoke.cjs`: lưu im lặng, định danh mẫu ổn định, phục hồi bản nháp.
- `output-paper-smoke.cjs`: PNG/SVG/Word, tỷ lệ A3/A4/A5 và dữ liệu thiết kế giữ nguyên.
- `art-ui-smoke.cjs`: canvas không nhảy khi đóng/mở panel liên tục, dữ liệu không đổi, focus/Escape, 6 mẫu gần đây, vị trí cuộn, reduced-motion và cửa sổ nhỏ.

Ảnh chụp được giữ trong `docs/screenshots/`; xem [tổng quan](screenshots/overview.png). Ảnh chụp cũng được lưu thành artifact `temhoa-ui-screenshots` trong workflow. Bộ icon `assets/temhoa.svg`, PNG, ICO và ICNS đã có; Electron/Windows sử dụng PNG và ICO trong cấu hình. Chưa build hoặc chạy bản cài Windows/macOS, chưa thử in trên máy in thật. Trên Mac tiếp tục chạy bằng `bash Mo-TemHoa-Mac.command`.

Phạm vi đợt này là giao diện và chuyển động (mục 16–18), không thay thế toàn bộ engine editor. Không bổ sung PDF, nhiều trang hay nhóm hỗn hợp chữ và ảnh trong đợt này.
