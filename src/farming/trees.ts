// @ts-nocheck
/*
 * GameGiaDinh — src/farming/trees.ts
 * GIAI ĐOẠN 2: cây ăn quả — 3 chỗ trồng ở góc sân, mua cây giống, trồng rồi
 * TƯỚI MỖI NGÀY: cây lớn thêm 1/growDays vào sáng hôm sau (xoài 5 ngày, ổi 4
 * ngày mới trưởng thành). Cây trưởng thành cần chăm tưới đủ fruitCycle ngày
 * (xoài 3 ngày, ổi 2 ngày) mới ra 1 đợt trái; trái chưa hái hết thì chưa ra
 * đợt mới. Không tưới thì cây đứng yên — không lớn, không ra trái. Hình dáng
 * cây tự vẽ lại theo trạng thái (đất trống / mầm / lớn / chín), giống cách
 * drawCrop làm. Cây cần nước có giọt nước xanh lơ lửng.
 */
import * as THREE from 'three';
import { G } from '../core/state';
import { FRUIT_TREES } from '../core/data';
import { scene, mat, box, block, ringGeo } from '../world/scene';
import { clearGroup, GEO, addMesh, sharedGeo } from './garden';

// 3 chỗ trồng cây: góc Đông-Nam, góc Đông gần ao, góc Tây gần chuồng trâu
export var TREE_SPOTS = [
  { x: 2.5, z: 12.3, label: "góc sân đông" },
  { x: 17.8, z: 10.8, label: "gần bờ ao" },
  { x: -13.8, z: 11.8, label: "góc sân tây" }
];
export var treeGroups = [];

var trunkM = mat(0x8a5f3c), leafM = mat(0x4d8a35), leafM2 = mat(0x6ba84f);
var mangoM = mat(0xf2a122), guavaM = mat(0x9fc24e);
var GEO_TRUNK = sharedGeo(new THREE.CylinderGeometry(0.10, 0.18, 1, 6));
var dropM = mat(0x3fa7e0);

(function buildTreeSpots() {
  TREE_SPOTS.forEach(function (s, i) {
    box(2.0, 0.12, 2.0, 0x5e4028, s.x, 0.06, s.z); // mô đất trồng
    block(s.x, s.z, 0.8); // mô đất cao, không đi xuyên qua được
    var g = new THREE.Group(); g.position.set(s.x, 0, s.z); scene.add(g); treeGroups.push(g);
    // vòng sáng dẫn người chơi tới chỗ có thể trồng
    var ring = new THREE.Mesh(ringGeo(0.85, 1.05, 20), mat(0xffe9a8, { transparent: true, opacity: 0.35 })); // PHASE 4.5: 3 vòng sáng dùng chung 1 geometry
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.14; g.add(ring);
    drawTree(i);
  });
})();

