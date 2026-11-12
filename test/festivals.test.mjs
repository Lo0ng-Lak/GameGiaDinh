// Test lễ hội trong năm (Phase 4.2) trong Node (không cần trình duyệt):
//  - nạp bundle test (game logic thật + stub three/DOM) rồi gọi thẳng các hàm
//    thật: eventForDay, checkFestivalToday, buyFestivalItem, saveGame/
//    applySave, và nút "Ngày mới" thật.
// Chạy:  node test/festivals.test.mjs
// (tự build lại bundle trước khi chạy; cần `npm install` trước lần đầu)
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, '..');
const BUNDLE = '/tmp/game-test-bundle.cjs';

// 1) Build lại bundle test từ code hiện tại
execSync(`node ${path.join(TEST_DIR, 'build-bundle.mjs')} ${BUNDLE}`, { cwd: ROOT, stdio: 'inherit' });

// 2) Cài stub DOM rồi mới nạp bundle (module game chạm document/window khi nạp)
const { installDomStubs } = await import('./dom-stub.mjs');
const { localStorage } = installDomStubs();
// RNG có seed — cùng seed với các test khác để ổn định.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SEED = 20261112;
Math.random = mulberry32(SEED);
const require = createRequire(import.meta.url);
const g = require(BUNDLE);
const { G } = g;

// ---------- khung test ----------
let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; failures.push(name); console.log('  FAIL  ' + name + (detail ? ' — ' + detail : '')); }
}
function eq(name, a, b) { check(name, JSON.stringify(a) === JSON.stringify(b), 'nhận ' + JSON.stringify(a) + ', muốn ' + JSON.stringify(b)); }
function section(title) { console.log('\n' + title); }

// Trạng thái gốc để reset giữa các nhóm test
const freshG = JSON.parse(JSON.stringify(G));
function resetState() {
  for (const k of Object.keys(G)) delete G[k];
  Object.assign(G, JSON.parse(JSON.stringify(freshG)));
  localStorage.clear();
  G.started = true;
  G.quests = [];
  Math.random = mulberry32(SEED);
}
function nextDay() {
  g.endDay();
  globalThis.document.getElementById('btn-next-day').fire('click');
}
function questById(id) { return G.quests.find(function (q) { return q.id === id; }); }

// ---------- A. Lịch: năm 360 ngày, lễ đúng ngày đã ghi trong README ----------
section('A. Lịch lễ (năm 360 ngày: Tết 31–33, Trung thu 270, sinh nhật rải đều)');
resetState();
eq('ngày 1 trong năm là 1', g.dayOfYear(1), 1);
eq('ngày 360 trong năm là 360', g.dayOfYear(360), 360);
eq('ngày 361 lặp lại đầu năm (1)', g.dayOfYear(361), 1);
eq('ngày 391 là Tết Mùng 1 năm sau', g.dayOfYear(391), 31);
eq('Tết Mùng 1: ngày 31', g.eventForDay(31) && g.eventForDay(31).id, 'tet1');
eq('Tết Mùng 2: ngày 32', g.eventForDay(32) && g.eventForDay(32).id, 'tet2');
eq('Tết Mùng 3: ngày 33', g.eventForDay(33) && g.eventForDay(33).id, 'tet3');
eq('Sinh nhật bé An: ngày 45', g.eventForDay(45) && g.eventForDay(45).id, 'an-birthday');
eq('Họ hàng sum họp: ngày 75', g.eventForDay(75) && g.eventForDay(75).id, 'gathering1');
eq('Sinh nhật anh: ngày 135', g.eventForDay(135) && g.eventForDay(135).id, 'husband-birthday');
eq('Họ hàng sum họp: ngày 165', g.eventForDay(165) && g.eventForDay(165).id, 'gathering2');
eq('Kỷ niệm ngày cưới: ngày 180', g.eventForDay(180) && g.eventForDay(180).id, 'anniversary');
eq('Sinh nhật vợ: ngày 225', g.eventForDay(225) && g.eventForDay(225).id, 'wife-birthday');
eq('Họ hàng sum họp: ngày 255', g.eventForDay(255) && g.eventForDay(255).id, 'gathering3');
eq('Tết Trung thu: ngày 270', g.eventForDay(270) && g.eventForDay(270).id, 'midautumn');
eq('Sinh nhật bà Tư: ngày 315', g.eventForDay(315) && g.eventForDay(315).id, 'tu-birthday');
eq('Họ hàng sum họp: ngày 345', g.eventForDay(345) && g.eventForDay(345).id, 'gathering4');
eq('ngày 1 không có lễ', g.eventForDay(1), null);
eq('ngày 34 (hết Tết) không có lễ', g.eventForDay(34), null);
eq('ngày 100 không có lễ', g.eventForDay(100), null);
eq('ngày 391 (năm sau) lại là Tết Mùng 1', g.eventForDay(391) && g.eventForDay(391).id, 'tet1');
eq('ngày 630 (năm sau) lại là Trung thu', g.eventForDay(630) && g.eventForDay(630).id, 'midautumn');
check('mỗi năm đúng 13 ngày lễ', g.FESTIVALS.length === 13, 'có ' + g.FESTIVALS.length);
check('không ngày nào trùng 2 lễ', new Set(g.FESTIVALS.map(function (f) { return f.day; })).size === g.FESTIVALS.length);

