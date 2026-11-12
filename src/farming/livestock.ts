// @ts-nocheck
/*
 * GameGiaDinh — src/farming/livestock.ts
 * GIAI ĐOẠN 2: vật nuôi mới ngoài gà —
 *  - Đàn vịt (3 con) ở bờ ao: mua ở sạp, cho ăn cám → vài chục giây sau đẻ 2–3 trứng vịt ở ổ.
 *  - Lợn con trong chuồng lợn (góc tây sân): mua lợn con, cho ăn mỗi ngày,
 *    ăn đủ 7 ngày thì lớn, bán 120.000đ/con. Tốn 5.000đ cám/con mỗi ngày,
 *    tính ra lãi 25.000đ/con sau 1 tuần. Cần mua chuồng lợn trước.
 * Hình dáng vẽ bằng khối đơn giản giống đàn gà có sẵn, đặt gần ao / góc sân.
 */
import * as THREE from 'three';
import { G } from '../core/state';
import { LIVESTOCK } from '../core/data';
import { scene, mat, box, cyl, sph, block, boxGeo } from '../world/scene';
import { GEO, addMesh } from './garden';

// Vị trí ổ vịt ở bờ ao (cách mép nước ~3.6m, không chắn đường đi)
export var DUCK_POS = { x: 17.8, z: 5.8, interact: { x: 17.0, z: 6.6 } };
// Chuồng lợn ở góc tây sân, cách chuồng trâu ~3.6m
export var PIG_POS = { x: -18.5, z: 9.5, interact: { x: -16.9, z: 9.5 } };

export var duckGroup = null, duckEggMeshes = [], duckBirds = [];
export var pigGroup = null, pigMeshes = [];

var duckBodyM = mat(0x8f8f8f), duckHeadM = mat(0x5f6b4a), beakM = mat(0xe08a2e);
var eggM = mat(0xf2e8d5), pigM = mat(0xf0a8b8), pigM2 = mat(0xe08a9a);

(function buildLivestock() {
  /* ---- Ổ vịt ở bờ ao ---- */
  var dg = new THREE.Group(); dg.position.set(DUCK_POS.x, 0, DUCK_POS.z); scene.add(dg); duckGroup = dg;
  box(1.4, 0.15, 1.4, 0x8a6b45, DUCK_POS.x, 0.08, DUCK_POS.z); // ổ rơm
  // 3 con vịt — ẩn cho đến khi mua
  for (var d = 0; d < 3; d++) {
    var b = new THREE.Group();
    b.position.set(DUCK_POS.x + (d - 1) * 0.8, 0, DUCK_POS.z + (d % 2) * 0.5 - 0.25);
    var body = addMesh(b, GEO.bush, duckBodyM, 0, 0.35, 0); body.scale.set(0.55, 0.45, 0.8);
    addMesh(b, GEO.ballLeaf, duckHeadM, 0, 0.62, 0.32);
    addMesh(b, GEO.fruitS, beakM, 0, 0.58, 0.5);
    b.visible = false; scene.add(b); duckBirds.push(b);
  }
  // trứng vịt trong ổ
  for (var e = 0; e < 3; e++) {
    var em = addMesh(dg, GEO.fruitS, eggM, -0.35 + e * 0.35, 0.22, 0.2);
    em.scale.set(1.0, 1.3, 1.0); em.visible = false; duckEggMeshes.push(em);
  }
  // vịt bơi trang trí vẫn ở ao như cũ (không đụng vào)

  /* ---- Chuồng lợn ở góc sân tây (ẩn cho đến khi mua) ---- */
  var pg = new THREE.Group(); pg.position.set(PIG_POS.x, 0, PIG_POS.z); scene.add(pg); pigGroup = pg;
  pg.visible = false;
  var fenceM = mat(0x8a5f3c), troughM = mat(0x6b4a29);
  function penBox(w, h, d, x, y, z) {
    var m = new THREE.Mesh(boxGeo(w, h, d), fenceM);
    m.position.set(x, y, z); m.castShadow = true; pg.add(m); return m;
  }
  // hàng rào chuồng: 2 cạnh dài + 2 cạnh ngắn + 4 cọc góc
  penBox(2.8, 0.08, 0.08, 0, 0.7, -1.2); penBox(2.8, 0.08, 0.08, 0, 0.7, 1.2);
  penBox(0.08, 0.08, 2.4, -1.4, 0.7, 0); penBox(0.08, 0.08, 2.4, 1.4, 0.7, 0);
  penBox(0.1, 0.9, 0.1, -1.4, 0.45, -1.2); penBox(0.1, 0.9, 0.1, 1.4, 0.45, -1.2);
  penBox(0.1, 0.9, 0.1, -1.4, 0.45, 1.2); penBox(0.1, 0.9, 0.1, 1.4, 0.45, 1.2);
  // 2 máng ăn bằng gỗ
  var tr1 = new THREE.Mesh(boxGeo(1.1, 0.25, 0.5), troughM);
  tr1.position.set(-0.6, 0.13, -0.9); tr1.castShadow = true; pg.add(tr1);
  var tr2 = new THREE.Mesh(boxGeo(1.1, 0.25, 0.5), troughM);
  tr2.position.set(0.6, 0.13, 0.9); tr2.castShadow = true; pg.add(tr2);
  // 2 con lợn — ẩn cho đến khi mua, lớn dần theo growDays
  for (var p = 0; p < 2; p++) {
    var pig = new THREE.Group();
    pig.position.set(p === 0 ? -0.6 : 0.6, 0, p === 0 ? 0.4 : -0.4);
    var pb = addMesh(pig, GEO.bush, p === 0 ? pigM : pigM2, 0, 0.55, 0); pb.scale.set(1.1, 0.8, 1.5);
    addMesh(pig, GEO.ballLeaf, p === 0 ? pigM : pigM2, 0, 0.85, 0.75);
    addMesh(pig, GEO.fruitS, mat(0xd97a8a), 0, 0.8, 0.95); // mũi
    pig.scale.set(0.6, 0.6, 0.6); // lợn con nhỏ, lớn dần
    pig.visible = false; pg.add(pig); pigMeshes.push(pig);
  }
  pigGroup.visible = false;
})();

