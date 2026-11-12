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
│   │                   # âm thanh (sound), hạt (particles)
│   ├── player/         # di chuyển, chuột/joystick, va chạm
│   ├── npc/            # bé An (child), chồng (husband), trộm (thief), bà Tư (visitor)
│   ├── farming/        # vườn, luống rau (garden); cây ăn quả (trees); vịt, lợn (livestock)
│   ├── activities/     # tương tác (interactions), đưa con đi học (school)
│   ├── economy/        # chợ, bán hàng (shop); mua đồ nhà, vật nuôi (upgrades)
│   ├── events/         # nhiệm vụ, thành tựu (quests)
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

## Ghi chú về bản chuyển đổi này

- **Logic game giữ nguyên 100%** so với bản chơi thử v8 (bản một file duy nhất trước đây). Chỉ tách code thành module và đổi cách nạp Three.js — không sửa gameplay, không viết lại engine.
- **Three.js lấy từ npm** (`import * as THREE from 'three'`, phiên bản **0.128.0** — đúng bản thư viện đã nhúng trong file cũ, nên API `THREE.sRGBEncoding` / `renderer.outputEncoding` vẫn như cũ). File cũ `assets/three.min.js` trong repo **đã lỗi thời, không còn được dùng** — đừng sửa nó, game giờ lấy Three.js từ `node_modules`.
- **Bản một file duy nhất cũ (index.html cũ) đã được thay bằng dự án Vite này** — đó là thay đổi theo đúng kế hoạch đã thống nhất. File `index.html` giờ chỉ là vỏ nạp `/src/main.ts`.
- **Chuyển sang TypeScript theo kiểu dần dần:** các module `.ts` hiện có dòng `// @ts-nocheck` ở đầu (chưa gõ kiểu chặt). Chuyển dần sang gõ kiểu sau, từng file một — xem `assets/CAU-TRUC-DU-AN.md` (bản đồ module → `.ts`) nếu còn trong repo.
- **Lưu game:** game lưu vào `localStorage` của trình duyệt như trước (tiền, sao, hạt, giỏ, luống rau, quỹ sửa nhà, thành tựu, kỷ niệm). Xóa dữ liệu trình duyệt sẽ mất save.
- **Tương thích:** game dùng WebGL (Three.js). Cần trình duyệt hiện đại (Chrome/Edge/Firefox/Safari mới). Trên điện thoại có joystick chạm để di chuyển.
