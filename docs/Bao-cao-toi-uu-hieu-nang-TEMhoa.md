# Báo cáo tối ưu hiệu năng TEMhoa — 07/10/2026

Phạm vi: chỉ repository minhdienhp2013/TEMhoa, nhánh feat/top-properties-20261006. Không merge main, không phát hành, không đổi giao diện tổng thể hoặc schema dự án. Không tạo lại mẫu AI. Tem mây/Tem thường, chủ đề, 6 thiết kế gần đây, kho tài nguyên, clipboard, font, crop, mask, nhóm, nền mây và pipeline xuất vẫn được giữ.

## Nguyên nhân và mã sửa

| Đường nóng | Nguyên nhân có bằng chứng | Thay đổi |
| --- | --- | --- |
| Kéo/resize/rotate ảnh | Live renderer vẽ mọi ảnh và reset kích thước canvas mỗi frame; toàn bộ tay nắm DOM bị tạo lại mỗi pointermove | image-tools.js giữ lớp tĩnh; chỉ vẽ đối tượng/nhóm đang thao tác; tái dùng canvas khi kích thước không đổi. TemHoa-MinhDien.html giữ DOM overlay và gộp cập nhật hình học qua RAF |
| Kéo/resize chữ và cả tem | Dựng lại mask/render và zoom/panel quá dày; zoom đọc settings chứa ảnh | Cache mask/lớp tĩnh cho riêng chữ được chọn; zoom/overlay được gộp bằng RAF, geometry-only update trong transform cả tem |
| Slider ảnh | Mỗi input ngoài màu gọi full preview + before/after history | Mở rộng live transaction cho opacity, brightness, contrast, saturation, temperature, blur, radius, stroke width và shadow. RAF lấy giá trị mới nhất; change/blur/undo/save/đóng panel chốt renderer chuẩn |
| Text | Mỗi ký tự serialize history đầy đủ, tạo lại thẻ font từng dòng | Gõ theo draft DOM, giữ bitmap preview; gộp history theo đợt gõ 800 ms/blur/undo/save. Reuse line-font cards khi số dòng/font list không đổi, cập nhật nhãn |
| History | Snapshot chứa nhiều bản lặp data URL ảnh, clone bằng JSON rồi stringify tiếp | Clone metadata không serialize chuỗi ảnh. Snapshot nội bộ dùng pool ảnh nguồn dùng chung; undo giải tham chiếu trước restore. Prune ảnh không còn được history tham chiếu; giữ 80 bước/64 MiB gồm pool, không đổi file dự án |
| Autosave | capture ở preview/history tạo snapshot + fingerprint liên tục; writer cũ có thể chạy giữa cử chỉ | Dirty/version flag; capture đầy đủ ở flush; debounce 1000 ms. Đợt gõ thường lưu khoảng 1200 ms từ ký tự cuối. Gesture save gate chặn draft/network đang chờ; save cuối dùng giá trị cuối, lỗi giữ nháp |
| Layer panel | zoom/preview gọi xây lại mọi row, thumbnail và listener | Chỉ rebuild khi cấu trúc/order/type đổi; đổi tên/thumbnail/lock/selection cập nhật row hiện có. Geometry, màu và opacity không gây dựng lại danh sách |
| Image cache | graphicImages không giới hạn; image filter cache key serialize cả data URL | Giới hạn cache ảnh không dùng bằng 32 entries/64 triệu pixel, bảo vệ nguồn đang dùng trong document. Filter key dùng bitmap identity; filter realtime dùng tối đa 1600 px, commit/export dùng nguồn đầy đủ |
| Import ảnh | Đường upload cũ giảm nguồn còn 1400 px không thể khôi phục | Dùng assetFromFile giữ nguyên bytes/kích thước nguồn và kiểm tra giới hạn; preview xử lý riêng |
| Lifecycle | RAF/gesture/typing có thể còn giữ save suspension khi mất focus/đóng trang; autoContexts giữ fingerprint thiết kế cũ | Release trên cancel/lost capture/blur/pagehide, cancel RAF; bỏ context đã lưu không còn active, giữ context lỗi/pending |

Document settings vẫn là dữ liệu dự án. Bitmap/DOM/working properties trong cử chỉ là preview và không serialize/lưu/ghi history mỗi frame; commit cuối đi qua renderer chuẩn. Không thay engine, không thêm dependency. Chưa chuyển toàn bộ ứng dụng cũ sang immutable patch engine: history vẫn là snapshot metadata dùng pool ảnh, không phải delta hoàn toàn.

## Benchmark trước/sau

Chromium headless Linux, 1600×1000, cùng fixture và đường thao tác. Mỗi lượt dưới đây có 60 cập nhật, mỗi cập nhật chủ ý đợi hai RAF; nền khoảng 33 ms là nhịp harness, **không phải phép đo FPS 60 Hz**. Counts gồm phần chốt cuối, không gồm bước chuẩn bị live layers. P95 không đo startup/import/export.

| Số hình | Lượt vẽ trước → sau | DOM tạo trước → sau | P95 ms trước → sau |
| ---: | ---: | ---: | ---: |
| 10 | 640 → 100 | 2069 → 107 | 34 → 34 |
| 50 | 3100 → 160 | 10225 → 463 | 34 → 34 |
| 100 | 6200 → 260 | 20425 → 913 | 35 → 35 |
| 300 | 18600 → 660 | 61225 → 2713 | 65 → 35 |

