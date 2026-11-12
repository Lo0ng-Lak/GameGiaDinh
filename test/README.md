# Test game trong Node (không cần trình duyệt)

Game là web 3D nên "test thật" thường cần trình duyệt. Trong máy này KHÔNG có
trình duyệt headless dùng được (xem dưới), nên test chạy game logic thật trong
Node bằng cách bundle code game với stub `three` + stub DOM — các hàm được
test là hàm thật, không phải bản sao.

## Chạy

```sh
npm install            # lần đầu (cần esbuild — đã có qua vite)
node test/save-shopping.test.mjs   # 76 kiểm tra, tự build bundle rồi chạy
node test/economy-sim.mjs          # mô phỏng kinh tế 30 ngày, in bảng + kết luận
```

## Cách test hoạt động

- `three-stub.mjs` — bản nhái tối thiểu của Three.js: mọi hàm vẽ là no-op, chỉ
  giữ trạng thái mà logic game đọc/ghi (position, visible, children...).
- `dom-stub.mjs` — `document`/`window`/`localStorage` giả. `getElementById`
  trả về cùng một phần tử cho cùng id, `addEventListener` ghi lại handler để
  test gọi trực tiếp — nhờ vậy test bấm được đúng nút "Ngày mới" thật của
  `day.ts`, chạy đúng code qua đêm (cây lớn/ra trái, giá mới, nhiệm vụ mới,
  trừ sinh hoạt).
- `entry.ts` — tái xuất API game cần test. Import `main.ts` ĐẦU TIÊN để vòng
  tròn main ↔ hud ↔ sound khởi tạo đúng thứ tự (như trình duyệt nạp main
  trước); `requestAnimationFrame` stub là no-op nên `animate()` chỉ chạy 1 khung.
- `build-bundle.mjs` — dùng esbuild gom entry thành 1 file CJS ở
  `/tmp/game-test-bundle.cjs` (không đi vào repo), thay `three` bằng stub.

## Cái gì đã được test thật

`test/save-shopping.test.mjs` (76 kiểm tra, đều đậu):
- **Save/load:** lưu trạng thái có tivi, cây giống, cây xoài đang lớn, vịt, 2
  lợn con, 1 luống rau → xóa sạch → tải lại → mọi thứ khớp. Save cũ Phase 2
  (không có `ripen`, lợn dùng `growDays` chung) vẫn đọc được, tự chuyển sang
  `days[]` theo từng con.
- **Mua sắm:** không đủ tiền thì không mua, mua rồi không mua lại (đồ nhà),
  chuồng đầy 2 lợn thì không mua thêm, mua xong save/load vẫn còn.
- **Cây ăn quả:** xoài 5 ngày tưới mới lớn, ổi 4 ngày; xoài chăm 3 ngày mới ra
  2 trái, ổi 2 ngày ra 2 trái; không tưới thì đứng yên; trái chưa hái hết thì
  không ra đợt mới; cây trưởng thành trong save cũ ra trái lại sau 3 ngày chăm
  (bug cũ: không bao giờ ra trái nữa).
- **Lợn:** ăn 6 hôm chưa lớn, bỏ 1 hôm thì đứng yên, ăn đủ 7 hôm thì lớn;
  bán 120.000đ; 1 con lãi ròng đúng 25.000đ.
- **Qua đêm:** nút "Ngày mới" thật — sang ngày, trừ sinh hoạt 12–16k, cây lớn
  thêm 1/5, luống lớn thêm 0.25, quay giá, nhiệm vụ mới 3 việc.

## Cái gì KHÔNG test được ở đây

- **Trình duyệt headless: không có.** Chrome hệ thống (`/opt/meta-chromium`)
  từ chối khởi động: "Hatch WebGL domain policy is required for browser
  startup" (exit 13). Cài Chromium qua Playwright cũng không được: lệnh
  `playwright install` treo ở bước chờ xác nhận, tải trực tiếp file zip từ CDN
  Playwright đều bị chặn (gateway trả `GatewayExceptionResponse`). npm registry
  thì vẫn truy cập được (đã cài `playwright-core`), nhưng không có file trình
  duyệt để chạy. Vì vậy **không có smoke test trình duyệt thật** trong lần này:
  chưa kiểm chứng bằng mắt rằng game render ra hình, click chuột/E trong 3D
  hoạt động, và save/load chạy trên trình duyệt thật. Cần chạy `npm run dev`
  rồi mở trình duyệt thật để chơi thử trước khi nghiệm thu.
- **Tương tác 3D theo vị trí người chơi** (đi tới luống, bấm E trồng/hái theo
  `doInteract`) không test được trong Node — test đặt trạng thái cây/lợn trực
  tiếp rồi gọi hàm logic. Phần tính toán của vườn rau trong mô phỏng kinh tế
  cũng là mô hình bằng số liệu thật của CROPS, không lái qua tương tác 3D.
- **Âm thanh** không test (AudioContext không có trong Node, `AC` luôn null).
