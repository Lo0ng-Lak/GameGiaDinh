// Test Phase 4.4 (3D graphics, lighting, movement, sound) trong Node:
//  - ánh sáng hoàng hôn theo phút (daylightState thuần), đèn chập tối
//    (lanternLevel + updateLanterns thật), giông cộng với hoàng hôn
//    (stormDimFactor, không ghi đè), chuyển động nhân vật (walkAnim
//    thuần + updateVillagers thật), âm thanh mới (AC null vẫn an toàn,
//    chuông chùa / gió rừng tre / dế chiều tối theo giờ + khoảng cách).
// Chạy:  node test/lighting.test.mjs
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
const { G, player } = g;

// ---------- khung test ----------
let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; failures.push(name); console.log('  FAIL  ' + name + (detail ? ' — ' + detail : '')); }
}
function eq(name, a, b) { check(name, JSON.stringify(a) === JSON.stringify(b), 'nhận ' + JSON.stringify(a) + ', muốn ' + JSON.stringify(b)); }
function approx(name, a, b, eps) { check(name, Math.abs(a - b) <= (eps || 0.01), 'nhận ' + a + ', muốn ~' + b); }
function section(title) { console.log('\n' + title); }
function noThrow(name, fn) {
  try { fn(); check(name, true); }
  catch (e) { check(name, false, 'ném lỗi: ' + (e && e.message)); }
}

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

// ---------- A. daylightState: cường độ + màu nắng theo giờ ----------
section('A. Ánh sáng ban ngày theo giờ (daylightState thuần)');
resetState();
let s = g.daylightState(330); // 05:30 bình minh
approx('05:30 cường độ nắng 0.75', s.intensity, 0.75);
eq('05:30 chưa vào hoàng hôn (duskT 0)', s.duskT, 0);
eq('05:30 đèn chưa sáng', s.lanternLevel, 0);
s = g.daylightState(720); // 12:00 trưa
approx('12:00 cường độ nắng 1.05', s.intensity, 1.05);
approx('12:00 nắng hơi vàng (hue 0.12)', s.sunHue, 0.12);
eq('12:00 chưa vào hoàng hôn', s.duskT, 0);
check('12:00 bóng ngắn (~1)', s.shadowLen < 1.1, 'shadowLen=' + s.shadowLen);
s = g.daylightState(1110); // 18:30 hoàng hôn
approx('18:30 cường độ nắng ~0.62 (mờ dần)', s.intensity, 0.62, 0.02);
check('18:30 đã vào hoàng hôn sâu (duskT > 0.8)', s.duskT > 0.8, 'duskT=' + s.duskT);
check('18:30 nắng ngả cam (hue < hue trưa)', s.sunHue < 0.12, 'sunHue=' + s.sunHue);
check('18:30 nắng đậm màu hơn trưa', s.sunSat > 0.65, 'sunSat=' + s.sunSat);
check('18:30 nắng tối dần (light < trưa)', s.sunLight < 0.72, 'sunLight=' + s.sunLight);
check('18:30 bóng dài hơn trưa rõ rệt', s.shadowLen > 2.5, 'shadowLen=' + s.shadowLen);
s = g.daylightState(1140); // 19:00 hết ngày
approx('19:00 cường độ nắng 0.5', s.intensity, 0.5);
eq('19:00 hoàng hôn xong (duskT 1)', s.duskT, 1);
eq('19:00 đèn sáng hẳn', s.lanternLevel, 1);
// smoothstep: 0/0.5/1 đúng, ngoài khoảng kẹp về biên
eq('smooth01(0)=0', g.smooth01(0), 0);
eq('smooth01(0.5)=0.5', g.smooth01(0.5), 0.5);
eq('smooth01(1)=1', g.smooth01(1), 1);
eq('smooth01(-1) kẹp về 0', g.smooth01(-1), 0);
eq('smooth01(2) kẹp về 1', g.smooth01(2), 1);

// ---------- B. Đèn chập tối: mốc bật/tắt ----------
section('B. Đèn chập tối (lanternLevel: tắt trước 17:00, sáng hẳn 17:30)');
resetState();
eq('12:00 đèn tắt', g.lanternLevel(720), 0);
eq('16:59 đèn vẫn tắt', g.lanternLevel(1019), 0);
check('17:10 đèn bắt đầu sáng dần', g.lanternLevel(1030) > 0 && g.lanternLevel(1030) < 1, 'level=' + g.lanternLevel(1030));
eq('17:30 đèn sáng hẳn', g.lanternLevel(1050), 1);
eq('18:30 đèn sáng hẳn', g.lanternLevel(1110), 1);
eq('19:00 đèn sáng hẳn', g.lanternLevel(1140), 1);
check('đèn sáng dần đều, không nhảy cóc', g.lanternLevel(1030) < g.lanternLevel(1040) && g.lanternLevel(1040) < g.lanternLevel(1050));

