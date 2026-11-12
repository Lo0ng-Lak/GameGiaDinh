// @ts-nocheck
/*
 * GameGiaDinh — assets/src/core/save.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/core/save.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { G } from './state';
import { LIVESTOCK } from './data';
import { rollQuests } from '../events/quests';
import { drawCrop, plots, ensureExtraPlots } from '../farming/garden';
import { drawTree } from '../farming/trees';
import { refreshDuckEggs, refreshPigs } from '../farming/livestock';
import { seasonOf } from '../world/weather';
import { refreshBambooShoots } from '../world/places';

    /* ---- Lưu game vào trình duyệt: tiền, sao, hạt, giỏ, luống rau, quỹ, thành tựu, kỷ niệm ---- */
    export var SAVE_KEY = "gia-dinh-que-save-v1";
    export var pendingSave = null;

    export function setPendingSave(v) { pendingSave = v; }
    export function saveGame() {
      if (!G.started || typeof plots === "undefined") return;
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
          v: 1, day: G.day, money: G.money, stars: G.stars, seeds: G.seeds, produce: G.produce,
          can: G.can, selSeed: G.selSeed, savings: G.savings, savingsGoalDone: G.savingsGoalDone, tuQuest: G.tuQuest,
          totalEarned: G.totalEarned, totalHarvest: G.totalHarvest, thiefChased: G.thiefChased,
          questsDoneTotal: G.questsDoneTotal, achievements: G.achievements, memories: G.memories.slice(-40),
          // PHASE 2: đồ đã mua, cây ăn quả, vịt, lợn, giá theo ngày
          owned: G.owned, saplings: G.saplings, priceDay: G.priceDay,
          trees: G.trees.map(function (t) {
            return { type: t.type, state: t.state, progress: t.progress, watered: t.watered, waterings: t.waterings, ripen: t.ripen || 0, fruitReady: t.fruitReady };
          }),
          ducks: G.ducks, pigs: G.pigs,
          // PHASE 4.1: thời tiết hôm nay đã bốc (để tắt trang mở lại giữa
          // ngày vẫn giữ đúng thời tiết hôm đó). rainAt = null khi hôm nay
          // không mưa (Infinity không lưu được thành JSON).
          weather: G.weather, rainToday: G.rainToday,
          rainAt: G.rainToday ? G.rainAt : null, rainLen: G.rainLen,
          // PHASE 4.2: lễ hội — ngày lễ đã nhận quà, lễ hội hôm nay.
          // Save cũ (trước Phase 4.2) không có các trường này -> quà chưa
          // nhận, lễ hôm nay để null (sẽ tự tính lại khi mở game).
          festivalClaimed: G.festivalClaimed, festivalToday: G.festivalToday,
          // PHASE 4.3: khám phá làng mới — đã thắp hương / nghỉ đồi hôm nay
          // chưa, măng còn hái được cây nào, măng hái được hôm nay.
          templePrayedToday: G.templePrayedToday, viewpointRestedToday: G.viewpointRestedToday,
          bambooReady: G.bambooReady.slice(), bambooToday: G.bambooToday,
          plots: plots.map(function (p) {
            return { state: p.state, type: p.type, progress: p.progress, watered: p.watered, waterings: p.waterings };
          })
        }));
      } catch (e) { /* trình duyệt chặn lưu thì bỏ qua, game vẫn chơi tiếp */ }
    }
    export function readSave() {
      try { var s = localStorage.getItem(SAVE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
    }
    export function applySave(d) {
      if (!d) return;
      G.day = d.day || 1; G.money = d.money != null ? d.money : 60000; G.stars = d.stars || 0;
      if (d.seeds) for (var k in G.seeds) if (d.seeds[k] != null) G.seeds[k] = d.seeds[k];
      if (d.produce) for (var k2 in G.produce) if (d.produce[k2] != null) G.produce[k2] = d.produce[k2];
      G.can = d.can != null ? d.can : 5; G.selSeed = d.selSeed || "cai";
      G.savings = d.savings || 0; G.savingsGoalDone = !!d.savingsGoalDone;
      G.totalEarned = d.totalEarned || 0; G.totalHarvest = d.totalHarvest || 0;
      G.thiefChased = d.thiefChased || 0; G.questsDoneTotal = d.questsDoneTotal || 0;
      G.achievements = d.achievements || {}; G.memories = d.memories || [];
      G.tuQuest = d.tuQuest || null;
      // PHASE 2: khôi phục đồ đã mua — đất mở rộng phải dựng trước khi khôi phục luống
      if (d.owned) for (var ok in G.owned) if (d.owned[ok] != null) G.owned[ok] = !!d.owned[ok];
      if (G.owned.land) ensureExtraPlots();
      if (d.saplings) for (var sk in G.saplings) if (d.saplings[sk] != null) G.saplings[sk] = d.saplings[sk];
      if (d.priceDay) G.priceDay = d.priceDay;
      if (d.trees) d.trees.forEach(function (st, i) {
        var t = G.trees[i]; if (!t || !st) return;
        t.type = st.type || null; t.state = st.state || "empty";
        t.progress = st.progress || 0; t.watered = !!st.watered; t.waterings = st.waterings || 0;
        t.ripen = st.ripen || 0; // save cũ không có ripen -> 0, cây bắt đầu kỳ chăm mới
        t.fruitReady = st.fruitReady || 0; drawTree(i);
      });
      if (d.ducks) { G.ducks = d.ducks; refreshDuckEggs(); }
      if (d.pigs) {
        G.pigs = d.pigs;
        // Save cũ (Phase 2 v1): growDays là số hôm ăn CHUNG của cả đàn -> chuyển
        // sang days[] theo từng con; con đang lớn nhất giữ số hôm đã ăn (tối đa
        // growDays-1 để không lớn ngay khi tải), con khác bắt đầu từ 0.
        if (!Array.isArray(G.pigs.days)) {
          var oldDays = typeof G.pigs.growDays === "number" ? G.pigs.growDays : 0;
          G.pigs.days = [];
          for (var pi = 0; pi < G.pigs.count; pi++)
            G.pigs.days[pi] = pi === G.pigs.grown ? Math.min(oldDays, LIVESTOCK.piglet.growDays - 1) : 0;
        }
        delete G.pigs.growDays;
        refreshPigs();
      }
      if (d.plots) d.plots.forEach(function (sp, i) {
        var p = plots[i]; if (!p) return;
        p.state = sp.state || "empty"; p.type = sp.type || null;
        p.progress = sp.progress || 0; p.watered = !!sp.watered; p.waterings = sp.waterings || 0;
        p.dryT = 0; p._wilted = false; drawCrop(p);
      });
      // PHASE 4.1: khôi phục thời tiết hôm nay đã bốc. Save cũ (trước Phase
      // 4.1) không có các trường này -> mặc định nắng, không mưa; mùa suy
      // ra từ số ngày nên luôn đúng dù save cũ hay mới.
      G.season = seasonOf(G.day);
      if (d.weather === "sunny" || d.weather === "cloudy" || d.weather === "rain" || d.weather === "storm") {
        G.weather = d.weather;
        G.rainToday = !!d.rainToday;
        G.rainAt = (typeof d.rainAt === "number") ? d.rainAt : Infinity;
        G.rainLen = (typeof d.rainLen === "number" && d.rainLen > 0) ? d.rainLen : 55;
      } else {
        G.weather = "sunny"; G.rainToday = false; G.rainAt = Infinity; G.rainLen = 55;
      }
      G.raining = false; G.rainT = 0; G.rainedToday = false;
      G.stormHit = false; G.stormDamaged = false;
      // PHASE 4.2: lễ hội — save cũ không có festivalClaimed/festivalToday
      // thì mặc định chưa nhận quà lễ nào, hôm nay chưa rõ là lễ gì
      // (checkFestivalToday khi mở game sẽ tự tính lại theo số ngày).
      G.festivalClaimed = d.festivalClaimed || {};
      G.festivalToday = d.festivalToday || null;
      G.festivalProgress = 0; G.festivalGiftTxt = "";
      // PHASE 4.3: chùa / rừng tre / đồi — save cũ không có các trường này
      // thì mặc định chưa thắp hương, chưa nghỉ trên đồi, măng còn đủ 3 cây.
      G.templePrayedToday = !!d.templePrayedToday;
      G.viewpointRestedToday = !!d.viewpointRestedToday;
      G.bambooReady = (Array.isArray(d.bambooReady) && d.bambooReady.length === 3)
        ? d.bambooReady.map(function (b) { return !!b; }) : [true, true, true];
      G.bambooToday = d.bambooToday || 0;
      refreshBambooShoots();
    }
    rollQuests();