// Vẽ lại cây i theo trạng thái hiện tại của G.trees[i] (giữ lại vòng sáng ở con đầu)
export function drawTree(i) {
  var t = G.trees[i], g = treeGroups[i];
  if (!g) return;
  var ring = g.children[0];
  g.remove(ring); clearGroup(g); g.add(ring);
  if (!t.type) {
    ring.material.opacity = 0.35; ring.material.color.setHex(0xffe9a8);
    return;
  }
  var def = FRUIT_TREES[t.type];
  var fruitM = t.type === "xoai" ? mangoM : guavaM;
  if (t.state === "growing") {
    var h = 0.5 + t.progress * 1.6;
    addMesh(g, GEO_TRUNK, trunkM, 0, h / 2, 0, h); // thân non, cao dần theo progress
    var leafScale = 0.4 + t.progress * 0.9;
    var leaf = addMesh(g, GEO.bush, t.type === "xoai" ? leafM : leafM2, 0, h + 0.3, 0);
    leaf.scale.set(leafScale, leafScale * 0.8, leafScale);
    if (!t.watered) addMesh(g, GEO.dropBall, dropM, 0.55, h + 0.7, 0.1); // khát nước
    ring.material.opacity = 0;
  } else if (t.state === "mature") {
    addMesh(g, GEO_TRUNK, trunkM, 0, 1.15, 0, 2.3); // thân to
    var l1 = addMesh(g, GEO.bush, t.type === "xoai" ? leafM : leafM2, 0, 2.75, 0);
    l1.scale.set(1.7, 1.3, 1.7);
    var l2 = addMesh(g, GEO.bush, leafM, 0.95, 2.2, 0.35);
    l2.scale.set(1.1, 0.9, 1.1);
    var l3 = addMesh(g, GEO.bush, leafM2, -0.9, 2.3, -0.3);
    l3.scale.set(1.0, 0.85, 1.0);
    // trái treo trên cây — số quả = t.fruitReady
    for (var f = 0; f < t.fruitReady; f++) {
      var a = (f / 3) * Math.PI * 2 + 0.6;
      addMesh(g, GEO.fruitS, fruitM, Math.cos(a) * 1.05, 2.05 + (f % 2) * 0.35, Math.sin(a) * 1.05);
    }
    if (t.fruitReady > 0) { ring.material.opacity = 0.85; ring.material.color.setHex(0xffc94d); } // có trái chín: vòng vàng
    else ring.material.opacity = 0;
    if (!t.watered && t.fruitReady === 0) addMesh(g, GEO.dropBall, dropM, 0.55, 3.1, 0.1); // cây lớn cũng khát nước — không tưới thì không ra trái
  }
}

// Qua đêm: cây lớn thêm / ra trái mới theo số ngày đã tưới — logic tách riêng
// khỏi UI để test mô phỏng được (trả về danh sách sự kiện trong đêm).
export function overnightTrees() {
  var events = [];
  G.trees.forEach(function (t, ti) {
    if (!t.type) return;
    var def = FRUIT_TREES[t.type];
    if (t.state === "growing") {
      if (t.watered) {
        t.progress += 1 / def.growDays;
        if (t.progress >= 1) {
          t.progress = 1; t.state = "mature"; t.ripen = 0; t.fruitReady = 0;
          events.push({ kind: "matured", tree: ti, type: t.type });
        }
      }
      t.watered = false; drawTree(ti);
    } else if (t.state === "mature") {
      if (t.fruitReady === 0 && t.watered) {
        t.ripen = (t.ripen || 0) + 1;
        if (t.ripen >= def.fruitCycle) {
          t.fruitReady = def.fruitPerCycle; t.ripen = 0;
          events.push({ kind: "fruited", tree: ti, type: t.type, n: t.fruitReady });
        }
      }
      t.watered = false; drawTree(ti);
    }
  });
  return events;
}

// Tưới cây (đang lớn hoặc đã lớn, 1 lần/ngày) — trả về thông báo hoặc null
export function waterTree(i) {
  var t = G.trees[i];
  if (!t.type || (t.state !== "growing" && t.state !== "mature") || t.watered || G.can <= 0) return null;
  G.can--; t.watered = true; t.waterings++;
  G.wateredToday++;
  drawTree(i);
  var def = FRUIT_TREES[t.type];
  if (t.state === "growing")
    return "Tưới cây " + def.name + " — cây lớn thêm vào sáng mai (" + Math.round(t.progress * 100) + "%, đủ " + def.growDays + " ngày tưới là lớn)";
  var left = def.fruitCycle - (t.ripen || 0);
  return "Tưới cây " + def.name + " — cây được chăm, chăm đủ " + def.fruitCycle + " ngày thì ra " + def.fruitPerCycle + " " + def.fruitName.toLowerCase() + " (đã chăm " + (t.ripen || 0) + "/" + def.fruitCycle + " ngày)";
}

// Hái trái chín — trả về số trái hái được
export function harvestTree(i) {
  var t = G.trees[i];
  if (!t.type || t.state !== "mature" || t.fruitReady <= 0) return 0;
  var n = t.fruitReady;
  var def = FRUIT_TREES[t.type];
  G.produce[def.fruit] += n;
  G.fruitToday += n;
  t.fruitReady = 0;
  drawTree(i);
  return n;
}