// ---------- C. Giông cộng với hoàng hôn, không ghi đè ----------
section('C. Giông/mây làm tối theo hệ số nhân (stormDimFactor)');
resetState();
eq('giông đang mưa: nắng ×0.32, hemi ×0.6', g.stormDimFactor('storm', true), { sun: 0.32, hemi: 0.6 });
eq('mưa thường: nắng ×0.5, hemi ×0.75', g.stormDimFactor('rain', true), { sun: 0.5, hemi: 0.75 });
eq('nhiều mây (không mưa): nắng ×0.85, hemi ×0.92', g.stormDimFactor('cloudy', false), { sun: 0.85, hemi: 0.92 });
eq('nắng: không tối (×1)', g.stormDimFactor('sunny', false), { sun: 1, hemi: 1 });
approx('18:30 nắng: nắng cuối ~0.62', g.finalSunIntensity(1110, 'sunny', false), 0.62, 0.02);
approx('18:30 giông: nắng cuối ~0.20 (0.62 × 0.32)', g.finalSunIntensity(1110, 'storm', true), 0.198, 0.02);
check('hoàng hôn giông tối hơn hoàng hôn nắng, nhưng không tối hẳn về 0',
  g.finalSunIntensity(1110, 'storm', true) < g.finalSunIntensity(1110, 'sunny', false) &&
  g.finalSunIntensity(1110, 'storm', true) > 0);
check('trưa giông vẫn sáng hơn hoàng hôn giông',
  g.finalSunIntensity(720, 'storm', true) > g.finalSunIntensity(1110, 'storm', true));

// ---------- D. updateSky thật: áp dụng đúng vào scene ----------
section('D. updateSky() thật áp dụng ánh sáng vào scene');
resetState();
G.minutes = 720;
g.updateSky();
approx('updateSky 12:00: sun.intensity 1.05', g.sun.intensity, 1.05);
approx('updateSky 12:00: khung bóng ~gốc (trưa bóng ngắn)', g.sun.shadow.camera.left, -34.2, 0.5);
G.minutes = 1110;
g.updateSky();
approx('updateSky 18:30: sun.intensity ~0.62 (mờ dần)', g.sun.intensity, 0.62, 0.02);
approx('updateSky 18:30: khung bóng mở ×1.8 (bóng dài nằm trong khung)', g.sun.shadow.camera.left, -61.2, 0.5);
noThrow('updateSky 12:00 không lỗi', () => { G.minutes = 720; g.updateSky(); });
noThrow('updateSky 18:30 không lỗi', () => { G.minutes = 1110; g.updateSky(); });
noThrow('updateSky 05:30 không lỗi', () => { G.minutes = 330; g.updateSky(); });
noThrow('updateSky 19:00 không lỗi', () => { G.minutes = 1140; g.updateSky(); });
approx('shadowLengthFactor trưa ~1', g.shadowLengthFactor(720), 1.0, 0.1);
check('shadowLengthFactor 18:30 > 2.5', g.shadowLengthFactor(1110) > 2.5);

// ---------- E. Đèn sạp chợ + đèn chùa ----------
section('E. Đèn sạp chợ + đèn chùa (updateLanterns thật)');
resetState();
G.minutes = 720;
g.updateLanterns(1.0);
let ls = g.lanternsState();
eq('12:00 đèn sạp tắt', ls.stall, 0);
eq('12:00 đèn chùa tắt', ls.temple, 0);
eq('12:00 bóng sạp màu đỏ mờ', ls.stallBulb, 0xd4573a);
eq('12:00 bóng chùa màu đá mờ', ls.templeBulb, 0x8a8378);
G.minutes = 1110;
g.updateLanterns(1.0);
ls = g.lanternsState();
check('18:30 đèn sạp sáng (PointLight > 0)', ls.stall > 0.5, 'stall=' + ls.stall);
check('18:30 đèn chùa sáng (PointLight > 0)', ls.temple > 0.4, 'temple=' + ls.temple);
eq('18:30 bóng sạp ngả vàng sáng', ls.stallBulb, 0xffc46b);
eq('18:30 bóng chùa ngả vàng sáng', ls.templeBulb, 0xffd97a);
eq('18:30 mức đèn = 1', ls.level, 1);
// Giông không tắt đèn chập tối — đèn chỉ theo giờ
G.weather = 'storm'; G.raining = true; G.minutes = 1110;
g.updateLanterns(2.0);
ls = g.lanternsState();
check('giông 18:30 đèn sạp vẫn sáng', ls.stall > 0.5, 'stall=' + ls.stall);
check('giông 18:30 đèn chùa vẫn sáng', ls.temple > 0.4, 'temple=' + ls.temple);
eq('giông không đổi mức đèn (vẫn 1)', ls.level, 1);
// Đèn sạp và đèn chùa là 2 đèn riêng, cường độ tối đa khác nhau
check('đèn sạp sáng hơn đèn chùa (tầm + cường độ khác nhau)', ls.stall > ls.temple, 'stall=' + ls.stall + ' temple=' + ls.temple);

