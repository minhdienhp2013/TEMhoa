# Sửa cuộn bảng Thuộc tính

Ảnh tham chiếu cho thấy nội dung dưới phần màu bị cắt. Tái hiện trước sửa trong Chromium 1600×1000: wordWorkspace cao 866 px nhưng layersPanel cao 1046 px; artProperties overflow visible, wheel không tăng scrollTop. Body overflow hidden cắt phần dưới. Không phải lỗi dữ liệu màu.

Bảng được giới hạn theo chiều cao workspace, flex column/min-height 0; Thuộc tính và danh sách Lớp là hai vùng cuộn độc lập. Hàng tab/đóng bảng không co và giữ phía trên. Cửa sổ hẹp dùng cùng cơ chế trong bottom sheet, cuộn không truyền sang canvas. Scroll pane có focus bàn phím và focus ring. Thanh điều hướng chính có overflow ngang ở cửa sổ trung bình để không làm rộng cả trang.

PASS tests/properties-scroll-smoke.cjs: HTTP server Python thật, profile Chromium, Tem mây; wheel và Home/PageUp/PageDown; tới nút cuối; mở bộ chọn màu và Escape; header/canvas giữ tọa độ; dữ liệu thiết kế không đổi khi cuộn; đổi tab; viewport 1440×700, 900×500, 390×760, 390×420; danh sách 13 lớp cuộn độc lập; đóng/mở bảng 5 lần vẫn tới được nút cuối. Không có lỗi console/module hoặc tràn ngang trang. Ảnh thật ở docs/properties-scroll-screenshots/.

PASS lại editor-interactions-smoke (kéo/resize/zoom/Aa), art-ui-smoke và clipboard-smoke sau sửa. Chưa chạy trực tiếp trên macOS/Windows. Thay đổi được đưa vào nhánh feat/clipboard-drop-20261006 và PR #5; chưa merge main.
