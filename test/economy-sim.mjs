// Mô phỏng kinh tế 30 ngày trong game bằng code thật (bundle test + stub DOM).
// Dùng hàm thật cho phần đã cân bằng lại: waterTree, overnightTrees (qua nút
// "Ngày mới" thật), feedPigs/sellGrownPig, buySapling/buyPiglet/buyDuckFlock,
// feedDucks/collectDuckEggs, rollPrices/sellPriceOf, endDay (trừ sinh hoạt).
// Phần rau: mô hình bằng số liệu thật của CROPS (1 vụ/ngày/luống — người chơi
// phải tự trồng/tưới/hái, không lái được bằng code vì trồng rau là tương tác
// 3D theo vị trí người chơi). Tiền công chồng dùng đúng phân phối của main.ts.
// RNG có seed nên kết quả ổn định giữa các lần chạy.
// Chạy:  node test/economy-sim.mjs
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, '..');
const BUNDLE = '/tmp/game-test-bundle.cjs';
execSync(`node ${path.join(TEST_DIR, 'build-bundle.mjs')} ${BUNDLE}`, { cwd: ROOT, stdio: 'inherit' });

// RNG có seed — mọi ngẫu nhiên trong game (giá, trộm, tiền công) đều ổn định
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
Math.random = mulberry32(20261112);

const { installDomStubs } = await import('./dom-stub.mjs');
installDomStubs();
const require = createRequire(import.meta.url);
const g = require(BUNDLE);
const { G, CROPS, FRUIT_TREES, LIVESTOCK, GOODS } = g;

// OLD_CROPS=1: khôi phục giá rau cũ (Giai đoạn 1) để so sánh trước/sau
// của lần cân bằng này: cải 5k/14k, cà chua 10k/26k×2, bí 18k/52k,
// ngô 8k/20k×2. Chạy 2 lần (có/không OLD_CROPS) rồi đối chiếu cùng kịch bản.
if (process.env.OLD_CROPS === '1') {
  Object.assign(CROPS.cai, { seed: 5000, sell: 14000, yield: 1 });
  Object.assign(CROPS.cachua, { seed: 10000, sell: 26000, yield: 2 });
  Object.assign(CROPS.bido, { seed: 18000, sell: 52000, yield: 1 });
  Object.assign(CROPS.ngo, { seed: 8000, sell: 20000, yield: 2 });
  console.log('!!! ĐANG DÙNG GIÁ RAU CŨ (OLD_CROPS=1) ĐỂ SO SÁNH !!!');
}

const freshG = JSON.parse(JSON.stringify(G));
function resetState() {
  for (const k of Object.keys(G)) delete G[k];
  Object.assign(G, JSON.parse(JSON.stringify(freshG)));
  G.started = true;
}
function nextDay() {
  g.endDay();
  globalThis.document.getElementById('btn-next-day').fire('click');
}
function fmt(n) { return Math.round(n).toLocaleString('vi-VN') + 'đ'; }

// Tiền công chồng — đúng phân phối main.ts:513-521 + 12% hôm không có việc
function husbandWage() {
  if (Math.random() < 0.12) return 0;
  const wr = Math.random();
  if (wr < 0.15) return Math.round((85000 + Math.random() * 30000) / 1000) * 1000;
  if (wr < 0.32) return Math.round((20000 + Math.random() * 12000) / 1000) * 1000;
  return Math.round((38000 + Math.random() * 34000) / 1000) * 1000;
}
// Thưởng nhiệm vụ trung bình: 2 việc/ngày × thưởng trung bình của QUEST_DEFS thật
const avgQuestReward = g.QUEST_DEFS.reduce((s, d) => s + (d.reward.money || 0), 0) / g.QUEST_DEFS.length;
const QUEST_PER_DAY = 2;

