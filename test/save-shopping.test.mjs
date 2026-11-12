// Test logic game trong Node (không cần trình duyệt):
//  - nạp bundle test (game logic thật + stub three/DOM) rồi gọi thẳng các hàm
//    thật: saveGame/applySave, buyUpgrade/buySapling/buyPiglet, waterTree,
//    overnightTrees, feedPigs/sellGrownPig, và nút "Ngày mới" thật.
// Chạy:  node test/save-shopping.test.mjs
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
}
function nextDay() {
  // Bấm nút "Ngày mới" thật — chạy đúng code qua đêm của day.ts
  globalThis.document.getElementById('btn-next-day').fire('click');
}
function plantTree(i, kind) {
  // Đặt cây giống cách mà doInteract làm khi người chơi trồng (cùng shape state)
  const t = G.trees[i];
  t.type = kind; t.state = 'growing'; t.progress = 0; t.watered = false;
  t.waterings = 0; t.ripen = 0; t.fruitReady = 0;
  g.drawTree(i);
}

// ================= A. Save/load round-trip (định dạng mới) =================
section('A. Save/load round-trip (định dạng mới: ripen + days[])');
resetState();
// 400k để đủ mua tivi 150k + cây giống 25k + vịt 30k + chuồng 50k + 2 lợn 120k + cám 10k
G.money = 400000; G.stars = 7;
check('mua tivi 150k', g.buyUpgrade('tv') === true);
check('mua cây xoài giống 25k', g.buySapling('xoai') === true);
plantTree(0, 'xoai');
G.can = 5;
check('tưới cây xoài', g.waterTree(0) !== null);
check('mua đàn vịt 30k', g.buyDuckFlock() === true);
check('mua chuồng lợn 50k', g.buyUpgrade('pigpen') === true);
check('mua lợn con #1', g.buyPiglet() === true);
check('mua lợn con #2', g.buyPiglet() === true);
check('cho lợn ăn ngày 1', g.feedPigs() !== null);
// 1 luống rau đang lớn để kiểm tra save luống
g.plots[0].state = 'growing'; g.plots[0].type = 'cai'; g.plots[0].progress = 0.5; g.plots[0].watered = true; g.plots[0].waterings = 1;
g.saveGame();
const raw = localStorage.getItem(g.SAVE_KEY);
check('save đã ghi vào localStorage', typeof raw === 'string' && raw.length > 100);
const savedJson = JSON.parse(raw);
check('save có ripen của cây', savedJson.trees[0].ripen === 0);
check('save có days[] của lợn', JSON.stringify(savedJson.pigs.days) === '[1,1]');
const snap = JSON.parse(JSON.stringify({ money: G.money, stars: G.stars, owned: G.owned, saplings: G.saplings, trees: G.trees, ducks: G.ducks, pigs: G.pigs, plot0: { state: g.plots[0].state, type: g.plots[0].type, progress: g.plots[0].progress } }));
// Xóa sạch rồi tải lại (giữ nguyên key của owned/saplings để applySave
// khôi phục được — nó duyệt key của G hiện tại)
G.money = 0; G.stars = 0; G.owned = JSON.parse(JSON.stringify(freshG.owned)); G.saplings = { xoai: 0, oi: 0 };
G.trees.forEach((t) => { t.type = null; t.state = 'empty'; t.progress = 0; t.fruitReady = 0; });
G.ducks = { owned: false, fed: false, timer: 0, ready: 0 };
G.pigs = { count: 0, grown: 0, fedToday: false, days: [] };
g.plots[0].state = 'empty'; g.plots[0].type = null;
g.applySave(g.readSave());
eq('tải lại: tiền', G.money, snap.money);
eq('tải lại: sao', G.stars, snap.stars);
eq('tải lại: đồ đã mua (tivi, chuồng lợn)', { tv: G.owned.tv, pigpen: G.owned.pigpen }, { tv: true, pigpen: true });
eq('tải lại: cây giống đã mua', G.saplings, snap.saplings);
eq('tải lại: cây xoài (type/state/progress/watered/ripen)', { type: G.trees[0].type, state: G.trees[0].state, progress: G.trees[0].progress, watered: G.trees[0].watered, ripen: G.trees[0].ripen }, { type: 'xoai', state: 'growing', progress: 0, watered: true, ripen: 0 });
eq('tải lại: đàn vịt', G.ducks.owned, true);
eq('tải lại: lợn (count/grown/days)', { count: G.pigs.count, grown: G.pigs.grown, days: G.pigs.days }, { count: 2, grown: 0, days: [1, 1] });
eq('tải lại: luống rau 0', { state: g.plots[0].state, type: g.plots[0].type, progress: g.plots[0].progress }, snap.plot0);

