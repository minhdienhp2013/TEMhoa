# Tem Hoa Minh Điến

Phần mềm soạn tem hoa trên Windows và macOS, nhập trực tiếp trên trang xem trước như Word.

## Tính năng

- Tạo nền và viền mây bo theo chữ; chỉnh màu, viền và kích thước in.
- Bôi đen chữ để đổi phông, cỡ chữ, đậm, nghiêng và gạch chân.
- Phông riêng từng dòng; rê chuột trong danh sách để xem thử phông.
- Lấy phông đã cài trên máy qua Chrome/Edge; không kèm phông nhúng.
- Xử lý bảng ký tự phông .Vn/TCVN3 từ tệp phông trên máy.
- Thước cm, thu/phóng, lưu/mở mẫu và hoàn tác/làm lại.
- Xuất PNG và ảnh trong Word ở 600 DPI; SVG chuyển chữ và viền thành đường vector.

## Mở phần mềm

Tải bằng **Code → Download ZIP**, giải nén toàn bộ thư mục.

### Windows

Bấm đúp `Mo-TemHoa-Windows.bat`. Không cần Python. Giữ cửa sổ mở trong khi dùng.

### macOS

Cần Python 3. Bấm đúp `Mo-TemHoa-Mac.command`.
Nếu tệp không mở được, mở Terminal trong thư mục và chạy:

```bash
bash Mo-TemHoa-Mac.command
```

Phần mềm mở trình duyệt qua localhost; không mở truy cập mạng LAN.
Có thể mở trực tiếp `TemHoa-MinhDien.html` để dùng các phông hệ thống thông thường.

## Phông chữ và bảng mã

Trong Chrome/Edge, bấm **Lấy phông trên máy → Cho phép** để nạp danh sách đầy đủ.
Với phông `.VnFree` hoặc phông `.Vn` TCVN3, cần cấp quyền này để xử lý bảng ký tự.

Khuyên dùng UniKey/EVKey ở **Unicode** và chọn **Bảng mã bộ gõ: Unicode** trong phần mềm.
Nếu bộ gõ đang xuất TCVN3, chọn **TCVN3 (ABC)**. Lựa chọn này áp dụng cho chữ nhập/dán mới.
Không tự chuyển lại nội dung đã nhập. Nét phông được giữ từ phông đã cài trên máy.

## Cập nhật qua Git

Nếu đã cài Git, tải lần đầu:

```bash
git clone https://github.com/minhdienhp2013/TEMhoa.git
cd TEMhoa
```

Những lần sau, đóng phần mềm, mở Terminal/PowerShell trong thư mục `TEMhoa` rồi chạy:

```bash
git pull --ff-only
```

Mở lại bằng tệp dành cho Windows hoặc Mac phía trên.
Nếu đã tải bằng Download ZIP, hãy tải ZIP mới hoặc dùng `git clone` để có thể cập nhật bằng `git pull`.

Xem thêm `HUONG-DAN.txt`.

## Thư mục mẫu cố định

**Lưu mẫu** đặt tên và lưu vào `Mau-Tem-Hoa` cạnh phần mềm. **Mở mẫu** hiển thị danh sách trong thư mục đó, không cần tìm tệp mỗi lần. Mẫu cùng tên sẽ được cập nhật.

Mở bằng tệp Windows/Mac để dùng chức năng này. Nếu mở HTML trực tiếp, hãy đóng và mở bằng tệp khởi động. Mẫu JSON cũ có thể dùng **Mở mẫu → Nhập mẫu JSON cũ**, rồi **Lưu mẫu** để chuyển vào thư mục cố định.

Các mẫu cá nhân không được đưa lên GitHub. Khi cập nhật bằng Git, thư mục mẫu được giữ lại. Khi tải ZIP mới, sao chép thư mục `Mau-Tem-Hoa` cũ vào bộ mới để giữ mẫu.