// ---- một kịch bản 30 ngày ----
// opts: { name, plots, crop, trees: ['xoai','oi'], pigs: bool, ducks: bool, treeModel: 'new'|'old' }
function runScenario(opts) {
  resetState();
  const DAYS = 30;
  const startMoney = G.money; // 60.000đ ban đầu — tính cả vốn mua cây/vịt/lợn vào lãi ròng
  const rows = [];
  const tot = { crops: 0, fruit: 0, pigs: 0, ducks: 0, husband: 0, quests: 0, seeds: 0, feed: 0, piglets: 0, living: 0, setup: 0 };
  let fruitEarnedOld = 0;
  // Mua sắm theo tiến độ kiếm tiền (như người chơi thật): ngày 1 chỉ đủ mua
  // cây giống; vịt/chuồng/lợn mua dần khi đủ tiền, kiểm tra mỗi sáng.
  const crop = CROPS[opts.crop];
  function trySetup() {
    if (opts.trees.includes('xoai') && G.saplings.xoai === 0 && !G.trees[0].type && G.money >= FRUIT_TREES.xoai.sapling) {
      g.buySapling('xoai'); G.trees[0].type = 'xoai'; G.trees[0].state = 'growing'; G.trees[0].progress = 0; G.trees[0].watered = false; G.trees[0].waterings = 0; G.trees[0].ripen = 0; G.trees[0].fruitReady = 0; g.drawTree(0);
      tot.setup += FRUIT_TREES.xoai.sapling;
    }
    if (opts.trees.includes('oi') && G.saplings.oi === 0 && !G.trees[1].type && G.money >= FRUIT_TREES.oi.sapling) {
      g.buySapling('oi'); G.trees[1].type = 'oi'; G.trees[1].state = 'growing'; G.trees[1].progress = 0; G.trees[1].watered = false; G.trees[1].waterings = 0; G.trees[1].ripen = 0; G.trees[1].fruitReady = 0; g.drawTree(1);
      tot.setup += FRUIT_TREES.oi.sapling;
    }
    if (opts.ducks && !G.ducks.owned && G.money >= LIVESTOCK.duckFlock.price) { g.buyDuckFlock(); tot.setup += LIVESTOCK.duckFlock.price; }
    if (opts.pigs && !G.owned.pigpen && G.money >= 50000) { g.buyUpgrade('pigpen'); tot.setup += 50000; }
    if (opts.pigs && G.owned.pigpen) while (G.pigs.count < LIVESTOCK.piglet.max && G.money >= LIVESTOCK.piglet.price) { if (!g.buyPiglet()) break; tot.setup += LIVESTOCK.piglet.price; }
  }

  for (let day = 1; day <= DAYS; day++) {
    const before = G.money;
    let income = 0, costs = 0, note = '';
    trySetup(); // mua dần đồ khi đủ tiền
    // --- rau: 1 vụ/ngày/luống (số liệu thật CROPS + giá thật hôm đó) ---
    const seedCost = crop.seed * opts.plots;
    if (G.money < seedCost) { note += 'hết tiền mua hạt; '; }
    else {
      G.money -= seedCost; tot.seeds += seedCost; costs += seedCost;
      const rev = crop.yield * g.sellPriceOf(opts.crop) * opts.plots;
      G.money += rev; G.totalEarned += rev; G.earnedToday += rev;
      income += rev; tot.crops += rev;
    }
    // --- cây ăn quả (mô hình mới: hàm thật) ---
    if (opts.treeModel === 'new') {
      G.can = 5;
      G.trees.forEach((t, i) => { if (t.type) g.waterTree(i); });
      const fruitBefore = G.produce.xoai + G.produce.oi;
      G.trees.forEach((t, i) => { if (t.type && t.state === 'mature' && t.fruitReady > 0) g.harvestTree(i); });
      const harvested = (G.produce.xoai + G.produce.oi) - fruitBefore;
      if (harvested > 0) {
        // bán trái vừa hái theo giá ngày (xoài/ổi riêng)
        const xoaiN = G.produce.xoai, oiN = G.produce.oi;
        const rev = Math.round((xoaiN * g.sellPriceOf('xoai') + oiN * g.sellPriceOf('oi')));
        // chỉ bán phần mới hái: tính từ số trái trước khi hái — đơn giản: bán hết giỏ trái cây
        G.money += rev; G.totalEarned += rev; G.earnedToday += rev;
        income += rev; tot.fruit += rev;
        G.produce.xoai = 0; G.produce.oi = 0;
      }
    } else {
      // Mô hình CŨ (trước khi sửa): cây lớn sau 2 lần tưới (~ngày 1), mỗi sáng
      // ra 3 xoài × 14.000đ + 2 ổi × 9.000đ = 60.000đ/ngày, không cần chăm.
      if (day >= 2 && opts.trees.length > 0) {
        const rev = (opts.trees.includes('xoai') ? 3 * 14000 : 0) + (opts.trees.includes('oi') ? 2 * 9000 : 0);
        G.money += rev; income += rev; tot.fruit += rev; fruitEarnedOld += rev;
      }
    }
    // --- vịt: cho ăn thật, đẻ thật (công thức game), nhặt thật ---
    if (opts.ducks) {
      if (g.feedDucks() !== null) { tot.feed += LIVESTOCK.duckFlock.feed; costs += LIVESTOCK.duckFlock.feed; }
      G.ducks.ready = LIVESTOCK.duckFlock.eggMin + Math.floor(Math.random() * (LIVESTOCK.duckFlock.eggMax - LIVESTOCK.duckFlock.eggMin + 1));
      const n = g.collectDuckEggs();
      if (n > 0) { const rev = n * g.sellPriceOf('trungvit'); G.money += rev; G.totalEarned += rev; income += rev; tot.ducks += rev; }
    }
    // --- lợn: cho ăn thật, bán thật khi lớn rồi mua lại ---
    if (opts.pigs) {
      if (g.feedPigs() !== null) { const c = LIVESTOCK.piglet.feed * G.pigs.count; tot.feed += c; costs += c; }
      while (G.pigs.grown > 0) {
        const price = g.sellGrownPig();
        if (price > 0) { income += price; tot.pigs += price; }
      }
      while (G.pigs.count < LIVESTOCK.piglet.max && G.money >= LIVESTOCK.piglet.price) {
        if (g.buyPiglet()) { tot.piglets += LIVESTOCK.piglet.price; costs += LIVESTOCK.piglet.price; }
        else break;
      }
    }
    // --- chồng đi làm + nhiệm vụ + trộm ---
    const wage = husbandWage();
    G.money += wage; G.totalEarned += wage; income += wage; tot.husband += wage;
    const quest = Math.round(avgQuestReward * QUEST_PER_DAY);
    G.money += quest; income += quest; tot.quests += quest;
    if (Math.random() < 0.65) { const loss = 6000; G.money = Math.max(0, G.money - loss); costs += loss; note += 'trộm ghé (-6k); '; }
    // --- hết ngày: sinh hoạt (code thật) + qua đêm (code thật) ---
    const livingBefore = G.money;
    nextDay();
    const living = livingBefore - G.money; // endDay trừ sinh hoạt (rollover không trừ tiền)
    // lưu ý: nextDay() không trừ thêm tiền ngoài sinh hoạt; tiền sau = trước - sinh hoạt
    tot.living += living; costs += living;
    rows.push({ day, income, costs, net: G.money - before, balance: G.money, note: note.trim() });
  }
  return { opts, rows, tot, startMoney, endMoney: G.money, fruitEarnedOld };
}

