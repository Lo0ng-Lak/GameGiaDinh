// @ts-nocheck
/*
 * GameGiaDinh — assets/src/economy/shop.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/economy/shop.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { CROPS, CROP_KEYS } from '../core/data';
import { saveGame } from '../core/save';
import { G, fmt, produceTotal, produceValue } from '../core/state';
import { exitLock } from '../player/player';
import { el, toast, updateHUD } from '../ui/hud';
import { sndCoin } from '../world/sound';

    /* ================== SẠP BÁN ================== */
    export var shopOverlay = el("shop-overlay");
    export function renderShop() {
      var sellBox = el("shop-sell");
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
      } else {
        sellBox.innerHTML = '<p class="sub" style="margin-top:10px">Giỏ đang trống — thu hoạch rau rồi quay lại bán nhé.</p>';
      }
      var rows = el("shop-rows"); rows.innerHTML = "";
      CROP_KEYS.forEach(function (k) {
        var c = CROPS[k];
        var row = document.createElement("div"); row.className = "shop-row";
        var info = document.createElement("div"); info.className = "info";
        info.innerHTML = '<div class="nm">Hạt ' + c.name + '</div><div class="pr">Giá ' + fmt(c.seed) +
          ' · Bán ra ' + fmt(c.sell) + (c.yield > 1 ? " · Hái được " + c.yield : "") + ' · Đang có ' + G.seeds[k] + ' hạt</div>';
        var btn = document.createElement("button");
        btn.className = "buy-btn"; btn.type = "button"; btn.textContent = "Mua 1 hạt";
        btn.disabled = G.money < c.seed;
        btn.addEventListener("click", function () {
          if (G.money < c.seed) return;
          G.money -= c.seed; G.seeds[k]++; sndCoin();
          toast("Đã mua 1 hạt " + c.name + ".");
          renderShop(); updateHUD();
        });
        row.appendChild(info); row.appendChild(btn); rows.appendChild(row);
      });
      // Quỹ sửa nhà: tiền dư gửi vào đây, đủ 300.000đ là mục tiêu lớn của cả nhà
      var srow = document.createElement("div"); srow.className = "shop-row";
      var sinfo = document.createElement("div"); sinfo.className = "info";
      sinfo.innerHTML = '<div class="nm">Quỹ sửa nhà</div><div class="pr">Đã để dành ' + fmt(G.savings) +
        ' / 300.000đ' + (G.savingsGoalDone ? ' · Đủ rồi, cả nhà mừng lắm!' : ' · Gửi 10.000đ mỗi lần') + '</div>';
      var sbtn = document.createElement("button");
      sbtn.className = "buy-btn"; sbtn.type = "button"; sbtn.textContent = "Gửi 10.000đ";
      sbtn.disabled = G.money < 10000 || G.savingsGoalDone;
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

