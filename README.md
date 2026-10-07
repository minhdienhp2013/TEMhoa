# Tem Hoa Minh Điến

Phần mềm soạn tem hoa trên Windows và macOS, nhập trực tiếp trên trang xem trước như Word.

## Tính năng

- Tạo nền và viền mây bo theo chữ; chỉnh màu, viền và kích thước in.
- Bôi đen chữ để đổi phông, cỡ chữ, đậm, nghiêng và gạch chân.
- Phông riêng từng dòng; rê chuột trong danh sách để xem thử phông.
- Lấy phông đã cài trên máy qua Chrome/Edge; không kèm phông nhúng.
- Xử lý bảng ký tự phông .Vn/TCVN3 từ tệp phông trên máy.
- Thước cm, thu/phóng, lưu/mở mẫu và hoàn tác/làm lại.
- Xuất toàn trang PNG và ảnh trong Word ở 300/600 DPI theo khổ đích; SVG chuyển chữ và viền thành đường vector.

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
- Khi có nhiều tem, In và xuất PNG/Word/SVG lấy đủ các tem trên cùng trang. PNG giữ nền ngoài tem trong suốt; SVG vẫn là đường vector. Word xuất toàn trang theo khổ giấy đích đã chọn, không tự giảm chiều cao 50%. Khi chỉ có một tem, cách xuất cũ được giữ nguyên.
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

## Mẫu tự thiết kế

Kho 60 mẫu tự tạo theo chủ đề đã được gỡ bỏ. Trang chủ chỉ hiển thị mẫu Word và mẫu cá nhân. Dùng **Tạo tem / Tiếp tục chỉnh sửa** để thiết kế thủ công, rồi **Lưu mẫu mới** để thêm vào kho mẫu của bạn.

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

- Đã bổ sung 38 mẫu có phần chữ chỉnh sửa được từ tài liệu Word của cửa hàng vào `Mau-Tem-Hoa`, tên bắt đầu bằng `Word-`. Đã xóa toàn bộ chữ và định dạng phông cũ theo yêu cầu của cửa hàng; chỉ giữ ảnh nền để tự làm lại chữ. Ảnh nền mặc định khóa.
- Bấm **Lấy phông trên máy**, cho phép truy cập và chọn phông muốn dùng cho phần chữ mới. Ứng dụng không phân phối tệp phông.
- Bấm **Tem thường · Word**, chọn hình mẫu, rồi bấm **Thay nội dung**. Dòng mới giữ phông, cỡ chữ, đậm/nghiêng của dòng tương ứng. Thêm dòng dùng định dạng dòng cuối. Khung nền giữ nguyên. Dán đè toàn bộ chữ trong preview cũng giữ định dạng theo dòng; dán trong một đoạn dùng định dạng ở vị trí dán.
- Nền Word là ảnh nhúng, chữ được soạn và xuất riêng. Các đối tượng Word cổ điển đã được chuyển thành nền ảnh; không phải mọi hình Word đều trở thành đối tượng vector chỉnh sửa được. Những ảnh có chữ nằm sẵn trong bitmap không tự biến thành văn bản.
- **Đọc ảnh mẫu** nhận ảnh PNG/JPEG/WebP, đọc chữ bằng OCR tiếng Việt/Anh trên trình duyệt và cho kiểm tra kết quả trước khi thay nội dung. Lần đầu cần Internet để tải Tesseract.js và dữ liệu OCR. Nếu không tải được hoặc ảnh dùng chữ nghệ thuật khó đọc, có thể nhập/sửa nội dung thủ công. Không cần API AI; ảnh được xử lý trên máy.
- OCR không biết chính xác tên phông từ ảnh. Nội dung nhận diện được đưa vào tem đang chọn, giữ phông và kích thước của tem đó. Khi lưu mẫu, phần Word và hình xem trước được lưu cùng mẫu.


## Lớp chữ, lớp ảnh và lưu vào mẫu gốc