// ---------- F. Chuyển động: xoay mặt êm + nhấp nhô + đung đưa ----------
section('F. walkAnim thuần: smoothFacing, walkBobY, idleSway');
resetState();
approx('quay mặt bị giới hạn tốc độ (6 rad/s × 0.016)', g.smoothFacing(0, Math.PI, 0.016, 6), 0.096, 0.001);
eq('quay tới góc gần thì tới thẳng đích', g.smoothFacing(0, 0.05, 0.016, 6), 0.05);
eq('quay đường ngắn qua vòng ±PI (3.0 -> -3.0 không quay ngược vòng)',
  g.smoothFacing(3.0, -3.0, 1, 6), -3.0);
check('quay qua vòng ±PI đi đường ngắn, không quay dài',
  Math.abs(g.angleDelta(3.0, -3.0)) < 0.3, 'delta=' + g.angleDelta(3.0, -3.0));
check('đứng yên không nhấp nhô', g.walkBobY(0.2, false, 1.6) === 0);
check('đang đi thì nhấp nhô > 0 giữa nhịp', g.walkBobY(0.2, true, 1.6) > 0.01, 'bob=' + g.walkBobY(0.2, true, 1.6));
eq('đầu nhịp bước thì bob = 0', g.walkBobY(0, true, 1.6), 0);
check('đi nhanh nhấp nhiều hơn đi chậm', g.walkBobY(0.2, true, 2.5) > g.walkBobY(0.2, true, 1.0));
check('đứng yên chỉ đung đưa rất nhẹ (|rotZ| <= 0.021)', Math.abs(g.idleSway(1.0, 0).rotZ) <= 0.021);
check('đứng yên tay chỉ khẽ đưa (|arm| <= 0.061)', Math.abs(g.idleSway(1.0, 0).arm) <= 0.061);
check('mỗi người đung đưa lệch pha nhau', g.idleSway(1.0, 0).rotZ !== g.idleSway(1.0, 3).rotZ);
// applyWalkAnim trên hình nộm (không cần THREE)
const fakeMesh = { position: { y: 0 }, rotation: { y: 0, z: 0 } };
const fakeParts = {
  legL: { rotation: { x: 0 } }, legR: { rotation: { x: 0 } },
  armL: { rotation: { x: 0 } }, armR: { rotation: { x: 0 } }
};
let r = g.applyWalkAnim(fakeMesh, fakeParts, { moving: true, dt: 0.016, tNow: 0.2, targetYaw: 1.0, speed: 1.6, seed: 0 });
check('đang đi: mặt xoay dần về hướng đi (chưa tới đích ngay)', fakeMesh.rotation.y > 0 && fakeMesh.rotation.y < 1.0, 'yaw=' + fakeMesh.rotation.y);
check('đang đi: thân nhấp nhô', fakeMesh.position.y > 0, 'y=' + fakeMesh.position.y);
check('đang đi: chân vung theo nhịp', fakeParts.legL.rotation.x !== 0);
g.applyWalkAnim(fakeMesh, fakeParts, { moving: false, dt: 0.016, tNow: 1.0, seed: 0 });
check('đứng yên: hết nhấp nhô', fakeMesh.position.y === 0);
check('đứng yên: chân về 0', fakeParts.legL.rotation.x === 0);
check('đứng yên: thân khẽ nghiêng (đung đưa)', Math.abs(fakeMesh.rotation.z) <= 0.021);

// ---------- G. updateVillagers thật: dân làng đi có nhịp, đứng có đung đưa ----------
section('G. updateVillagers thật: đi thì nhấp nhô + xoay êm, đứng thì đung đưa');
resetState();
G.minutes = 330; // 05:30, bác Hai đang ở trước nhà h1
const hai = g.villagerMeshes['hai'];
const haiParts = g.villagerParts ? g.villagerParts['hai'] : null;
// Đặt bác Hai xa đích để buộc phải đi bộ về
hai.position.set(-10, 0, 0);
hai.rotation.y = 0;
g.updateVillagers(0.016, 0.2);
check('đi bộ: mặt xoay dần, chưa bẻ ngoặt tới đích ngay', hai.rotation.y > -2.1 && hai.rotation.y < 0, 'yaw=' + hai.rotation.y);
check('đi bộ: thân nhấp nhô giữa nhịp', hai.position.y > 0, 'y=' + hai.position.y);
check('đi bộ: chân vung theo nhịp', haiParts ? haiParts.legL.rotation.x !== 0 : true);
// Cho đi đủ lâu thì tới gần đích (không kẹt, không đứng yên giữa đường)
for (let i = 0; i < 600; i++) g.updateVillagers(0.05, 0.2 + i * 0.05);
const dxHai = hai.position.x - (-23.8), dzHai = hai.position.z - (-8);
check('đi đủ lâu thì bác Hai tới trước nhà', Math.hypot(dxHai, dzHai) < 1.0,
  'còn cách đích ' + Math.hypot(dxHai, dzHai).toFixed(2) + 'm tại (' + hai.position.x.toFixed(1) + ',' + hai.position.z.toFixed(1) + ')');