// ---------- B. Lễ gắn với mùa cho hợp lý ----------
section('B. Ngày lễ gắn với mùa: Tết đầu mùa khô, Trung thu cuối mùa mưa');
resetState();
eq('ngày 31 (Tết) là mùa khô', g.seasonOf(31), 'dry');
eq('ngày 32 (Tết) là mùa khô', g.seasonOf(32), 'dry');
eq('ngày 270 (Trung thu) là mùa mưa', g.seasonOf(270), 'rainy');
eq('ngày 270 là ngày cuối đợt mưa 241–270', g.dayOfYear(270) % 60, 30);

// ---------- C. Nút "Ngày mới" thật: sang Tết thì tặng quà + giao việc lễ + HUD ----------
section('C. Qua đêm thật sang ngày 31 (Tết Mùng 1): quà, việc lễ, HUD');
resetState();
G.day = 30; G.money = 100000; G.stars = 0;
const memBefore = G.memories.length;
nextDay(); // ngày 30 -> 31: trừ sinh hoạt 12–16k, cộng lì xì Tết 20k
eq('sang ngày 31', G.day, 31);
eq('lễ hôm nay là tet1', G.festivalToday, 'tet1');
check('quà Tết Mùng 1 đã ghi nhận (không tặng lại)', G.festivalClaimed[31] === true);
check('tiền = 100k - sinh hoạt (12–16k) + lì xì 20k', G.money >= 104000 && G.money <= 108000, 'tiền còn ' + G.money);
eq('sao vui vẻ +2', G.stars, 2);
check('nhiệm vụ lễ hội "Gói 2 bánh chưng" có trong 3 việc', !!questById('fest-banhchung'));
eq('vẫn đúng 3 việc/ngày (việc lễ thay 1 việc)', G.quests.length, 3);
check('kỷ niệm ghi lại ngày Tết', G.memories.length >= memBefore + 1 && G.memories.some(function (m) { return m.includes('Tết'); }), G.memories.join(' | '));
// (Sang ngày 31 thì thành tựu "Một tuần ở quê" cũng ghi thêm 1 kỷ niệm,
// nên tổng kỷ niệm tăng hơn 1 — chỉ cần chắc có dòng Tết trong đó.)
g.updateHUD();
const wxText = globalThis.document.getElementById('hud-wx').textContent;
check('HUD hiện tên lễ cạnh thời tiết + mùa', wxText.includes('Tết Mùng 1') && wxText.includes(g.seasonName('dry')), 'hud-wx=' + wxText);
const dec = g.festivalDecorState();
check('trang trí Tết hiện (đèn lồng + băng rôn), trăng/bàn tiệc ẩn', dec.tet === true && dec.moon === false && dec.party === false, JSON.stringify(dec));
check('tóm tắt lễ hội có tên Tết + quà', g.festivalSummaryText().includes('Tết') && g.festivalSummaryText().includes('20.000đ'));
// Bảng "Hết ngày" của ngày 31 ghi lễ hội
g.endDay();
const sumHtml = globalThis.document.getElementById('sum-rows').innerHTML;
check('bảng tổng kết cuối ngày có dòng lễ hội', sumHtml.includes('Lễ hội hôm nay') && sumHtml.includes('Tết'), sumHtml.slice(0, 200));