function printScenario(r) {
  console.log('\n========== Kịch bản: ' + r.opts.name + ' ==========');
  console.log('Luống: ' + r.opts.plots + ' × ' + CROPS[r.opts.crop].name + ' · Cây: ' + (r.opts.trees.join(', ') || 'không') + ' (' + r.opts.treeModel + ') · Lợn: ' + (r.opts.pigs ? 'có' : 'không') + ' · Vịt: ' + (r.opts.ducks ? 'có' : 'không'));
  console.log('Ngày | Thu | Chi | Lãi ròng | Số dư');
  r.rows.forEach((row) => {
    if (row.day % 5 === 1 || row.day === 30)
      console.log(String(row.day).padStart(4) + ' | ' + fmt(row.income).padStart(9) + ' | ' + fmt(row.costs).padStart(8) + ' | ' + fmt(row.net).padStart(9) + ' | ' + fmt(row.balance));
  });
  const t = r.tot;
  console.log('--- Tổng 30 ngày ---');
  console.log('Thu: rau ' + fmt(t.crops) + ' · trái cây ' + fmt(t.fruit) + ' · lợn ' + fmt(t.pigs) + ' · vịt ' + fmt(t.ducks) + ' · chồng ' + fmt(t.husband) + ' · nhiệm vụ ' + fmt(t.quests));
  console.log('Chi: hạt giống ' + fmt(t.seeds) + ' · cám ' + fmt(t.feed) + ' · mua lợn con lại ' + fmt(t.piglets) + ' · sinh hoạt ' + fmt(t.living) + ' · mua ban đầu ' + fmt(t.setup));
  console.log('Tiền đầu: ' + fmt(r.startMoney) + ' -> cuối: ' + fmt(r.endMoney) + ' · tăng ròng ' + fmt(r.endMoney - r.startMoney) + ' (' + fmt((r.endMoney - r.startMoney) / 30) + '/ngày)');
}