// ================= B. Save cũ (Phase 2 v1) vẫn đọc được =================
section('B. Save cũ (Phase 2 v1: không ripen, lợn dùng growDays chung) vẫn đọc được');
resetState();
const oldSave = JSON.parse(JSON.stringify(g.readSave() || {}));
const oldFormat = {
  day: 5, money: 120000, stars: 3,
  trees: [
    { type: 'xoai', state: 'mature', progress: 1, watered: false, waterings: 2, fruitReady: 0 },
    { type: 'oi', state: 'growing', progress: 0.5, watered: true, waterings: 1, fruitReady: 0 },
    { type: null, state: 'empty', progress: 0, watered: false, waterings: 0, fruitReady: 0 },
  ],
  saplings: { xoai: 0, oi: 1 },
  ducks: { owned: true, fed: true, timer: 0, ready: 2 },
  pigs: { count: 2, grown: 0, fedToday: true, growDays: 2 }, // cũ: 2 hôm ăn chung
  plots: [],
};
localStorage.setItem(g.SAVE_KEY, JSON.stringify(oldFormat));
g.applySave(g.readSave());
eq('save cũ: cây xoài ripen mặc định 0', G.trees[0].ripen, 0);
eq('save cũ: cây xoài vẫn mature', G.trees[0].state, 'mature');
eq('save cũ: lợn chuyển sang days[]', G.pigs.days, [2, 0]);
check('save cũ: growDays cũ đã xóa', G.pigs.growDays === undefined);
eq('save cũ: vịt vẫn còn', G.ducks.owned, true);
eq('save cũ: tiền vẫn đúng', G.money, 120000);
// Cây xoài cũ (đã từng ra trái 1 lần theo bug cũ) phải ra trái lại sau 3 ngày chăm
for (let d = 0; d < 3; d++) { G.can = 5; g.waterTree(0); nextDay(); }
eq('save cũ: cây xoài ra trái lại sau 3 ngày chăm (bug cũ đã sửa)', G.trees[0].fruitReady, 2);

// ================= C. Mua sắm + nâng cấp =================
section('C. Mua sắm + nâng cấp');
resetState();
check('không đủ tiền mua tivi (60k < 150k)', g.buyUpgrade('tv') === false && G.money === 60000 && !G.owned.tv);
G.money = 200000;
check('đủ tiền mua tivi', g.buyUpgrade('tv') === true);
eq('mua tivi trừ đúng 150k', G.money, 50000);
eq('tivi đã sở hữu, +2 sao', [G.owned.tv, G.stars], [true, 2]);
check('không mua lại tivi lần 2', g.buyUpgrade('tv') === false && G.money === 50000);
check('mua cây xoài giống', g.buySapling('xoai') === true && G.saplings.xoai === 1 && G.money === 25000);
check('mua thêm 1 cây xoài giống được (hàng tiêu hao)', g.buySapling('xoai') === true && G.saplings.xoai === 2);
check('không đủ tiền mua cây ổi giống', (() => { G.money = 10000; return g.buySapling('oi') === false && G.saplings.oi === 0; })());
check('chưa có chuồng thì không mua được lợn', g.buyPiglet() === false);
G.money = 300000;
check('mua chuồng lợn', g.buyUpgrade('pigpen') === true);
check('mua lợn con #1', g.buyPiglet() === true && G.pigs.count === 1 && JSON.stringify(G.pigs.days) === '[0]');
check('mua lợn con #2', g.buyPiglet() === true && G.pigs.count === 2 && JSON.stringify(G.pigs.days) === '[0,0]');
check('chuồng đầy 2 con thì không mua thêm', g.buyPiglet() === false && G.pigs.count === 2);
eq('bán lợn khi chưa con nào lớn = 0đ', g.sellPigFromShop(), 0);
// Mua sắm vẫn còn sau save/load
g.saveGame();
const moneyBefore = G.money;
G.money = 0; G.owned = JSON.parse(JSON.stringify(freshG.owned)); G.pigs = { count: 0, grown: 0, fedToday: false, days: [] };
g.applySave(g.readSave());
eq('sau save/load: tiền giữ nguyên', G.money, moneyBefore);
check('sau save/load: tivi + chuồng lợn còn', G.owned.tv === true && G.owned.pigpen === true);
eq('sau save/load: 2 lợn con còn', G.pigs.count, 2);

