// @ts-nocheck
/*
 * GameGiaDinh — src/events/festivals.ts
 * GIAI ĐOẠN 4.2: lễ hội trong năm — Tết, Tết Trung thu, sinh nhật, kỷ niệm
 * ngày cưới, họ hàng sum họp.
 *
 * Lịch: một "năm" trong game dài 360 ngày = sáu chu kỳ mùa 60 ngày
 * (xem seasonOf trong src/world/weather.ts: mỗi chu kỳ 30 ngày mùa mưa
 * rồi 30 ngày mùa khô). Ngày trong năm = ((ngày - 1) % 360) + 1.
 * Ngày lễ gắn với mùa cho hợp lý: Tết vào đầu mùa khô (ngày 31–33, 3
 * ngày đầu của đợt khô đầu tiên trong năm), Trung thu vào ngày cuối
 * của một đợt mùa mưa (ngày 270), sinh nhật rải đều qua các mùa.
 * Mỗi năm có 13 ngày lễ — đủ để mong chờ, không dồn dập.
 *
 * Luật chơi trong ngày lễ (chỉ ngày đó, hôm sau hết):
 *  - Sáng ra cả nhà nhận một món quà nhỏ (lì xì / sao / hạt giống) —
 *    chỉ nhận ĐƯỢC MỘT LẦN cho mỗi ngày lễ (ghi vào
 *    G.festivalClaimed theo số ngày tuyệt đối, nên tải lại giữa ngày
 *    hay chơi lại từ save cũ cũng không nhận trùng).
 *  - Một nhiệm vụ lễ hội thay 1 trong 3 việc hằng ngày (dùng đúng hệ
 *    nhiệm vụ cũ trong quests.ts — các việc "fest-*" chỉ giao ngày lễ,
 *    rollQuests() thường không bao giờ bốc trúng).
 *  - Đồ lễ hội (bánh chưng, bánh trung thu, lồng đèn) chỉ bán ở sạp cô
 *    Tư trong vài ngày quanh lễ — mua về làm nhiệm vụ lễ hội hoặc để
 *    dành, bán lại thì lỗ một ít (không phải đường làm giàu).
 *  - Trang trí 3D chỉ hiện trong ngày lễ (xem src/world/festivalDecor.ts).
 */
import { G, fmt, goodName } from '../core/state';
import { el, toast, updateHUD } from '../ui/hud';
import { addMemory } from './quests';
import { saveGame } from '../core/save';
import { showFestivalDecor } from '../world/festivalDecor';

export var YEAR_CYCLE = 360;   // 1 năm trong game = 360 ngày = 6 chu kỳ mùa 60 ngày

export function dayOfYear(day) {
  return ((day - 1) % YEAR_CYCLE) + 1;
}

