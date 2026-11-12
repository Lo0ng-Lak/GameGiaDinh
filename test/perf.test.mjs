// Test hiệu năng PC (Phase 4.5) trong Node (không cần trình duyệt):
//  - đo lại cảnh bằng traversal thật (vật liệu / hình học / đèn / đổ bóng)
//  - vật liệu + hình học dùng chung đúng như thiết kế, vật liệu bị đổi màu
//    riêng (buồng chuối, vòng sáng cây, tường nhà) KHÔNG bị dùng chung nhầm
//  - tầng chất lượng (phân giải + bản đồ bóng) đúng ngưỡng
//  - hạt hiệu ứng bỏ qua vòng quét khi không có hạt sống
//  - HUD + thẻ nhiệm vụ chỉ ghi DOM khi giá trị đổi
//  - rau trên luống không đổ bóng nữa, cây ăn quả vẫn đổ bóng
// Chạy:  node test/perf.test.mjs
// (tự build lại bundle trước khi chạy; cần `npm install` trước lần đầu)
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(TEST_DIR, '..');
const BUNDLE = '/tmp/game-test-bundle.cjs';

execSync(`node ${path.join(TEST_DIR, 'build-bundle.mjs')} ${BUNDLE}`, { cwd: ROOT, stdio: 'inherit' });

const { installDomStubs } = await import('./dom-stub.mjs');
const { localStorage } = installDomStubs();
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
const { G } = g;

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; failures.push(name); console.log('  FAIL  ' + name + (detail ? ' — ' + detail : '')); }
}
function eq(name, a, b) { check(name, JSON.stringify(a) === JSON.stringify(b), 'nhận ' + JSON.stringify(a) + ', muốn ' + JSON.stringify(b)); }
function section(title) { console.log('\n' + title); }

const freshG = JSON.parse(JSON.stringify(G));

// Đếm cảnh bằng traversal thật (three-stub giữ children/material/geometry)
function measureScene() {
  const c = { objects: 0, mesh: 0, pointLights: 0, dirLights: 0, hemiLights: 0, castShadow: 0 };
  const mats = new Set(), geos = new Set();
  g.scene.traverse((o) => {
    c.objects++;
    const kind = o.constructor && o.constructor.name;
    if (kind === 'Mesh' || kind === 'InstancedMesh') c.mesh++;
    if (kind === 'PointLight') c.pointLights++;
    if (kind === 'DirectionalLight') c.dirLights++;
    if (kind === 'HemisphereLight') c.hemiLights++;
    if (o.castShadow) c.castShadow++;
    if (o.material) mats.add(o.material);
    if (o.geometry) geos.add(o.geometry);
  });
  c.distinctMaterials = mats.size;
  c.distinctGeometries = geos.size;
  c.blockers = g.blockers.length;
  return c;
}
// Số vật liệu Lambert trơn (không map) khác nhau cho 1 màu — dùng chung thì đúng 1
function distinctPlainLambert(hex) {
  const s = new Set();
  g.scene.traverse((o) => {
    const m = o.material;
    if (m && m.constructor && m.constructor.name === 'MeshLambertMaterial' && !m.map
        && m.color && m.color.hex === hex) s.add(m);
  });
  return s.size;
}

// ================= A. Số đo cảnh sau tối ưu =================
section('A. Số đo cảnh sau tối ưu (đo trước tối ưu: 651 vật liệu, 1.088 hình học)');
const m0 = measureScene();
console.log('  measured: ' + JSON.stringify(m0));
eq('cảnh giữ nguyên 1.420 vật', m0.objects, 1420);
eq('cảnh giữ nguyên 1.215 mesh', m0.mesh, 1215);
eq('đèn giữ nguyên: 4 PointLight', m0.pointLights, 4);
eq('đèn giữ nguyên: 1 DirectionalLight', m0.dirLights, 1);
eq('đèn giữ nguyên: 1 HemisphereLight', m0.hemiLights, 1);
eq('vòng chặn giữ nguyên 44', m0.blockers, 44);
eq('đổ bóng nền giữ nguyên 297 (vườn đang trống)', m0.castShadow, 297);
check('vật liệu khác nhau giảm mạnh (< 300, trước 651)', m0.distinctMaterials < 300, 'nhận ' + m0.distinctMaterials);
check('hình học khác nhau giảm mạnh (< 500, trước 1.088)', m0.distinctGeometries < 500, 'nhận ' + m0.distinctGeometries);
check('matCache có vật liệu dùng chung', g.matCacheSize() >= 30, 'nhận ' + g.matCacheSize());
check('geoCache có hình học dùng chung', g.geoCacheSize() >= 30, 'nhận ' + g.geoCacheSize());