// ================= D. Cây ăn quả: lớn theo ngày, ra trái theo kỳ =================
section('D. Cây ăn quả — lớn theo ngày, ra trái theo kỳ chăm');
resetState();
G.money = 500000;
plantTree(0, 'xoai'); plantTree(1, 'oi');
// 5 ngày tưới đều: xoài lớn (5 ngày), ổi lớn sớm hơn (4 ngày)
for (let d = 0; d < 5; d++) { G.can = 5; g.waterTree(0); g.waterTree(1); nextDay(); }
eq('sau 5 ngày tưới: xoài trưởng thành', G.trees[0].state, 'mature');
eq('sau 5 ngày tưới: ổi trưởng thành', G.trees[1].state, 'mature');
// Xoài cần 3 ngày chăm mới ra trái; ổi cần 2 ngày — nhưng ổi lớn từ ngày 4
// nên ngày tưới thứ 5 (lúc đã lớn) đã tính 1 ngày chăm, ngày thứ 6 là đủ 2.
G.can = 5; g.waterTree(0); g.waterTree(1); nextDay();
eq('chăm thêm 1 ngày: ổi ra 2 trái, xoài chưa (mới chăm 1/3 ngày)', [G.trees[0].fruitReady, G.trees[1].fruitReady], [0, 2]);
G.can = 5; g.waterTree(0); g.waterTree(1); nextDay();
eq('chăm thêm 1 ngày nữa: xoài vẫn chưa (2/3 ngày), ổi giữ 2 trái', [G.trees[0].fruitReady, G.trees[1].fruitReady], [0, 2]);
G.can = 5; g.waterTree(0); g.waterTree(1); nextDay();
eq('chăm 3 ngày: xoài ra 2 trái', [G.trees[0].fruitReady, G.trees[1].fruitReady], [2, 2]);
const n = g.harvestTree(0);
eq('hái xoài được 2 trái vào giỏ', [n, G.produce.xoai], [2, 2]);
eq('hái xong thì hết trái trên cây', G.trees[0].fruitReady, 0);
// Trái chưa hái hết thì không ra đợt mới: để ổi còn trái, chăm tiếp 2 ngày
G.can = 5; g.waterTree(1); nextDay();
G.can = 5; g.waterTree(1); nextDay();
eq('ổi chưa hái hết thì không ra đợt mới', G.trees[1].fruitReady, 2);
// Không tưới thì cây đứng yên
resetState();
plantTree(0, 'xoai');
for (let d = 0; d < 5; d++) nextDay(); // 5 ngày không tưới
eq('không tưới 5 ngày: cây không lớn', [G.trees[0].state, G.trees[0].progress], ['growing', 0]);
resetState();
plantTree(0, 'xoai');
G.can = 5; g.waterTree(0); nextDay();
G.can = 5; g.waterTree(0); nextDay();
nextDay(); nextDay(); nextDay(); // bỏ 3 ngày
eq('tưới 2/5 ngày: cây chỉ lớn 40%', G.trees[0].progress, 0.4);