// kind: "tet" | "midautumn" | "birthday" | "anniversary" | "gathering"
// gift: { money?, stars?, seeds? } — quà sáng ngày lễ, số nhỏ, không phá kinh tế.
// quest: nhiệm vụ lễ hội của ngày đó (dùng đúng id trong QUEST_DEFS).
export var FESTIVALS = [
  { id: "tet1", day: 31, kind: "tet", icon: "🧧", name: "Tết — Mùng 1", short: "Tết Mùng 1",
    gift: { money: 20000, stars: 2 },
    quest: { id: "fest-banhchung", target: 2, text: "Gói 2 bánh chưng cho ngày Tết (mua ở sạp cô Tư)", reward: { money: 10000, stars: 1 } } },
  { id: "tet2", day: 32, kind: "tet", icon: "🧧", name: "Tết — Mùng 2", short: "Tết Mùng 2",
    gift: { money: 10000, stars: 1 },
    quest: { id: "fest-greet", target: 3, text: "Chúc Tết 3 người hàng xóm", reward: { money: 0, stars: 1 } } },
  { id: "tet3", day: 33, kind: "tet", icon: "🧧", name: "Tết — Mùng 3", short: "Tết Mùng 3",
    gift: { money: 5000, stars: 1 },
    quest: { id: "cook", target: 1, text: "Nấu bữa cơm đầu năm cho cả nhà", reward: { money: 0, stars: 1 } } },
  { id: "an-birthday", day: 45, kind: "birthday", icon: "🎂", name: "Sinh nhật bé An", short: "Sinh nhật bé An",
    gift: { stars: 1, seeds: { cai: 2 } },
    quest: { id: "eggs", target: 3, text: "Nhặt 3 trứng gà nấu bữa sinh nhật bé An", reward: { money: 6000, stars: 1 } } },
  { id: "gathering1", day: 75, kind: "gathering", icon: "👨‍👩‍👧‍👦", name: "Họ hàng sum họp", short: "Họ hàng sum họp",
    gift: { money: 8000, stars: 1 },
    quest: { id: "sell", target: 30000, text: "Bán nông sản được 30.000đ đãi họ hàng", reward: { money: 0, stars: 1 } } },
  { id: "husband-birthday", day: 135, kind: "birthday", icon: "🎂", name: "Sinh nhật anh (chồng)", short: "Sinh nhật anh",
    gift: { money: 15000, stars: 1 },
    quest: { id: "fish", target: 1, text: "Câu 1 con cá rô nấu bữa sinh nhật anh", reward: { money: 0, stars: 1 } } },
  { id: "gathering2", day: 165, kind: "gathering", icon: "👨‍👩‍👧‍👦", name: "Họ hàng sum họp", short: "Họ hàng sum họp",
    gift: { money: 8000, stars: 1 },
    quest: { id: "sell", target: 30000, text: "Bán nông sản được 30.000đ đãi họ hàng", reward: { money: 0, stars: 1 } } },
  { id: "anniversary", day: 180, kind: "anniversary", icon: "💐", name: "Kỷ niệm ngày cưới", short: "Kỷ niệm ngày cưới",
    gift: { money: 15000, stars: 2 },
    quest: { id: "cook", target: 1, text: "Nấu bữa cơm kỷ niệm ngày cưới", reward: { money: 0, stars: 1 } } },
  { id: "wife-birthday", day: 225, kind: "birthday", icon: "🎂", name: "Sinh nhật vợ (người chơi)", short: "Sinh nhật vợ",
    gift: { money: 20000, stars: 2 },
    quest: { id: "harvest", target: 3, text: "Thu hoạch 3 món nông sản mừng sinh nhật", reward: { money: 0, stars: 1 } } },
  { id: "gathering3", day: 255, kind: "gathering", icon: "👨‍👩‍👧‍👦", name: "Họ hàng sum họp", short: "Họ hàng sum họp",
    gift: { money: 8000, stars: 1 },
    quest: { id: "sell", target: 30000, text: "Bán nông sản được 30.000đ đãi họ hàng", reward: { money: 0, stars: 1 } } },
  { id: "midautumn", day: 270, kind: "midautumn", icon: "🏮", name: "Tết Trung thu", short: "Tết Trung thu",
    gift: { money: 10000, stars: 1 },
    quest: { id: "fest-lantern", target: 1, text: "Mua 1 lồng đèn cho bé An (bán ở sạp cô Tư dịp Trung thu)", reward: { money: 5000, stars: 1 } } },
  { id: "tu-birthday", day: 315, kind: "birthday", icon: "🎂", name: "Sinh nhật bà Tư", short: "Sinh nhật bà Tư",
    gift: { stars: 1, seeds: { cachua: 2 } },
    quest: { id: "eggs", target: 2, text: "Nhặt 2 trứng gà biếu bà Tư", reward: { money: 8000, stars: 1 } } },
  { id: "gathering4", day: 345, kind: "gathering", icon: "👨‍👩‍👧‍👦", name: "Họ hàng sum họp", short: "Họ hàng sum họp",
    gift: { money: 8000, stars: 1 },
    quest: { id: "sell", target: 30000, text: "Bán nông sản được 30.000đ đãi họ hàng", reward: { money: 0, stars: 1 } } }
];

export function eventForDay(day) {
  var d = dayOfYear(day);
  for (var i = 0; i < FESTIVALS.length; i++) if (FESTIVALS[i].day === d) return FESTIVALS[i];
  return null;
}
export function eventById(id) {
  for (var i = 0; i < FESTIVALS.length; i++) if (FESTIVALS[i].id === id) return FESTIVALS[i];
  return null;
}
// Đoạn thêm vào dòng thời tiết ở HUD: " · 🧧 Tết Mùng 1" (ngày thường trả "").
export function festivalHudSuffix() {
  var ev = G.festivalToday ? eventById(G.festivalToday) : null;
  return ev ? " · " + ev.icon + " " + ev.short : "";
}
// Dòng tóm tắt lễ hội cho bảng "Hết ngày".
export function festivalSummaryText() {
  var ev = G.festivalToday ? eventById(G.festivalToday) : null;
  if (!ev) return "Không có lễ hội";
  return ev.name + (G.festivalGiftTxt ? " · " + G.festivalGiftTxt : "");
}

