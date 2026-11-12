// @ts-nocheck
/*
 * GameGiaDinh — assets/src/core/data.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/core/data.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
"use strict";
    /* ================== DỮ LIỆU CÂY ================== */
    export var CROPS = {
      cai:    { name: "Rau cải", seed: 5000,  sell: 14000, grow: 34, waters: 1, yield: 1, fruit: 0x8fce4f },
      cachua: { name: "Cà chua", seed: 10000, sell: 26000, grow: 58, waters: 2, yield: 2, fruit: 0xe2483a },
      bido:   { name: "Bí đỏ",   seed: 18000, sell: 52000, grow: 92, waters: 2, yield: 1, fruit: 0xef8f2e },
      ngo:    { name: "Ngô",     seed: 8000,  sell: 20000, grow: 46, waters: 1, yield: 2, fruit: 0xf2c230 }
    };
    export var CROP_KEYS = ["cai", "cachua", "bido", "ngo"];
    // Nông sản không trồng theo luống: nhặt / câu / hái được
    export var GOODS = {
      trung: { name: "Trứng gà", sell: 4000 },
      ca:    { name: "Cá rô ao", sell: 22000 },
      chuoi: { name: "Nải chuối", sell: 15000 },
      trungvit: { name: "Trứng vịt", sell: 5000 },
      xoai: { name: "Xoài chín", sell: 14000 },
      oi:   { name: "Ổi chín", sell: 9000 }
    };
    export var GOOD_KEYS = ["trung", "ca", "chuoi", "trungvit", "xoai", "oi"];
    export function priceOf(k) { return CROPS[k] ? CROPS[k].sell : GOODS[k].sell; }

    // — PHASE 2: cây ăn quả (mua cây giống, tưới 2 lần, hái trái mỗi ngày) —
    export var FRUIT_TREES = {
      xoai: { name: "Cây xoài", sapling: 25000, grow: 170, waters: 2, fruit: "xoai", fruitName: "Xoài chín", fruitPerDay: 3 },
      oi:   { name: "Cây ổi",   sapling: 18000, grow: 130, waters: 2, fruit: "oi",   fruitName: "Ổi chín",  fruitPerDay: 2 }
    };
    // — PHASE 2: vật nuôi mới —
    export var LIVESTOCK = {
      duckFlock: { name: "Đàn vịt (3 con)", price: 30000, feed: 4000, eggMin: 2, eggMax: 3, eggKind: "trungvit" },
      piglet:    { name: "Lợn con", price: 60000, feed: 5000, growDays: 3, sell: 120000, max: 2 }
    };
    // — PHASE 2: nâng cấp nhà cửa —
    export var UPGRADES = {
      tv:      { name: "Tivi",              price: 150000, stars: 2, desc: "Màn hình sáng lúc chiều tối — chống chán, nhà có không khí." },
      fridge:  { name: "Tủ lạnh",           price: 180000, stars: 1, desc: "Đồ ăn nấu ra ngon hơn — nấu ăn được +2 sao thay vì +1." },
      bike:    { name: "Xe máy",            price: 250000, stars: 2, desc: "Đi nhanh hơn ~40% — đưa An đi học, ra chợ, làm việc đỡ mệt." },
      land:    { name: "Mở rộng đất trồng", price: 120000, stars: 0, desc: "Thêm 4 luống rau mới (tổng 16 luống)." },
      coopBig: { name: "Mở rộng chuồng gà", price: 80000,  stars: 0, desc: "Thêm ổ đẻ — gà đẻ 5–7 trứng thay vì 3–5." },
      pigpen:  { name: "Xây chuồng lợn",    price: 50000,  stars: 0, desc: "Chuồng lợn ở góc sân — nuôi lợn con rồi bán." }
    };
    export var HOUSE_REPAIR_SAVINGS = 300000;

