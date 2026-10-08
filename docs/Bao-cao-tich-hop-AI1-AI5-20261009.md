# Bàn giao tích hợp AI1 → AI5 — 09/10/2026

## Kết luận

Đã tích hợp bản chia 14 module và phần sửa chữ của PR #8 vào ứng dụng chạy thật trên nhánh `ai5/integrate-ai1-20261009`. Chưa merge hoặc phát hành main. Các bài kiểm tra chữ, font, nhập số, nhóm, lưu/mở lại và đầu ra liên quan đạt trên Chromium/Linux. Chưa nghiệm thu toàn bộ sản phẩm: yêu cầu lớp chữ độc lập trong tem mây vẫn chưa có; hai test clipboard/hình còn thất bại cả trên main gốc.

## Nền mã và bảo toàn công việc

- BASE và origin/main đã fetch/xác minh: `d73c4139b87fbc2b28b7350f7a5d2305abdcf25a`.
- Bản chia module `d111afa` tồn tại trong workspace, trước đợt này chưa nằm trong origin/main.
- PR AI1: https://github.com/minhdienhp2013/TEMhoa/pull/8 ; head `2b2cc2159e8aed3bfe7a9b6fe2baa49dde18b755`.
- Commit tích hợp nội dung: `93d6a3b`. Commit hợp nhất lịch sử PR #8: `a43435f`.
- Nhánh/worktree riêng, không thay đổi các file chưa commit trong `TEMhoa-upgrade`, không xóa mẫu hay dữ liệu người dùng.
- Không tìm thấy AGENTS.md trong repository/worktree hiện tại. Đã đọc tài liệu `docs/Chia-module-va-hieu-nang.md`.

## Thay đổi

1. Giữ classic script và thứ tự 14 module từ d111afa, cùng cấu hình phục vụ Python/PowerShell và tài nguyên Electron.
2. Giữ phần render và font-size đã tách, bổ sung API AI1 vào các module tương ứng. Không thay file render bằng module wrapper nhỏ, tránh mất engine cũ. Guard được cài sau khi toàn bộ wrapper layout đã khai báo.
3. Guard dùng actualBoundingBox, giữ nguyên kích thước canvas vật lý, bảo vệ nét bằng dịch gốc khi còn đủ chỗ; không mở rộng giấy hay di chuyển đối tượng thật sự vượt biên trang vào trong. Có giới hạn an toàn và kiểm tra cài idempotent.
4. Sửa ô font thành chuỗi nháp: tạm rỗng/0/1/12 được giữ trong lúc gõ; Enter/rời ô xác nhận một lần, Escape hủy. Cỡ 0 không được áp dụng. Giá trị dương ngoài giới hạn được clamp khi xác nhận. Một lần xác nhận tạo một bước undo. Bổ sung test thao tác bàn phím thật.
5. Hợp nhất test nhóm: giữ kiểm tra pointer/live từ main, kiểm tra vị trí hiển thị cuối, kích thước và thành viên còn lại. Không bỏ assertion sản phẩm.
6. Test pixel cũ yêu cầu tổng alpha giống tuyệt đối sau dịch 400 px, thất bại 3/36 mẫu chữ nghiêng. Điều tra cho thấy lệch 565–660 alpha trên tổng khoảng 70 triệu, và **0 alpha ngoài khung tham chiếu**. Test nay kiểm tra trực tiếp không một pixel tham chiếu nào vượt khung và dùng sai số alpha 0,002% (chặt hơn mức 1% trước đó). Không bỏ kiểm tra nét chữ. 36/36 mẫu đạt.
7. Test ứng dụng chữ yêu cầu đủ 54 tổ hợp thực sự đi qua assertion pixel, tránh trường hợp test đạt vì bỏ qua toàn bộ mẫu.

## Kiểm chứng