// ---------- D. Quà chỉ tặng 1 lần: gọi lại + tải lại giữa ngày không tặng nữa ----------
section('D. Quà lễ chỉ tặng 1 lần (gọi lại / tải lại giữa ngày)');
resetState();
G.day = 31; G.money = 100000; G.stars = 0;
g.checkFestivalToday();
const moneyAfterGift = G.money, starsAfterGift = G.stars, memAfterGift = G.memories.length;
g.checkFestivalToday(); // gọi lại trong ngày
eq('gọi lại trong ngày: tiền không tăng thêm', G.money, moneyAfterGift);
eq('gọi lại trong ngày: sao không tăng thêm', G.stars, starsAfterGift);
check('gọi lại trong ngày: không ghi thêm kỷ niệm', G.memories.length === memAfterGift);
// Tải lại giữa ngày (save -> xóa sạch -> applySave -> mở lại ngày lễ)
g.saveGame();
const saved = g.readSave();
check('save ghi lễ đã nhận + lễ hôm nay', saved.festivalClaimed && saved.festivalClaimed[31] === true && saved.festivalToday === 'tet1', JSON.stringify({ c: saved.festivalClaimed, t: saved.festivalToday }));
G.money = 100000; G.stars = 0; G.festivalClaimed = {}; G.festivalToday = null;
g.applySave(saved); // tải lại: tiền/sao về đúng lúc đã nhận quà (120k / 2 sao)
eq('tải lại: tiền đúng lúc đã nhận quà', G.money, moneyAfterGift);
eq('tải lại: sao đúng lúc đã nhận quà', G.stars, starsAfterGift);
g.checkFestivalToday();
eq('tải lại giữa ngày: tiền giữ nguyên (không tặng lại)', G.money, moneyAfterGift);
eq('tải lại giữa ngày: sao giữ nguyên', G.stars, starsAfterGift);
check('tải lại: lễ hôm nay vẫn là Tết Mùng 1', G.festivalToday === 'tet1');
// Sang ngày 32: Tết Mùng 2 tặng quà MỚI (không phải quà cũ tặng lại)
nextDay();
eq('sang ngày 32 là Tết Mùng 2', G.festivalToday, 'tet2');
check('ngày 32 ghi nhận quà riêng', G.festivalClaimed[32] === true && G.festivalClaimed[31] === true);
check('nhiệm vụ lễ hội ngày 32 là chúc Tết hàng xóm', !!questById('fest-greet'));

// ---------- E. Đồ lễ hội: mua được quanh lễ, xong việc lễ; ngoài dịp thì không ----------
section('E. Đồ lễ hội: chỉ bán quanh lễ, mua xong việc lễ');
resetState();
eq('ngày 30: sát Tết, bánh chưng đã mở bán (từ ngày 28)', g.availableFestivalItems(30).map(function (i) { return i.id; }), ['banhchung']);
eq('ngày 31 (Tết): chỉ bán bánh chưng', g.availableFestivalItems(31).map(function (i) { return i.id; }), ['banhchung']);
eq('ngày 27 (sát Tết): bánh chưng đã bán', g.availableFestivalItems(27).map(function (i) { return i.id; }), []);
eq('ngày 28: bánh chưng mở bán 3 hôm trước Tết', g.availableFestivalItems(28).map(function (i) { return i.id; }), ['banhchung']);
eq('ngày 36: bánh chưng còn bán', g.availableFestivalItems(36).map(function (i) { return i.id; }), ['banhchung']);
eq('ngày 37: hết dịp Tết, đóng sạp', g.availableFestivalItems(37), []);
eq('ngày 270 (Trung thu): bán bánh trung thu + lồng đèn', g.availableFestivalItems(270).map(function (i) { return i.id; }), ['banhtrungthu', 'longden']);
eq('ngày 45 (sinh nhật bé An): bán lồng đèn', g.availableFestivalItems(45).map(function (i) { return i.id; }), ['longden']);
eq('ngày 40: ngoài mọi dịp, không món nào', g.availableFestivalItems(40), []);
// Ngày thường mua bánh chưng: không bán
resetState(); G.day = 40; G.money = 100000;
eq('ngày thường mua bánh chưng: từ chối', g.buyFestivalItem('banhchung'), false);
eq('ngày thường: tiền không trừ', G.money, 100000);
// Ngày Tết mua 2 bánh chưng -> xong việc lễ "Gói 2 bánh chưng"
resetState(); G.day = 31; G.money = 100000; G.stars = 0;
g.checkFestivalToday(); // lì xì 20k + 2 sao, giao việc fest-banhchung
eq('sau quà Tết: tiền 120k', G.money, 120000);
eq('mua bánh chưng 1: được', g.buyFestivalItem('banhchung'), true);
eq('giỏ có 1 bánh chưng', G.produce.banhchung, 1);
eq('đếm việc lễ: 1/2', G.festivalProgress, 1);
check('mua 1 cái chưa xong việc', !questById('fest-banhchung').done);
eq('mua bánh chưng 2: được', g.buyFestivalItem('banhchung'), true);
eq('đếm việc lễ: 2/2', G.festivalProgress, 2);
g.checkQuestsAchievements();
check('mua đủ 2 cái: việc lễ xong, thưởng 10k + 1 sao', questById('fest-banhchung').done === true, 'done=' + questById('fest-banhchung').done);
eq('tiền: 120k - 2×12k + thưởng việc 10k', G.money, 106000);
eq('sao: quà 2 + thưởng việc 1', G.stars, 3);
// Dịp Trung thu: mua lồng đèn -> xong việc lễ "Mua lồng đèn cho bé An"
resetState(); G.day = 270; G.money = 100000; G.stars = 0;
g.checkFestivalToday(); // quà Trung thu 10k + 1 sao
eq('quà Trung thu: tiền 110k', G.money, 110000);
eq('Trung thu: bánh chưng không bán', g.festivalItemAvailable('banhchung', 270), false);
eq('Trung thu: bánh trung thu có bán', g.festivalItemAvailable('banhtrungthu', 270), true);
eq('Trung thu: lồng đèn có bán', g.festivalItemAvailable('longden', 270), true);
eq('mua 1 lồng đèn: được', g.buyFestivalItem('longden'), true);
g.checkQuestsAchievements();
check('mua lồng đèn xong việc lễ Trung thu', questById('fest-lantern').done === true);
eq('tiền: 110k - 8k + thưởng việc 5k', G.money, 107000);
// Đồ lễ hội bán lại được ở chợ: anh Đức lấy mọi món (GOOD_KEYS), chị Lan lấy bánh trung thu
resetState(); G.priceDay = { cai: 1.0, cachua: 1.0, bido: 1.0, ngo: 1.0, trung: 1.0, ca: 1.0, chuoi: 1.0, trungvit: 1.0, xoai: 1.0, oi: 1.0, banhchung: 1.0, banhtrungthu: 1.0, longden: 1.0 };
G.produce.banhtrungthu = 2; G.money = 50000;
const sold = g.sellToVendor('lan', 'banhtrungthu');
// giá chợ = giá ngày 12.000đ × 1,1 = 13.200đ/cái, 2 cái = 26.400đ
eq('chị Lan mua bánh trung thu giá chợ +10%', sold, 26400);
eq('bán xong giỏ hết bánh trung thu', G.produce.banhtrungthu, 0);
G.produce.longden = 1;
const soldDuc = g.sellToVendor('duc', 'longden');
// giá ngày 5.000đ × 1,05 = 5.250đ -> làm tròn trăm 5.300đ
eq('anh Đức mua lồng đèn giá chợ +5%', soldDuc, 5300);

