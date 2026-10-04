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


## In trực tiếp đúng kích thước

- Bấm **In** hoặc **Ctrl + P** (Mac: **Command + P**).
- Bản in dùng khổ A4/A3/A5 đang chọn, vị trí tem trên trang và kích thước cả viền trong preview. Zoom màn hình không đổi kích thước in. Khoảng bảo vệ mặc định: trên/phải 1 mm, dưới/trái 0,3 mm. Có thể chỉnh từng mép 0–10 mm trong cửa sổ In; được ghi nhớ trên trình duyệt. Tem vượt vùng in được dịch vào trong, chỉ thu nhỏ khi không đủ chỗ; nhiều tem giữ nguyên vị trí tương đối. Đây là khoảng bảo vệ thử nghiệm, cần căn theo máy thật; không thay đổi trang làm việc hoặc các file xuất PNG/Word/SVG.
- Mặc định **In màu**, tỷ lệ **100%**, trang ảnh **600 DPI**. Có lựa chọn trắng đen.
- Windows: mở bằng `Mo-TemHoa-Windows.bat`, chọn máy in và bấm **Properties** để mở Printing Preferences của đúng driver. Chọn số bản rồi bấm **In…** trong phần mềm để gửi lệnh in trực tiếp, không mở hộp thoại Print hoặc tiến trình in mặc định của Windows.
- Cập nhật đầy đủ `Print-TemHoa-Windows.ps1` cùng các file ứng dụng. Không cần cài thêm Python để in trên Windows.
- Mac hoặc khi mở HTML trực tiếp: dùng hộp thoại in của trình duyệt/hệ thống. Chọn đúng khổ giấy, Scale 100%, không lề và tắt header/footer.
- Với máy in màu: chọn đúng loại giấy, Color và chất lượng phù hợp trong driver. In sát mép cần driver hỗ trợ Borderless; đặt Expansion/mở rộng ảnh về 0 hoặc thấp nhất để hạn chế thay đổi kích thước. Máy không hỗ trợ Borderless vẫn có lề phần cứng.
- Windows tải đầy đủ cấu hình DEVMODE của đúng máy in, giữ dữ liệu riêng của driver Canon (Borderless, khoảng mở rộng, loại giấy, chất lượng), rồi để driver xác nhận khổ/chiều giấy trước khi in. Tọa độ và vùng in lấy trực tiếp từ HDC của lệnh in theo DPI và PHYSICALOFFSETX/Y, tránh bù lề sai khi xoay ngang. Tem sát lề phần cứng được dịch vào vùng in, giữ kích thước khi đủ chỗ; tem quá lớn được thu nhỏ đồng đều để không mất viền. Cách này có thể thay đổi vị trí hoặc kích thước bản in so với trang làm việc.
- In trực tiếp giữ bố cục trang khi nằm đủ trong vùng in; xuất Word/PNG/SVG vẫn giữ cách xuất hiện có.

Đã kiểm tra bằng trình duyệt/PDF cho đủ năm lựa chọn khổ giấy và kiểm tra cú pháp PowerShell. Hộp thoại driver Windows và chất lượng màu cần kiểm tra thêm trên máy in thật.


## Nhiều tem trên một trang

- Chuột phải trong vùng làm việc → **Sao chép tem**, rồi **Dán tem**; hoặc **Nhân đôi tem** (Ctrl/Command+D). Bản mới lệch 0,7 cm để dễ nhận ra.
- Bấm vào tem để chọn và nhập trực tiếp. Mỗi tem giữ riêng nội dung, phông từng chữ/dòng, màu/gradient, giãn dòng, bo/dày viền, kích thước, khóa tỷ lệ và vị trí. Các tay kéo và thanh công cụ điều khiển tem đang chọn.
- Chuột phải → **Xóa tem** khi có ít nhất hai tem. Ctrl/Command+C/V sao chép/dán cả tem khi vùng tem đang được chọn; khi con trỏ đang nhập chữ, các phím này vẫn dùng cho văn bản.
- Lưu/mở mẫu giữ cả danh sách tem và tem đang chọn; mẫu một tem cũ vẫn mở được. Undo/redo giữ trạng thái cả trang, bao gồm nhân đôi/xóa tem.
- Khi có nhiều tem, In và xuất PNG/Word/SVG lấy đủ các tem trên cùng trang. PNG giữ nền ngoài tem trong suốt; SVG vẫn là đường vector. Word tiếp tục dùng ảnh 600 DPI với chiều cao 50% theo thiết lập trước. Khi chỉ có một tem, cách xuất cũ được giữ nguyên.
- Khổ giấy và zoom dùng chung. Mỗi trang hỗ trợ tối đa 20 tem.


## Icon nhanh và ảnh trang trí

- Bấm **♥ Icon / Ảnh** trên thanh trên cùng: có tim đặc, tim nét gạch, hai trái tim, sao, hoa, lá, nơ và bóng bay. Chọn chèn bên trái hoặc bên phải chữ.
- Icon/ảnh thuộc tem đang chọn; đường viền mây bao theo cả chữ và hình. Mỗi tem tối đa 12 hình.
- Bấm hình để chọn, kéo hình để di chuyển, kéo góc để đổi kích thước, kéo nút tròn để xoay. Bảng hình hỗ trợ kích thước cm, vị trí, góc xoay, màu icon, khóa tỷ lệ, lật ngang/dọc, nhân đôi và xóa.
- **Thêm ảnh từ máy…** nhận PNG/JPG/WebP. Có thể chọn vùng cắt trên ảnh nhỏ, chọn màu nền bằng cách bấm vào ảnh và bật **Xóa nền ảnh**; chỉ phần nền nối với mép ảnh được xóa để giữ chi tiết bên trong. PNG trong suốt dùng trực tiếp.
- Ảnh được nhúng vào mẫu; không cần giữ đường dẫn ảnh gốc. Lưu/mở mẫu và sao chép tem giữ các hình và thông số. Mẫu một/nhiều tem cũ vẫn mở được. Mẫu có ảnh tối đa 32 MB; lịch sử giới hạn theo bộ nhớ.
- Preview, bản in, PNG và Word đều có hình trang trí. SVG giữ chữ, icon có sẵn và viền dưới dạng vector; ảnh nhập từ máy vẫn là ảnh bitmap nhúng trong SVG, không tự biến thành vector.