const s1 = runScenario({ name: 'Chăm chỉ — 12 luống cà chua + xoài + ổi + lợn + vịt (mô hình MỚI)', plots: 12, crop: 'cachua', trees: ['xoai', 'oi'], pigs: true, ducks: true, treeModel: 'new' });
printScenario(s1);
const s1old = runScenario({ name: 'Chăm chỉ — CÙNG kịch bản, cây ăn quả theo mô hình CŨ (42k+18k/ngày)', plots: 12, crop: 'cachua', trees: ['xoai', 'oi'], pigs: true, ducks: true, treeModel: 'old' });
printScenario(s1old);
const s2 = runScenario({ name: 'Vừa phải — 6 luống cải + xoài + ổi, không lợn/vịt (mô hình MỚI)', plots: 6, crop: 'cai', trees: ['xoai', 'oi'], pigs: false, ducks: false, treeModel: 'new' });
printScenario(s2);
// --- Chỉ trồng 1 loại rau, 12 luống, không cây/lợn/vịt: xem loại nào áp đảo ---
// (lãi ròng = thu bán rau − tiền hạt; chồng + nhiệm vụ vẫn chạy như mọi kịch bản)
const sTom = runScenario({ name: 'CHỈ cà chua — 12 luống, không cây/lợn/vịt', plots: 12, crop: 'cachua', trees: [], pigs: false, ducks: false, treeModel: 'new' });
printScenario(sTom);
const sBi = runScenario({ name: 'CHỈ bí đỏ — 12 luống, không cây/lợn/vịt', plots: 12, crop: 'bido', trees: [], pigs: false, ducks: false, treeModel: 'new' });
printScenario(sBi);
const sNgo = runScenario({ name: 'CHỈ ngô — 12 luống, không cây/lợn/vịt', plots: 12, crop: 'ngo', trees: [], pigs: false, ducks: false, treeModel: 'new' });
printScenario(sNgo);
const sCai = runScenario({ name: 'CHỈ cải — 12 luống, không cây/lợn/vịt', plots: 12, crop: 'cai', trees: [], pigs: false, ducks: false, treeModel: 'new' });
printScenario(sCai);

console.log('\n========== KẾT LUẬN ==========');
function netCrop(r) { return r.tot.crops - r.tot.seeds; }
console.log('Lãi ròng rau 30 ngày (12 luống, chỉ trồng rau): cà chua ' + fmt(netCrop(sTom)) + ' · bí đỏ ' + fmt(netCrop(sBi)) + ' · ngô ' + fmt(netCrop(sNgo)) + ' · cải ' + fmt(netCrop(sCai)) + ' — chênh nhau tối đa ' + (Math.max(netCrop(sTom), netCrop(sBi), netCrop(sNgo), netCrop(sCai)) / Math.min(netCrop(sTom), netCrop(sBi), netCrop(sNgo), netCrop(sCai))).toFixed(1) + ' lần.');
console.log('So với hoạt động khác (30 ngày, kịch bản chăm chỉ): trái cây ' + fmt(s1.tot.fruit) + ' · lợn (bán ' + fmt(s1.tot.pigs) + ', trừ mua lợn con ' + fmt(s1.tot.piglets) + ' + cám) · vịt (trứng ' + fmt(s1.tot.ducks) + ', trừ cám 4.000đ/ngày) · chồng ' + fmt(s1.tot.husband) + ' · nhiệm vụ ' + fmt(s1.tot.quests) + '.');
console.log('Cây ăn quả 30 ngày: mô hình MỚI cho ' + fmt(s1.tot.fruit) + ' — mô hình CŨ cho ' + fmt(s1old.tot.fruit) + ' (giảm ' + Math.round((1 - s1.tot.fruit / s1old.tot.fruit) * 100) + '%).');
console.log('Số dư cuối 30 ngày: chăm chỉ (mới) ' + fmt(s1.endMoney) + ' vs chăm chỉ (cũ) ' + fmt(s1old.endMoney) + ' — cây cũ chiếm ' + fmt(s1old.endMoney - s1.endMoney) + ' tiền thừa.');
console.log('Người chơi vừa phải (mới): ' + fmt(s2.endMoney) + ' sau 30 ngày — ' + (s2.endMoney >= 300000 ? 'đủ Quỹ sửa nhà 300k sau ~' + Math.ceil(300000 / ((s2.endMoney - s2.startMoney) / 30)) + ' ngày.' : 'chưa đủ Quỹ sửa nhà 300k — cần cày thêm hoặc chăm hơn.'));
console.log('Đầu game: ngày 1–6 của kịch bản vừa phải: số dư ngày 1 ' + fmt(s2.rows[0].balance) + ', ngày 6 ' + fmt(s2.rows[5].balance) + ' — ' + (s2.rows[5].balance < 600000 ? 'vẫn chật vật thật.' : 'đã dư dả sớm, cần xem lại.'));
