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


## Nhóm emoji và ảnh

- Bấm chọn hình; giữ **Shift** và bấm các hình khác trong cùng tem để chọn nhiều hình. Shift+bấm lại để bỏ chọn. Bấm **Nhóm** trên thanh trên cùng hoặc **Ctrl/Command+G** trong vùng làm việc.
- Nhóm có một khung chọn chung: kéo để di chuyển tất cả, kéo góc để phóng/thu theo cùng tỷ lệ, kéo nút tròn để xoay quanh tâm chung. Hai nút xoay 15° và lật hình áp dụng cho cả nhóm. Ô thông số từng hình và công cụ cắt/xóa nền bị khóa khi nhóm đang chọn; bỏ nhóm để chỉnh riêng.
- **Bỏ nhóm** hoặc **Ctrl/Command+Shift+G** giữ nguyên vị trí, kích thước và góc của các hình. Nhân đôi/xóa hình và lên/xuống lớp áp dụng cho cả nhóm. Nhóm được lưu trong mẫu, giữ khi sao chép tem và hỗ trợ undo/redo.

## Nhóm các tem trên trang

- Giữ **Shift** và bấm các tem để chọn nhiều tem, rồi bấm **Nhóm** hoặc Ctrl/Command+G. Nhóm/Bỏ nhóm cũng có trong menu chuột phải.
- Khung chung có nút di chuyển ở giữa và bốn tay kéo góc: di chuyển cùng nhau, phóng/thu đồng tỷ lệ, giữ khoảng cách tương đối. Các tem vẫn giữ chữ, phông, viền, emoji và ảnh riêng; có thể bấm trực tiếp vào chữ để sửa. Tem chưa có chức năng xoay cả tem.
- Bấm **Bỏ nhóm** hoặc Ctrl/Command+Shift+G để tách, không thay đổi vị trí/kích thước. Lưu/mở mẫu và undo/redo giữ nhóm.
- Lên/xuống lớp di chuyển cả nhóm. Sao chép/dán hoặc nhân đôi tem thuộc nhóm tạo bản sao của cả nhóm với mã nhóm mới, không nối với nhóm cũ. Tối đa 20 tem/trang.

## Sắp xếp lớp

- Chọn emoji/ảnh rồi bấm **Lên 1 lớp** hoặc **Xuống 1 lớp** trên thanh trên cùng hoặc trong bảng Emoji / Ảnh để đổi thứ tự giữa các hình trang trí trong tem. Hình ở lớp trên che hình ở lớp dưới khi chồng nhau; chữ vẫn nằm dưới nhóm hình trang trí.
- Khi không chọn emoji/ảnh, hai nút đổi thứ tự giữa các tem trên trang. Chuột phải vào tem hoặc hình cũng có hai lệnh này. Phím tắt **Alt + PageUp / Alt + PageDown** khi đang làm việc trong preview.
- Chỉ dịch một bậc mỗi lần, không thay vị trí/kích thước; nút tự khóa khi đã ở lớp cao nhất/thấp nhất. Thứ tự được giữ trong mẫu đã lưu, xuất PNG/Word/SVG và bản in; hỗ trợ undo/redo.

## Kho mẫu theo chủ đề

- Bấm **Kho mẫu · 60** trên thanh trên cùng để chọn trong 60 mẫu có sẵn, dùng được cả khi không có mạng.
- 15 chủ đề: sinh nhật, 8/3, 20/10, Ngày của bố, Ngày của mẹ, thầy cô 20/11, Valentine, đám cưới, kỷ niệm, khai trương, tốt nghiệp, cảm ơn, Tết, Giáng sinh và thăm hỏi sức khỏe. Mỗi chủ đề có 4 kiểu màu/bố cục: đỏ hồng cổ điển, hồng tím dịu dàng, xanh lá thanh lịch và đỏ tối giản.
- Lọc theo chủ đề hoặc tìm kiếm không dấu; nhập người nhận và người gửi nếu muốn. Chọn **Thay tem đang chọn** hoặc **Thêm tem mới vào trang** trước khi bấm mẫu. Các tem khác và mẫu đã lưu không bị thay đổi.
- Mẫu là thiết kế nguyên bản, có chữ Unicode, nền trắng và icon có sẵn; sử dụng phông đang chọn trên máy. Có thể sửa từng chữ, đổi phông/màu, kéo/xoay hình, in và xuất như tem thông thường. Hình thu nhỏ chỉ minh họa bố cục.
- Bấm **Lưu mẫu** để giữ phiên bản đã chỉnh trong Mau-Tem-Hoa. Undo/redo hỗ trợ việc áp dụng mẫu.

## Xóa nền AI cho người và ảnh