300 hình: giảm khoảng 96% lượt vẽ và DOM tạo mới. Thử thêm 300 cập nhật (~10 giây): P50 33/P95 37 ms, 1500 lượt vẽ/2717 DOM. 20 và 50 ảnh 1024×768 trong diagnostic scene: P95 34 ms. Đây là stress fixture inject trực tiếp để đo engine; không nâng giới hạn 12 hình/tem, 20 tem của sản phẩm. Test lưu/mở lại 20/50 ảnh thực dùng nhiều tem, mỗi tem 10 ảnh, trong các giới hạn hiện có.

Màu ảnh: 60 input không full preview giữa cử chỉ; P50 17/P95 20 ms/max 23 ms trong lượt đo hồi quy, final bitmap bằng renderer. Burst 50 input: 1 full preview/2 lần record before-after (before trùng không thêm snapshot), không replay 50 lần. Thời gian đo thay đổi theo tài nguyên máy, không cam kết mọi máy không lag.

Raw: hieu-nang-truoc-toi-uu.json và hieu-nang-sau-toi-uu.json.

## Kiểm chứng chức năng

- performance-smoke: 25 input cho opacity/blur/temperature/shadow blur/radius, **0 full preview, 0 bước history, 0 revision autosave trong cử chỉ**, đúng 1 history cuối; nguồn import 2400×1600 giữ nguyên bytes. Gõ nhanh không tăng history theo ký tự; undo/redo nội dung và row DOM còn nguyên; dirty=false sau lưu.
- Stress ngắn: 100 lần chỉnh + 120 lần mở/đóng panel; document/window listener count qua CDP không tăng; history tối đa 80, một ảnh nguồn dùng chung (732708 bytes metadata + 212820 bytes nguồn trong fixture), save gate trở về 0.
- Cache: nạp 60 ảnh tạm, cache không dùng trở về ≤32; không evict ảnh đang dùng. 20/50 ảnh qua Python template API → file mẫu → reload → mở lại đủ số lượng.
- Debug: chỉ xuất hiện khi ?debugPerformance=1; counters canvas/layer/history/save/frame, khoảng cách frame gần nhất, undo/redo, cache và heap nếu hỗ trợ. Không có loop khi idle: counters không đổi trong 1,5 giây thử. Heap không phải tổng RAM/GPU.
- Hồi quy PASS: all-colors-smoke, image-color-performance, layer-transform-smoke, editor-interactions-smoke, image-tools-smoke, shapes-smoke, autosave-smoke, clipboard-smoke, art-ui-smoke, properties-scroll-smoke, recent-fonts-smoke, design-smoke, delete-template-smoke, output-paper-smoke, studio-smoke, studio-core.
- PDF parser thực tế: studio-pdf-check PASS A3/A4/A5 ngang/dọc, toàn bộ trang (đến 17 trang), kích thước vật lý và dàn bản tem. PNG/SVG/Word kích thước thực, mask/alpha và màu qua các smoke tests; không in ra máy thật.
- JS syntax (toàn bộ inline scripts và modules), Python compile, git diff --check. Repository là HTML/JS thuần, không có TypeScript/lint frontend/build bundler để chạy. Python launcher dùng thực trong E2E; Electron main syntax và tài nguyên được giữ trong cấu hình.
- Test design-smoke cũ yêu cầu body clear bất kể dữ liệu và không có nút nền mây, trái với bản sửa nền mây đã tồn tại; cập nhật assertion để yêu cầu nguồn màu mây được giữ, solid/clear có pixel và SVG khác nhau. Không vô hiệu hoá test.

## Giới hạn và tiếp tục theo dõi

Chưa chạy soak **30 phút hoặc 1 giờ thực**, chưa profiling trên Windows/macOS native và chưa build installer Electron: máy kiểm thử Linux không có native backend đóng gói/models. Không tuyên bố đã đạt mọi mục tiêu hiệu năng hoặc hết mọi memory leak. Các bản kiểm thử ngắn không thay thế đo dài hạn/thiết bị người dùng.

Có runner soak thật, không tua thời gian: TEMHOA_SOAK_MINUTES=30 (hoặc 60) node tests/performance-smoke.cjs; cần Playwright + Chromium/Python dependencies. Mặc định CI chạy stress ngắn để không tiêu tốn 30–60 phút mỗi commit. Có thể chạy node tests/performance-benchmark.cjs để đo lại.

Nguồn ảnh đang dùng phải được giữ; cache 32/64Mpx là soft budget cho ảnh không dùng, có thể vượt khi nhiều ảnh lớn đang active. FontFace đang dùng/đã nạp chưa áp evict mù vì có thể phá chữ và export; cần đo riêng khi đổi rất nhiều phông. GPU canvas memory không được performance.memory phản ánh. Group/ungroup vẫn dùng transaction/render chuẩn để giữ kết quả; chưa dựng patch engine mới. Panel structural rebuild vẫn O(N) khi thêm/xoá/reorder; chưa virtualization. PDF vẫn raster. Tách nền kiểm tra backend contract bằng fixture, chưa benchmark mô hình AI thật.

Chạy Mac: bash Mo-TemHoa-Mac.command. Windows: Mo-TemHoa-Windows.bat. Đóng bản/tab cũ trước khi dùng nhánh nâng cấp; main chưa cập nhật.

