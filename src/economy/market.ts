// @ts-nocheck
/*
 * GameGiaDinh — src/economy/market.ts
 * GIAI ĐOẠN 3: chợ làng — 3 sạp mua nông sản giá cao hơn sạp cô Tư
 * (chuyên món +10%, sạp chung +5%), tiệm tạp hóa bán đồ nhà (mỗi món +1 sao,
 * mua được 1 lần/ngày). Giá chợ vẫn dựa trên giá ngày (sellPriceOf) nên
 * khớp kinh tế đã cân bằng ở Giai đoạn 2 — chợ chỉ là tiền công đi chợ.
 */
import { G, fmt, sellPriceOf } from '../core/state';
import { CROPS, GOODS, CROP_KEYS, GOOD_KEYS } from '../core/data';
import { saveGame } from '../core/save';
import { sndCoin } from '../world/sound';
import { toast, updateHUD, el } from '../ui/hud';
import { addMemory, checkQuestsAchievements } from '../events/quests';

export var VENDORS = {
  ba: {
    name: "Sạp rau cô Ba", bonus: 0.10,
    keys: ["cai", "cachua", "bido", "ngo"],
    note: "Cô Ba lấy rau củ tươi, giá chợ cao hơn sạp làng 10%."
  },
  lan: {
    name: "Sạp trái cây chị Lan", bonus: 0.10,
    // PHASE 4.2: chị Lan lấy thêm bánh trung thu dịp lễ (bánh chưng, lồng
    // đèn thì anh Đức lấy vì sạp đồ khô lấy mọi món trong GOOD_KEYS).
    keys: ["xoai", "oi", "trung", "trungvit", "chuoi", "banhtrungthu"],
    note: "Chị Lan lấy xoài, ổi, trứng, chuối — giá chợ cao hơn 10%."
  },
  duc: {
    name: "Sạp đồ khô anh Đức", bonus: 0.05,
    keys: CROP_KEYS.concat(GOOD_KEYS),
    note: "Anh Đức lấy tất cả mọi thứ, giá chợ cao hơn 5%."
  }
};
export var GROCERY = [
  { id: "cake", name: "Bánh đậu xanh", price: 8000, desc: "Hộp bánh đậu xanh cho cả nhà ăn trưa — mua 1 lần/ngày, +1 sao vui vẻ." },
  { id: "fishsauce", name: "Chai nước mắm ngon", price: 15000, desc: "Nước mắm ngon nấu cơm tối — mua 1 lần/ngày, +1 sao vui vẻ." },
  { id: "rice", name: "Bao gạo mới 5kg", price: 25000, desc: "Gạo mới cho cả tuần — mua 1 lần/ngày, +1 sao vui vẻ." }
];

// Giá chợ cho 1 món: giá ngày, làm tròn trăm, cộng % thưởng của sạp
export function marketPriceOf(vendorId, key) {
  var v = VENDORS[vendorId];
  var p = sellPriceOf(key);
  return Math.round(p * (1 + v.bonus) / 100) * 100;
}

// ---- Bán cho sạp chợ ----
export function sellToVendor(vendorId, key) {
  var v = VENDORS[vendorId];
  if (!v || v.keys.indexOf(key) < 0) return 0;
  var n = G.produce[key] || 0;
  if (n <= 0) return 0;
  var p = marketPriceOf(vendorId, key);
  var total = n * p;
  G.produce[key] = 0;
  G.money += total; G.earnedToday += total; G.totalEarned += total;
  G.marketSoldToday += total;
  sndCoin();
  var nm = CROPS[key] ? CROPS[key].name : GOODS[key].name;
  toast(v.name + ": \"Cảm ơn chị!\" Đã bán " + n + " " + nm + " được " + fmt(total) + " (giá chợ " + fmt(p) + ").", true);
  saveGame(); updateHUD();
  checkQuestsAchievements();
  return total;
}
export function vendorBuyableCount(vendorId) {
  var v = VENDORS[vendorId];
  var n = 0;
  v.keys.forEach(function (k) { if ((G.produce[k] || 0) > 0) n++; });
  return n;
}

