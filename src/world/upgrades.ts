// @ts-nocheck
/*
 * GameGiaDinh — src/world/upgrades.ts
 * GIAI ĐOẠN 2: đồ mua cho nhà — vẽ 3D và hiện/ẩn theo G.owned.
 *  - Tivi treo tường hiên (màn hình sáng lúc chập tối).
 *  - Tủ lạnh đứng cuối hiên.
 *  - Xe máy dựng ở góc sân trước nhà (đi nhanh hơn).
 *  - Sửa nhà: tường sơn mới + đèn lồng đỏ hai bên cửa.
 *  - Mở rộng chuồng gà: thêm ổ đẻ bên cạnh chuồng cũ (+3 trứng vịt gà hiển thị).
 * Tất cả nhóm đều xây sẵn 1 lần lúc tải game, ẩn đi, applyUpgrades() sẽ hiện
 * ra theo đồ đã mua — nên sau khi tải save cũ, đồ cũng hiện lại đúng.
 */
import * as THREE from 'three';
import { G } from '../core/state';
import { scene, mat, box, cyl, block, boxGeo, sphGeo, torusGeo } from '../world/scene';
import { GEO, addMesh } from '../farming/garden';

// Tọa độ trong hệ nhà (nhà ở (-11,-6), xoay 0.5) — cùng công thức với details.ts
function houseLocal(x, y, z) {
  var c = Math.cos(0.5), s = Math.sin(0.5);
  return new THREE.Vector3(-11 + x * c + z * s, y, -6 - x * s + z * c);
}

export var tvGroup, fridgeGroup, bikeGroup, coopExtGroup, repairGroup;
export var coopBlockAdded = false;

