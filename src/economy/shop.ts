// @ts-nocheck
/*
 * GameGiaDinh — assets/src/economy/shop.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/economy/shop.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 *
 * GIAI ĐOẠN 2: sạp cô Tư thành cửa hàng chung — hạt giống, cây ăn quả, vật nuôi,
 * nâng cấp nhà cửa, sửa nhà bằng quỹ. Giá bán nông sản lên xuống mỗi ngày (±10%).
 */
import { CROPS, CROP_KEYS, GOODS, GOOD_KEYS, FRUIT_TREES, LIVESTOCK, UPGRADES, HOUSE_REPAIR_SAVINGS, priceOf } from '../core/data';
import { saveGame } from '../core/save';
import { G, fmt, produceTotal, produceValue, sellPriceOf } from '../core/state';
import { exitLock } from '../player/player';
import { el, toast, updateHUD } from '../ui/hud';
import { sndCoin } from '../world/sound';
import { buyUpgrade, repairHouse, buySapling, buyDuckFlock, buyPiglet, sellPigFromShop } from './upgrades';

    /* ================== SẠP BÁN ================== */
    export var shopOverlay = el("shop-overlay");

    // PHASE 2: giá bán lên xuống mỗi ngày — 25% giảm, 50% giữ, 25% tăng (±10%)
    export function rollPrices() {
      var day = {};
      CROP_KEYS.concat(GOOD_KEYS).forEach(function (k) {
        var r = Math.random();
        day[k] = r < 0.25 ? 0.9 : (r < 0.75 ? 1.0 : 1.1);
      });
      G.priceDay = day;
    }

    function shopSection(rows, title) {
      var h = document.createElement("div"); h.className = "shop-sec"; h.textContent = title;
      rows.appendChild(h);
    }
    function shopRow(rows, name, desc, btnText, disabled, onClick) {
      var row = document.createElement("div"); row.className = "shop-row";
      var info = document.createElement("div"); info.className = "info";
      info.innerHTML = '<div class="nm">' + name + '</div><div class="pr">' + desc + '</div>';
      var btn = document.createElement("button");
      btn.className = "buy-btn"; btn.type = "button"; btn.textContent = btnText;
      btn.disabled = !!disabled;
      if (onClick) btn.addEventListener("click", onClick);
      row.appendChild(info); row.appendChild(btn); rows.appendChild(row);
      return btn;
    }

    export function renderShop() {
      var sellBox = el("shop-sell");
      // Bảng giá hôm nay — giá nông sản lên xuống theo ngày
      var priceLine = "";
      CROP_KEYS.concat(GOOD_KEYS).forEach(function (k) {
        var base = priceOf(k), today = sellPriceOf(k);
        var arrow = today > base ? " ▲" : (today < base ? " ▼" : "");
        priceLine += (priceLine ? " · " : "") + (CROPS[k] ? CROPS[k].name : GOODS[k].name) + " " + fmt(today) + arrow;
      });
      if (produceTotal() > 0) {
        sellBox.innerHTML = "";
        var b = document.createElement("button");
        b.className = "big-btn"; b.type = "button";
        b.textContent = "Bán hết nông sản trong giỏ — nhận " + fmt(produceValue());
        b.addEventListener("click", function () {
          var v = produceValue();
          G.money += v; G.earnedToday += v; G.totalEarned += v;
          for (var kk in G.produce) G.produce[kk] = 0;
          sndCoin(); toast("Cô Tư: \"Rau tươi quá!\" Đã bán được " + fmt(v) + ".", true);
          renderShop(); updateHUD(); saveGame();
        });
        sellBox.appendChild(b);
        var pl = document.createElement("p"); pl.className = "sub"; pl.style.marginTop = "8px";
        pl.textContent = "Giá hôm nay: " + priceLine;
        sellBox.appendChild(pl);
      } else {
        sellBox.innerHTML = '<p class="sub" style="margin-top:10px">Giỏ đang trống — thu hoạch rau rồi quay lại bán nhé.</p>' +
          '<p class="sub">Giá hôm nay: ' + priceLine + '</p>';
      }
      var rows = el("shop-rows"); rows.innerHTML = "";
      /* ---- Hạt giống ---- */
      shopSection(rows, "🌱 Hạt giống");
      CROP_KEYS.forEach(function (k) {
        var c = CROPS[k];
        shopRow(rows, "Hạt " + c.name,
          "Giá " + fmt(c.seed) + " · Bán ra " + fmt(sellPriceOf(k)) + " hôm nay" + (c.yield > 1 ? " · Hái được " + c.yield : "") + " · Đang có " + G.seeds[k] + " hạt",
          "Mua 1 hạt", G.money < c.seed, function () {
            if (G.money < c.seed) return;
            G.money -= c.seed; G.seeds[k]++; G.boughtToday++; sndCoin();
            toast("Đã mua 1 hạt " + c.name + ".");
            renderShop(); updateHUD(); saveGame();
          });
      });
      /* ---- Cây ăn quả (PHASE 2) ---- */
      shopSection(rows, "🌳 Cây ăn quả — trồng ở 3 mô đất trống trong sân");
      Object.keys(FRUIT_TREES).forEach(function (k) {
        var t = FRUIT_TREES[k];
        shopRow(rows, "Cây " + t.name.toLowerCase() + " giống",
          "Giá " + fmt(t.sapling) + " · Tưới " + t.waters + " lần là lớn · Mỗi sáng hái " + t.fruitPerDay + " " + t.fruitName.toLowerCase() + " (bán " + fmt(GOODS[t.fruit].sell) + "/quả) · Đang có " + G.saplings[k] + " cây giống",
          "Mua 1 cây giống", G.money < t.sapling, function () {
            if (buySapling(k)) { sndCoin(); renderShop(); }
          });
      });
      /* ---- Vật nuôi (PHASE 2) ---- */
      shopSection(rows, "🐔 Vật nuôi");
      if (!G.ducks.owned) {
        shopRow(rows, LIVESTOCK.duckFlock.name,
          "Giá " + fmt(LIVESTOCK.duckFlock.price) + " · Vịt về bờ ao · Cho ăn cám " + fmt(LIVESTOCK.duckFlock.feed) + ", ~30 giây sau đẻ " + LIVESTOCK.duckFlock.eggMin + "–" + LIVESTOCK.duckFlock.eggMax + " trứng vịt (bán " + fmt(GOODS.trungvit.sell) + "/quả)",
          "Mua đàn vịt", G.money < LIVESTOCK.duckFlock.price, function () {
            if (buyDuckFlock()) { sndCoin(); renderShop(); }
          });
      } else {
        shopRow(rows, LIVESTOCK.duckFlock.name, "Đàn vịt đang ở bờ ao — cho ăn cám rồi ra ổ nhặt trứng.", "Đã mua ✓", true);
      }
      if (!G.owned.pigpen) {
        shopRow(rows, "Lợn con", "Cần xây chuồng lợn trước — xem mục Nâng cấp nhà cửa bên dưới.", "Chưa có chuồng", true);
      } else if (G.pigs.count < LIVESTOCK.piglet.max) {
        shopRow(rows, "Lợn con",
          "Giá " + fmt(LIVESTOCK.piglet.price) + " · Cho ăn " + fmt(LIVESTOCK.piglet.feed) + "/con mỗi ngày, ăn đủ " + LIVESTOCK.piglet.growDays + " hôm là lớn · Lợn lớn bán " + fmt(LIVESTOCK.piglet.sell) + "/con · Đang nuôi " + G.pigs.count + "/" + LIVESTOCK.piglet.max + " con",
          "Mua 1 lợn con", G.money < LIVESTOCK.piglet.price, function () {
            if (buyPiglet()) { sndCoin(); renderShop(); }
          });
      } else {
        shopRow(rows, "Lợn con", "Chuồng đã đủ " + G.pigs.count + " con — nuôi lớn rồi bán lấy tiền.", "Đã đủ lợn", true);
      }
      if (G.pigs.grown > 0) {
        shopRow(rows, "Bán lợn đã lớn",
          "Đang có " + G.pigs.grown + " con lợn đã lớn · Bán " + fmt(LIVESTOCK.piglet.sell) + "/con",
          "Bán 1 con", false, function () {
            if (sellPigFromShop()) { sndCoin(); renderShop(); }
          });
      }
      /* ---- Nâng cấp nhà cửa (PHASE 2) ---- */
      shopSection(rows, "🏠 Nâng cấp nhà cửa");
      Object.keys(UPGRADES).forEach(function (id) {
        var u = UPGRADES[id];
        var owned = G.owned[id];
        shopRow(rows, u.name + (u.stars ? " (+" + u.stars + " sao)" : ""),
          "Giá " + fmt(u.price) + " · " + u.desc + (owned ? " — Đã mua ✓" : ""),
          owned ? "Đã mua ✓" : "Mua", owned || G.money < u.price, function () {
            if (buyUpgrade(id)) { sndCoin(); renderShop(); }
          });
      });
      // Sửa nhà bằng Quỹ sửa nhà
      if (G.owned.houseFixed) {
        shopRow(rows, "Sửa nhà", "Nhà đã sửa xong — tường sơn mới, đèn lồng đỏ treo hai bên cửa. Cả nhà mừng lắm!", "Đã sửa xong ✓", true);
      } else if (G.savings >= HOUSE_REPAIR_SAVINGS) {
        shopRow(rows, "Sửa nhà (dùng Quỹ sửa nhà)",
          "Quỹ đã đủ " + fmt(G.savings) + " — sửa tường, lợp lại mái, treo đèn lồng. +2 sao vui vẻ.",
          "Sửa nhà ngay", false, function () {
            if (repairHouse()) { sndCoin(); renderShop(); }
          });
      } else {
        shopRow(rows, "Sửa nhà (dùng Quỹ sửa nhà)",
          "Cần đủ 300.000đ trong quỹ — đang có " + fmt(G.savings) + ". Gửi ở mục Tiết kiệm bên dưới.",
          "Chưa đủ quỹ", true);
      }
      /* ---- Tiết kiệm & sao ---- */
      shopSection(rows, "💰 Tiết kiệm & sao vui vẻ");
      // Quỹ sửa nhà: tiền dư gửi vào đây, đủ 300.000đ là mục tiêu lớn của cả nhà
      var srow = document.createElement("div"); srow.className = "shop-row";
      var sinfo = document.createElement("div"); sinfo.className = "info";
      if (G.owned.houseFixed) {
        sinfo.innerHTML = '<div class="nm">Quỹ sửa nhà</div><div class="pr">Nhà đã sửa xong — quỹ đã dùng hết để sửa nhà. Cả nhà cảm ơn quỹ tiết kiệm!</div>';
      } else {
        sinfo.innerHTML = '<div class="nm">Quỹ sửa nhà</div><div class="pr">Đã để dành ' + fmt(G.savings) +
          ' / 300.000đ' + (G.savingsGoalDone ? ' · Đủ rồi, cả nhà mừng lắm! Sửa nhà ở mục trên.' : ' · Gửi 10.000đ mỗi lần') + '</div>';
      }
      var sbtn = document.createElement("button");
      sbtn.className = "buy-btn"; sbtn.type = "button"; sbtn.textContent = "Gửi 10.000đ";
      sbtn.disabled = G.owned.houseFixed || G.money < 10000 || G.savingsGoalDone;
      sbtn.addEventListener("click", function () {
        if (G.money < 10000) return;
        G.money -= 10000; G.savings += 10000; sndCoin();
        toast("Đã gửi 10.000đ vào Quỹ sửa nhà. Giờ quỹ có " + fmt(G.savings) + ".");
        renderShop(); updateHUD(); saveGame();
      });
      srow.appendChild(sinfo); srow.appendChild(sbtn); rows.appendChild(srow);
      // Sao vui vẻ đổi được túi quà — sao không còn là con số để ngắm nữa
      var grow2 = document.createElement("div"); grow2.className = "shop-row";
      var ginfo = document.createElement("div"); ginfo.className = "info";
      ginfo.innerHTML = '<div class="nm">Túi quà quê (đổi bằng sao)</div><div class="pr">3 sao vui vẻ đổi 1 túi — trong túi có hạt giống hoặc ít tiền lẻ cô Tư lì xì. Đang có ' + G.stars + ' sao</div>';
      var gbtn = document.createElement("button");
      gbtn.className = "buy-btn"; gbtn.type = "button"; gbtn.textContent = "Đổi 3 sao";
      gbtn.disabled = G.stars < 3;
      gbtn.addEventListener("click", function () {
        if (G.stars < 3) return;
        G.stars -= 3; sndCoin();
        if (Math.random() < 0.5) {
          var gk = CROP_KEYS[Math.floor(Math.random() * CROP_KEYS.length)];
          G.seeds[gk] += 3;
          toast("Mở túi quà: được 3 hạt " + CROPS[gk].name + "! Cô Tư chu đáo quá.", true);
        } else {
          var gm = 12000 + Math.floor(Math.random() * 5) * 2000;
          G.money += gm; G.totalEarned += gm;
          toast("Mở túi quà: cô Tư lì xì " + fmt(gm) + " trong túi!", true);
        }
        renderShop(); updateHUD(); saveGame();
      });
      grow2.appendChild(ginfo); grow2.appendChild(gbtn); rows.appendChild(grow2);
    }
    export function openShop() { exitLock(); renderShop(); shopOverlay.classList.add("show"); }
    el("shop-close").addEventListener("click", function () { shopOverlay.classList.remove("show"); });
