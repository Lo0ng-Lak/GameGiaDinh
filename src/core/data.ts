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
      chuoi: { name: "Nải chuối", sell: 15000 }
    };
    export var GOOD_KEYS = ["trung", "ca", "chuoi"];
    export function priceOf(k) { return CROPS[k] ? CROPS[k].sell : GOODS[k].sell; }