// ---------- F. Save/load: giữ trạng thái lễ; save cũ không có trường lễ ----------
section('F. Save/load lễ + save cũ không có trường lễ');
resetState();
G.day = 270; G.money = 100000; G.stars = 0;
g.checkFestivalToday(); // quà Trung thu 10k + 1 sao
g.saveGame();
const saved270 = g.readSave();
check('save ghi quà lễ đã nhận + lễ hôm nay', saved270.festivalClaimed && saved270.festivalClaimed[270] === true && saved270.festivalToday === 'midautumn');
check('save ghi cả đồ lễ trong giỏ', saved270.produce && saved270.produce.banhtrungthu === 0 && saved270.produce.longden === 0);
G.money = 50000; G.stars = 0; G.festivalClaimed = {}; G.festivalToday = null;
g.applySave(saved270);
eq('tải lại: tiền giữ nguyên', G.money, 110000);
eq('tải lại: sao giữ nguyên', G.stars, 1);
check('tải lại: lễ đã nhận vẫn ghi', G.festivalClaimed[270] === true);
eq('tải lại: lễ hôm nay là Trung thu', G.festivalToday, 'midautumn');
// Save cũ (trước Phase 4.2): xóa trường lễ rồi tải
resetState();
G.day = 45; g.saveGame();
const oldSave = g.readSave();
delete oldSave.festivalClaimed; delete oldSave.festivalToday;
G.festivalClaimed = { 31: true }; G.festivalToday = 'tet1'; G.festivalProgress = 2;
g.applySave(oldSave);
check('save cũ: quà lễ về mặc định rỗng', JSON.stringify(G.festivalClaimed) === '{}', JSON.stringify(G.festivalClaimed));
eq('save cũ: lễ hôm nay về null', G.festivalToday, null);
eq('save cũ: đếm việc lễ về 0', G.festivalProgress, 0);
// ...rồi mở game ngày lễ đó thì quà vẫn tặng được đúng 1 lần
G.money = 100000; G.stars = 0;
g.checkFestivalToday();
check('save cũ mở ngày lễ: quà sinh nhật bé An tặng được (2 hạt cải + 1 sao)', G.festivalClaimed[45] === true && G.stars === 1 && G.seeds.cai === 6, 'stars=' + G.stars + ' seeds.cai=' + G.seeds.cai);

