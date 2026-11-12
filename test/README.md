# Test game trong Node (không cần trình duyệt)

Game là web 3D nên "test thật" thường cần trình duyệt. Trong máy này KHÔNG có
trình duyệt headless dùng được (xem dưới), nên test chạy game logic thật trong
Node bằng cách bundle code game với stub `three` + stub DOM — các hàm được
test là hàm thật, không phải bản sao.

## Chạy

```sh
npm install            # lần đầu (cần esbuild — đã có qua vite)
node test/save-shopping.test.mjs   # 124 kiểm tra, tự build bundle rồi chạy
node test/npc-pathing.test.mjs     # 177 kiểm tra đường đi + lịch dân làng + địa điểm mới 4.3
node test/weather.test.mjs         # 66 kiểm tra thời tiết + mùa (Phase 4.1)
node test/festivals.test.mjs       # 110 kiểm tra lễ hội trong năm (Phase 4.2)
node test/lighting.test.mjs        # 104 kiểm tra ánh sáng, đèn, chuyển động, âm thanh (Phase 4.4)
node test/perf.test.mjs            # 59 kiểm tra hiệu năng PC: vật liệu/hình học dùng chung, tầng chất lượng, HUD chỉ ghi khi đổi (Phase 4.5)
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

`test/npc-pathing.test.mjs` (177 kiểm tra, đều đậu):
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
- **Địa điểm mới 4.3 (thêm 67 kiểm tra):** chùa có vòng chặn r=2,8, rừng tre
  3 khóm r=0,9, đồi có vòng chặn r=2,2 — cả 5 vòng đều nằm ngoài sân rào
  lõi; bà Năm ghé chùa 05:30–07:00, bác Hai nghỉ ở rừng tre 13:00–15:30;
  điểm thắp hương / 3 cây măng / ghế đá trên đồi đều ngoài vòng chặn và
  trong bản đồ; 3 nút "Đi tới" mới cũng vậy; đi bộ bằng đúng `collide()`
  của game từ mỗi chỗ mới về giữa làng đều tới được (không ngõ cụt).
  Tương tác thật qua `doInteract`/`findTarget`: thắp hương +1 sao, lần 2
  cùng ngày không tăng; ngồi nghỉ trên đồi ghi kỷ niệm, không cộng sao;
  hái măng từng cây 1 lần/ngày (cây đã hái thì ẩn), hái hết 3 cây bán cho
  anh Đức được 18.900đ; qua đêm (nút "Ngày mới" thật) măng mọc lại đủ 3
  cây, mai thắp hương/nghỉ đồi lại được; vòng tròn lưu/tải giữ trạng thái
  thắp hương + măng đã hái; save cũ không có trường 4.3 vẫn đọc được,
  mặc định chưa thắp hương, măng còn đủ 3 cây. Lỗi tìm được khi làm 4.3:
  bác Hai đi thẳng từ rừng tre về nhà thì kẹt cứng ở khe giữa 2 vòng chặn
  chồng nhau của nhà chính + ghế hiên (đứng yên ở (-10,5, -2,5) tới hết
  ngày) — đã sửa bằng điểm `via` đi vòng qua phía đông ao rồi theo đường
  làng phía bắc, về tới nhà sau 69 phút trong ca 210 phút.

`test/weather.test.mjs` (66 kiểm tra, đều đậu — Phase 4.1):
- **Mùa:** chu kỳ 60 ngày (30 mưa + 30 khô), kiểm tra đúng ranh giới
  ngày 1/30/31/60/61/90/91/120/121.
- **Bốc thời tiết:** ép `Math.random` về các ngưỡng để kiểm tra đúng loại
  (mưa/giông/mây/nắng) và giờ mưa + độ dài mưa từng mùa; bốc 1000 lần với
  seed cố định: mùa mưa ~50% ngày mưa/giông, mùa khô ~10%.
- **Mưa:** `startRain()` thật tưới miễn phí luống + cây ăn quả, không tốn
  nước giếng; qua đêm (nút "Ngày mới" thật) luống được mưa tưới lớn thêm.
  Ngày nắng mùa khô: điều kiện mở mưa sai, luống/cây vẫn khô.
- **Giông:** ép 30% trúng/trượt — trúng thì đúng 1 luống chín rụng xuống
  50%, gọi mưa lần 2 không quật thêm; trượt thì không luống nào bị sao.
- **Save/load:** vòng tròn lưu/tải giữ thời tiết hôm nay; ngày nắng lưu
  `rainAt: null` (Infinity không vào được JSON) và tải lại thành Infinity;
  save cũ không có trường thời tiết vẫn đọc được, mặc định nắng.

`test/festivals.test.mjs` (110 kiểm tra, đều đậu — Phase 4.2):
- **Lịch:** năm 360 ngày, đúng ngày đã ghi (Tết 31–33, sinh nhật bé An 45,
  sum họp 75/165/255/345, sinh nhật anh 135, kỷ niệm ngày cưới 180, sinh
  nhật vợ 225, Trung thu 270, sinh nhật bà Tư 315); ngày thường không có
  lễ; năm sau lặp lại đúng ngày (391 lại Tết Mùng 1, 630 lại Trung thu);
  mỗi năm đúng 13 ngày lễ, không ngày nào trùng 2 lễ. Tết rơi vào mùa
  khô, Trung thu rơi vào ngày cuối đợt mùa mưa (ngày 270 = ngày 30 của
  chu kỳ 60).
- **Qua đêm thật (nút "Ngày mới"):** sang ngày 31 thì lì xì Tết 20.000đ
  + 2 sao, nhiệm vụ lễ hội "Gói 2 bánh chưng" thay 1 việc (vẫn 3 việc),
  HUD hiện "Tết Mùng 1", trang trí Tết hiện, kỷ niệm + bảng tổng kết cuối
  ngày đều ghi lễ hội.
- **Quà 1 lần:** gọi `checkFestivalToday()` lại trong ngày, và save → tải
  lại giữa ngày, đều không tặng thêm; sang ngày 32 thì Tết Mùng 2 tặng
  quà riêng của nó.
- **Đồ lễ hội:** bánh chưng chỉ bán ngày 28–36, bánh trung thu + lồng đèn
  ngày 265–274, lồng đèn thêm ngày 42–48; ngày thường mua thì từ chối,
  không trừ tiền. Mua đủ 2 bánh chưng thì xong việc lễ Tết (+10.000đ +
  1 sao); mua 1 lồng đèn Trung thu thì xong việc lễ (+5.000đ + 1 sao).
  Bán lại ở chợ: chị Lan mua bánh trung thu +10% (2 cái = 26.400đ),
  anh Đức mua lồng đèn +5% (5.300đ).
- **Save/load:** vòng tròn lưu/tải giữ `festivalClaimed` + lễ hôm nay
  (kể cả đồ lễ trong giỏ); save cũ không có trường lễ vẫn đọc được,
  mặc định quà rỗng / lễ null, rồi mở game ngày lễ thì quà vẫn tặng
  được đúng 1 lần (sinh nhật bé An: 2 hạt cải + 1 sao).
- **Việc lễ khác:** sinh nhật bé An (nhặt 3 trứng), Mùng 2 (chúc Tết 3
  người), sum họp (bán 30.000đ), kỷ niệm ngày cưới (nấu cơm + quà 15k
  + 2 sao) đều xong được bằng đúng bộ đếm game; bốc 20 lần việc thường
  không lần nào lọt việc lễ.
- **Trang trí:** Trung thu đèn lồng + trăng to (×1,9), sinh nhật bàn +
  bánh hồng + bóng bay, kỷ niệm ngày cưới bàn + bánh đỏ, sum họp chỉ
  bàn tiệc; ngày thường dọn hết, trăng về cỡ cũ, tóm tắt lễ là
  "Không có lễ hội".
- **Lưu ý khi test:** sang ngày 31 thì thành tựu "Một tuần ở quê" cũng
  ghi thêm 1 dòng kỷ niệm — test kỷ niệm Tết chỉ cần dòng Tết có mặt,
  không đếm đúng +1 dòng.

`test/perf.test.mjs` (59 kiểm tra, đều đậu — Phase 4.5):
- **Số đo cảnh:** traversal thật của scene sau tối ưu: 1.420 vật / 1.215 mesh / 4 PointLight + 1 DirectionalLight + 1 HemisphereLight / 44 vòng chặn / 297 vật đổ bóng (vườn trống) — giống hệt trước tối ưu; vật liệu khác nhau 651 → 248, hình học khác nhau 1.088 → 409 (ngưỡng test: < 300 và < 500).
- **Dùng chung đúng chỗ:** mỗi màu trơn (cọc rào 0xb59a5e, gỗ 0x7a4a21, nâu đậm 0x5a3a22, nón lá 0xd6b26a) chỉ còn đúng 1 vật liệu Lambert không map; `box()/cyl()/sph()` gọi 2 lần cùng cỡ dùng chung 1 geometry, lần 2 không thêm geometry mới.
- **Không dùng chung nhầm:** 4 buồng chuối dùng 4 vật liệu riêng (hái xong đổi màu từng buồng), 3 vòng sáng cây ăn quả dùng 3 vật liệu riêng (đổi màu/độ mờ theo trạng thái từng cây), tường nhà chính khác vật liệu tường trường (sơn nhà không sơn luôn trường — lý do `texMat()` không được cache).
- **Tầng chất lượng:** `shadowSizeForLevel()` đúng ngưỡng (0: 2048, 1: 1536, 5: 768, quá tầng kẹp 768, âm kẹp 2048), bóng nhỏ dần theo tầng; `applyQualityLevel()` ghi đúng `qualityState` (level / bóng / phân giải) và kẹp tầng vượt quá.
- **Hạt hiệu ứng:** ban đầu `pAlive` = 0; tạo 5 hạt thì sống 5, bay xong chết hết; không hạt sống thì `updateParticles()` không chạm buffer (`needsUpdate` vẫn false); tạo 345 hạt thì kẹp ở PMAX 340 rồi vẫn chết hết đúng số.
- **HUD:** gọi `updateHUD()` lần 2 không đổi gì thì không ghi thêm text nào (đếm bằng `hudWriteStats()`), đổi tiền thì chỉ ghi đúng 1 ô; thẻ nhiệm vụ ghi 1 lần rồi không ghi lại, thêm 1 nhiệm vụ thì ghi lại đúng 1 lần (`questCardWriteStats()`).
- **Bóng đổ:** trồng kín 12 luống rau chín (132 mesh) thì không mesh rau nào đổ bóng, đất luống vẫn đổ bóng; cây xoài trưởng thành vẫn đổ bóng, vòng sáng cây có trái chín mờ 0.85 như cũ.
- **Tra cứu đã cache:** giữ sẵn 2 ô kính cửa sổ; `updateSky()` chạy xong mà `scene.traverse` không bị gọi lần nào (đếm bằng cách bọc traverse); đủ 5 con gà, đầu gà giữ sẵn trong `userData` và khớp `getObjectByName('head')`; đuôi trâu giữ sẵn ở `window.__buffaloTail`.
- **Cái gì KHÔNG đo được:** FPS thật và số draw call thật — stub renderer là no-op, không có trình duyệt/WebGL ở đây. Test chỉ chứng minh tài nguyên (vật liệu/hình học/bóng) giảm và logic tầng chất lượng + cache đúng; muốn biết game có mượt hơn thật không phải chơi trên PC thật.

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

`test/lighting.test.mjs` (104 kiểm tra, đều đậu — Phase 4.4):
- **Ánh sáng hoàng hôn:** `daylightState()` thuần theo phút — 05:30 cường
  độ 0.75, 12:00 cường độ 1.05, 18:30 cường độ ~0.62, nắng ngả cam (hue
  nhỏ hơn trưa, đậm màu, tối dần), bóng dài > 2.5 lần trưa, 19:00 còn
  0.5; `updateSky()` thật áp dụng đúng vào scene (sun.intensity, khung
  bóng mở ×1.8 lúc hoàng hôn); `smooth01` kẹp đúng biên 0/1.
- **Đèn chập tối:** `lanternLevel()` tắt trước 17:00, sáng dần 17:00–
  17:30, sáng hẳn tới 19:00; `updateLanterns()` thật: ban ngày 2 đèn
  PointLight mới (sạp + chùa) cường độ 0, bóng mờ; 18:30 cả hai sáng,
  bóng ngả vàng, đèn sạp sáng hơn đèn chùa; giông 18:30 đèn vẫn sáng
  (đèn chỉ theo giờ, không theo thời tiết).
- **Giông cộng hoàng hôn:** `stormDimFactor()` đúng hệ số cũ (giông
  ×0.32, mưa ×0.5, mây ×0.85, nắng ×1); `finalSunIntensity()` 18:30
  giông ~0.20 < 18:30 nắng ~0.62 nhưng > 0, và trưa giông vẫn sáng hơn
  hoàng hôn giông.
- **Chuyển động:** `smoothFacing()` giới hạn tốc độ quay, đi đường ngắn
  qua vòng ±PI; `walkBobY()` = 0 khi đứng, > 0 giữa nhịp khi đi, đi
  nhanh nhấp nhiều hơn; `idleSway()` rất nhẹ và lệch pha mỗi người;
  `applyWalkAnim()` trên hình nộm + `updateVillagers()` thật: bác Hai
  đi bộ về nhà thì mặt xoay dần (không bẻ ngoặt), thân nhấp nhô, chân
  vung; tới đích thì chân về 0, thân khẽ nghiêng.
- **Âm thanh:** mọi hàm tiếng mới đều no-op an toàn khi `AC` null
  (chuông chùa, dế, `initAmbient`, `updateAmbient` cả khi tắt tiếng);
  `cricketLevel()` 0 ban ngày → ~0.5 lúc 17:00 → 1 lúc 18:00;
  `bambooWindLevel()` = 1 trong rừng (≤6m), ~2/3 ở 12m, 0 ngoài 24m
  và giữa làng; thắp hương ở chùa thật (E tại điểm thắp hương) vẫn
  +1 sao và không lỗi khi `AC` null.

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
- **Âm thanh** không nghe được thật (AudioContext không có trong Node,
  `AC` luôn null) — test Phase 4.4 chỉ kiểm chứng các hàm tiếng mới
  không lỗi khi `AC` null, mức dế/gió tre tính đúng theo giờ và khoảng
  cách, và cổng `Sound` chặn được. Tiếng chuông chùa, gió rừng tre, dế
  chiều tối có vang đúng như thiết kế hay không cần nghe trên trình
  duyệt thật.
- **Ánh sáng / đèn / chuyển động** chỉ kiểm chứng bằng số liệu hàm thuần
  và trạng thái scene trong stub (cường độ nắng, màu hue, khung bóng,
  cường độ PointLight, góc xoay, độ nhấp nhô) — chưa nhìn thấy bằng mắt
  rằng hoàng hôn trông ấm hơn, đèn lồng sáng đẹp, hay dân làng đi có
  hồn hơn. Cần mở trình duyệt thật lúc chập tối trong game để xem.