(function buildUpgradeItems() {
  /* ---- Tivi treo tường hiên, giữa cửa và cửa sổ ---- */
  var tv = new THREE.Group();
  var tvP = houseLocal(1.6, 1.5, 2.78);
  tv.position.copy(tvP); tv.rotation.y = 0.5;
  var tvBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.6, 0.08), mat(0x1a1a1a));
  tvBody.castShadow = true; tv.add(tvBody);
  var tvScreen = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.02),
    new THREE.MeshBasicMaterial({ color: 0x2c4a5e }));
  tvScreen.position.z = 0.05; tv.add(tvScreen);
  window.__tvScreen = tvScreen; // daylight.ts đổi màu màn hình lúc chập tối
  tv.visible = false; scene.add(tv); tvGroup = tv;

  /* ---- Tủ lạnh đứng cuối hiên, sát góc đông ---- */
  var fr = new THREE.Group();
  var frP = houseLocal(4.6, 0, 3.6);
  fr.position.copy(frP); fr.rotation.y = 0.5;
  var frBody = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.5, 0.6), mat(0xf2f2f2));
  frBody.position.y = 0.75; frBody.castShadow = true; fr.add(frBody);
  var frLine = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.03, 0.02), mat(0x9a9a9a));
  frLine.position.set(0, 0.95, 0.31); fr.add(frLine);
  var frHandle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35, 0.04), mat(0x6a6a6a));
  frHandle.position.set(0.22, 1.05, 0.32); fr.add(frHandle);
  fr.visible = false; scene.add(fr); fridgeGroup = fr;

  /* ---- Xe máy dựng ở góc sân trước nhà ---- */
  var bk = new THREE.Group();
  bk.position.set(-5.8, 0, -3.6); bk.rotation.y = -1.2;
  var wheelM = mat(0x1a1a1a), bodyM = mat(0xc0392b), chromeM = mat(0xb8b8b8);
  var wheelGeo = torusGeo(0.32, 0.07, 8, 16);
  [-0.55, 0.55].forEach(function (wx) {
    var w = new THREE.Mesh(wheelGeo, wheelM);
    w.position.set(wx, 0.32, 0); w.castShadow = true; bk.add(w);
  });
  var bbody = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.3, 0.22), bodyM);
  bbody.position.set(0, 0.55, 0); bbody.castShadow = true; bk.add(bbody);
  var seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.24), mat(0x2c2c2c));
  seat.position.set(-0.1, 0.74, 0); bk.add(seat);
  var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6), chromeM);
  bar.rotation.x = Math.PI / 2; bar.position.set(0.62, 0.85, 0); bk.add(bar);
  var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), mat(0xffe9a8));
  lamp.position.set(0.72, 0.62, 0); bk.add(lamp);
  bk.visible = false; scene.add(bk); bikeGroup = bk;

  /* ---- Mở rộng chuồng gà: ổ đẻ mới bên cạnh chuồng cũ (cùng kiểu ổ rơm) ---- */
  var ce = new THREE.Group();
  ce.position.set(-2.3, 0, 8.3);
  var ceNest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.32, 0.7), mat(0x8a5f3c));
  ceNest.position.y = 0.16; ceNest.castShadow = true; ce.add(ceNest);
  var ceStraw = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.55), mat(0xd9c07a));
  ceStraw.position.y = 0.36; ce.add(ceStraw);
  var ceRoof = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.07, 0.95), mat(0xb4552f));
  ceRoof.position.y = 0.95; ceRoof.rotation.x = 0.2; ce.add(ceRoof);
  [-0.55, 0.55].forEach(function (s) {
    var pp = new THREE.Mesh(boxGeo(0.08, 0.95, 0.08), mat(0x7a4a21));
    pp.position.set(s, 0.48, -0.3); ce.add(pp);
  });
  // 3 trứng mới trong ổ mở rộng — gộp vào danh sách trứng để refreshEggs() hiện đúng
  var eggM = mat(0xf7f2e6);
  [[-0.3, 0], [0.1, 0.12], [0.4, -0.08]].forEach(function (ep) {
    var em = addMesh(ce, GEO.fruitS, eggM, ep[0], 0.46, ep[1]);
    em.scale.set(0.65, 0.85, 0.65); em.visible = false;
    if (window.__eggMeshes) window.__eggMeshes.push(em);
  });
  ce.visible = false; scene.add(ce); coopExtGroup = ce;

  /* ---- Sửa nhà: đèn lồng đỏ hai bên cửa + chiếu mới ---- */
  var rp = new THREE.Group();
  [-0.6, 2.75].forEach(function (lx) {
    var p = houseLocal(lx, 2.3, 2.85);
    var lan = new THREE.Mesh(sphGeo(0.16, 10, 8), mat(0xd4573a));
    lan.position.copy(p); lan.scale.y = 1.2; rp.add(lan);
  });
  var mat2 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.6), mat(0xb03a2e));
  var mp = houseLocal(0.6, 0.12, 3.5); mat2.position.copy(mp); mat2.rotation.y = 0.5; rp.add(mat2);
  rp.visible = false; scene.add(rp); repairGroup = rp;
})();

// Hiện/ẩn đồ theo G.owned — gọi sau khi tải save và sau mỗi lần mua
export function applyUpgrades() {
  if (tvGroup) tvGroup.visible = !!G.owned.tv;
  if (fridgeGroup) fridgeGroup.visible = !!G.owned.fridge;
  if (bikeGroup) bikeGroup.visible = !!G.owned.bike;
  if (coopExtGroup) coopExtGroup.visible = !!G.owned.coopBig;
  if (repairGroup) repairGroup.visible = !!G.owned.houseFixed;
  // sơn lại tường khi sửa nhà xong
  if (window.__houseWalls) {
    window.__houseWalls.material.color.setHex(G.owned.houseFixed ? 0xffe9a8 : 0xffffff);
  }
  // chắn va chạm cho đồ mới đặt (chỉ thêm 1 lần)
  if (fridgeGroup && G.owned.fridge && !fridgeGroup.userData.blocked) {
    fridgeGroup.userData.blocked = true; block(-5.23, -5.04, 0.7);
  }
  if (bikeGroup && G.owned.bike && !bikeGroup.userData.blocked) {
    bikeGroup.userData.blocked = true; block(-5.8, -3.6, 0.9);
  }
  if (coopExtGroup && G.owned.coopBig && !coopBlockAdded) {
    coopBlockAdded = true; block(-2.3, 8.3, 0.8);
  }
}
