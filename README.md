# GameGiaDinh — Game nông trại gia đình Việt (TypeScript + Vite)

Game nông trại góc nhìn thứ nhất: một ngày sống trong gia đình nông thôn Việt Nam — làm vườn, nuôi gà, nấu cơm, đưa bé An đi học, bán hàng ở chợ, đón chồng đi làm thuê về.

> **Bản này là dự án TypeScript + Vite, chạy bằng máy chủ phát triển (dev server).**
> **Mở trực tiếp file `index.html` bằng trình duyệt sẽ KHÔNG chạy được** — phải chạy qua `npm run dev` như hướng dẫn bên dưới.

## Chạy game trên máy (Windows / macOS / Linux)

**Điều kiện:** đã cài [Node.js](https://nodejs.org) **18 trở lên** (khuyên dùng bản LTS mới nhất). Kiểm tra bằng:

```bash
node --version
npm --version
```

**Lần đầu tiên (chỉ cần làm 1 lần):**

```bash
npm install
```

**Chạy game để chơi / phát triển:**

```bash
npm run dev
```

Mở trình duyệt vào địa chỉ mà terminal in ra, thường là:

```
http://localhost:5173
```

Game sẽ tự tải lại khi sửa code trong `src/`.

**Build bản production:**

```bash
npm run build
npm run preview
```

`npm run build` tạo thư mục `dist/`; `npm run preview` chạy thử bản `dist/` đó trên máy.

## Chơi trên web (GitHub Pages)

Game được deploy tự động lên GitHub Pages mỗi lần push code lên nhánh `main` (workflow `.github/workflows/deploy.yml`: build rồi deploy, không cần làm gì thêm):

```
https://lo0ng-lak.github.io/GameGiaDinh/
```

Mở link trên máy tính hoặc điện thoại là chơi được ngay, không cần cài Node hay chạy `npm run dev`.

**Lưu ý về dữ liệu lưu game:** game lưu vào localStorage của trình duyệt, gắn với từng địa chỉ web (origin). Bản trên GitHub Pages là một địa chỉ khác với `localhost:5173`, nên **bản Pages bắt đầu với dữ liệu lưu mới (trống)** — dữ liệu lưu cũ trên localhost vẫn còn nguyên trong trình duyệt, không bị xóa, chỉ là hai bản lưu riêng biệt ở hai địa chỉ khác nhau. Muốn chơi tiếp tiến trình cũ thì vẫn chạy `npm run dev` trên máy như trước.

## Cấu trúc dự án

```
GameGiaDinh/
├── index.html          # Vỏ Vite: khung HTML + CSS, nạp /src/main.ts
├── package.json        # three, vite, typescript; scripts: dev, build, preview
├── vite.config.ts
├── tsconfig.json
├── public/
│   ├── models/         # (chỗ để model 3D sau này)
│   ├── textures/       # (chỗ để texture sau này)
│   └── sounds/         # (chỗ để âm thanh sau này)
├── src/
│   ├── main.ts         # Điểm vào: vòng lặp chính, khởi động game
│   ├── core/           # dữ liệu (data), trạng thái (state), lưu game (save), kết ngày (day)
│   ├── world/          # cảnh (scene), nhà/chợ/trường (buildings), chi tiết (details),
│   │                   # sinh vật nền (ambient), thời tiết (weather), ánh sáng ngày (daylight),
│   │                   # âm thanh (sound), hạt (particles), trang trí lễ hội (festivalDecor)
│   ├── player/         # di chuyển, chuột/joystick, va chạm
│   ├── npc/            # bé An (child), chồng (husband), trộm (thief), bà Tư (visitor)
│   ├── farming/        # vườn, luống rau (garden); cây ăn quả (trees); vịt, lợn (livestock)
│   ├── activities/     # tương tác (interactions), đưa con đi học (school)
│   ├── economy/        # chợ, bán hàng (shop); mua đồ nhà, vật nuôi (upgrades)
│   ├── events/         # nhiệm vụ, thành tựu (quests); lễ hội trong năm (festivals)
│   └── ui/             # HUD, nút đi tới (goto), bảng cấu trúc code (structure)
└── README.md
```

## Giai đoạn 2 — Làm giàu: nâng cấp nhà, kinh tế, mua sắm

- **Nâng cấp nhà cửa:** mua ở sạp cô Tư — Tivi (150.000đ, +2 sao, màn hình sáng lúc chiều tối), Tủ lạnh (180.000đ, +1 sao, nấu ăn được +2 sao), Xe máy (250.000đ, +2 sao, đi nhanh hơn ~40%), Mở rộng đất trồng (120.000đ — thêm 4 luống, tổng 16), Mở rộng chuồng gà (80.000đ — gà đẻ 5–7 trứng), Xây chuồng lợn (50.000đ). Sửa nhà bằng Quỹ sửa nhà khi đủ 300.000đ (tường sơn mới, đèn lồng đỏ, +2 sao).
- **Cây ăn quả (cân bằng lại 12/11):** mua cây xoài / cây ổi giống ở sạp, trồng ở 3 mô đất trống trong sân. Cây lớn THEO NGÀY, không theo số lần tưới: tưới mỗi ngày thì lớn thêm 1 phần — xoài cần 5 ngày tưới, ổi 4 ngày mới trưởng thành. Cây trưởng thành phải chăm tưới đủ kỳ mới ra trái: xoài 3 ngày chăm → 2 xoài (bán 12.000đ/quả), ổi 2 ngày chăm → 2 ổi (8.000đ/quả); không tưới thì không ra trái, trái chưa hái hết thì chưa ra đợt mới. Trộm cũng hái trộm trái chín nếu không canh.
- **Vật nuôi mới:** Đàn vịt (30.000đ, ở bờ ao) — cho ăn cám 4.000đ, ~30 giây sau đẻ 2–3 trứng vịt. Lợn con (60.000đ/con, tối đa 2, cần chuồng lợn) — cho ăn 5.000đ/con mỗi ngày, mỗi con ăn đủ 7 hôm mới lớn, bán 120.000đ/con (cả cám tốn ~95.000đ/con, lãi ~25.000đ/con sau 1 tuần); bỏ đói 1 hôm thì hôm đó không tính.
- **Giá bán theo ngày:** giá nông sản lên xuống ±10% mỗi sáng (bảng giá ở sạp cô Tư, có dấu ▲/▼) — bán lúc được giá thì lời hơn.
- **Nhiệm vụ & thành tựu mới:** nhiệm vụ mua sắm, nhặt trứng vịt, hái trái cây, bán lợn; thành tựu "Nhà cửa khang trang", "Vườn rộng nhà to", "Trang trại nhỏ". Tổng kết cuối ngày ghi rõ tiền mua đồ, đồ đã mua, trứng vịt, trái cây, lợn bán được.
- Mọi thứ đều lưu vào `localStorage` cùng save cũ (đồ đã mua, cây, vịt, lợn, giá theo ngày) — tải lại game vẫn còn. Save từ bản Phase 2 cũ vẫn đọc được: cây cũ chưa có số ngày chăm (`ripen`) thì bắt đầu kỳ chăm mới từ 0, lợn cũ giữ số hôm ăn chung thành tiến độ của con đang lớn nhất (capped ở 6/7 ngày).

## Giai đoạn 3 — Làng quê: chợ, tiệm tạp hóa, trường, hàng xóm

- **Chợ làng** (dọc bờ bắc đường làng, đối diện trường): 3 sạp — **sạp rau cô Ba** mua rau củ (cải, cà chua, bí đỏ, ngô) giá chợ cao hơn sạp làng **10%**, **sạp trái cây chị Lan** mua xoài, ổi, trứng gà, trứng vịt, chuối cao hơn **10%**, **sạp đồ khô anh Đức** mua tất cả mọi thứ cao hơn **5%**. Là lại gần sạp (khi người bán đang đứng bán) và bấm **E** để mở bảng sạp, bán từng món hoặc bán hết. Giá chợ vẫn dựa trên giá ngày (bảng giá ±10% ở Giai đoạn 2) nên không phá cân bằng — đi chợ chỉ là tiền công đi chợ.
- **Tiệm tạp hóa ông Tư** (đầu chợ, 6:00–18:00): bán 3 món cho nhà — Bánh đậu xanh (8.000đ), Chai nước mắm ngon (15.000đ), Bao gạo mới 5kg (25.000đ). Mỗi món mua được **1 lần/ngày**, mua xong cả nhà vui **+1 sao**. Ngoài giờ thì ông Tư về phía sau tiệm, lại gần thì chào hỏi như hàng xóm.
- **Dân làng có lịch sinh hoạt** (7 người, đi bộ theo giờ, không đứng yên chờ người chơi): **bác Hai** (nhà → ruộng → nhà → chợ chiều → nhà), **bà Năm** (nhà → chợ sáng → nhà → cổng trường đón cháu 15:00–16:00 → nhà), **cô Ba / chị Lan / anh Đức** (ở nhà sáng sớm → ra sạp bán tới 16:00–17:00 → về nhà; anh Đức còn ra ao câu cá sáng sớm và chiều), **ông Tư** (tiệm 6:00–18:00), **cô giáo** (nhà → sân trường 7:00–16:30 → nhà). Lại gần bấm **E** để chào hỏi: **lần đầu mỗi người mỗi ngày +1 sao vui vẻ** (ghi vào tổng kết cuối ngày), lần sau thì chỉ nói chuyện.
- **Trường mở rộng:** thêm lớp học thứ hai, ghế đá, cây to trong sân, hàng rào thấp quanh sân trường (chừa lối ở cổng). Chiều tối sau giờ học, bé An thỉnh thoảng ra sân trường chơi cùng các bạn. **Nhiệm vụ mới:** "Mang 2 trứng gà cho cô giáo" — lớp nấu ăn trưa cho các cháu, đưa đủ 2 trứng thì thưởng 15.000đ + 1 sao (đưa trực tiếp cho cô giáo bằng phím **E**). Nhiệm vụ "Bán nông sản ở chợ được 30.000đ/50.000đ" thưởng 1 sao.
- **Số liệu làng** ghi vào tổng kết cuối ngày (chào mấy người, bán chợ được bao nhiêu, có đưa trứng cho cô giáo không) và reset mỗi sáng như các số liệu ngày khác. Save cũ vẫn đọc được nguyên vẹn (không thêm trường lưu mới nào — vị trí dân làng suy ra từ lịch theo giờ, số liệu làng là số liệu theo ngày).
- **Lỗi tìm được khi làm Giai đoạn 3:** `rollQuests()` chọn việc "đưa bé An đi học" bằng chỉ số cố định `pool.splice(8, 1)` — thêm 2 việc mới (chợ, cô giáo) vào danh sách đã đẩy "school" xuống chỉ số 10, nên mỗi sáng việc bắt buộc thành ra "hái chuối" thay vì "đưa bé đi học". Đã sửa thành tìm theo `id === "school"` và có test kiểm chứng (rollQuests 5 lần đều có việc đưa bé đi học).

## Cân bằng kinh tế (sau bản sửa 12/11 — số cũ → số mới)

| Hạng mục | Trước | Sau | Ý nghĩa |
|---|---|---|---|
| Xoài | 3 trái × 14.000đ **mỗi sáng** = 42.000đ/ngày | 2 trái × 12.000đ **mỗi 3 ngày chăm** = 8.000đ/ngày | Cây xoài là khoản đầu tư dài hạn, không còn "máy in tiền" |
| Ổi | 2 trái × 9.000đ mỗi sáng = 18.000đ/ngày | 2 trái × 8.000đ mỗi 2 ngày chăm = 8.000đ/ngày | Tương tự |
| Cây lớn | Sau 2 lần tưới (~1 phút) | Xoài 5 ngày tưới, ổi 4 ngày tưới | Lớn theo ngày trong game, có hiển thị % tiến độ |
| Lợn lớn | Ăn đủ 3 hôm, chung 1 bộ đếm cả đàn | Mỗi con ăn đủ 7 hôm, tính riêng từng con | Nuôi 1 con: mua 60.000đ + cám 35.000đ = 95.000đ, bán 120.000đ → lãi 25.000đ/tuần |
| Sinh hoạt | 12.000–16.000đ/ngày | Không đổi | 3 cây ăn quả chăm đều cho ~24.000đ/ngày — đủ sống dư một chút, nhưng phải chăm mỗi ngày |

Kết quả mô phỏng 30 ngày (chạy `node test/economy-sim.mjs`, dùng code thật cho cây/lợn/vịt/giá/sinh hoạt, hạt giống tính bằng số liệu thật của CROPS, tiền công chồng đúng phân phối game):
- **Cây ăn quả:** mô hình mới cho **387.000đ/30 ngày** (2 cây, chăm đều) — mô hình cũ cho **1.740.000đ** (giảm **78%**). Xoài 2 trái × 12.000đ/3 ngày, ổi 2 × 8.000đ/2 ngày — khoản đầu tư dài hạn, không còn "máy in tiền".
- **Lợn:** 1 con mua 60.000đ + cám 7×5.000đ = 95.000đ, bán 120.000đ → **lãi 25.000đ/con/tuần** (test `test/save-shopping.test.mjs` kiểm chứng đúng số này bằng hàm thật).
- **Vịt:** cho ăn 4.000đ/ngày, đẻ 2–3 trứng (5.000đ/quả) → lãi ròng khoảng **7.000đ/ngày**.
- **Người chơi chăm chỉ** (12 luống cà chua + cây + lợn + vịt): 60.000đ → **4,25 triệu sau 30 ngày** (~140.000đ/ngày). **Người chơi vừa phải** (6 luống cải + 2 cây): 60.000đ → **2,86 triệu sau 30 ngày** (~93.000đ/ngày). Đầu game vẫn chật vật thật: ngày 1–6 phải tính tiền mua hạt từng ngày, chỉ sau ~1 tuần mới dư dả.
- **Cân bằng rau (sửa 12/11, sau review GĐ3):** lãi ròng/vụ/luống — cải 7.000đ (hạt 5.000đ, bán 12.000đ), ngô 9.000đ (9.000đ/2×9.000đ), cà chua 10.000đ (12.000đ/2×11.000đ), bí đỏ 12.000đ (18.000đ/30.000đ). 12 luống 1 loại 30 ngày lãi ròng: cà chua **2,95 triệu** (cũ 13,04 triệu, giảm **77%**), bí **3,46 triệu**, ngô **3,20 triệu**, cải **2,58 triệu** — chênh nhau tối đa **1,3 lần** (cũ 3,9 lần), và ngang tầm các hoạt động khác cộng lại (chồng ~1,51 triệu + nhiệm vụ ~0,34 triệu + cây/vịt/lợn ~0,69 triệu). Trồng rau vẫn là việc chính nhưng không còn áp đảo. Tiền công chồng (~50.000đ/ngày, đúng phân phối game) một mình đã đủ sống dư sinh hoạt (~14.000đ/ngày).

## Giai đoạn 4.1 — Thời tiết theo ngày, mùa mưa & mùa khô

- **Mùa suy ra từ số ngày chơi, chu kỳ 60 ngày kiểu miền Nam:** ngày 1–30 **Mùa mưa**, ngày 31–60 **Mùa khô**, rồi lặp lại (ngày 61 lại mùa mưa…). Mùa hiện ở HUD, dưới số ngày, cùng thời tiết hôm nay (`☀️ Nắng · Mùa mưa`).
- **Thời tiết bốc mới mỗi sáng** (nút "Ngày mới" gọi `rollWeather()` trong `src/world/weather.ts`), 4 loại: nắng, nhiều mây, mưa rào, giông bão. Xác suất: **mùa mưa** mưa 35% + giông 15% + mây 25% + nắng 25% (mưa/giông **50%**); **mùa khô** mưa 7% + giông 3% + mây 25% + nắng 65% (mưa/giông chỉ **10%**). Test `test/weather.test.mjs` bốc 1000 lần với seed cố định để kiểm chứng đúng tỉ lệ.
- **Hệ thống mới điều khiển cơn mưa rào có sẵn:** ngày mưa/giông thì mưa tới đúng giờ đã bốc (mưa rào 13:00–15:30, 55 giây game; giông tới sớm 11:00–14:00, mưa lâu gấp đôi 110 giây); ngày nắng/mây thì không mưa (`rainAt = Infinity`). Vẫn dùng đúng hình ảnh mưa + vũng nước + đất ướt + cầu vồng đã có.
- **Mưa tưới miễn phí cả luống rau lẫn cây ăn quả** (quyết định: mưa là nước trời nên cây tính như đã tưới 1 lần, không tốn nước giếng — luống/cây được mưa tưới sẽ lớn thêm vào sáng hôm sau như tưới tay). **Giông** = mưa lâu hơn + trời tối hơn hẳn (nắng ×0,32, sương mù dày hơn) + **30% quật ngã 1 luống rau chín** (rụng xuống còn lớn dở 50%, không mất hẳn; tối đa 1 luống/ngày, ghi vào tổng kết cuối ngày). Ngày nhiều mây nắng dịu đi một chút.
- **Mùa khô: rau khát nước héo nhanh gấp đôi** (đồng hồ khô `dryT` tăng gấp đôi nên cây rũ xuống sớm hơn — chỉ là dấu hiệu thị giác, cây không chết; muốn cây lớn vẫn phải tưới tay vì mưa hiếm).
- **Hiện ở game:** HUD (`#hud-wx`), dòng "Thời tiết" trong bảng tổng kết cuối ngày (có nhắc cả mùa và thiệt hại giông nếu có), toast sáng báo thời tiết hôm nay.
- **Lưu game:** thời tiết hôm nay đã bốc (`weather`, `rainToday`, `rainAt`, `rainLen`) lưu vào save nên tắt trang mở lại giữa ngày vẫn giữ đúng thời tiết hôm đó; mùa suy ra từ số ngày nên không cần lưu riêng. **Save cũ** (trước Phase 4.1, không có các trường này) vẫn đọc được: mặc định nắng, không mưa.
- **Cân bằng:** mưa miễn phí chỉ tiết kiệm *thời gian* tưới (nước giếng vốn không tốn tiền), không thêm tiền — mô phỏng 30 ngày (`node test/economy-sim.mjs`) sau Phase 4.1 vẫn cho kết quả tương đương trước: người chăm chỉ ~4,72 triệu (trước 4,25 triệu — chênh do thứ tự bốc số ngẫu nhiên thay đổi khi thêm lượt bốc thời tiết mỗi ngày, không do mưa làm giàu), cây ăn quả 388.800đ/30 ngày, chênh rau tối đa 1,4 lần. Không đổi giá rau.

## Giai đoạn 4.2 — Lễ hội trong năm: Tết, Trung thu, sinh nhật, sum họp

- **Lịch lễ:** một "năm" trong game dài **360 ngày** = 6 chu kỳ mùa 60 ngày (`dayOfYear()` trong `src/events/festivals.ts`). Ngày trong năm = `((ngày − 1) % 360) + 1`. Mỗi năm có **13 ngày lễ**:
  | Ngày trong năm | Lễ | Mùa lúc đó |
  |---|---|---|
  | 31–33 | Tết — Mùng 1, 2, 3 (đèn lồng đỏ + băng rôn) | đầu mùa khô |
  | 45 | Sinh nhật bé An | mùa khô |
  | 75, 165, 255, 345 | Họ hàng sum họp (bàn tiệc ngoài sân) | rải đều 2 mùa |
  | 135 | Sinh nhật anh (chồng) | mùa mưa |
  | 180 | Kỷ niệm ngày cưới | mùa khô |
  | 225 | Sinh nhật vợ (người chơi) | mùa khô |
  | 270 | Tết Trung thu (đèn lồng đủ màu + trăng to) | ngày cuối đợt mùa mưa 241–270 |
  | 315 | Sinh nhật bà Tư | mùa mưa |
- **Quà sáng ngày lễ (chỉ 1 lần/ngày lễ):** Tết Mùng 1 lì xì 20.000đ + 2 sao, Mùng 2 10.000đ + 1 sao, Mùng 3 5.000đ + 1 sao; Trung thu 10.000đ + 1 sao; sinh nhật vợ 20.000đ + 2 sao; sinh nhật anh 15.000đ + 1 sao; kỷ niệm ngày cưới 15.000đ + 2 sao; sum họp 8.000đ + 1 sao mỗi lần; sinh nhật bé An 2 hạt cải + 1 sao; sinh nhật bà Tư 2 hạt cà chua + 1 sao. Quà ghi theo số ngày tuyệt đối (`G.festivalClaimed`) nên tải lại giữa ngày không tặng lại, chơi lại từ save cũ cũng chỉ nhận 1 lần.
- **Nhiệm vụ lễ hội** thay 1 trong 3 việc hằng ngày (vẫn đủ 3 việc): "Gói 2 bánh chưng" (Tết Mùng 1), "Chúc Tết 3 người hàng xóm" (Mùng 2), "Nấu bữa cơm đầu năm / kỷ niệm ngày cưới" (Mùng 3, ngày cưới), "Nhặt 3 trứng gà nấu bữa sinh nhật bé An", "Câu 1 con cá rô nấu bữa sinh nhật anh", "Thu hoạch 3 món mừng sinh nhật vợ", "Nhặt 2 trứng gà biếu bà Tư", "Mua 1 lồng đèn cho bé An" (Trung thu), "Bán nông sản được 30.000đ đãi họ hàng" (sum họp). Việc lễ (`fest-*`) không bao giờ bốc trúng trong ngày thường.
- **Đồ lễ hội** — chỉ bán ở sạp cô Tư trong vài ngày quanh lễ (giá cố định, không quay giá ngày để không lệch dòng số ngẫu nhiên của game): **Bánh chưng** 12.000đ (bán lại 10.000đ, ngày 28–36), **Bánh trung thu** 15.000đ (bán lại 12.000đ, ngày 265–274), **Lồng đèn giấy** 8.000đ (bán lại 5.000đ, ngày 42–48 dịp sinh nhật bé An và ngày 265–274 dịp Trung thu). Mua về làm nhiệm vụ lễ hội hoặc đãi khách; bán lại thì lỗ một ít nên không phải đường làm giàu. Bán lại được ở chợ: chị Lan lấy bánh trung thu (+10%), anh Đức lấy mọi món lễ hội (+5%).
- **Hiện ở game:** tên lễ hiện ở HUD ngay sau thời tiết + mùa (`🧧 Tết Mùng 1`), toast sáng báo lễ + quà, dòng "Lễ hội hôm nay" trong bảng tổng kết cuối ngày, kỷ niệm ghi "Ngày X — Tết...". Trang trí 3D chỉ hiện trong ngày lễ, hôm sau tự dọn: Tết treo đèn lồng đỏ + băng rôn trước hiên; Trung thu đèn lồng đủ màu quanh sân + trăng đêm to ~1,9 lần; sinh nhật/kỷ niệm ngày cưới có bàn tiệc + bánh + bóng bay (bánh hồng sinh nhật, đỏ kỷ niệm); sum họp chỉ có bàn tiệc. Trang trí không thêm vòng chặn va chạm để không kẹt đường dân làng.
- **Lưu game:** `festivalClaimed` + `festivalToday` lưu vào save; **save cũ** không có các trường này vẫn đọc được (mặc định chưa nhận quà lễ nào, hôm nay chưa rõ là lễ gì — mở game ngày lễ thì quà vẫn tặng đúng 1 lần). Mở game đã lưu đúng ngày lễ thì tính lại lễ hôm nay, nhiệm vụ lễ hội và trang trí hiện lại, quà không tặng trùng.
- **Cân bằng:** quà lễ cả năm cộng lại ~90.000đ tiền + ~15 sao + 4 hạt giống — không đáng kể so với thu nhập 30 ngày (~5 triệu). Mô phỏng 30 ngày (`node test/economy-sim.mjs`) vẫn cho kết quả tương đương trước: người chăm chỉ 4.742.710đ (trước 4.722.710đ — chênh đúng 20.000đ lì xì Tết Mùng 1 vì lần qua đêm cuối của mô phỏng rơi vào ngày 31), cây ăn quả 388.800đ/30 ngày, chênh rau tối đa 1,4 lần. Đồ lễ hội giá cố định (không quay giá ngày) để dòng số ngẫu nhiên của game không đổi.

## Ghi chú về bản chuyển đổi này

- **Logic game giữ nguyên 100%** so với bản chơi thử v8 (bản một file duy nhất trước đây). Chỉ tách code thành module và đổi cách nạp Three.js — không sửa gameplay, không viết lại engine.
- **Three.js lấy từ npm** (`import * as THREE from 'three'`, phiên bản **0.128.0** — đúng bản thư viện đã nhúng trong file cũ, nên API `THREE.sRGBEncoding` / `renderer.outputEncoding` vẫn như cũ). File cũ `assets/three.min.js` trong repo **đã lỗi thời, không còn được dùng** — đừng sửa nó, game giờ lấy Three.js từ `node_modules`.
- **Bản một file duy nhất cũ (index.html cũ) đã được thay bằng dự án Vite này** — đó là thay đổi theo đúng kế hoạch đã thống nhất. File `index.html` giờ chỉ là vỏ nạp `/src/main.ts`.
- **Chuyển sang TypeScript theo kiểu dần dần:** các module `.ts` hiện có dòng `// @ts-nocheck` ở đầu (chưa gõ kiểu chặt). Chuyển dần sang gõ kiểu sau, từng file một — xem `assets/CAU-TRUC-DU-AN.md` (bản đồ module → `.ts`) nếu còn trong repo.
- **Lưu game:** game lưu vào `localStorage` của trình duyệt như trước (tiền, sao, hạt, giỏ, luống rau, quỹ sửa nhà, thành tựu, kỷ niệm). Xóa dữ liệu trình duyệt sẽ mất save.
- **Tương thích:** game dùng WebGL (Three.js). Cần trình duyệt hiện đại (Chrome/Edge/Firefox/Safari mới). Trên điện thoại có joystick chạm để di chuyển.
