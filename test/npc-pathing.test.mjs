// Test đường đi + lịch sinh hoạt của dân làng trong Node (không cần trình duyệt):
//  - lịch của 7 dân làng phải phủ kín 05:30–19:00, không hở/không chồng lấn,
//    đúng giờ ở các địa điểm chính (sạp, tiệm, trường, ruộng);
//  - mọi điểm đến trong lịch phải nằm NGOÀI vòng chặn (blockers) và trong bản đồ;
//  - không hai người nào đứng cùng một chỗ vào cùng một giờ;
//  - mô phỏng cả ngày bằng đúng hàm updateVillagers thật (1 phút game = 2/3
//    giây thật, đi 1,6 m/giây, trượt quanh vật cản): không ai đi xuyên vật
//    thể, ai cũng tới được điểm hẹn trước khi hết ca, và không ai kẹt đường.
//  - lặp lại mô phỏng sau khi mua đủ nâng cấp (tủ lạnh, xe máy, chuồng lợn,
//    mở rộng chuồng gà...) vì các nâng cấp thêm vòng chặn mới vào sân.
// Chạy:  node test/npc-pathing.test.mjs
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
// RNG có seed — game bốc nhiều thứ ngẫu nhiên lúc nạp (nhiệm vụ, trộm,
// mưa...). Seed để kết quả ổn định giữa các lần chạy (cùng seed với
// economy-sim.mjs và save-shopping.test.mjs).
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
const require = createRequire(import.meta.url);
const g = require(BUNDLE);
const { G, VILLAGERS, villagerMeshes, blockers } = g;

// ---------- khung test ----------
let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; failures.push(name); console.log('  FAIL  ' + name + (detail ? ' — ' + detail : '')); }
}
function section(title) { console.log('\n' + title); }

const DAY_START = 330, DAY_END = 1140; // 05:30–19:00
const fmtT = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');

// Khoảng cách từ 1 điểm tới vòng chặn gần nhất (âm = lọt trong vòng chặn)
function clearance(x, z) {
  let min = Infinity, who = null;
  for (const b of blockers) {
    const d = Math.hypot(x - b.x, z - b.z) - b.r;
    if (d < min) { min = d; who = b; }
  }
  return { min, who };
}
function segAt(def, m) {
  for (const s of def.schedule) if (m >= s.from && m < s.to) return s;
  return def.schedule[def.schedule.length - 1];
}
function pt(p) { return '(' + p.x + ',' + p.z + ')'; }

// Trạng thái gốc để reset giữa các nhóm test
const freshG = JSON.parse(JSON.stringify(G));
function resetState() {
  for (const k of Object.keys(G)) delete G[k];
  Object.assign(G, JSON.parse(JSON.stringify(freshG)));
  localStorage.clear();
  G.started = true; G.dayOver = false;
}

