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

console.log('\n================ KẾT QUẢ ================');
console.log(`PASS: ${pass} | FAIL: ${fail}`);
if (fail > 0) { console.log('Thất bại: ' + failures.join(', ')); process.exit(1); }
console.log('Tất cả test đều đậu.');