// ================= B. Vật liệu dùng chung đúng chỗ, không dùng nhầm =================
section('B. Vật liệu + hình học dùng chung (không dùng nhầm chỗ bị đổi màu riêng)');
eq('màu cọc rào 0xb59a5e chỉ còn 1 vật liệu trơn', distinctPlainLambert(0xb59a5e), 1);
eq('màu gỗ 0x7a4a21 chỉ còn 1 vật liệu trơn', distinctPlainLambert(0x7a4a21), 1);
eq('màu nâu đậm 0x5a3a22 chỉ còn 1 vật liệu trơn', distinctPlainLambert(0x5a3a22), 1);
eq('màu nón lá 0xd6b26a chỉ còn 1 vật liệu trơn', distinctPlainLambert(0xd6b26a), 1);
// Buồng chuối: hái xong/hái rồi đổi màu từng buồng riêng nên KHÔNG được dùng chung
const bananas = globalThis.window.__bananas;
check('đủ 4 buồng chuối', bananas && bananas.length === 4, 'nhận ' + (bananas && bananas.length));
check('4 buồng chuối dùng 4 vật liệu riêng (đổi màu từng buồng)', bananas && bananas[0].mat !== bananas[1].mat
  && bananas[1].mat !== bananas[2].mat && bananas[2].mat !== bananas[3].mat);
// Vòng sáng 3 mô đất trồng cây: đổi màu/độ mờ theo trạng thái từng cây nên riêng
const rings = g.treeGroups.map((tg) => tg.children[0].material);
check('3 vòng sáng cây ăn quả dùng 3 vật liệu riêng', rings[0] !== rings[1] && rings[1] !== rings[2]);
// Tường nhà chính: sơn lại khi sửa nhà nên KHÔNG được dùng chung với tường trường
let schoolWallsMat = null;
g.scene.traverse((o) => {
  if (o.position && o.position.x === 25 && o.position.z === -16.5 && o.children && o.children[0])
    schoolWallsMat = o.children[0].material;
});
check('tường nhà chính khác vật liệu tường trường (sơn nhà không sơn luôn trường)',
  globalThis.window.__houseWalls && schoolWallsMat && globalThis.window.__houseWalls.material !== schoolWallsMat);
// box()/cyl()/sph() dùng chung geometry theo kích thước
const gs0 = g.geoCacheSize();
const b1 = g.box(1, 1, 1, 0xffffff, 200, 0, 200);
const b2 = g.box(1, 1, 1, 0xffffff, 202, 0, 200);
check('box() 2 lần cùng cỡ dùng chung 1 geometry', b1.geometry === b2.geometry);
check('box() lần 2 không thêm geometry mới', g.geoCacheSize() === gs0 || g.geoCacheSize() === gs0 + 1);
const c1 = g.cyl(0.5, 0.5, 1, 0xffffff, 204, 0, 200);
const c2 = g.cyl(0.5, 0.5, 1, 0xffffff, 206, 0, 200);
check('cyl() 2 lần cùng cỡ dùng chung 1 geometry', c1.geometry === c2.geometry);
const sp1 = g.sph(0.5, 0xffffff, 208, 0, 200);
const sp2 = g.sph(0.5, 0xffffff, 210, 0, 200);
check('sph() 2 lần cùng cỡ dùng chung 1 geometry', sp1.geometry === sp2.geometry);