// Đứng tại đích: chân về 0, thân đung đưa nhẹ
g.updateVillagers(0.016, 5.0);
check('đứng tại đích: chân về 0', haiParts ? Math.abs(haiParts.legL.rotation.x) < 0.001 : true);
check('đứng tại đích: thân khẽ nghiêng (đung đưa)', Math.abs(hai.rotation.z) <= 0.021, 'rotZ=' + hai.rotation.z);

// ---------- H. Âm thanh mới: an toàn khi AC null, mức theo giờ/khoảng cách ----------
section('H. Âm thanh mới: AC null an toàn, dế + gió tre theo giờ/khoảng cách');
resetState();
// AC luôn null trong Node — mọi hàm tiếng mới phải là no-op, không ném lỗi
noThrow('sndTempleBell với AC null không lỗi', () => g.sndTempleBell());
noThrow('sndCricket với AC null không lỗi', () => g.sndCricket());
noThrow('sndCricket(vol lớn) với AC null không lỗi', () => g.sndCricket(0.05));
noThrow('initAmbient với AC null không lỗi', () => g.initAmbient());
check('initAmbient với AC null thì AMB chưa sẵn sàng', g.AMB.ready === false);
noThrow('updateAmbient với AMB chưa sẵn sàng không lỗi', () => g.updateAmbient(0.016));
noThrow('updateAmbient với soundOn=false không lỗi', () => { G.soundOn = false; g.updateAmbient(0.016); });
G.soundOn = false;
noThrow('sndTempleBell khi tắt tiếng không lỗi', () => g.sndTempleBell());
// Dế: 0 ban ngày, lên dần chiều tối, to hẳn 18:00
eq('dế: 12:00 mức 0', g.cricketLevel(720), 0);
eq('dế: 15:59 mức 0', g.cricketLevel(959), 0);
approx('dế: 17:00 mức ~0.5', g.cricketLevel(1020), 0.5, 0.01);
eq('dế: 18:00 mức 1', g.cricketLevel(1080), 1);
eq('dế: 19:00 mức 1', g.cricketLevel(1140), 1);
check('dế to dần đều theo chiều tối', g.cricketLevel(1020) < g.cricketLevel(1050) && g.cricketLevel(1050) < g.cricketLevel(1080));
// Gió rừng tre: to nhất trong rừng, hết ngoài 24m
eq('gió tre: đứng giữa rừng thì to nhất', g.bambooWindLevel(26, 14), 1);
eq('gió tre: cách tâm 6m vẫn to nhất', g.bambooWindLevel(26, 20), 1);
approx('gió tre: cách 12m còn ~2/3', g.bambooWindLevel(26, 26), 2 / 3, 0.01);
eq('gió tre: cách 24m thì hết', g.bambooWindLevel(26, 38), 0);
eq('gió tre: đứng giữa làng (xa rừng) thì hết', g.bambooWindLevel(0, 0), 0);
check('gió tre nhỏ dần theo khoảng cách', g.bambooWindLevel(26, 26) > g.bambooWindLevel(26, 32));
// Chuông chùa gắn vào thắp hương: E ở chùa vẫn +1 sao, không lỗi khi AC null
// (08:20 — bà Năm đã rời chùa về làm việc, không ai tranh mục tiêu với chùa)
resetState();
G.minutes = 500; G.templePrayedToday = false;
const starsBefore = G.stars;
player.x = g.TEMPLE_PRAY_SPOT.x; player.z = g.TEMPLE_PRAY_SPOT.z;
g.setCurrentTarget(g.findTarget());
noThrow('thắp hương ở chùa (kèm chuông chùa) không lỗi khi AC null', () => g.doInteract());
check('thắp hương vẫn +1 sao như cũ', G.stars === starsBefore + 1 && G.templePrayedToday === true);

// ---------- KẾT QUẢ ----------
console.log('\n================ KẾT QUẢ ================');
console.log('PASS: ' + pass + ' | FAIL: ' + fail);
if (fail > 0) { console.log('Các kiểm tra rớt: ' + failures.join(', ')); process.exit(1); }
console.log('Tất cả test đều đậu.');