// ---------- G. Việc lễ các ngày khác dùng đúng việc ngày thường ----------
section('G. Nhiệm vụ lễ hội ngày thường: sinh nhật, sum họp, kỷ niệm');
resetState();
G.day = 45; G.money = 100000; g.checkFestivalToday();
check('sinh nhật bé An: việc lễ là nhặt 3 trứng gà', !!questById('eggs'));
G.eggsToday = 3; g.checkQuestsAchievements();
check('nhặt đủ 3 trứng: việc sinh nhật xong', questById('eggs').done === true);
resetState();
G.day = 32; G.money = 100000; g.checkFestivalToday();
G.greetedToday = 3; g.checkQuestsAchievements();
check('chúc Tết đủ 3 người: việc Mùng 2 xong', questById('fest-greet').done === true);
resetState();
G.day = 75; G.money = 100000; g.checkFestivalToday();
check('sum họp: việc lễ là bán 30k nông sản', !!questById('sell'));
G.earnedToday = 30000; g.checkQuestsAchievements();
check('bán đủ 30k: việc sum họp xong', questById('sell').done === true);
resetState();
G.day = 180; G.money = 100000; g.checkFestivalToday();
check('kỷ niệm ngày cưới: việc lễ là nấu cơm', !!questById('cook'));
check('kỷ niệm ngày cưới: quà 15k + 2 sao', G.money === 115000 && G.stars === 2, 'money=' + G.money + ' stars=' + G.stars);
// Việc lễ không lọt vào việc ngẫu nhiên ngày thường: bốc 20 lần không trúng fest-*
resetState();
let festLeaked = false;
for (let i = 0; i < 20; i++) {
  g.rollQuests();
  if (G.quests.some(function (q) { return q.id.indexOf('fest-') === 0; })) festLeaked = true;
}
check('bốc 20 lần việc thường: không lần nào trúng việc lễ', !festLeaked);
check('việc thường vẫn đủ 3 việc', G.quests.length === 3);

// ---------- H. Trang trí 3D: đúng loại, đúng ngày, hôm sau dọn ----------
section('H. Trang trí lễ: Tết / Trung thu (trăng to) / sinh nhật / sum họp / ngày thường');
resetState();
G.day = 270; g.checkFestivalToday();
let st = g.festivalDecorState();
check('Trung thu: đèn lồng + trăng to, bàn tiệc ẩn', st.moon === true && st.moonBoost === true && st.tet === false && st.party === false, JSON.stringify(st));
resetState();
G.day = 45; g.checkFestivalToday();
st = g.festivalDecorState();
check('sinh nhật bé An: bàn + bánh + bóng bay', st.party === true && st.cake === true && st.balloons === true, JSON.stringify(st));
check('sinh nhật: bánh màu hồng', st.cakeColor === 0xf2a7c3, 'màu=' + st.cakeColor);
resetState();
G.day = 180; g.checkFestivalToday();
st = g.festivalDecorState();
check('kỷ niệm ngày cưới: bàn + bánh đỏ, có bóng bay', st.party === true && st.cake === true && st.balloons === true && st.cakeColor === 0xd4573a, JSON.stringify(st));
resetState();
G.day = 75; g.checkFestivalToday();
st = g.festivalDecorState();
check('sum họp: chỉ bàn tiệc, không bánh không bóng', st.party === true && st.cake === false && st.balloons === false, JSON.stringify(st));
resetState();
G.day = 34; g.checkFestivalToday();
st = g.festivalDecorState();
check('ngày thường: dọn hết, trăng về cỡ cũ', st.tet === false && st.moon === false && st.party === false && st.moonBoost === false, JSON.stringify(st));
check('ngày thường: không có lễ hôm nay', G.festivalToday === null);
check('ngày thường: tóm tắt lễ là "Không có lễ hội"', g.festivalSummaryText() === 'Không có lễ hội');

// ---------- KẾT QUẢ ----------
console.log('\n================ KẾT QUẢ ================');
console.log('PASS: ' + pass + ' | FAIL: ' + fail);
if (fail > 0) { console.log('Các kiểm tra rớt: ' + failures.join(', ')); process.exit(1); }
console.log('Tất cả test đều đậu.');