// ================= C. Tầng chất lượng =================
section('C. Tầng chất lượng: phân giải + bản đồ bóng');
eq('số tầng bóng = số tầng phân giải', g.SHADOW_SIZES.length, g.PR_STEPS.length);
eq('tầng 0: bóng 2048', g.shadowSizeForLevel(0), 2048);
eq('tầng 1: bóng 1536', g.shadowSizeForLevel(1), 1536);
eq('tầng 5: bóng 768', g.shadowSizeForLevel(5), 768);
eq('quá tầng thì kẹp ở 768', g.shadowSizeForLevel(99), 768);
eq('âm thì kẹp ở 2048', g.shadowSizeForLevel(-1), 2048);
check('bóng nhỏ dần theo tầng (máy yếu -> bóng rẻ hơn)',
  [0, 1, 2, 3, 4, 5].every((i, ix, a) => ix === 0 || g.shadowSizeForLevel(i) <= g.shadowSizeForLevel(a[ix - 1])));
g.applyQualityLevel(2);
eq('tầng 2 ghi đúng level', g.qualityState.level, 2);
eq('tầng 2 ghi đúng bóng 1280', g.qualityState.shadowSize, 1280);
eq('tầng 2 ghi đúng phân giải (dpr stub = 1)', g.qualityState.pixelRatio, 1);
g.applyQualityLevel(99);
eq('tầng 99 kẹp về tầng 5', g.qualityState.level, 5);
eq('tầng 5 bóng 768', g.qualityState.shadowSize, 768);
g.applyQualityLevel(0);
eq('về tầng 0: bóng 2048', g.qualityState.shadowSize, 2048);

// ================= D. Hạt hiệu ứng =================
section('D. Hạt hiệu ứng: bỏ qua vòng quét khi không có hạt sống');
eq('ban đầu không có hạt sống', g.pAlive, 0);
g.spawnParticles(0, 1, 0, 5, 0xff0000, 1, 2, 1, 9.8);
eq('tạo 5 hạt -> sống 5', g.pAlive, 5);
for (let i = 0; i < 200; i++) g.updateParticles(0.016);
eq('hạt chết hết sau khi bay xong', g.pAlive, 0);
g.pGeo.attributes.position.needsUpdate = false;
g.updateParticles(0.016);
check('không hạt sống thì không chạm buffer (needsUpdate vẫn false)',
  g.pGeo.attributes.position.needsUpdate === false && g.pAlive === 0);
g.spawnParticles(0, 1, 0, 345, 0xff0000, 1, 2, 2, 9.8);
check('tạo quá cỡ thì số hạt sống kẹp ở PMAX 340', g.pAlive === 340, 'nhận ' + g.pAlive);
for (let i = 0; i < 400; i++) g.updateParticles(0.016);
eq('sau đó hạt vẫn chết hết đúng số', g.pAlive, 0);

// ================= E. HUD + thẻ nhiệm vụ chỉ ghi khi đổi =================
section('E. HUD + thẻ nhiệm vụ: chỉ ghi DOM khi giá trị đổi');
G.quests = []; G.started = true; G.dayOver = false;
g.updateHUD();
let hw = g.hudWriteStats(), qw = g.questCardWriteStats();
const w1 = hw.writes, s1 = hw.skipped, q1 = qw.writes, qs1 = qw.skipped;
g.updateHUD();
hw = g.hudWriteStats(); qw = g.questCardWriteStats();
check('gọi updateHUD lần 2 không đổi gì thì không ghi thêm text', hw.writes === w1, 'ghi thêm ' + (hw.writes - w1));
check('gọi lần 2 thì số lần bỏ qua tăng', hw.skipped > s1);
check('thẻ nhiệm vụ lần 1 ghi 1 lần', q1 === 1, 'nhận ' + q1);
check('thẻ nhiệm vụ lần 2 không ghi lại', qw.writes === q1 && qw.skipped > qs1);
G.money += 1000;
g.updateHUD();
hw = g.hudWriteStats();
check('đổi tiền thì chỉ ghi đúng 1 ô (hud-money)', hw.writes === w1 + 1, 'ghi thêm ' + (hw.writes - w1));
G.quests = [freshG.quests[0]];
g.updateHUD();
qw = g.questCardWriteStats();
check('thêm 1 nhiệm vụ thì thẻ nhiệm vụ ghi lại 1 lần', qw.writes === q1 + 1, 'nhận ' + qw.writes);
g.updateHUD();
qw = g.questCardWriteStats();
check('nhiệm vụ không đổi thì thẻ không ghi lại', qw.writes === q1 + 1);

