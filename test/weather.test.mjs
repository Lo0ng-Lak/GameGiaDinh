// Test thời tiết theo ngày + mùa (Phase 4.1) trong Node (không cần trình duyệt):
//  - nạp bundle test (game logic thật + stub three/DOM) rồi gọi thẳng các hàm
//    thật: seasonOf, rollWeather, startRain, weatherSummaryText, saveGame/
//    applySave, và nút "Ngày mới" thật.
// Chạy:  node test/weather.test.mjs
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
const { G, plots } = g;

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
function resetPlots() {
  plots.forEach(function (p) {
    p.state = 'empty'; p.type = null; p.progress = 0; p.watered = false;
    p.waterings = 0; p.dryT = 0; p._wilted = false;
  });
  G.trees.forEach(function (t) {
    t.type = null; t.state = 'empty'; t.progress = 0; t.watered = false;
    t.waterings = 0; t.ripen = 0; t.fruitReady = 0;
  });
}
function nextDay() {
  globalThis.document.getElementById('btn-next-day').fire('click');
}

// ---------- A. Mùa suy ra từ số ngày: chu kỳ 60 ngày, 30 mưa + 30 khô ----------
section('A. Mùa theo ngày (chu kỳ 60: ngày 1–30 mùa mưa, 31–60 mùa khô)');
resetState();
eq('ngày 1 là mùa mưa', g.seasonOf(1), 'rainy');
eq('ngày 30 vẫn mùa mưa', g.seasonOf(30), 'rainy');
eq('ngày 31 sang mùa khô', g.seasonOf(31), 'dry');
eq('ngày 60 vẫn mùa khô', g.seasonOf(60), 'dry');
eq('ngày 61 lặp lại mùa mưa', g.seasonOf(61), 'rainy');
eq('ngày 90 mùa mưa', g.seasonOf(90), 'rainy');
eq('ngày 91 mùa khô', g.seasonOf(91), 'dry');
eq('ngày 120 mùa khô', g.seasonOf(120), 'dry');
eq('ngày 121 mùa mưa', g.seasonOf(121), 'rainy');
eq('tên mùa mưa', g.seasonName('rainy'), 'Mùa mưa');
eq('tên mùa khô', g.seasonName('dry'), 'Mùa khô');

// ---------- B. Bốc thời tiết: ngưỡng xác suất từng mùa (ép Math.random) ----------
section('B. rollWeather: ngưỡng xác suất đúng từng mùa');
resetState();
Math.random = () => 0.0; G.day = 1;
eq('mùa mưa, r=0.00 -> mưa rào', g.rollWeather(), 'rain');
check('mưa rào tới buổi chiều (13:00–15:30)', G.rainAt >= 780 && G.rainAt < 930, 'rainAt=' + G.rainAt);
eq('mưa rào kéo dài 55', G.rainLen, 55);
check('ngày mưa có cờ rainToday', G.rainToday === true);
Math.random = () => 0.40; G.day = 1;
eq('mùa mưa, r=0.40 -> giông bão', g.rollWeather(), 'storm');
check('giông tới sớm hơn (11:00–14:00)', G.rainAt >= 660 && G.rainAt < 840, 'rainAt=' + G.rainAt);
eq('giông mưa lâu gấp đôi (110)', G.rainLen, 110);
Math.random = () => 0.60; G.day = 1;
eq('mùa mưa, r=0.60 -> nhiều mây', g.rollWeather(), 'cloudy');
check('ngày mây không mưa', G.rainToday === false && G.rainAt === Infinity);
Math.random = () => 0.99; G.day = 1;
eq('mùa mưa, r=0.99 -> nắng', g.rollWeather(), 'sunny');
check('ngày nắng không mưa', G.rainToday === false && G.rainAt === Infinity);
Math.random = () => 0.05; G.day = 40;
eq('mùa khô, r=0.05 -> vẫn mưa rào (hiếm)', g.rollWeather(), 'rain');
Math.random = () => 0.08; G.day = 40;
eq('mùa khô, r=0.08 -> giông bão (hiếm)', g.rollWeather(), 'storm');
Math.random = () => 0.20; G.day = 40;
eq('mùa khô, r=0.20 -> nhiều mây', g.rollWeather(), 'cloudy');
Math.random = () => 0.40; G.day = 40;
eq('mùa khô, r=0.40 -> nắng (mùa khô nắng nhiều)', g.rollWeather(), 'sunny');
Math.random = mulberry32(SEED);