- Chọn ảnh → **Emoji / Ảnh → Xóa nền ảnh · AI**. Xóa nền AI là lựa chọn mặc định, chọn sẵn **Chất lượng cao** mỗi khi mở; có thể chuyển sang **Nhanh**. Xóa theo màu nằm trong mục **Xóa nền theo màu (thủ công)**. Ảnh được xử lý trên máy bằng rembg/ONNX, không cần API key.
- So sánh ảnh gốc/kết quả trước khi áp dụng. Có cọ **Xóa thêm**, **Giữ lại chi tiết**, cỡ cọ, hoàn tác nét cọ và **Khôi phục ảnh gốc**. Lưu mẫu và xuất file giữ ảnh PNG trong suốt.
- Cài một lần trên Mac: `bash Cai-AI-Mac.command`; Windows: chạy `Cai-AI-Windows.bat`. Cần Python 3.12, Internet để tải thư viện/mô hình lần đầu. Sau khi tải mô hình, có thể dùng offline. Mô hình Chất lượng cao tải riêng khi dùng lần đầu.
- Mở phần mềm bằng launcher Mac/Windows; tính năng AI không chạy khi mở HTML trực tiếp. Xem [AI-NOTES.md](AI-NOTES.md) để biết nguồn mô hình, cách cài và giới hạn xử lý.

## Icon nhanh và ảnh trang trí

- Bấm **😁 Emoji / Ảnh** trên thanh trên cùng: có 109 emoji, gồm các emoji đã yêu cầu 😁 😳 😭 😩 😘 🤐 ☺️ 😔 👄 💋 và nhiều mẫu cùng kiểu. Có ô tìm kiếm không dấu, lọc 3 nhóm **Khuôn mặt**, **Tình cảm**, **Chúc mừng**. Chọn chèn bên trái hoặc bên phải chữ. Emoji lấy từ phông emoji hệ điều hành, có thể khác kiểu nét giữa Windows và macOS.
- Icon/ảnh thuộc tem đang chọn; đường viền mây bao theo cả chữ và hình. Mỗi tem tối đa 12 hình.
- Bấm hình để chọn, kéo hình để di chuyển, kéo góc để đổi kích thước, kéo nút tròn để xoay. Bảng hình hỗ trợ kích thước cm, vị trí, góc xoay, khóa tỷ lệ, lật ngang/dọc, nhân đôi và xóa. Emoji giữ màu nguyên bản, không đổi thành màu chữ. Icon kiểu cũ trong mẫu và kho chủ đề cũng được hiển thị thành emoji tương ứng.
- **Thêm ảnh từ máy…** nhận PNG/JPG/WebP. Có thể chọn vùng cắt trên ảnh nhỏ, chọn màu nền bằng cách bấm vào ảnh và bật **Xóa nền ảnh**; chỉ phần nền nối với mép ảnh được xóa để giữ chi tiết bên trong. PNG trong suốt dùng trực tiếp.
- Ảnh được nhúng vào mẫu; không cần giữ đường dẫn ảnh gốc. Lưu/mở mẫu và sao chép tem giữ các hình và thông số. Mẫu một/nhiều tem cũ vẫn mở được. Mẫu có ảnh tối đa 32 MB; lịch sử giới hạn theo bộ nhớ.
- Preview, bản in, PNG và Word đều có hình trang trí. Emoji được vẽ rồi nhúng dưới dạng PNG trong suốt khi xuất SVG để giữ đúng màu và hình dáng đã thấy trong preview; chữ và viền vẫn là vector. Ảnh nhập từ máy vẫn là bitmap nhúng trong SVG.


## Tem thường từ mẫu Word của cửa hàng

- Đã bổ sung 38 mẫu có phần chữ chỉnh sửa được từ tài liệu Word của cửa hàng vào `Mau-Tem-Hoa`, tên bắt đầu bằng `Word-`. Mỗi mẫu giữ khung nền riêng, phông của các dòng và nội dung chuyển sang Unicode; không cần mở Word để đổi lời chúc.
- Bấm **Lấy phông trên máy** và cho phép truy cập để dùng các phông `.Vn` giống Word. Máy cần có phông tương ứng; ứng dụng không phân phối tệp phông.
- Bấm **Tem thường · Word**, chọn hình mẫu, rồi bấm **Thay nội dung**. Dòng mới giữ phông, cỡ chữ, đậm/nghiêng của dòng tương ứng. Thêm dòng dùng định dạng dòng cuối. Khung nền giữ nguyên. Dán đè toàn bộ chữ trong preview cũng giữ định dạng theo dòng; dán trong một đoạn dùng định dạng ở vị trí dán.
- Nền Word là ảnh nhúng, chữ được soạn và xuất riêng. Các đối tượng Word cổ điển đã được chuyển thành nền ảnh; không phải mọi hình Word đều trở thành đối tượng vector chỉnh sửa được. Những ảnh có chữ nằm sẵn trong bitmap không tự biến thành văn bản.
- **Đọc ảnh mẫu** nhận ảnh PNG/JPEG/WebP, đọc chữ bằng OCR tiếng Việt/Anh trên trình duyệt và cho kiểm tra kết quả trước khi thay nội dung. Lần đầu cần Internet để tải Tesseract.js và dữ liệu OCR. Nếu không tải được hoặc ảnh dùng chữ nghệ thuật khó đọc, có thể nhập/sửa nội dung thủ công. Không cần API AI; ảnh được xử lý trên máy.
- OCR không biết chính xác tên phông từ ảnh. Nội dung nhận diện được đưa vào tem đang chọn, giữ phông và kích thước của tem đó. Khi lưu mẫu, phần Word và hình xem trước được lưu cùng mẫu.