// ================= E. Lợn: lớn sau 7 hôm, tính riêng từng con =================
section('E. Lợn — 7 hôm ăn đều, tính riêng từng con');
resetState();
G.money = 500000;
g.buyUpgrade('pigpen');
g.buyPiglet(); g.buyPiglet();
for (let d = 0; d < 6; d++) { check('cho lợn ăn ngày ' + (d + 1), g.feedPigs() !== null); nextDay(); }
eq('cho ăn 6 hôm: chưa con nào lớn', G.pigs.grown, 0);
eq('cho ăn 6 hôm: mỗi con 6/7 ngày', G.pigs.days, [6, 6]);
nextDay(); // bỏ 1 hôm không cho ăn
eq('bỏ 1 hôm: tiến độ đứng yên ở 6', G.pigs.days, [6, 6]);
g.feedPigs(); nextDay();
eq('cho ăn đủ 7 hôm: cả 2 con lớn', [G.pigs.grown, G.pigs.days], [2, [7, 7]]);
const moneyBeforeSell = G.money;
const got = g.sellGrownPig();
eq('bán 1 con lợn lớn = 120.000đ', got, 120000);
eq('bán xong: tiền +120k', G.money, moneyBeforeSell + 120000);
eq('bán xong: còn 1 con lớn + 1 con đang lớn? (còn 1 con, 1 con lớn)', [G.pigs.count, G.pigs.grown, G.pigs.days.length], [1, 1, 1]);
// Kinh tế 1 con: mua 60k + cám 7×5k = 95k, bán 120k -> lãi 25k
resetState();
G.money = 200000;
g.buyUpgrade('pigpen');
g.buyPiglet();
for (let d = 0; d < 7; d++) { g.feedPigs(); nextDay(); }
check('1 con lợn: tổng chi (mua 60k + cám 7×5k) = 95k', 200000 - 50000 - G.money === 95000, 'chi thực tế ' + (200000 - 50000 - G.money));
g.sellGrownPig();
check('1 con lợn: bán 120k, lãi ròng 25k so với vốn nuôi', G.money - 200000 + 50000 === 25000, 'lãi thực tế ' + (G.money - 200000 + 50000));

// ================= F. Qua đêm thật (nút Ngày mới) =================
section('F. Qua đêm thật bằng nút "Ngày mới"');
resetState();
G.money = 100000;
plantTree(0, 'xoai'); G.can = 5; g.waterTree(0);
g.plots[0].state = 'growing'; g.plots[0].type = 'cai'; g.plots[0].progress = 0.5; g.plots[0].watered = true; g.plots[0].waterings = 1;
const dayBefore = G.day;
g.endDay(); // hết ngày: trừ chi tiêu sinh hoạt, hiện bảng tổng kết
nextDay();  // bấm "Ngày mới"
eq('sang ngày mới', G.day, dayBefore + 1);
check('trừ chi tiêu sinh hoạt 12–16k', G.money >= 100000 - 16000 && G.money < 100000 - 11000, 'tiền còn ' + G.money);
eq('cây qua đêm lớn thêm 1/5 (đã tưới)', G.trees[0].progress, 0.2);
eq('luống qua đêm lớn thêm 0.25 (đã tưới)', g.plots[0].progress, 0.75);
eq('luống qua đêm đất khô lại', g.plots[0].watered, false);
check('quay giá bán mới (priceDay có dữ liệu)', Object.keys(G.priceDay).length > 0);
eq('nhiệm vụ mới: đúng 3 việc', G.quests.length, 3);
eq('hết ngày: dayOver reset', G.dayOver, false);

console.log('\n================ KẾT QUẢ ================');
console.log(`PASS: ${pass} | FAIL: ${fail}`);
if (fail > 0) { console.log('Thất bại: ' + failures.join(', ')); process.exit(1); }
console.log('Tất cả test đều đậu.');