// ================= A. Bảng lịch: phủ kín ngày, đúng giờ ở địa điểm chính =================
section('A. Lịch sinh hoạt phủ kín 05:30–19:00, đúng giờ');
for (const v of VILLAGERS) {
  const segs = v.schedule;
  let ok = segs[0].from === DAY_START && segs[segs.length - 1].to === DAY_END;
  for (let i = 1; i < segs.length; i++) if (segs[i].from !== segs[i - 1].to) ok = false;
  check(v.name + ': lịch phủ kín 05:30–19:00, không hở giờ', ok);
  for (const s of segs) {
    check(v.name + ' ' + fmtT(s.from) + '–' + fmtT(s.to) + ': có điểm đến hợp lệ', s.at && typeof s.at.x === 'number' && typeof s.at.z === 'number');
  }
}
// Địa điểm chính theo giờ (đúng như mô tả Giai đoạn 3)
check('cô Ba đứng bán ở sạp 06:30–17:00', segAt(VILLAGERS.find(v => v.id === 'ba'), 390).stall === 'ba' && segAt(VILLAGERS.find(v => v.id === 'ba'), 1019).stall === 'ba');
check('chị Lan đứng bán ở sạp 07:00–17:00', segAt(VILLAGERS.find(v => v.id === 'lan'), 420).stall === 'lan' && segAt(VILLAGERS.find(v => v.id === 'lan'), 1019).stall === 'lan');
check('anh Đức đứng bán ở sạp 07:00–16:00', segAt(VILLAGERS.find(v => v.id === 'duc'), 420).stall === 'duc' && segAt(VILLAGERS.find(v => v.id === 'duc'), 959).stall === 'duc');
check('ông Tư ở tiệm tạp hóa 06:00–18:00', segAt(VILLAGERS.find(v => v.id === 'tu'), 360).at === g.GROCERY_FRONT && segAt(VILLAGERS.find(v => v.id === 'tu'), 1079).at === g.GROCERY_FRONT);
check('cô giáo ở sân trường 07:00–16:30', segAt(VILLAGERS.find(v => v.id === 'giao'), 420).at === g.SCHOOL_YARD_SPOT && segAt(VILLAGERS.find(v => v.id === 'giao'), 989).at === g.SCHOOL_YARD_SPOT);
check('bác Hai ở ruộng 07:00–11:00', segAt(VILLAGERS.find(v => v.id === 'hai'), 420).at === g.FIELD_SPOT && segAt(VILLAGERS.find(v => v.id === 'hai'), 659).at === g.FIELD_SPOT);
check('anh Đức câu cá ở ao 05:30–06:00 và 16:00–18:00', segAt(VILLAGERS.find(v => v.id === 'duc'), 330).at === g.POND_SPOT && segAt(VILLAGERS.find(v => v.id === 'duc'), 1000).at === g.POND_SPOT);

// ================= B. Mọi điểm đến nằm ngoài vòng chặn, trong bản đồ =================
section('B. Điểm đến (kể cả điểm via) ngoài vòng chặn, trong bản đồ');
for (const v of VILLAGERS) {
  for (const s of v.schedule) {
    const targets = (s.via || []).concat([s.at]);
    for (const t of targets) {
      const c = clearance(t.x, t.z);
      check(v.name + ' ' + fmtT(s.from) + ' ' + pt(t) + ': ngoài vòng chặn (cách ' + c.min.toFixed(2) + 'm)',
        c.min >= -0.02, 'lọt trong vòng chặn ' + JSON.stringify(c.who));
      check(v.name + ' ' + fmtT(s.from) + ' ' + pt(t) + ': trong bản đồ',
        t.x >= -27 && t.x <= 31 && t.z >= -20.5 && t.z <= 19);
    }
  }
}

// ================= C. Không hai người nào đứng cùng chỗ cùng giờ =================
section('C. Không trùng chỗ đứng giữa các dân làng');
{
  let worst = { d: Infinity, when: null, pair: null };
  for (let m = DAY_START; m < DAY_END; m += 15) {
    for (let i = 0; i < VILLAGERS.length; i++) {
      for (let j = i + 1; j < VILLAGERS.length; j++) {
        const a = segAt(VILLAGERS[i], m).at, b = segAt(VILLAGERS[j], m).at;
        const d = Math.hypot(a.x - b.x, a.z - b.z);
        if (d < worst.d) worst = { d, when: m, pair: VILLAGERS[i].name + '/' + VILLAGERS[j].name };
      }
    }
  }
  check('cặp dân làng đứng gần nhất trong ngày vẫn cách nhau ' + worst.d.toFixed(2) + 'm (' + worst.pair + ' lúc ' + fmtT(worst.when) + ')', worst.d > 0.9);
}