- Chọn **Lớp chữ** hoặc **Lớp ảnh / emoji** tại thanh Đoạn văn. Ở lớp chữ, ảnh không chặn thao tác nhập liệu. Kéo nút **✥ Chữ**, hoặc chỉnh **X chữ / Y chữ (cm)** để di chuyển riêng chữ mà không đổi ảnh nền.
- **Khóa ảnh** giữ ảnh tại vị trí và kích thước hiện có. Ảnh khóa không thể kéo, xoay, đổi kích thước hoặc xóa. Bấm **Mở khóa ảnh** để chỉnh lại; trạng thái khóa được lưu cùng mẫu.
- Mở một mẫu có sẵn rồi bấm **Lưu mẫu** sẽ cập nhật trực tiếp chính file JSON đó trong `Mau-Tem-Hoa`, gồm nội dung, ảnh nền, hai lớp và hình xem trước. **Lưu mẫu mới** tạo một file khác. Mẫu mới chưa có tên vẫn mở hộp đặt tên khi lưu. Chức năng này cập nhật file mẫu ứng dụng, không ghi lại tài liệu Word nguồn.


## Cầu vồng cho toàn trang hoặc dòng được bôi đen

- Không bôi đen chữ: **⌒ Cầu vồng**, **Thẳng** và ô **Chữ cong** áp dụng cho tất cả các dòng của tất cả tem trên trang.
- Bôi đen chữ: áp dụng cho toàn bộ những dòng có chữ được bôi đen trong tem đang sửa, kể cả khi chỉ chọn một phần của dòng. Các dòng khác giữ độ cong hiện có.
- Có thể làm cong nhiều dòng cùng lúc; không cần chọn Dòng đầu/Dòng thứ 2. **Thẳng** cũng dùng cùng phạm vi chọn.
- Độ cong riêng của từng dòng được giữ khi lưu/mở mẫu, sao chép tem, hoàn tác/làm lại, in và xuất PNG/Word/SVG. Mẫu cũ vẫn đọc được thiết lập cong từng dòng trước đây.


## Bảng lớp bên phải

- Bảng Lớp hiển thị từng dòng chữ, nền/viền tem và từng ảnh/emoji riêng. Các mẫu Word giữ ảnh nền thành một lớp ảnh có khóa.
- Danh sách hiển thị lớp trên cùng trước. Kéo tay nắm ⋮⋮ tới nửa trên/dưới hàng khác để đổi thứ tự trong tem; nền, chữ và ảnh có thể đổi thứ tự với nhau.
- Bấm dòng chữ để chọn nội dung của dòng; bấm ảnh/emoji để chọn hình, dùng nút khóa trên hàng để khóa/mở khóa hình. Lên/Xuống 1 lớp áp dụng cho đơn vị đang chọn.
- Các tem được phân thành mục riêng theo thứ tự trên trang. Nút Lớp thu gọn/mở lại bảng. Alt + mũi tên lên/xuống trên hàng hỗ trợ đổi lớp bằng bàn phím.
- Thứ tự được lưu trong mẫu, giữ khi undo/redo và được dùng cho preview, in, PNG/Word/SVG. Không ghi thay đổi vào tài liệu Word nguồn.

## Thiết kế đồ họa cho tem thường

- Trang chủ → **＋ Tem thường mới** tạo thiết kế tự do. **T · Văn bản** thêm một khối chữ độc lập; phím T khi không nhập liệu cũng thêm chữ.
- Bấm khối chữ để chọn, kéo trực tiếp tới vị trí bất kỳ trên trang. Bấm đúp hoặc **Sửa chữ** để nhập và định dạng; bấm **Xong** để kéo lại. Dùng tay kéo góc để đổi kích thước.
- Mẫu Word cũ được giữ ảnh nền và tách từng dòng chữ thành khối riêng khi mở. Bấm **Lưu mẫu mới** để giữ bản thiết kế mới, hoặc **Lưu mẫu** để cập nhật mẫu đang mở.
- Bảng Lớp, nhóm, nhân đôi, xóa, undo/redo và dữ liệu vị trí dùng chung với cơ chế lưu/xuất hiện có. Hiện tối đa 20 khối/tem trên một trang; chế độ khối chữ chưa có xoay cả khối chữ.
- Tem mây tiếp tục nhập chữ và tạo viền như trước. Bộ cài Windows chỉ dựng khi chạy workflow thủ công; giai đoạn hiện tại dùng launcher Mac để thử và sửa.

## Khổ thiết kế và khổ in/xuất độc lập

