// @ts-nocheck
/*
 * GameGiaDinh — assets/src/core/state.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/core/state.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { CROPS, GOODS, priceOf } from './data';

    /* ================== TRẠNG THÁI GAME ================== */
    export var G = {
      started: false, dayOver: false,
      day: 1, minutes: 5 * 60 + 30,           // 05:30
      money: 60000, stars: 0,
      seeds: { cai: 4, cachua: 2, bido: 1, ngo: 2 },
      produce: { cai: 0, cachua: 0, bido: 0, ngo: 0, trung: 0, ca: 0, chuoi: 0, trungvit: 0, xoai: 0, oi: 0 },
      selSeed: "cai",
      can: 5, canMax: 5,
      childState: "home",                      // home | follow | school | away
      schoolOnTime: null,                      // true/false khi đã đưa
      earnedToday: 0, harvestedToday: 0, plantedToday: 0,
      dayStatsReset: false,
      // Hoạt động mới: gà đẻ trứng, câu cá, nấu cơm, chuối, chồng đi làm về
      chicken: { fed: false, timer: 0, ready: 0 },
      eggsToday: 0, fishToday: 0,
      fish: { state: "idle", t: 0 },          // idle | wait | bite
      cookedToday: false, smokeBoost: 0,
      husband: { state: "notyet", wage: 0, wp: 0, talked: false },  // notyet | walking | home
      // Sự kiện bất ngờ trong ngày: trộm lẻn vào sân, mưa rào, bà Tư qua chơi
      thief: { state: "none", wp: 0, t: 0, loot: 0, lootKind: "", lootTxt: "", lootItems: null, lootType: "", result: "" },  // none | in | steal | out | flee | done
      thiefDay: Math.random() < 0.65,           // có hôm có trộm, có hôm yên ổn hẳn
      thiefAt: 480 + Math.random() * 570,       // trộm lẻn vào bất kỳ lúc nào 8:00–17:30, không theo khung giờ cố định
      raining: false, rainT: 0, rainedToday: false,
      rainAt: 780 + Math.random() * 150,        // khoảng 13:00–15:30 có mưa rào
      visit: { state: "none", wp: 0, t: 0, talked: false },  // none | walking | here | leaving | done
      visitAt: 900 + Math.random() * 60,        // khoảng 15:00–16:00 bà Tư qua chơi
      // Lớp chân thật: âm thanh tự nhiên, gió, mặt đất ướt sau mưa, cầu vồng, xe máy chạy qua đường
      soundOn: true, roosterDone: false, bellDone: false,
      wind: 0.6, wet: 0, rainbowT: 0, dipT: 0,
      bike: { state: "idle", t: 18 + Math.random() * 30, x: -36, dir: 1, z: -15.4 },
      /* ===== GIAI ĐOẠN 1: nhiệm vụ, tiết kiệm, thành tựu, kỷ niệm, AI gia đình ===== */
      wateredToday: 0, bananaToday: 0, livingCost: 0,
      totalEarned: 0, totalHarvest: 0, thiefChased: 0, questsDoneTotal: 0,
      quests: [],                                // 3 nhiệm vụ ngắn của hôm nay
      savings: 0,                                // Quỹ sửa nhà — gửi ở sạp cô Tư, mục tiêu 300.000đ
      savingsGoalDone: false,
      achievements: {},                          // id -> ngày đạt được
      memories: [],                              // dòng kỷ niệm "Ngày X — ..."
      tuQuest: null,                             // việc bà Tư nhờ: {key, name, n, reward}
      husbandAt: 990 + Math.random() * 105,      // anh về lúc nào cũng khác: 16:30–18:15
      noWorkToday: Math.random() < 0.12,         // có hôm chủ không có việc, anh về tay không
      husbandMode: "rest", husbandT: 25, husbandTx: 0, husbandTz: 0, husbandPlot: null,
      childPlay: { wp: 0, spot: -1, pauseT: 4, lineT: 30, mood: "vui", playedToday: false },
      childBack: false,
      /* ===== GIAI ĐOẠN 2: nâng cấp nhà, cây ăn quả, chăn nuôi, giá theo ngày ===== */
      owned: { tv: false, fridge: false, bike: false, land: false, coopBig: false, pigpen: false, houseFixed: false },
      saplings: { xoai: 0, oi: 0 },
      trees: [
        { type: null, state: "empty", progress: 0, watered: false, waterings: 0, fruitReady: 0 },
        { type: null, state: "empty", progress: 0, watered: false, waterings: 0, fruitReady: 0 },
        { type: null, state: "empty", progress: 0, watered: false, waterings: 0, fruitReady: 0 }
      ],
      ducks: { owned: false, fed: false, timer: 0, ready: 0 },
      pigs: { count: 0, grown: 0, fedToday: false, growDays: 0 },
      priceDay: {},
      boughtToday: 0, duckEggsToday: 0, fruitToday: 0, pigsSoldToday: 0, spentToday: 0
    };
    export var SCHOOL_BELL = 7 * 60 + 30;             // 7:30
    export var DAY_END = 19 * 60;                     // 19:00

    export function fmt(n) { return n.toLocaleString("vi-VN") + "đ"; }
    export function fmtTime(m) {
      var h = Math.floor(m / 60), mm = Math.floor(m % 60);
      return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
    }
    export function produceTotal() { var t = 0; for (var k in G.produce) t += G.produce[k]; return t; }
    export function produceValue() {
      var v = 0; for (var k in G.produce) v += G.produce[k] * sellPriceOf(k); return v;
    }
    // PHASE 2: giá bán theo ngày — mỗi ngày giá lên xuống ±10% so với giá gốc
    export function sellPriceOf(k) {
      var f = (G.priceDay && G.priceDay[k] != null) ? G.priceDay[k] : 1;
      return Math.round(priceOf(k) * f / 100) * 100;
    }
    export function goodName(k) { return CROPS[k] ? CROPS[k].name : (GOODS[k] ? GOODS[k].name : k); }

