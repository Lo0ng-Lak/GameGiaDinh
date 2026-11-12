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
      xoai: { name: "Xoài chín", sell: 12000 },
      oi:   { name: "Ổi chín", sell: 8000 }
    };
    export var GOOD_KEYS = ["trung", "ca", "chuoi", "trungvit", "xoai", "oi"];
    export function priceOf(k) { return CROPS[k] ? CROPS[k].sell : GOODS[k].sell; }

    // — PHASE 2 (cân bằng lại, sau review 12/11): cây ăn quả lớn THEO NGÀY, không phải
    // sau 2 lần tưới. Tưới mỗi ngày thì cây lớn thêm 1/growDays; đủ growDays ngày tưới
    // mới thành cây trưởng thành. Cây trưởng thành cần chăm tưới đủ fruitCycle ngày
    // mới ra 1 đợt trái (fruitPerCycle trái); trái không ra nữa khi chưa hái hết
    // đợt cũ. Giá trái cũng hạ xuống để 3 cây tối đa chỉ cho ~24.000đ/ngày có chăm
    // đều (xoài 2×12.000đ/3 ngày, ổi 2×8.000đ/2 ngày) — khoản đầu tư dài hạn, không
    // còn là "máy in tiền" (cũ: xoài 3×14.000đ = 42.000đ/ngày, ổi 18.000đ/ngày). —
    export var FRUIT_TREES = {
      xoai: { name: "Cây xoài", sapling: 25000, growDays: 5, fruitCycle: 3, fruitPerCycle: 2, fruit: "xoai", fruitName: "Xoài chín" },
      oi:   { name: "Cây ổi",   sapling: 18000, growDays: 4, fruitCycle: 2, fruitPerCycle: 2, fruit: "oi",   fruitName: "Ổi chín" }
    };
    // — PHASE 2: vật nuôi mới — lợn lớn sau 7 hôm cho ăn đều (cũ: 3 hôm), mỗi con
    // tốn 5.000đ cám/ngày suốt thời gian nuôi: chi phí 60.000đ + 7×5.000đ = 95.000đ,
    // bán 120.000đ → lãi 25.000đ/con sau 1 tuần, không còn nuôi vài hôm là giàu. —
    export var LIVESTOCK = {
      duckFlock: { name: "Đàn vịt (3 con)", price: 30000, feed: 4000, eggMin: 2, eggMax: 3, eggKind: "trungvit" },
      piglet:    { name: "Lợn con", price: 60000, feed: 5000, growDays: 7, sell: 120000, max: 2 }
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