| Nhóm | Kết quả |
| --- | --- |
| Python/module-loading | PASS: 23 URL JS/CSS HTTP 200 và MIME đúng; global, tạo/sửa, undo/redo, lưu/mở lại, PNG/SVG/PDF; không pageerror/HTTP lỗi |
| text-ink-bounds | PASS 36 tổ hợp |
| text-ink-clipping | PASS 36/36 mẫu, tái hiện 36 trường hợp mất nét trước guard, không pixel tham chiếu ngoài vùng |
| text-ink-installer | PASS: khổ canvas không đổi, giữ cắt theo biên chủ ý, không làm cắt ảnh khác, không cài wrapper hai lần |
| text-ink-real-app | PASS 54 tổ hợp Arial/Georgia × 64/180/320 × căn trái/giữa/phải × zoom 50/100/140, DPR 2; resize, một text layer |
| font-size-draft | PASS bàn phím thật: chọn hết/xóa hết, 1→12→120, Enter/rời ô, 0, Escape, clamp tối thiểu, một bước undo/redo |
| font-size-smooth, text-box-layer | PASS tăng font không quay lại cỡ cũ, resize tỷ lệ cập nhật cỡ; nhiều dòng trong một lớp, tạo ô mới thành lớp khác ở thiết kế thường |
| text-resize-performance | PASS 80 bước pointer: 3 lần preview, historyDelta 2, scale được bake về font thật; không tuyên bố FPS native |
| exact-group-layer, precise-layer-drag, canva-workflow, layer-transform, layers-scroll | PASS: kéo riêng thành viên, vị trí trên màn hình đúng, thành viên khác đứng yên, nhóm và kích thước giữ nguyên |
| output-paper | PASS tỷ lệ A3/A4/A5, PNG/SVG/Word đúng khổ, print target, editor không đổi |
| autosave | PASS normal/cloud, identity, đổi mẫu, phục hồi nháp |
| studio-smoke | PASS kho ảnh, tìm Việt, nhận diện trùng, crop, restart, nhóm chữ–ảnh–hình và khóa; 12 PDF tải thật |
| studio-pdf-check.py | PASS 12 PDF A5/A4/A3 ngang/dọc; số trang 1–17, kích thước và nội dung mọi trang/số bản |
| Electron manifest | PASS kiểm tra đủ 14 module trong extraResources; chưa build hoặc chạy native Electron |
| delete-template, art-ui, all-colors, image-color-performance, performance, image-tools, editor-interactions, properties-scroll, recent-fonts, curve | PASS; art-ui chạy nguyên test riêng lẻ sau timeout khi chạy cùng tải thumbnail |
| Cú pháp/whitespace | PASS node --check các module sửa, py_compile launcher, git diff --check |

Các test font cũ xác nhận giá trị bằng Enter/rời ô theo hành vi mới trước khi kiểm tra preview và resize. Các test API độc lập chỉ nạp phần guard, còn test thực nạp toàn bộ module qua HTML và launcher.

## Lỗi kéo thành viên nhóm được báo trong PR #8

AI2 xác minh `studio-objects.js` compact() chuẩn hóa tọa độ local và dịch tọa độ khối khi thả chuột. Test cũ chỉ so local x/y nên báo sai. Test tích hợp đo trên trang: thành viên chọn dịch đúng 80 × 35 px; thành viên còn lại đứng yên; kích thước và cấu trúc nhóm giữ nguyên. Không xác minh được lỗi sản phẩm snapback trên bản này; không sửa engine nhóm hoặc RAF để che test.

## Chưa đạt/chưa kiểm tra

- **Tem mây:** thao tác thật createCloudTemplate → bấm Văn bản cho kết quả labels=1, text units=1; nội dung được nối thêm dòng vào lớp cũ. Chưa có ô chữ độc lập trong tem mây; chưa nghiệm thu viền đi theo từng ô và nối thành một đường bao khi gần nhau. Phần này thuộc thiết kế tài liệu/đối tượng/render, cần một đợt phối hợp riêng, không coi bản sửa AI1 đã giải quyết.
- Test `clipboard-smoke` thất bại tại nút designFinishText đang ẩn; `shapes-smoke` thất bại vì panel Lớp chắn nút insertShapes trong cửa sổ hẹp. Đã đối chiếu pristine BASE d73c413, cùng lỗi. Art UI ban đầu timeout khi tạo thumbnail cùng tải kiểm thử khác; BASE cũng timeout, chạy lại nguyên test trên bản tích hợp riêng lẻ đã PASS. Không bỏ test hoặc dùng force click để cho đạt.
- Chưa có bằng chứng từ Mac/Windows thực tế, bộ cài native hoặc máy in thật. Không gửi lệnh in vật lý.
- Arial/Georgia được kiểm tra; chưa xác minh đúng font của ảnh lỗi gốc vì không có tên font.
- PNG/SVG/PDF đã tải thực và kiểm tra định dạng/kích thước/nội dung phù hợp; chưa có so sánh từng pixel toàn bộ đầu ra cho mọi font/hiệu ứng/crop. Đối tượng thật sự nằm ngoài giấy vẫn có thể bị cắt đúng biên giấy.

## Chạy và quyết định main

Mac: `bash Mo-TemHoa-Mac.command` trong thư mục nhánh tích hợp. Windows: `Mo-TemHoa-Windows.bat`. Cần phân phối toàn bộ JS/CSS/assets, không chỉ HTML.

**Chưa đủ điều kiện nghiệm thu toàn bộ TEMhoa/merge main theo yêu cầu tất cả bài kiểm thử đạt.** Phần chữ đã có bằng chứng trên ứng dụng thật; PR #8 không còn chỉ được kiểm tra độc lập. Nhánh tích hợp cần giữ draft cho tới khi xử lý hoặc phân định rõ các blocker trên.