// ================= D + E. Mô phỏng cả ngày bằng updateVillagers thật =================
function simulateDay(label) {
  section(label);
  // Đặt mọi người đúng chỗ 05:30
  for (const v of VILLAGERS) {
    const m = villagerMeshes[v.id];
    const s = segAt(v, DAY_START);
    m.position.set(s.at.x, 0, s.at.z);
  }
  G.minutes = DAY_START;
  let tNow = 0, intrusions = 0, stuck = [];
  const arrived = {}; // "id:from" -> phút tới nơi
  const arrivalLag = [];
  for (let m = DAY_START; m < DAY_END; m++) {
    G.minutes = m;
    tNow += 2 / 3; // 1 phút game = 2/3 giây thật (main.ts: minutes += dt*1.5)
    g.updateVillagers(2 / 3, tNow);
    // (1) không ai lọt trong vòng chặn sau mỗi bước
    for (const v of VILLAGERS) {
      const p = villagerMeshes[v.id].position;
      const c = clearance(p.x, p.z);
      if (c.min < -0.05) {
        intrusions++;
        if (intrusions <= 3) console.log('    xâm phạm: ' + v.name + ' lúc ' + fmtT(m) + ' tại ' + pt({ x: +p.x.toFixed(2), z: +p.z.toFixed(2) }) + ' lọt ' + (-c.min).toFixed(2) + 'm vào vòng ' + JSON.stringify(c.who));
      }
    }
    // (2) ghi nhận phút tới điểm hẹn của từng ca
    for (const v of VILLAGERS) {
      const s = segAt(v, m);
      const key = v.id + ':' + s.from;
      if (!(key in arrived)) {
        const p = villagerMeshes[v.id].position;
        if (Math.hypot(p.x - s.at.x, p.z - s.at.z) <= 0.5) arrived[key] = m;
      }
      // (3) hết ca mà chưa tới nơi = kẹt đường / đích không tới được
      if (m === s.to - 1 && !(key in arrived)) stuck.push(v.name + ' ca ' + fmtT(s.from) + '–' + fmtT(s.to) + ' đích ' + pt(s.at));
      if (m === s.to - 1 && arrived[key] != null) arrivalLag.push({ v: v.name, from: s.from, to: s.to, arrived: arrived[key] });
    }
  }
  check(label + ': không ai đi xuyên vật thể (0 lần lọt vòng chặn)', intrusions === 0, intrusions + ' lần lọt vào vòng chặn');
  check(label + ': mọi ca đều tới được điểm hẹn trước khi hết ca', stuck.length === 0, stuck.join('; '));
  if (arrivalLag.length > 0) {
    let worstLag = arrivalLag[0];
    for (const a of arrivalLag) if ((a.arrived - a.from) > (worstLag.arrived - worstLag.from)) worstLag = a;
    console.log('    ca tới muộn nhất: ' + worstLag.v + ' ca ' + fmtT(worstLag.from) + ' tới lúc ' + fmtT(worstLag.arrived) + ' (đi ' + (worstLag.arrived - worstLag.from) + ' phút)');
  }
  // (4) cuối ngày: mọi người đứng đúng chỗ 19:00, không ai trùng nhau
  let closest = { d: Infinity, pair: null };
  for (let i = 0; i < VILLAGERS.length; i++) {
    for (let j = i + 1; j < VILLAGERS.length; j++) {
      const a = villagerMeshes[VILLAGERS[i].id].position, b = villagerMeshes[VILLAGERS[j].id].position;
      const d = Math.hypot(a.x - b.x, a.z - b.z);
      if (d < closest.d) closest = { d, pair: VILLAGERS[i].name + '/' + VILLAGERS[j].name };
    }
  }
  check(label + ': cuối ngày hai người gần nhất vẫn cách nhau ' + closest.d.toFixed(2) + 'm', closest.d > 0.9, closest.pair);
  return { intrusions, stuck };
}

resetState();
simulateDay('D. Mô phỏng cả ngày — trạng thái mặc định');
const defaultBlockers = blockers.length;
resetState();
G.money = 1000000; // mua đủ nâng cấp để thêm vòng chặn vào sân rồi đi lại
for (const u of ['tv', 'fridge', 'bike', 'land', 'coopBig', 'pigpen']) g.buyUpgrade(u);
console.log('    vòng chặn: mặc định ' + defaultBlockers + ' -> sau khi mua đủ nâng cấp ' + blockers.length);
simulateDay('E. Mô phỏng cả ngày — đã mua đủ nâng cấp nhà');

