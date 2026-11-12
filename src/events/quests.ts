// @ts-nocheck
/*
 * GameGiaDinh — assets/src/events/quests.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/events/quests.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { saveGame } from '../core/save';
import { G, fmt } from '../core/state';
import { el, toast } from '../ui/hud';
import { sndCoin } from '../world/sound';

    /* ================== GIAI ĐOẠN 1 — NHIỆM VỤ, THÀNH TỰU, LƯU GAME ================== */
    export var QUEST_DEFS = [
      { id: "harvest", targets: [3, 5, 7],    txt: function (n) { return "Thu hoạch " + n + " món nông sản"; },        get: function () { return G.harvestedToday; }, reward: { money: 12000, stars: 1 } },
      { id: "plant",   targets: [3, 4, 6],    txt: function (n) { return "Gieo trồng " + n + " luống rau"; },          get: function () { return G.plantedToday; },   reward: { money: 9000, stars: 0 } },
      { id: "water",   targets: [4, 6, 8],    txt: function (n) { return "Tưới nước " + n + " lượt luống"; },          get: function () { return G.wateredToday; },   reward: { money: 8000, stars: 0 } },
      { id: "sell",    targets: [30000, 50000, 80000], txt: function (n) { return "Bán nông sản được " + fmt(n); },   get: function () { return G.earnedToday; },    reward: { money: 0, stars: 1 } },
      { id: "eggs",    targets: [3, 5],       txt: function (n) { return "Nhặt " + n + " trứng gà"; },                 get: function () { return G.eggsToday; },      reward: { money: 6000, stars: 0 } },
      { id: "fish",    targets: [1, 2],       txt: function (n) { return "Câu " + n + " con cá rô ở ao"; },            get: function () { return G.fishToday; },      reward: { money: 10000, stars: 0 } },
      { id: "banana",  targets: [1, 2],       txt: function (n) { return "Hái " + n + " nải chuối chín"; },            get: function () { return G.bananaToday; },   reward: { money: 7000, stars: 0 } },
      { id: "cook",    targets: [1],          txt: function () { return "Nấu bữa cơm nhà ở bếp củi"; },                get: function () { return G.cookedToday ? 1 : 0; }, reward: { money: 0, stars: 1 } },
      { id: "school",  targets: [1],          txt: function () { return "Đưa bé An tới trường đúng giờ"; },            get: function () { return G.schoolOnTime === true ? 1 : 0; }, reward: { money: 0, stars: 1 } }
    ];
    export function rollQuests() {
      var pool = QUEST_DEFS.slice();
      // Việc đưa con đi học chỉ có ý nghĩa buổi sáng — luôn ưu tiên có mặt, thêm 2 việc ngẫu nhiên
      var picked = [pool.splice(8, 1)[0]];
      while (picked.length < 3 && pool.length) {
        picked.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      }
      G.quests = picked.map(function (d) {
        var tg = d.targets[Math.floor(Math.random() * d.targets.length)];
        return { id: d.id, target: tg, text: d.txt(tg), reward: d.reward, done: false };
      });
    }
    export function questDef(id) { for (var i = 0; i < QUEST_DEFS.length; i++) if (QUEST_DEFS[i].id === id) return QUEST_DEFS[i]; return null; }
    export function questProgress(q) { var d = questDef(q.id); return d ? Math.min(d.get(), q.target) : 0; }

    export var ACHIEVEMENTS = [
      { id: "first-harvest", name: "Vụ rau đầu tiên", desc: "Thu hoạch món nông sản đầu tiên", test: function () { return G.totalHarvest >= 1; } },
      { id: "earner", name: "Biết làm ăn", desc: "Tổng thu nhập của nhà đạt 200.000đ", test: function () { return G.totalEarned >= 200000; } },
      { id: "week", name: "Một tuần ở quê", desc: "Sống tới ngày 7", test: function () { return G.day >= 7; } },
      { id: "stars10", name: "Nhà mình vui vẻ", desc: "Đạt 10 sao vui vẻ", test: function () { return G.stars >= 10; } },
      { id: "guard", name: "Canh nhà giỏi", desc: "Đuổi kịp trộm 2 lần", test: function () { return G.thiefChased >= 2; } },
      { id: "worker", name: "Siêng năng đảm đang", desc: "Hoàn thành 5 nhiệm vụ hằng ngày", test: function () { return G.questsDoneTotal >= 5; } },
      { id: "saver", name: "Có của để dành", desc: "Quỹ sửa nhà đạt 300.000đ", test: function () { return G.savingsGoalDone; } }
    ];
    export function addMemory(txt) {
      G.memories.push("Ngày " + G.day + " — " + txt);
      if (G.memories.length > 40) G.memories.shift();
    }
    export function checkQuestsAchievements() {
      G.quests.forEach(function (q) {
        if (q.done) return;
        var d = questDef(q.id);
        if (d && d.get() >= q.target) {
          q.done = true; G.questsDoneTotal++;
          if (q.reward.money) { G.money += q.reward.money; G.totalEarned += q.reward.money; }
          if (q.reward.stars) G.stars += q.reward.stars;
          sndCoin();
          toast("Xong việc: " + q.text + " — thưởng " +
            (q.reward.money ? fmt(q.reward.money) : "") + (q.reward.money && q.reward.stars ? " + " : "") +
            (q.reward.stars ? q.reward.stars + " sao vui vẻ" : "") + "!", true);
          addMemory("Làm xong việc \"" + q.text + "\".");
          saveGame();
        }
      });
      ACHIEVEMENTS.forEach(function (a) {
        if (G.achievements[a.id]) return;
        if (a.test()) {
          G.achievements[a.id] = G.day;
          toast("Thành tựu mới: " + a.name + " — " + a.desc, true);
          addMemory("Đạt thành tựu \"" + a.name + "\".");
          saveGame();
        }
      });
      if (!G.savingsGoalDone && G.savings >= 300000) {
        G.savingsGoalDone = true; G.stars += 3;
        toast("Quỹ sửa nhà đủ 300.000đ rồi! Cả nhà mừng rỡ +3 sao vui vẻ", true);
        addMemory("Để dành đủ 300.000đ vào Quỹ sửa nhà.");
        saveGame();
      }
    }
    export function renderQuestCard() {
      var box = el("quest-list"); if (!box) return;
      var html = "";
      G.quests.forEach(function (q) {
        html += '<div class="q-row' + (q.done ? " done" : "") + '"><span>' + q.text + '</span><span class="pr">' +
          (q.done ? "Xong" : questProgress(q) + "/" + q.target) + '</span></div>';
      });
      if (G.tuQuest) {
        html += '<div class="q-row tu"><span>Bà Tư nhờ: mang ' + G.tuQuest.n + " " + G.tuQuest.name + ' cho bà</span><span class="pr">' +
          Math.min(G.produce[G.tuQuest.key] || 0, G.tuQuest.n) + "/" + G.tuQuest.n + '</span></div>';
      }
      box.innerHTML = html || '<div class="q-row">Hôm nay chưa có việc nào.</div>';
    }
    export function renderQuestPanel() {
      var full = "";
      G.quests.forEach(function (q) {
        full += '<div class="ach-row' + (q.done ? "" : "") + '"><span>' + q.text + (q.done ? " — đã xong" : "") + '</span><b>' +
          (q.done ? "Đã nhận thưởng" : questProgress(q) + "/" + q.target) + '</b></div>';
      });
      if (G.tuQuest) full += '<div class="ach-row"><span>Việc bà Tư nhờ: mang ' + G.tuQuest.n + " " + G.tuQuest.name + ' qua nhà bà</span><b>Thưởng ' + fmt(G.tuQuest.reward) + '</b></div>';
      el("quest-full").innerHTML = full || '<div class="mem-row">Chưa có nhiệm vụ nào.</div>';
      el("goal-rows").innerHTML =
        '<div class="ach-row"><span>Quỹ sửa nhà (gửi ở sạp cô Tư, 10.000đ mỗi lần)</span><b>' + fmt(G.savings) + " / 300.000đ" + (G.savingsGoalDone ? " — Đủ rồi!" : "") + '</b></div>' +
        '<div class="ach-row"><span>Tổng thu nhập từ ngày về quê</span><b>' + fmt(G.totalEarned) + '</b></div>' +
        '<div class="ach-row"><span>Nhiệm vụ đã hoàn thành</span><b>' + G.questsDoneTotal + ' việc</b></div>';
      var ach = "";
      ACHIEVEMENTS.forEach(function (a) {
        var got = G.achievements[a.id];
        ach += '<div class="ach-row' + (got ? "" : " locked") + '"><span><b style="color:#ffd97a">' + a.name + '</b> — ' + a.desc + '</span><b>' + (got ? "Ngày " + got : "Chưa đạt") + '</b></div>';
      });
      el("ach-list").innerHTML = ach;
      el("mem-list").innerHTML = G.memories.length
        ? G.memories.slice().reverse().map(function (m) { return '<div class="mem-row">' + m + '</div>'; }).join("")
        : '<div class="mem-row">Chưa có kỷ niệm nào — cứ sống từng ngày, chuyện vui sẽ tự ghi lại.</div>';
    }