Khổ giấy trên màn hình là khổ thiết kế. Bấm In hoặc PNG/SVG/Word mới chọn khổ đích A5/A4/A3; chiều ngang/dọc theo trang thiết kế. Toàn bộ đối tượng được đổi tỷ lệ cùng trang, giữ bố cục và không sửa dữ liệu thiết kế. PNG giữ nền ngoài thiết kế trong suốt; Word xuất ảnh đầy đủ chiều cao trang, bỏ chế độ 50% cũ. DPI mặc định 300; 600 DPI chỉ dùng khi không vượt giới hạn 40 triệu pixel.

Bảo vệ mép khi in là tùy chọn riêng, mặc định tắt. Bật có thể thu nhỏ thêm bố cục. Các khổ ISO có sai số do làm tròn kích thước mm; phép fit giữ tỷ lệ, không kéo méo hoặc cắt nội dung. In sát mép thực tế còn phụ thuộc lề phần cứng và Borderless của máy in. Trên Mac, hộp thoại hệ thống cần chọn cùng khổ, tỷ lệ 100%, không header/footer.

### Kho tài nguyên, mẫu điền nhanh và PDF

Trong editor bấm **Tài nguyên** để nhập ảnh PNG/JPG/WebP, dùng hoa/trang trí offline, tìm theo tên/từ khóa hoặc quản lý yêu thích. **Xuất kho / Nhập kho** dùng tệp JSON để sao lưu/chuyển máy; nhập giữ nguyên tài nguyên đã có. Kho thuộc trình duyệt đang dùng, còn ảnh đã chèn được lưu cùng thiết kế.

Trang chính có **Mẫu điền nhanh**. Nhập người nhận, lời chúc, người gửi rồi xem preview thật trước khi tạo bản thiết kế riêng. **Lưu thiết kế thành mẫu** trong kho tạo mẫu cá nhân giữ ảnh và định dạng, không thay thế tự lưu thiết kế.

Giữ Shift để chọn các khối chữ/ảnh trên canvas hoặc panel Lớp rồi **Nhóm**. Nhóm có tay kéo, resize và nút xoay; khi bỏ nhóm, các khối vẫn giữ biến đổi. **Khôi phục ảnh gốc** giữ nguyên nguồn sau crop.

**Xuất → PDF / Dàn tem…** chọn A5/A4/A3 ngang/dọc, xuất toàn trang hoặc dàn toàn bộ nội dung thành nhiều tem. Có chọn trang preview, lề, khoảng cách và dấu cắt. PDF dùng raster, mục tiêu 300 DPI, có báo độ phân giải thực tế; chưa hỗ trợ PDF vector/CMYK. Khổ editor được giữ nguyên.

Chi tiết kiểm thử và giới hạn: [studio-upgrade-qa.md](docs/studio-upgrade-qa.md). Trên Mac chạy `bash Mo-TemHoa-Mac.command`.

### Thanh ảnh theo vùng chọn

Chọn một ảnh để dùng thanh ngang ngay dưới hàng điều hướng: chỉnh sáng/màu/blur, thay ảnh giữ khung, xóa nền, viền, bo góc/mask, crop trực tiếp, lật, độ mờ, vị trí và bóng đổ. Ở cửa sổ hẹp mở **Thêm**. **Chỉnh sửa → Khôi phục ảnh gốc** trả lại toàn ảnh; phần mở rộng có xóa nền theo màu. Ảnh khóa có **Mở khóa**. Chuyển động trình chiếu chưa hỗ trợ.

Kết quả kiểm tra và giới hạn: [image-toolbar-qa.md](docs/image-toolbar-qa.md).

### Dán và kéo thả trực tiếp

Trong editor, dùng **⌘V trên Mac / Ctrl+V trên Windows** để dán ảnh PNG/JPG/WebP hoặc chữ từ clipboard máy tính. Có nút **Dán** trên thanh chính. Khi đang sửa chữ, dán văn bản vào vùng nhập hiện tại; trên canvas tạo khối chữ mới. **⌘C / Ctrl+C** và dán vẫn giữ đối tượng/nhóm nội bộ. Undo/redo và tự lưu giữ dữ liệu đã nhập.

Kéo file ảnh từ Finder/Explorer hoặc kéo đoạn văn bản vào canvas; ảnh được chèn thành đối tượng có thể kéo, đổi cỡ, crop và xóa nền. File tối đa 12 MB, 40 triệu pixel. Ảnh liên kết web cần sao chép nội dung ảnh hoặc tải file trước. Nút Dán cần quyền clipboard của trình duyệt; nếu trình duyệt chặn nút, dùng phím tắt.