// ================= F. Địa điểm mới 4.3: chùa, rừng tre, đồi ngắm ruộng =================
section('F. Địa điểm mới 4.3: vòng chặn, lịch dân làng, lối đi mở');
function hasBlocker(x, z, r) {
  return blockers.some(function (b) { return b.x === x && b.z === z && b.r === r; });
}
check('chùa có vòng chặn r=2,8 ở (-25,5, 15,5)', hasBlocker(-25.5, 15.5, 2.8));
for (const c of g.GROVE_CLUSTERS) {
  check('rừng tre: 1 khóm có vòng chặn r=0,9 ở ' + pt(c), hasBlocker(c.x, c.z, 0.9));
}
check('đồi ngắm ruộng có vòng chặn r=2,2 ở (4, -19)', hasBlocker(4, -19, 2.2));
// Vòng chặn mới đều nằm ngoài sân rào lõi — lõi làng không động vào
for (const nb of [{ x: -25.5, z: 15.5 }, ...g.GROVE_CLUSTERS, { x: 4, z: -19 }]) {
  check('vòng chặn mới ' + pt(nb) + ' nằm ngoài sân rào lõi (|x|>19 hoặc |z|>12 hoặc z<-11)',
    nb.x < -19 || nb.x > 19 || nb.z > 12 || nb.z < -11);
}
// Lịch dân làng tới chỗ mới (điểm đến đã được B/C kiểm tra ngoài vòng chặn,
// trong bản đồ, không trùng nhau; mô phỏng D/E đã chạy qua chúng)
const nam = VILLAGERS.find(v => v.id === 'nam'), hai = VILLAGERS.find(v => v.id === 'hai');
check('bà Năm ghé chùa 05:30–07:00', segAt(nam, 330).at === g.TEMPLE_SPOT && segAt(nam, 419).at === g.TEMPLE_SPOT);
check('bác Hai nghỉ ở rừng tre 13:00–15:30', segAt(hai, 780).at === g.GROVE_REST_SPOT && segAt(hai, 929).at === g.GROVE_REST_SPOT);
// Điểm tương tác của 3 chỗ mới: ngoài vòng chặn, trong bản đồ
{
  const tp = clearance(g.TEMPLE_PRAY_SPOT.x, g.TEMPLE_PRAY_SPOT.z);
  check('điểm thắp hương ngoài vòng chặn (cách ' + tp.min.toFixed(2) + 'm)', tp.min >= 0.2);
  check('điểm thắp hương trong bản đồ', g.TEMPLE_PRAY_SPOT.x >= -27 && g.TEMPLE_PRAY_SPOT.z <= 19);
  for (const s of g.GROVE_SHOOTS) {
    const sc = clearance(s.x, s.z);
    check('cây măng ' + pt(s) + ' ngoài vòng chặn (cách ' + sc.min.toFixed(2) + 'm)', sc.min >= 0.3);
    check('cây măng ' + pt(s) + ' trong bản đồ', s.x >= -27 && s.x <= 31 && s.z >= -20.5 && s.z <= 19);
  }
  const hc = clearance(g.HILL_REST_SPOT.x, g.HILL_REST_SPOT.z);
  check('điểm ngồi nghỉ trên đồi ngoài vòng chặn (cách ' + hc.min.toFixed(2) + 'm)', hc.min >= 1);
  check('điểm ngồi nghỉ trên đồi trong bản đồ', g.HILL_REST_SPOT.x >= -27 && g.HILL_REST_SPOT.z >= -20.5);
}
// Nút "Đi tới" cho 3 chỗ mới: trong bản đồ, ngoài vòng chặn
for (const k of ['temple', 'grove', 'hill']) {
  const t = g.gotoTargets[k];
  check('Đi tới "' + k + '" ' + pt(t) + ': trong bản đồ',
    t.x >= -27 && t.x <= 31 && t.z >= -20.5 && t.z <= 19);
  const gc = clearance(t.x, t.z);
  check('Đi tới "' + k + '" ' + pt(t) + ': ngoài vòng chặn (cách ' + gc.min.toFixed(2) + 'm)', gc.min >= 0);
}
// Không ngõ cụt: đi bộ (dùng đúng collide() của game, từng bước 0,5m, trượt
// quanh vòng chặn như người chơi) từ mỗi chỗ mới về giữa làng phải tới được
function canWalkTo(from, to) {
  let x = from.x, z = from.z, stuck = 0;
  for (let step = 0; step < 400; step++) {
    const dx = to.x - x, dz = to.z - z, d = Math.hypot(dx, dz);
    if (d < 1) return true;
    const c = g.collide(x + dx / d * 0.5, z + dz / d * 0.5);
    if (Math.hypot(c.x - x, c.z - z) < 0.05) { stuck++; if (stuck > 20) return false; }
    else stuck = 0;
    x = c.x; z = c.z;
  }
  return Math.hypot(to.x - x, to.z - z) < 1;
}
check('đi bộ từ chùa ra giữa làng không kẹt (không ngõ cụt)', canWalkTo(g.TEMPLE_PRAY_SPOT, { x: 0, z: 0 }));
check('đi bộ từ rừng tre ra giữa làng không kẹt (không ngõ cụt)', canWalkTo(g.GROVE_REST_SPOT, { x: 0, z: 0 }));
check('đi bộ từ đồi ngắm ruộng ra giữa làng không kẹt (không ngõ cụt)', canWalkTo(g.HILL_REST_SPOT, { x: 0, z: 0 }));