// ---------- C. Phân phối: mùa mưa mưa nhiều hơn hẳn mùa khô ----------
section('C. Phân phối 1000 lần bốc (seed cố định): mùa mưa ~50%, mùa khô ~10%');
resetState();
function rainRate(day, n) {
  let wet = 0;
  for (let i = 0; i < n; i++) { G.day = day; const w = g.rollWeather(); if (w === 'rain' || w === 'storm') wet++; }
  return wet / n;
}
const rainyRate = rainRate(1, 1000);
const dryRate = rainRate(40, 1000);
console.log('  (mùa mưa: ' + (rainyRate * 100).toFixed(1) + '% ngày mưa/giông; mùa khô: ' + (dryRate * 100).toFixed(1) + '%)');
check('mùa mưa mưa/giông 40–60%', rainyRate >= 0.40 && rainyRate <= 0.60, 'tỉ lệ=' + rainyRate);
check('mùa khô mưa/giông 3–20%', dryRate >= 0.03 && dryRate <= 0.20, 'tỉ lệ=' + dryRate);
check('mùa mưa mưa nhiều hơn hẳn mùa khô', rainyRate > dryRate * 2);

// ---------- D. Mưa tưới miễn phí luống + cây; qua đêm rau lớn thêm ----------
section('D. Mưa rào tưới miễn phí luống rau + cây ăn quả');
resetState(); resetPlots();
plots[0].state = 'growing'; plots[0].type = 'cai'; plots[0].progress = 0.3; plots[0].watered = false;
plots[1].state = 'growing'; plots[1].type = 'cachua'; plots[1].progress = 0.5; plots[1].watered = false;
G.trees[0].type = 'xoai'; G.trees[0].state = 'growing'; G.trees[0].progress = 0.4; G.trees[0].watered = false;
G.weather = 'rain'; G.rainToday = true; G.rainAt = 800; G.rainLen = 55;
g.startRain();
check('mưa bắt đầu: cờ raining + rainedToday', G.raining === true && G.rainedToday === true);
check('luống 1 được tưới', plots[0].watered === true);
check('luống 2 được tưới', plots[1].watered === true);
check('cây xoài được tưới (mưa tính như tưới 1 lần)', G.trees[0].watered === true);
check('mưa không tốn nước giếng (can giữ nguyên)', G.can === 5);
const progBefore = plots[0].progress;
nextDay(); // qua đêm: luống đã tưới lớn thêm 0.25
check('qua đêm, luống được mưa tưới lớn thêm', plots[0].progress === Math.min(0.92, progBefore + 0.25), 'progress=' + plots[0].progress);

// ---------- E. Ngày nắng mùa khô: không mưa, không tưới miễn phí ----------
section('E. Ngày nắng mùa khô: không mưa, không tưới miễn phí');
resetState(); resetPlots();
Math.random = () => 0.99; G.day = 40;
eq('mùa khô bốc trúng nắng', g.rollWeather(), 'sunny');
eq('mùa hôm đó là mùa khô', G.season, 'dry');
plots[0].state = 'growing'; plots[0].type = 'cai'; plots[0].progress = 0.3; plots[0].watered = false;
G.trees[0].type = 'oi'; G.trees[0].state = 'growing'; G.trees[0].watered = false;
G.minutes = 900; // 15:00 — giờ mà ngày mưa đã mưa từ lâu
// Điều kiện mở mưa trong animate() của main.ts — ngày nắng phải sai:
check('điều kiện mở mưa sai (không mưa giữa chiều)', !(G.rainToday && !G.rainedToday && G.minutes >= G.rainAt));
check('luống vẫn khô, không được tưới chùa', plots[0].watered === false);
check('cây vẫn khô', G.trees[0].watered === false);
Math.random = mulberry32(SEED);

// ---------- F. Giông: thiệt hại vừa phải, tối đa 1 luống/ngày ----------
section('F. Giông bão: 30% quật ngã 1 luống rau chín, không mất hẳn');
resetState(); resetPlots();
plots[0].state = 'mature'; plots[0].type = 'cai'; plots[0].progress = 1;
plots[1].state = 'mature'; plots[1].type = 'bido'; plots[1].progress = 1;
plots[2].state = 'growing'; plots[2].type = 'ngo'; plots[2].progress = 0.4;
G.weather = 'storm'; G.rainToday = true; G.rainAt = 700; G.rainLen = 110;
Math.random = () => 0.05; // ép trúng 30% thiệt hại, nạn nhân là luống đầu
g.startRain();
check('giông đánh dấu đã xử lý 1 lần', G.stormDamaged === true);
check('có đúng 1 luống chín bị quật ngã', G.stormHit === true);
const damaged = plots.filter(p => p.state === 'growing' && p.progress === 0.5);
check('luống bị quật còn lớn dở 50% (không mất hẳn)', damaged.length === 1, 'số luống 50%=' + damaged.length);
check('luống còn lại vẫn chín nguyên', plots.filter(p => p.state === 'mature').length === 1);
check('luống đang lớn không bị giông chạm tới', plots[2].progress === 0.4);
g.startRain(); // gọi lại lần nữa trong ngày
check('gọi mưa lần 2 không quật thêm luống nào', plots.filter(p => p.state === 'mature').length === 1);
// Giông không trúng 30%: không thiệt hại
resetState(); resetPlots();
plots[0].state = 'mature'; plots[0].type = 'cai'; plots[0].progress = 1;
G.weather = 'storm'; G.rainToday = true; G.rainAt = 700; G.rainLen = 110;
Math.random = () => 0.9; // ép trượt 30%
g.startRain();
check('giông trượt 30% thì không luống nào bị quật', G.stormHit === false && plots[0].state === 'mature');
Math.random = mulberry32(SEED);

