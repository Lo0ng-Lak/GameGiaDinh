// @ts-nocheck
/*
 * GameGiaDinh — src/world/village.ts
 * GIAI ĐOẠN 3: mở rộng làng — chợ (3 sạp), tiệm tạp hóa, trường mở rộng
 * (lớp học thứ hai, ghế đá, cây to, hàng rào sân trường), 2 nhà hàng xóm.
 * Chợ nằm dọc bờ bắc đường làng, đối diện trường; tiệm tạp hóa ở đầu chợ.
 * Tọa độ khớp với bản đồ có sẵn: đường làng z=-14, sạp cô Tư (9,-11.6),
 * trường (25,-16.5), cổng (21.5,-13.2), nhà mình (-11,-6).
 */
import * as THREE from 'three';
import { mat, block, scene, texMat, woodTex, plasterTex, tree } from './scene';

// ---- Vị trí cố định của làng (dùng chung cho NPC, tương tác, chợ) ----
export var MARKET_STALLS = [
  { x: -6, z: -11.5, vendor: "ba",  label: "Sạp rau cô Ba" },
  { x: -2, z: -11.5, vendor: "lan", label: "Sạp trái cây chị Lan" },
  { x: 2,  z: -11.5, vendor: "duc", label: "Sạp đồ khô anh Đức" }
];
// Chỗ đứng để nói chuyện với người bán: phía nam sạp, hướng ra đường.
// +1.65m để đứng NGOÀI vòng chặn của sạp (r=1.5) — trước đây +1.3m nên
// người bán đứng lọt trong vòng chặn, đi lại phải trượt ra mép mỗi lần.
export function stallFront(s) { return { x: s.x, z: s.z + 1.65 }; }
export var GROCERY_POS = { x: -12, z: -12 };
export var GROCERY_FRONT = { x: -12, z: -9.8 };
export var HOUSE_POS = { h1: { x: -22, z: -11 }, h2: { x: -22, z: -17.5 } };
// Chỗ đứng "ở nhà" của dân làng: TRƯỚC CỬA nhà (cửa quay về phía nam),
// mỗi người một điểm riêng cách nhau 1,2m — trước đây cả 3 người chung
// 1 điểm nên chồng lên nhau lúc 05:30. h1: bác Hai [0], bà Năm [1],
// anh Đức [2]; h2: cô Ba [0], chị Lan [1], cô giáo [2]. Mỗi điểm cách
// tâm nhà ~3m — ngoài vòng chặn nhà (r=2.5).
export var HOUSE_FRONT = {
  h1: [{ x: -23.8, z: -8 }, { x: -22.6, z: -8 }, { x: -21.4, z: -8 }],
  h2: [{ x: -23.8, z: -14.5 }, { x: -22.6, z: -14.5 }, { x: -21.4, z: -14.5 }]
};
export var SCHOOL_YARD_SPOT = { x: 21, z: -14.5 };   // cô giáo đứng
export var SCHOOL_PLAY_SPOT = { x: 19, z: -15 };      // bé An ra sân trường chơi
export var FIELD_SPOT = { x: -18, z: 2 };             // ruộng bác Hai làm
export var POND_SPOT = { x: 13.5, z: 6 };             // bờ ao anh Đức câu cá

function stripedAwning(g, w, colorA, colorB) {
  var cv = document.createElement("canvas"); cv.width = 128; cv.height = 32;
  var cx = cv.getContext("2d");
  for (var i = 0; i < 8; i++) { cx.fillStyle = i % 2 ? "#f3ede0" : colorA; cx.fillRect(i * 16, 0, 16, 32); }
  var tex = new THREE.CanvasTexture(cv);
  var awn = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 2.2),
    new THREE.MeshLambertMaterial({ map: tex }));
  awn.position.y = 2.3; awn.rotation.x = 0.14; awn.castShadow = true; g.add(awn);
}

// ---- Chợ: 3 sạp ----
(function buildMarket() {
  // Nền đất chợ
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(16, 4.5), texMat(woodTex));
  ground.rotation.x = -Math.PI / 2; ground.position.set(-2, 0.008, -11.5); ground.receiveShadow = true;
  scene.add(ground);
  var goods = [
    { colors: [0xe2483a, 0x8fce4f, 0xef8f2e], awn: "#3e7d5a" },   // rau củ
    { colors: [0xf2a122, 0x9fc24e, 0xe2483a], awn: "#b0563a" },   // trái cây
    { colors: [0xd6b26a, 0x8a5a2b, 0x9fc24e], awn: "#38618c" }    // đồ khô
  ];
  MARKET_STALLS.forEach(function (s, si) {
    var g = new THREE.Group();
    [[-1.4, -0.8], [1.4, -0.8], [-1.4, 0.8], [1.4, 0.8]].forEach(function (pp) {
      var post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.1, 0.1), mat(0x7a4a21));
      post.position.set(pp[0], 1.05, pp[1]); post.castShadow = true; g.add(post);
    });
    stripedAwning(g, 3.6, goods[si].awn);
    var counter = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.7, 1.3), texMat(woodTex));
    counter.position.y = 0.5; counter.castShadow = true; g.add(counter);
    goods[si].colors.forEach(function (c, ci) {
      var crate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.28, 0.75), mat(0x8a5a2b));
      crate.position.set((ci - 1) * 1.0, 1.0, 0); g.add(crate);
      for (var j = 0; j < 3; j++) {
        var v = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), mat(c));
        v.position.set((ci - 1) * 1.0 + (j - 1) * 0.2, 1.2, (j % 2) * 0.18 - 0.09); g.add(v);
      }
    });
    g.position.set(s.x, 0, s.z); scene.add(g);
    block(s.x, s.z, 1.5);
  });
  // Vài sọt, giỏ để quanh chợ cho có không khí
  [[-8.5, -9.6], [4.8, -9.7], [-9.2, -12.8]].forEach(function (p) {
    var basket = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.4, 10), mat(0xa8895a));
    basket.position.set(p[0], 0.2, p[1]); basket.castShadow = true; scene.add(basket);
    var top = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 8), mat(0x8fce4f));
    top.position.set(p[0], 0.45, p[1]); scene.add(top);
  });
})();

