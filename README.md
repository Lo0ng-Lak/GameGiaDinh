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
│   ├── farming/        # vườn, luống rau (garden)
│   ├── activities/     # tương tác (interactions), đưa con đi học (school)
│   ├── economy/        # chợ, bán hàng (shop)
│   ├── events/         # nhiệm vụ, thành tựu (quests)
│   └── ui/             # HUD, nút đi tới (goto), bảng cấu trúc code (structure)
└── README.md
```

## Ghi chú về bản chuyển đổi này

- **Logic game giữ nguyên 100%** so với bản chơi thử v8 (bản một file duy nhất trước đây). Chỉ tách code thành module và đổi cách nạp Three.js — không sửa gameplay, không viết lại engine.
- **Three.js lấy từ npm** (`import * as THREE from 'three'`, phiên bản **0.128.0** — đúng bản thư viện đã nhúng trong file cũ, nên API `THREE.sRGBEncoding` / `renderer.outputEncoding` vẫn như cũ). File cũ `assets/three.min.js` trong repo **đã lỗi thời, không còn được dùng** — đừng sửa nó, game giờ lấy Three.js từ `node_modules`.
- **Bản một file duy nhất cũ (index.html cũ) đã được thay bằng dự án Vite này** — đó là thay đổi theo đúng kế hoạch đã thống nhất. File `index.html` giờ chỉ là vỏ nạp `/src/main.ts`.
- **Chuyển sang TypeScript theo kiểu dần dần:** các module `.ts` hiện có dòng `// @ts-nocheck` ở đầu (chưa gõ kiểu chặt). Chuyển dần sang gõ kiểu sau, từng file một — xem `assets/CAU-TRUC-DU-AN.md` (bản đồ module → `.ts`) nếu còn trong repo.
- **Lưu game:** game lưu vào `localStorage` của trình duyệt như trước (tiền, sao, hạt, giỏ, luống rau, quỹ sửa nhà, thành tựu, kỷ niệm). Xóa dữ liệu trình duyệt sẽ mất save.
- **Tương thích:** game dùng WebGL (Three.js). Cần trình duyệt hiện đại (Chrome/Edge/Firefox/Safari mới). Trên điện thoại có joystick chạm để di chuyển.