// ================= G. Tương tác 4.3 + save cũ =================
section('G. Tương tác 4.3: thắp hương, nghỉ đồi, hái măng + save cũ');
function nextDay() {
  g.endDay();
  globalThis.document.getElementById('btn-next-day').fire('click');
}
// --- Thắp hương ở chùa: +1 sao, 1 lần/ngày ---
resetState();
G.stars = 0;
const mem0 = G.memories.length;
g.setCurrentTarget({ kind: 'temple' });
g.doInteract();
check('thắp hương lần đầu: +1 sao vui vẻ', G.stars === 1, 'stars=' + G.stars);
check('thắp hương: đã đánh dấu trong ngày', G.templePrayedToday === true);
check('thắp hương: ghi 1 dòng kỷ niệm', G.memories.length === mem0 + 1 && /chùa/.test(G.memories[G.memories.length - 1]));
g.doInteract();
check('thắp hương lần 2 cùng ngày: không tăng sao', G.stars === 1, 'stars=' + G.stars);
g.player.x = g.TEMPLE_PRAY_SPOT.x; g.player.z = g.TEMPLE_PRAY_SPOT.z;
const ft = g.findTarget();
check('đứng ở điểm thắp hương: E hiện đúng "Thắp hương ở chùa"', ft && ft.kind === 'temple', ft && ft.kind);
// --- Nghỉ trên đồi: kỷ niệm, không cộng sao ---
resetState();
const starsBefore = G.stars;
const mem1 = G.memories.length;
g.setCurrentTarget({ kind: 'viewpoint' });
g.doInteract();
check('ngồi nghỉ trên đồi: đã đánh dấu, không cộng sao', G.viewpointRestedToday === true && G.stars === starsBefore);
check('ngồi nghỉ: ghi 1 dòng kỷ niệm', G.memories.length === mem1 + 1 && /đồi/.test(G.memories[G.memories.length - 1]));
g.doInteract();
check('ngồi nghỉ lần 2 cùng ngày: không ghi thêm kỷ niệm', G.memories.length === mem1 + 1);
g.player.x = g.HILL_REST_SPOT.x; g.player.z = g.HILL_REST_SPOT.z;
const fh = g.findTarget();
check('đứng ở ghế đá trên đồi: E hiện đúng "Ngồi nghỉ trên đồi"', fh && fh.kind === 'viewpoint', fh && fh.kind);
// --- Hái măng tre: mỗi cây 1 lần/ngày, bán được ở chợ ---
resetState();
check('măng tre: lúc đầu giỏ chưa có', (G.produce.mangtre || 0) === 0);
check('măng tre: giá bán gốc 6.000đ', g.GOODS.mangtre.sell === 6000);
check('măng tre: anh Đức lấy (+5% = 6.300đ), cô Ba không lấy', g.marketPriceOf('duc', 'mangtre') === 6300 && g.VENDORS.ba.keys.indexOf('mangtre') < 0);
g.setCurrentTarget({ kind: 'bamboo', shootIndex: 0 });
g.doInteract();
check('hái măng cây 0: giỏ +1 măng, cây hết hái', G.produce.mangtre === 1 && G.bambooReady[0] === false && G.bambooToday === 1);
check('hái măng: cây đã hái thì ẩn khỏi rừng tre', globalThis.window.__bambooShoots[0].group.visible === false);
g.doInteract();
check('hái lại cùng cây măng: không thêm măng', G.produce.mangtre === 1);
g.setCurrentTarget({ kind: 'bamboo', shootIndex: 1 }); g.doInteract();
g.setCurrentTarget({ kind: 'bamboo', shootIndex: 2 }); g.doInteract();
check('hái hết 3 cây măng: giỏ có 3 măng', G.produce.mangtre === 3);
g.player.x = g.GROVE_SHOOTS[0].x; g.player.z = g.GROVE_SHOOTS[0].z;
const fb = g.findTarget();
check('đứng ở cây măng đã hái: E vẫn hiện "Măng ở đây vừa hái rồi"', fb && fb.kind === 'bamboo' && /vừa hái/.test(fb.label), fb && fb.label);
const moneyBefore = G.money;
const sold = g.sellToVendor('duc', 'mangtre');
check('bán 3 măng cho anh Đức: +18.900đ, giỏ hết măng', sold === 18900 && G.money === moneyBefore + 18900 && G.produce.mangtre === 0, 'bán được ' + sold);
// --- Qua đêm: măng mọc lại, mai thắp hương / nghỉ đồi lại được ---
resetState();
g.setCurrentTarget({ kind: 'temple' }); g.doInteract();
g.setCurrentTarget({ kind: 'bamboo', shootIndex: 1 }); g.doInteract();
g.setCurrentTarget({ kind: 'viewpoint' }); g.doInteract();
const starsDay1 = G.stars;
nextDay();
check('sang ngày mới: thắp hương / nghỉ đồi về chưa làm', G.templePrayedToday === false && G.viewpointRestedToday === false);
check('sang ngày mới: măng mọc lại đủ 3 cây, đếm hôm nay về 0', G.bambooReady.join(',') === 'true,true,true' && G.bambooToday === 0);
check('sang ngày mới: 3 cây măng hiện lại trong rừng tre',
  globalThis.window.__bambooShoots.every(function (s) { return s.group.visible; }));