// Gà đẻ bao nhiêu trứng — chuồng mở rộng thì đẻ nhiều hơn
export function chickenLayCount() {
  return G.owned.coopBig ? 5 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 3);
}

// Hiện/ẩn trứng vịt trong ổ theo G.ducks.ready
export function refreshDuckEggs() {
  duckEggMeshes.forEach(function (e, i) { e.visible = G.ducks.owned && i < G.ducks.ready; });
  duckBirds.forEach(function (b) { b.visible = G.ducks.owned; });
}

export var pigBlockAdded = false;

// Hiện/ẩn lợn theo G.pigs (số con, độ lớn)
export function refreshPigs() {
  pigMeshes.forEach(function (pig, i) {
    var show = G.owned.pigpen && i < G.pigs.count;
    pig.visible = show;
    if (show) {
      var grown = i < G.pigs.grown; // con đã lớn to hơn
      var s = grown ? 1.1 : 0.6 + Math.min(0.4, (G.pigs.days[i] || 0) / LIVESTOCK.piglet.growDays * 0.4);
      pig.scale.set(s, s, s);
    }
  });
  // chuồng lợn chỉ vẽ khi đã mua — kèm chắn va chạm từ lúc đó
  pigGroup.visible = G.owned.pigpen;
  if (G.owned.pigpen && !pigBlockAdded) { pigBlockAdded = true; block(PIG_POS.x, PIG_POS.z, 1.6); }
}

// Cho vịt ăn — trả về thông báo hoặc null
export function feedDucks() {
  if (!G.ducks.owned || G.ducks.fed || G.money < LIVESTOCK.duckFlock.feed) return null;
  G.money -= LIVESTOCK.duckFlock.feed;
  G.spentToday += LIVESTOCK.duckFlock.feed;
  G.ducks.fed = true;
  G.ducks.timer = 26 + Math.random() * 10; // ~26–36s sau đẻ trứng
  refreshDuckEggs();
  return "Cho vịt ăn cám hết 4.000đ — vịt no rồi, lát nữa ra ổ xem trứng";
}

// Nhặt trứng vịt — trả về số trứng
export function collectDuckEggs() {
  if (!G.ducks.owned || G.ducks.ready <= 0) return 0;
  var n = G.ducks.ready;
  G.produce.trungvit += n;
  G.duckEggsToday += n;
  G.ducks.ready = 0;
  refreshDuckEggs();
  return n;
}

// Cho lợn ăn — trả về thông báo hoặc null. Mỗi con lợn có tiến độ riêng
// (days[i]): cho ăn đủ growDays (7) hôm thì con đó lớn. Lợn chưa lớn mà bỏ
// đói 1 hôm thì hôm đó không tính — phải cho ăn đều cả tuần mới lớn được.
export function feedPigs() {
  if (!G.owned.pigpen || G.pigs.count <= 0 || G.pigs.fedToday) return null;
  var cost = LIVESTOCK.piglet.feed * G.pigs.count;
  if (G.money < cost) return null;
  G.money -= cost;
  G.spentToday += cost;
  G.pigs.fedToday = true;
  var started = G.pigs.grown;
  for (var i = started; i < G.pigs.count; i++) {
    G.pigs.days[i] = (G.pigs.days[i] || 0) + 1;
    if (G.pigs.days[i] >= LIVESTOCK.piglet.growDays) G.pigs.grown++;
  }
  refreshPigs();
  var youngest = G.pigs.count > G.pigs.grown ? (G.pigs.days[G.pigs.grown] || 0) : LIVESTOCK.piglet.growDays;
  return "Cho lợn ăn hết " + (cost).toLocaleString("vi-VN") + "đ — lợn đang lớn dần (" + G.pigs.grown + "/" + G.pigs.count + " con lớn, con nhỏ nhất đã ăn " + youngest + "/" + LIVESTOCK.piglet.growDays + " hôm)";
}

// Bán 1 con lợn đã lớn — trả về số tiền hoặc 0. Lợn lớn là những con đầu
// trong days[] (đã đủ ngày ăn), bán con lớn nhất đầu tiên, con đang lớn giữ
// nguyên tiến độ của nó.
export function sellGrownPig() {
  if (!G.owned.pigpen || G.pigs.grown <= 0) return 0;
  G.pigs.grown--;
  G.pigs.count--;
  G.pigs.days.splice(0, 1);
  var price = LIVESTOCK.piglet.sell;
  G.money += price;
  G.totalEarned += price;
  G.earnedToday += price;
  G.pigsSoldToday++;
  refreshPigs();
  return price;
}
