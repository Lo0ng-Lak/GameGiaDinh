// @ts-nocheck
/*
 * GameGiaDinh — assets/src/core/save.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/core/save.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { G } from './state';
import { rollQuests } from '../events/quests';
import { drawCrop, plots } from '../farming/garden';

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
      if (d.plots) d.plots.forEach(function (sp, i) {
        var p = plots[i]; if (!p) return;
        p.state = sp.state || "empty"; p.type = sp.type || null;
        p.progress = sp.progress || 0; p.watered = !!sp.watered; p.waterings = sp.waterings || 0;
        p.dryT = 0; p._wilted = false; drawCrop(p);
      });
    }
    rollQuests();

