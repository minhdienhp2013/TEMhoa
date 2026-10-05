# TEMhoa Windows

Bộ cài `TEMhoa-Setup-1.0.0-x64.exe` được tạo tại GitHub Actions → Windows installer with offline AI → Artifacts → TEMhoa-Windows-Setup.

Cài một lần, mở TEMhoa từ biểu tượng Desktop hoặc Start Menu. Không cần chạy BAT, cài Python hay cài trình duyệt. Hai mô hình AI tách nền được đóng gói để dùng ngoại tuyến. Phông chữ trên máy được nạp tự động mỗi lần mở ứng dụng.

Mẫu lưu riêng trong thư mục dữ liệu người dùng của TEMhoa, được giữ lại khi nâng cấp hoặc gỡ cài đặt. Bộ cài hiện dành cho Windows 10/11 x64. Bản dựng chưa ký chứng thư; Windows có thể yêu cầu xác nhận nhà phát hành.

Để dựng lại: chạy workflow `Windows installer with offline AI`. Quy trình kiểm tra khởi động, phông chữ tự động, tải ảnh và cả hai bộ AI trước khi xuất bộ cài. Không lưu ảnh thử hay ảnh người dùng vào Git.