// ---- Tiệm tạp hóa ----
(function buildGrocery() {
  var g = new THREE.Group();
  var walls = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.7, 3.4), texMat(plasterTex));
  walls.position.y = 1.35; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
  [-1, 1].forEach(function (s) {
    var r = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 2.2), mat(0x8c4a2e));
    r.position.set(0, 3.0, s * 0.95); r.rotation.x = s * 0.55; r.castShadow = true; g.add(r);
  });
  var door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.1), mat(0x7a4a21));
  door.position.set(0, 0.95, 1.72); g.add(door);
  [-1.4, 1.4].forEach(function (wx) {
    var win = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.8, 0.08), mat(0xbfd9e8));
    win.position.set(wx, 1.6, 1.72); g.add(win);
  });
  // Biển "TẠP HÓA" vẽ bằng canvas, giống biển trường
  var cv = document.createElement("canvas"); cv.width = 512; cv.height = 96;
  var cx = cv.getContext("2d");
  cx.fillStyle = "#fdf6e3"; cx.fillRect(0, 0, 512, 96);
  cx.fillStyle = "#8c4a2e"; cx.font = "bold 56px sans-serif"; cx.textAlign = "center";
  cx.fillText("TẠP HÓA", 256, 68);
  var sign = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.6, 0.08),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cv) }));
  sign.position.set(0, 2.55, 1.76); g.add(sign);
  // Quầy hàng trước cửa: vài hũ, bao gạo
  var counter = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.7, 0.9), texMat(woodTex));
  counter.position.set(0, 0.35, 2.3); counter.castShadow = true; g.add(counter);
  [[-0.8, 0xd6b26a], [0, 0x9fc24e], [0.8, 0xe2483a]].forEach(function (cc) {
    var jar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 10), mat(cc[0]));
    jar.position.set(cc[1], 0.87, 2.3); g.add(jar);
  });
  g.position.set(GROCERY_POS.x, 0, GROCERY_POS.z); scene.add(g);
  block(GROCERY_POS.x, GROCERY_POS.z, 2.2);
})();

// ---- Nhà hàng xóm (nhỏ, đơn giản) ----
function smallHouse(x, z, wallColor, roofColor, rotY) {
  var g = new THREE.Group();
  var walls = new THREE.Mesh(new THREE.BoxGeometry(5, 2.8, 4), mat(wallColor));
  walls.position.y = 1.4; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
  [-1, 1].forEach(function (s) {
    var r = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.14, 2.4), mat(roofColor));
    r.position.set(0, 3.15, s * 1.05); r.rotation.x = s * 0.55; r.castShadow = true; g.add(r);
  });
  var door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.8, 0.1), mat(0x7a4a21));
  door.position.set(-0.6, 0.9, 2.02); g.add(door);
  var win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.08), mat(0xbfd9e8));
  win.position.set(1.2, 1.6, 2.02); g.add(win);
  g.position.set(x, 0, z); g.rotation.y = rotY || 0; scene.add(g);
  block(x, z, 2.5);
}
smallHouse(HOUSE_POS.h1.x, HOUSE_POS.h1.z, 0xe8dcc0, 0x8c4a2e, 0);
smallHouse(HOUSE_POS.h2.x, HOUSE_POS.h2.z, 0xdfe8d8, 0x38618c, 0);

// ---- Trường mở rộng: lớp học thứ hai, ghế đá, cây to, hàng rào sân ----
(function buildSchoolYard() {
  var g = new THREE.Group();
  var walls = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.8, 3.6), texMat(plasterTex));
  walls.position.y = 1.4; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
  [-1, 1].forEach(function (s) {
    var r = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.14, 2.3), mat(0x38618c));
    r.position.set(0, 3.1, s * 1.0); r.rotation.x = s * 0.55; r.castShadow = true; g.add(r);
  });
  var door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.1), mat(0x7a4a21));
  door.position.set(0, 0.95, 1.82); g.add(door);
  [-1.7, 1.7].forEach(function (wx) {
    var win = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.9, 0.08), mat(0xbfd9e8));
    win.position.set(wx, 1.6, 1.82); g.add(win);
  });
  g.position.set(32.5, 0, -18.5); scene.add(g);
  block(32.5, -18.5, 3);
  // Ghế đá trong sân
  [[20, -18], [23, -19.5]].forEach(function (p) {
    var bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.45), mat(0x9a938a));
    bench.position.set(p[0], 0.45, p[1]); bench.castShadow = true; scene.add(bench);
    [-0.6, 0.6].forEach(function (s) {
      var leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.4), mat(0x9a938a));
      leg.position.set(p[0] + s, 0.22, p[1]); scene.add(leg);
    });
  });
  // Cây to trong sân trường
  tree(29, -13.5, 1.4);
  // Hàng rào thấp quanh sân trường, chừa lối ở cổng (x 20.2–22.8)
  var fm = mat(0xb59a5e);
  for (var x = 18; x <= 36; x += 1.2) {
    if (x > 20.2 && x < 22.8) continue; // lối vào cổng
    var post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), fm);
    post.position.set(x, 0.3, -12.2); scene.add(post);
  }
})();