g.setCurrentTarget({ kind: 'temple' }); g.doInteract();
check('ngày mới thắp hương lại: +1 sao', G.stars === starsDay1 + 1, 'stars=' + G.stars);
// --- Save/load: vòng tròn giữ trạng thái; save cũ không có trường 4.3 vẫn đọc được ---
resetState();
g.setCurrentTarget({ kind: 'temple' }); g.doInteract();
g.setCurrentTarget({ kind: 'bamboo', shootIndex: 1 }); g.doInteract();
g.saveGame();
const saved43 = g.readSave();
G.templePrayedToday = false; G.bambooReady = [true, true, true]; G.produce.mangtre = 0;
g.applySave(saved43);
check('save/load: giữ trạng thái đã thắp hương', G.templePrayedToday === true);
check('save/load: giữ măng cây 1 đã hái, cây 0 và 2 còn', G.bambooReady.join(',') === 'true,false,true');
check('save/load: giữ 1 măng trong giỏ', G.produce.mangtre === 1);
check('save/load: cây măng đã hái vẫn ẩn sau khi tải', globalThis.window.__bambooShoots[1].group.visible === false);
resetState();
G.day = 5; G.money = 80000; G.stars = 3;
g.saveGame();
const oldSave = g.readSave();
delete oldSave.templePrayedToday; delete oldSave.viewpointRestedToday;
delete oldSave.bambooReady; delete oldSave.bambooToday;
delete oldSave.produce.mangtre;
g.applySave(oldSave);
check('save cũ (trước 4.3): thắp hương / nghỉ đồi về mặc định chưa làm', G.templePrayedToday === false && G.viewpointRestedToday === false);
check('save cũ: măng về mặc định còn đủ 3 cây, đếm hôm nay 0', G.bambooReady.join(',') === 'true,true,true' && G.bambooToday === 0);
check('save cũ: giỏ chưa có măng tre', (G.produce.mangtre || 0) === 0);
check('save cũ: 3 cây măng hiện đủ trong rừng tre',
  globalThis.window.__bambooShoots.every(function (s) { return s.group.visible; }));

console.log('\n================ KẾT QUẢ ================');
console.log(`PASS: ${pass} | FAIL: ${fail}`);
if (fail > 0) { console.log('Thất bại: ' + failures.join(', ')); process.exit(1); }
console.log('Tất cả test đều đậu.');