// ================= F. Rau không đổ bóng, cây ăn quả vẫn đổ bóng =================
section('F. Bóng đổ: rau trên luống tắt, cây ăn quả + đất giữ nguyên');
// Trồng kín 12 luống rau chín rồi đếm mesh đổ bóng trong luống
let cropMeshes = 0, cropCasters = 0;
g.plots.forEach((p) => {
  p.state = 'mature'; p.type = 'cai'; p.progress = 1; p.watered = true;
  g.drawCrop(p);
  p.cropGroup.children.forEach((m) => { cropMeshes++; if (m.castShadow) cropCasters++; });
  p.markGroup.children.forEach((m) => { cropMeshes++; if (m.castShadow) cropCasters++; });
});
console.log('  crop meshes (12 luống chín): ' + cropMeshes + ', casters: ' + cropCasters);
check('không còn mesh rau nào đổ bóng', cropCasters === 0, 'còn ' + cropCasters + ' mesh');
check('rau vẫn vẽ đủ mesh (' + cropMeshes + ' mesh 12 luống)', cropMeshes >= 100, 'nhận ' + cropMeshes);
check('đất luống vẫn đổ bóng + nhận bóng', g.plots[0].soil.castShadow === true);
// Cây ăn quả trưởng thành vẫn đổ bóng
const t0 = G.trees[0];
t0.type = 'xoai'; t0.state = 'mature'; t0.fruitReady = 2; t0.watered = true; t0.progress = 1; t0.ripen = 0; t0.waterings = 3;
g.drawTree(0);
let treeCasters = 0;
g.treeGroups[0].children.forEach((m, i) => { if (i > 0 && m.castShadow) treeCasters++; });
check('cây xoài trưởng thành vẫn đổ bóng', treeCasters > 0, 'nhận ' + treeCasters);
check('vòng sáng cây có trái chín: mờ 0.85', g.treeGroups[0].children[0].material.opacity === 0.85);

// ================= G. Kính cửa sổ + đầu gà + đuôi trâu (không tìm lại mỗi khung) =================
section('G. Tra cứu đã cache: kính cửa sổ, đầu gà, đuôi trâu');
check('giữ sẵn 2 ô kính cửa sổ', g.windowGlass.length === 2, 'nhận ' + g.windowGlass.length);
let traversals = 0;
const origTraverse = g.scene.traverse.bind(g.scene);
g.scene.traverse = (fn) => { traversals++; return origTraverse(fn); };
G.minutes = 1110; // 18:30, hoàng hôn — updateSky đổi màu kính
g.updateSky();
g.scene.traverse = origTraverse;
check('updateSky không duyệt toàn scene nữa', traversals === 0, 'duyệt ' + traversals + ' lần');
check('đủ 5 con gà', g.chickens.length === 5);
check('đầu gà giữ sẵn trong userData (khớp getObjectByName)',
  g.chickens.every((c) => c.userData.head && c.userData.head === c.getObjectByName('head')));
check('đuôi trâu giữ sẵn ở window.__buffaloTail', !!globalThis.window.__buffaloTail);

// ================= Tổng kết =================
console.log('\n==== KẾT QUẢ: ' + pass + ' đậu, ' + fail + ' rớt ====');
if (fail > 0) { console.log('Rớt: ' + failures.join(', ')); process.exit(1); }