function giftText(gift) {
  var parts = [];
  if (gift.money) parts.push(fmt(gift.money));
  if (gift.stars) parts.push(gift.stars + " sao vui vẻ");
  if (gift.seeds) for (var k in gift.seeds) parts.push(gift.seeds[k] + " hạt " + goodName(k));
  return parts.join(" + ") || "niềm vui cả nhà";
}
function grantFestivalGift(ev) {
  var gift = ev.gift || {};
  if (gift.money) { G.money += gift.money; G.totalEarned += gift.money; }
  if (gift.stars) G.stars += gift.stars;
  if (gift.seeds) for (var k in gift.seeds) G.seeds[k] = (G.seeds[k] || 0) + gift.seeds[k];
  G.festivalGiftTxt = giftText(gift);
}
// Nhiệm vụ lễ hội thay 1 việc hằng ngày (giữ đúng 3 việc/ngày): bỏ việc
// cũ cùng id nếu có rồi đặt vào ô thứ 3 (hoặc thêm vào nếu chưa đủ 3).
export function applyFestivalQuest(ev) {
  if (!ev || !ev.quest) return;
  var spec = ev.quest;
  G.quests = (G.quests || []).filter(function (q) { return q.id !== spec.id; });
  var q = { id: spec.id, target: spec.target, text: spec.text, reward: spec.reward, done: false };
  if (G.quests.length >= 3) G.quests[2] = q;
  else G.quests.push(q);
}

// Chạy mỗi sáng (nút "Ngày mới" trong day.ts) và khi mở game đã lưu
// (nút bắt đầu trong main.ts): đặt lễ hội hôm nay, tặng quà MỘT LẦN cho
// mỗi ngày lễ, giao nhiệm vụ lễ hội, hiện trang trí, báo toast + ghi kỷ
// niệm. Tải lại giữa ngày thì quà không tặng lại (đã ghi claimed), chỉ
// nhắc lại tên lễ hội và giao lại nhiệm vụ lễ hội.
export function checkFestivalToday() {
  var ev = eventForDay(G.day);
  if (!ev) {
    G.festivalToday = null;
    G.festivalGiftTxt = "";
    showFestivalDecor(null);
    return null;
  }
  G.festivalToday = ev.id;
  showFestivalDecor(ev.kind);
  if (!G.festivalClaimed[G.day]) {
    G.festivalClaimed[G.day] = true;
    grantFestivalGift(ev);
    addMemory(ev.name + " — cả nhà vui vẻ (" + G.festivalGiftTxt + ").");
    toast("🎉 Hôm nay là " + ev.name + "! Cả nhà nhận được " + G.festivalGiftTxt + ".", true);
  } else {
    toast("🎉 Hôm nay là " + ev.name + "! Cả nhà đang sửa soạn đón lễ.");
  }
  applyFestivalQuest(ev);
  updateHUD();
  saveGame();
  return ev;
}

/* ================== ĐỒ LỄ HỘI — chỉ bán quanh ngày lễ ==================
 * Món lễ hội là hàng nông sản đặc biệt (thêm vào GOODS trong data.ts nên
 * bán lại được ở sạp cô Tư như rau thường, anh Đức ở chợ cũng mua vì
 * sạp đồ khô lấy mọi món trong GOOD_KEYS; chị Lan lấy thêm bánh trung
 * thu). Mua về để làm nhiệm vụ lễ hội hoặc đãi khách; bán lại thì lỗ
 * một ít nên không phải đường làm giàu. windows: [từ, tới] theo ngày
 * trong năm (dayOfYear), gồm vài ngày trước lễ để kịp chuẩn bị.
 */
export var FESTIVAL_GOODS = ["banhchung", "banhtrungthu", "longden"];
export var FESTIVAL_ITEMS = [
  { id: "banhchung", name: "Bánh chưng", buy: 12000, windows: [[28, 36]],
    desc: "Bánh chưng gói lá dong — mua về đãi khách ngày Tết, bán lại được 10.000đ/cái." },
  { id: "banhtrungthu", name: "Bánh trung thu", buy: 15000, windows: [[265, 274]],
    desc: "Bánh nướng nhân đậu xanh — mua về phá cỗ Trung thu, bán lại được 12.000đ/cái." },
  { id: "longden", name: "Lồng đèn giấy", buy: 8000, windows: [[42, 48], [265, 274]],
    desc: "Lồng đèn giấy đỏ cho bé An — dịp sinh nhật bé và Tết Trung thu, bán lại được 5.000đ/cái." }
];
export function isFestivalGood(key) { return FESTIVAL_GOODS.indexOf(key) >= 0; }
export function festivalItemAvailable(id, day) {
  var d = dayOfYear(day == null ? G.day : day);
  for (var i = 0; i < FESTIVAL_ITEMS.length; i++) {
    if (FESTIVAL_ITEMS[i].id !== id) continue;
    var ws = FESTIVAL_ITEMS[i].windows;
    for (var w = 0; w < ws.length; w++) if (d >= ws[w][0] && d <= ws[w][1]) return true;
    return false;
  }
  return false;
}
export function availableFestivalItems(day) {
  return FESTIVAL_ITEMS.filter(function (it) { return festivalItemAvailable(it.id, day); });
}
