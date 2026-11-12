# Test game trong Node (không cần trình duyệt)

Game là web 3D nên "test thật" thường cần trình duyệt. Trong máy này KHÔNG có
trình duyệt headless dùng được (xem dưới), nên test chạy game logic thật trong
Node bằng cách bundle code game với stub `three` + stub DOM — các hàm được
test là hàm thật, không phải bản sao.

## Chạy

```sh
npm install            # lần đầu (cần esbuild — đã có qua vite)
node test/save-shopping.test.mjs   # 124 kiểm tra, tự build bundle rồi chạy
node test/npc-pathing.test.mjs     # 110 kiểm tra đường đi + lịch dân làng
node test/economy-sim.mjs          # mô phỏng kinh tế 30 ngày, in bảng + kết luận
# OLD_CROPS=1 node test/economy-sim.mjs   # chạy lại với giá rau cũ để so sánh trước/sau
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

`test/save-shopping.test.mjs` (124 kiểm tra, đều đậu):
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
- **Làng (Giai đoạn 3, thêm 48 kiểm tra):** lịch sinh hoạt theo giờ đúng
  (cô Ba 5:30 ở nhà, 8:00 ở sạp, 18:00 về nhà; cô giáo 10:00 ở sân trường;
  bác Hai 8:00 ở ruộng; ông Tư 10:00 ở tiệm); dân làng đi lại về đúng phía
  mục tiêu; giá chợ cô Ba +10%, anh Đức +5% và cao hơn giá sạp làng; bán 5
  cải cho cô Ba nhận đúng tiền, giỏ hết, ghi vào `marketSoldToday`; cô Ba
  không mua cá; mua bánh đậu xanh trừ 8.000đ +1 sao, mua lần 2 cùng ngày
  không được, không đủ tiền mua gạo thì không mua; chào bác Hai lần đầu +1
  sao, chào lại không tăng; đưa cô giáo 2 trứng gà: chưa đủ 2 thì không giao,
  đủ thì giao xong hết trứng, nhiệm vụ xong, thưởng 15.000đ; `rollQuests` 5
  lần đều có việc đưa bé đi học (bug chỉ số 8 cũ đã sửa); bảng sạp chợ / tạp
  hóa mở được không lỗi; qua đêm reset hết số liệu làng.

`test/npc-pathing.test.mjs` (110 kiểm tra, đều đậu):
- **Lịch:** 7 dân làng phủ kín 05:30–19:00 không hở giờ; đúng giờ ở sạp
  (cô Ba 06:30–17:00, chị Lan 07:00–17:00, anh Đức 07:00–16:00), tiệm tạp
  hóa ông Tư 06:00–18:00, sân trường cô giáo 07:00–16:30, ruộng bác Hai
  07:00–11:00, ao anh Đức 05:30–06:00 và 16:00–18:00.
- **Điểm đến:** mọi điểm trong lịch (kể cả điểm `via`) nằm ngoài vòng chặn
  và trong bản đồ; cặp dân làng gần nhất vẫn cách nhau 1,2m — không ai đứng
  trong tường nhà hay trùng chỗ nhau (3 lỗi cũ đã sửa: dân làng đứng lọt
  trong nhà hàng xóm, bác Hai/bà Năm trùng điểm trước sạp, ông Tư đứng
  trong vòng chặn nhà chính do vòng nhà r=5,2 phủ lấn).
- **Mô phỏng cả ngày bằng `updateVillagers` thật** (1 phút game = 2/3 giây
  thật, đi 1,6 m/s, trượt quanh vật cản): 0 lần đi xuyên vật thể, mọi ca
  đều tới điểm hẹn trước khi hết ca, cả ở trạng thái mặc định và sau khi mua
  đủ nâng cấp (tủ lạnh, xe máy, chuồng lợn... thêm 4 vòng chặn). Ca đi lâu
  nhất: anh Đức từ ao về nhà 46 phút (đi vòng qua đường làng phía bắc,
  trong ca 60 phút).

## Lưu ý: test từng rớt lúc đậu lúc rớt (đã sửa)

`save-shopping.test.mjs` từng đậu 124/124 nhưng thỉnh thoảng rớt 5 kiểm tra
tiền (mua tivi ra 55.000đ thay vì 50.000đ, lãi lợn 30.000đ thay vì 25.000đ
— lệch đúng 5.000đ). Nguyên nhân: `src/core/save.ts:88` có `rollQuests()` ở
cấp module, nên lúc nạp game đã bốc sẵn 3 việc ngẫu nhiên; khoảng 20% số lần
bốc trúng việc "Mua 1 món ở sạp" (thưởng 5.000đ), mua tivi hay chuồng lợn
xong là hoàn thành việc đó nên tiền tăng thêm 5.000đ. Đây là hành vi game
đúng, lỗi ở test. Cách sửa: (1) seed `Math.random` bằng mulberry32
(20261112) trước khi nạp bundle — cả 3 file test + sim đều dùng chung seed;
(2) `resetState()` của save-shopping test xóa `G.quests` về rỗng, các kiểm
tra tiền không còn nhiễm thưởng nhiệm vụ; test nào cần nhiệm vụ thì tự đặt
tường minh. Sau khi sửa: 10/10 lần chạy đều 124/124.

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