// ---- Mua đồ ở tiệm tạp hóa ----
export function buyGrocery(id) {
  var item = null;
  GROCERY.forEach(function (g) { if (g.id === id) item = g; });
  if (!item) return false;
  if (G.groceryToday[id]) return false; // đã mua hôm nay
  if (G.money < item.price) { toast("Chưa đủ tiền mua " + item.name + " (" + fmt(item.price) + ")."); return false; }
  G.money -= item.price; G.spentToday += item.price;
  G.groceryToday[id] = true; G.stars++;
  toast("Đã mua " + item.name + " ở tiệm ông Tư. Cả nhà có món ngon — +1 sao vui vẻ.", true);
  addMemory("Mua " + item.name + " ở tiệm tạp hóa.");
  saveGame(); updateHUD();
  return true;
}

// ---- Bảng sạp chợ / tiệm tạp hóa (overlay riêng, giống sạp cô Tư) ----
var marketMode = null; // {kind:'vendor', vendor:'ba'} | {kind:'grocery'}
export function openVendorPanel(vendorId) {
  var v = VENDORS[vendorId];
  if (!v) return;
  marketMode = { kind: "vendor", vendor: vendorId };
  var box = el("market-rows");
  box.innerHTML = "";
  var h = document.createElement("h3"); h.textContent = v.name;
  box.appendChild(h);
  var p = document.createElement("p"); p.className = "sub"; p.textContent = v.note;
  box.appendChild(p);
  var any = false;
  v.keys.forEach(function (k) {
    var n = G.produce[k] || 0;
    if (n <= 0) return;
    any = true;
    var nm = CROPS[k] ? CROPS[k].name : GOODS[k].name;
    var row = document.createElement("div"); row.className = "shop-row";
    row.innerHTML = '<div class="info"><div class="nm">' + nm + ' × ' + n + '</div><div class="pr">Giá chợ ' + fmt(marketPriceOf(vendorId, k)) + ' (sạp làng ' + fmt(sellPriceOf(k)) + ') · Tổng ' + fmt(n * marketPriceOf(vendorId, k)) + '</div></div>';
    var btn = document.createElement("button"); btn.className = "buy-btn"; btn.type = "button";
    btn.textContent = "Bán hết";
    btn.addEventListener("click", function () { sellToVendor(vendorId, k); openVendorPanel(vendorId); });
    row.appendChild(btn); box.appendChild(row);
  });
  if (!any) {
    var empty = document.createElement("p"); empty.className = "sub";
    empty.textContent = "Giỏ đang trống — sạp này không có gì để mua của chị hôm nay.";
    box.appendChild(empty);
  }
  document.getElementById("market-title").textContent = v.name;
  el("market-overlay").classList.add("show");
}
export function openGroceryPanel() {
  marketMode = { kind: "grocery" };
  var box = el("market-rows");
  box.innerHTML = "";
  var h = document.createElement("h3"); h.textContent = "Tiệm tạp hóa ông Tư";
  box.appendChild(h);
  var p = document.createElement("p"); p.className = "sub";
  p.textContent = "Đồ dùng cho nhà — mỗi món mua được 1 lần/ngày, mua xong cả nhà vui (+1 sao).";
  box.appendChild(p);
  GROCERY.forEach(function (g) {
    var bought = !!G.groceryToday[g.id];
    var row = document.createElement("div"); row.className = "shop-row";
    row.innerHTML = '<div class="info"><div class="nm">' + g.name + '</div><div class="pr">' + g.desc + ' · Giá ' + fmt(g.price) + (bought ? ' · Đã mua hôm nay ✓' : '') + '</div></div>';
    var btn = document.createElement("button"); btn.className = "buy-btn"; btn.type = "button";
    btn.textContent = bought ? "Đã mua" : "Mua";
    btn.disabled = bought || G.money < g.price;
    btn.addEventListener("click", function () { if (buyGrocery(g.id)) openGroceryPanel(); });
    row.appendChild(btn); box.appendChild(row);
  });
  document.getElementById("market-title").textContent = "Tiệm tạp hóa ông Tư";
  el("market-overlay").classList.add("show");
}
export function closeMarketPanel() { el("market-overlay").classList.remove("show"); marketMode = null; }
el("market-close").addEventListener("click", function () { el("market-overlay").classList.remove("show"); });
