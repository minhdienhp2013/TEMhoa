# Kéo và giãn riêng layer đang chọn

Chọn một lớp chữ trong panel Lớp: khung và tay nắm bám đúng lớp đó, lưu dịch chuyển/tỷ lệ riêng trong layerStack.transforms. Ảnh và các lớp chữ khác giữ hình học; không đổi scale của cả ô tem. Khi chọn ảnh/hình chỉ hiện khung của đối tượng đó. Nhóm giữ thao tác nhóm; double-click chỉnh văn bản vẫn dùng editor. Nút di chuyển Chữ tác động đúng lớp đang chọn; kéo trên canvas khi không ở chế độ nhập cũng di chuyển lớp đó. Dữ liệu cũ mặc định transform đơn vị, không migration phá dữ liệu. Reorder giữ thuộc tính transform.

Kiểm thử Chromium Linux: layer-transform-smoke dùng chuột thật kéo tay nắm ngang và nút Chữ; xác minh scale/offset của lớp được chọn, sibling/ảnh/scale toàn tem không đổi; chuyển chọn sang ảnh và lớp chữ khác, undo/redo, restore từ dữ liệu đã lưu, bảo vệ khóa và đổi thứ tự lớp. Pipeline paintLayerUnit chung áp transform cho renderer/PNG/PDF/SVG. Chưa build native Windows/Mac.
