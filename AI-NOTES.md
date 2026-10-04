# Xóa nền AI cục bộ

TEMhoa tích hợp rembg 2.0.67 qua một môi trường Python riêng; không gửi ảnh tới dịch vụ AI và không cần API key. Mô hình được tải về máy trong lần đầu, dùng lại offline sau đó.

## Nguồn tham khảo

- [rembg](https://github.com/danielgatis/rembg): API remove/new_session, ONNX CPU, MIT.
- [U²-Net](https://github.com/xuebinqin/U-2-Net): mô hình u2netp dùng trong chế độ Nhanh, Apache-2.0.
- [BiRefNet](https://github.com/ZhengPeng7/BiRefNet): birefnet-general-lite dùng trong chế độ Chất lượng cao, MIT.
- [IMG.LY background-removal-js](https://github.com/imgly/background-removal-js): tham khảo hướng chạy trên trình duyệt; không tích hợp thư viện/mã/tài nguyên của dự án này.

Các dự án/model có giấy phép riêng trong liên kết nguồn. Mã TEMhoa gọi thư viện được cài qua pip; không chép trọng số mô hình vào repo.

## Cài một lần

1. Cài Python 3.12 (hoặc 3.11/3.13 trên Mac).
2. Mac: mở Terminal trong thư mục ứng dụng, chạy `bash Cai-AI-Mac.command`. Windows: mở `Cai-AI-Windows.bat` (dùng Python Launcher `py -3.12`).
3. Đợi cài thư viện và mô hình Nhanh. Môi trường `.temhoa-ai` không đưa lên GitHub và không nằm trong mẫu. Không chuyển môi trường này từ Mac sang Windows; mỗi máy cài riêng.
4. Mở lại phần mềm bằng launcher Mac/Windows. Chọn ảnh → Emoji / Ảnh → Xóa nền AI. Không hỗ trợ AI khi mở HTML trực tiếp bằng file://.

Chế độ Nhanh dùng u2netp; Chất lượng cao dùng BiRefNet General Lite và tải riêng khi dùng lần đầu. Việc tải lần đầu cần Internet; chất lượng và thời gian xử lý phụ thuộc ảnh/máy. CPU hỗ trợ cả Mac và Windows, không bắt buộc card NVIDIA.

## Chỉnh và lưu

- Hai cửa sổ ảnh gốc/kết quả trên nền caro. Kết quả chỉ thay tem khi bấm **Áp dụng vào tem**.
- Cọ Xóa thêm/Giữ lại chi tiết, cỡ cọ, hoàn tác tối đa 5 nét gần nhất, về kết quả AI. Đóng cửa sổ không áp dụng kết quả.
- Khôi phục ảnh gốc, undo/redo và lưu/mở mẫu giữ ảnh gốc cùng ảnh đã xử lý. Nhóm ảnh phải bỏ nhóm trước khi xử lý riêng.
- PNG trong suốt được nhúng vào mẫu và các bản xuất/in. Ảnh không tự biến thành vector.
- Ảnh giữ cùng khung và vị trí, không tự crop; độ phân giải đầu vào vẫn theo giới hạn nhập ảnh hiện tại của ứng dụng. Worker giới hạn cạnh 2400 px và 20 megapixel trước khi giải mã đầy đủ.

## Vận hành

API `/api/background` chỉ qua localhost và token phiên hiện tại, giới hạn 16 MB/yêu cầu, một tác vụ mỗi lần. Worker xử lý ở tiến trình riêng để giao diện và máy chủ vẫn phản hồi. Có giới hạn chờ 10 phút. Đóng hộp preview không giết tác vụ đang chạy; có thể đợi xong rồi thử lại. Ảnh đầu vào tạm bị xóa khi worker xong; tác vụ hoàn tất cũ được dọn khi chạy tác vụ mới, thư mục phiên được dọn khi thoát launcher bình thường.

Mép tóc, vật trong suốt, lỗ nhỏ hoặc chủ thể giống màu nền có thể cần sửa bằng cọ. Không dùng thay thế AI bằng một phép xóa màu khi mô hình lỗi; ứng dụng giữ nguyên ảnh và báo lỗi.