// ---------- G. Nút "Ngày mới" thật bốc thời tiết + HUD + tóm tắt ----------
section('G. Nút "Ngày mới" bốc thời tiết, HUD và tóm tắt hiện đúng');
resetState(); resetPlots();
const dayBefore = G.day;
nextDay();
eq('sang ngày mới', G.day, dayBefore + 1);
check('thời tiết hôm mới là 1 trong 4 loại', ['sunny', 'cloudy', 'rain', 'storm'].includes(G.weather), G.weather);
eq('mùa khớp với số ngày mới', G.season, g.seasonOf(G.day));
g.updateHUD();
const wxText = globalThis.document.getElementById('hud-wx').textContent;
check('HUD hiện thời tiết + mùa', wxText.includes(g.weatherName(G.weather)) && wxText.includes(g.seasonName(G.season)), 'hud-wx=' + wxText);
G.weather = 'rain'; G.season = 'rainy';
check('tóm tắt ngày mưa nhắc trời tưới', g.weatherSummaryText().includes('mưa rào') && g.weatherSummaryText().includes('Mùa mưa'));
G.weather = 'storm'; G.stormHit = true; G.season = 'dry';
check('tóm tắt ngày giông nhắc luống bị quật + mùa khô', g.weatherSummaryText().includes('Giông bão') && g.weatherSummaryText().includes('quật ngã') && g.weatherSummaryText().includes('Mùa khô'));
G.weather = 'sunny'; G.season = 'dry';
check('tóm tắt ngày nắng mùa khô', g.weatherSummaryText().includes('Nắng cả ngày') && g.weatherSummaryText().includes('Mùa khô'));
G.weather = 'cloudy';
check('tóm tắt ngày nhiều mây', g.weatherSummaryText().includes('nhiều mây'));

// ---------- H. Save/load: giữ thời tiết hôm nay; save cũ đọc được ----------
section('H. Save/load thời tiết + save cũ không có trường thời tiết');
resetState(); resetPlots();
G.day = 5; G.weather = 'rain'; G.rainToday = true; G.rainAt = 812; G.rainLen = 55;
g.saveGame();
const saved = g.readSave();
check('save ghi được thời tiết', saved.weather === 'rain' && saved.rainToday === true && saved.rainAt === 812, JSON.stringify({ w: saved.weather, r: saved.rainToday, at: saved.rainAt }));
G.weather = 'sunny'; G.rainToday = false; G.rainAt = Infinity; G.rainLen = 55;
g.applySave(saved);
eq('tải lại giữ đúng thời tiết hôm đó', G.weather, 'rain');
check('tải lại giữ cờ mưa + giờ mưa', G.rainToday === true && G.rainAt === 812);
eq('tải lại giữ độ dài mưa', G.rainLen, 55);
// Ngày nắng: rainAt lưu thành null (Infinity không đi vào JSON được)
resetState();
G.day = 40; G.weather = 'sunny'; G.rainToday = false; G.rainAt = Infinity;
g.saveGame();
const savedSunny = g.readSave();
check('save ngày nắng ghi rainAt null', savedSunny.rainAt === null && savedSunny.weather === 'sunny');
G.weather = 'rain'; G.rainToday = true; G.rainAt = 800;
g.applySave(savedSunny);
eq('tải save ngày nắng: thời tiết nắng', G.weather, 'sunny');
check('tải save ngày nắng: không mưa, rainAt Infinity', G.rainToday === false && G.rainAt === Infinity);
eq('mùa sau khi tải save ngày 40 là mùa khô', G.season, 'dry');
// Save cũ Phase 2/3 (không có weather/rainToday/rainAt/rainLen) vẫn đọc được
resetState();
const oldSave = JSON.parse(JSON.stringify(g.readSave() || {}));
if (!oldSave || Object.keys(oldSave).length === 0) {
  G.day = 12; g.saveGame();
  Object.assign(oldSave, g.readSave());
}
delete oldSave.weather; delete oldSave.rainToday; delete oldSave.rainAt; delete oldSave.rainLen;
oldSave.day = 12;
G.weather = 'storm'; G.rainToday = true; G.rainAt = 700;
g.applySave(oldSave);
eq('save cũ: mặc định nắng', G.weather, 'sunny');
check('save cũ: không mưa', G.rainToday === false && G.rainAt === Infinity);
eq('save cũ ngày 12: mùa vẫn tính đúng là mùa mưa', G.season, 'rainy');

// ---------- KẾT QUẢ ----------
console.log('\n================ KẾT QUẢ ================');
console.log('PASS: ' + pass + ' | FAIL: ' + fail);
if (fail > 0) { console.log('Các kiểm tra rớt: ' + failures.join(', ')); process.exit(1); }
console.log('Tất cả test đều đậu.');
