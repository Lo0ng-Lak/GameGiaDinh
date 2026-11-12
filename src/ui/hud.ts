// @ts-nocheck
/*
 * GameGiaDinh — assets/src/ui/hud.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/ui/hud.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { CROP_KEYS, LIVESTOCK } from '../core/data';
import { G, SCHOOL_BELL, fmt, fmtTime, produceTotal } from '../core/state';
import { checkQuestsAchievements, renderQuestCard, renderQuestPanel } from '../events/quests';
import { plots } from '../farming/garden';
import { exitLock } from '../player/player';
import { AMB, sndCoin } from '../world/sound';
import { weatherLabel } from '../world/weather';
import { festivalHudSuffix } from '../events/festivals';

    /* ================== TOAST + HUD ================== */
    export var toastBox = document.getElementById("toasts");
    export function toast(msg, money) {
      var t = document.createElement("div");
      t.className = "toast" + (money ? " money" : ""); t.textContent = msg;
      toastBox.appendChild(t);
      setTimeout(function () { t.classList.add("bye"); }, 2400);
      setTimeout(function () { t.remove(); }, 2900);
      while (toastBox.children.length > 3) toastBox.firstChild.remove();
    }
    export var el = function (id) { return document.getElementById(id); };
    export function updateHUD() {
      el("hud-day").textContent = "Ngày " + G.day;
      // PHASE 4.1: thời tiết hôm nay + mùa hiện tại, hiện ngay dưới số ngày
      // PHASE 4.2: ngày lễ thì thêm tên lễ ngay sau đó ("· 🧧 Tết Mùng 1")
      el("hud-wx").textContent = weatherLabel(G.weather, G.season) + festivalHudSuffix();
      el("hud-time").textContent = fmtTime(G.minutes);
      var ph = G.minutes < 420 ? "Bình minh" : G.minutes < 660 ? "Buổi sáng" : G.minutes < 840 ? "Buổi trưa" :
               G.minutes < 1020 ? "Buổi chiều" : "Hoàng hôn";
      el("hud-phase").textContent = ph;
      el("hud-money").textContent = fmt(G.money);
      el("hearts").textContent = "Sao vui vẻ: " + G.stars;
      el("can-text").textContent = G.can + "/" + G.canMax;
      el("can-fill").firstElementChild.style.width = (G.can / G.canMax * 100) + "%";
      var bt = produceTotal();
      el("basket-text").textContent = bt === 0 ? "Trống" : bt + " món";
      el("meal-text").textContent = G.cookedToday ? "Đã nấu" : "Chưa nấu";
      CROP_KEYS.forEach(function (k) {
        document.querySelector('[data-seed-count="' + k + '"]').textContent =
          "Hạt: " + G.seeds[k] + " · Giỏ: " + G.produce[k];
      });
      document.querySelectorAll(".seed-btn").forEach(function (b) {
        b.classList.toggle("sel", b.dataset.seed === G.selSeed);
      });
      if (G.started && !G.dayOver) { checkQuestsAchievements(); renderQuestCard(); }
    }
    el("btn-quests").addEventListener("click", function () {
      exitLock(); renderQuestPanel(); el("quest-overlay").classList.add("show");
    });
    el("quest-close").addEventListener("click", function () { el("quest-overlay").classList.remove("show"); });
    export function selectSeed(k) { G.selSeed = k; updateHUD(); }
    document.querySelectorAll(".seed-btn").forEach(function (b) {
      b.addEventListener("click", function () { selectSeed(b.dataset.seed); });
    });
    el("btn-sound").addEventListener("click", function () {
      G.soundOn = !G.soundOn;
      if (AMB.master) AMB.master.gain.value = G.soundOn ? 1 : 0;
      el("sound-state").textContent = G.soundOn ? "Đang bật" : "Đang tắt";
      if (G.soundOn) sndCoin();
    });

    export function objectiveText() {
      if (G.thief.state === "in" || G.thief.state === "steal" || G.thief.state === "out")
        return "<b>Có trộm lẻn vào sân!</b> — chạy lại gần nó bấm <b>E</b> để đuổi ra, đừng để nó mang đồ chạy thoát.";
      if (G.tuQuest)
        return "Bà Tư nhờ mua hộ <b>" + G.tuQuest.n + " " + G.tuQuest.name + "</b> — có đủ trong giỏ thì ra hiên <b>nói chuyện với bà</b> để giao, bà trả " + fmt(G.tuQuest.reward) + ".";
      if (G.visit.state === "here" && !G.visit.talked)
        return "Bà Tư hàng xóm đang ở hiên — ra <b>nói chuyện với bà</b> một lát.";
      if (G.childState === "home" && G.minutes < SCHOOL_BELL + 90)
        return "Việc đầu ngày: <b>đưa bé An đi học</b> — bé đang chờ ở hiên nhà, hạn chót <b>7:30</b>.";
      if (G.childState === "follow")
        return "Đang nắm tay bé An — đi theo đường đất tới <b>cổng trường</b> (vòng vàng ở cuối đường).";
      var mature = plots.some(function (p) { return p.state === "mature"; });
      if (mature) return "Có luống <b>rau đã chín</b> (vòng vàng) — lại gần bấm E để thu hoạch.";
      if (G.fish.state === "bite") return "<b>Cá đang cắn câu ở ao!</b> — chạy nhanh ra bờ ao giật cần.";
      if (G.chicken.ready > 0) return "Ổ gà có <b>" + G.chicken.ready + " trứng</b> — ra chuồng gà nhặt trứng vào giỏ.";
      // PHASE 2: trái cây chín, trứng vịt (sửa lỗi cũ: so sánh t.type thay vì
      // t.state nên gợi ý này không bao giờ hiện)
      var treeRipe = G.trees.filter(function (t) { return t.state === "mature" && t.fruitReady > 0; }).length;
      if (treeRipe > 0) return "Cây ăn quả có <b>trái chín</b> (vòng vàng) — lại gần bấm E để hái.";
      if (G.ducks.owned && G.ducks.ready > 0) return "Ổ vịt có <b>" + G.ducks.ready + " trứng vịt</b> — ra bờ ao nhặt trứng vào giỏ.";
      if (!G.cookedToday && G.minutes >= 630 && G.minutes < 1080)
        return "Nhớ ghé <b>bếp củi nấu cơm</b> cho cả nhà — có cá hay trứng trong giỏ thì dùng luôn.";
      if (G.husband.state === "walking") return "Anh đi làm thuê đang về tới — ra hiên đón anh nhé.";
      if (produceTotal() > 0) return "Giỏ đang có rau — mang ra <b>sạp cô Tư</b> ở đầu đường để bán, mua thêm hạt.";
      // PHASE 2: lợn chưa ăn, cây ăn quả khát nước (sửa lỗi cũ: t.type -> t.state)
      if (G.owned.pigpen && G.pigs.count > 0 && !G.pigs.fedToday) return "Lợn trong chuồng <b>chưa ăn</b> — ra góc sân cho lợn ăn cám, mỗi con ăn đủ " + LIVESTOCK.piglet.growDays + " hôm là lớn.";
      var dryTree = G.trees.some(function (t) { return t.state === "growing" && !t.watered; });
      if (dryTree) return "Cây ăn quả đang <b>khô nước</b> (giọt xanh) — múc nước ở giếng rồi tưới, cây mới lớn tiếp.";
      var dry = plots.some(function (p) { return p.state === "growing" && !p.watered; });
      if (dry) return "Có luống đang <b>khô nước</b> (giọt xanh) — múc nước ở giếng rồi tưới, cây mới lớn tiếp.";
      var growing = plots.some(function (p) { return p.state === "growing"; });
      if (growing) return "Rau đang lớn dần. Trong lúc chờ, trồng thêm luống trống hoặc ngắm sân nhà.";
      if (CROP_KEYS.some(function (k) { return G.seeds[k] > 0; }))
        return "Ra vườn <b>trồng rau</b>: chọn hạt ở thanh dưới, lại gần luống trống bấm E.";
      // PHASE 2: nhắc trồng cây giống, nhắc mua đồ khi tiền đã dư
      if (G.saplings.xoai > 0 || G.saplings.oi > 0)
        return "Trong túi có <b>cây giống</b> — ra mô đất trống trong sân bấm E để trồng.";
      if (G.money >= 150000 && (!G.owned.tv || !G.owned.bike))
        return "Tiền đã dư " + fmt(G.money) + " — ra <b>sạp cô Tư</b> mua tivi, xe máy cho nhà khang trang hơn.";
      return "Hết hạt rồi — ra <b>sạp cô Tư</b> mua thêm hạt giống nhé.";
    }

