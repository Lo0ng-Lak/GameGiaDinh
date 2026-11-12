// @ts-nocheck
/*
 * GameGiaDinh — src/world/places.ts
 * GIAI ĐOẠN 4.3: mở rộng làng — 3 địa điểm mới ở RÌA bản đồ, lõi làng giữ
 * nguyên: chùa nhỏ góc tây-bắc, rừng tre góc đông-bắc, đồi ngắm ruộng ở
 * mép nam. Mở rộng VỪA PHẢI theo đúng lời dặn của Sư Huynh: dựng bằng
 * đúng mẫu có sẵn (box/cyl/cone + mat()/texMat(), biển vẽ bằng canvas
 * như biển trường) — không thêm hình nặng hay texture mới. Mỗi chỗ đều
 * có vòng chặn riêng và điểm tương tác đứng NGOÀI vòng chặn; lối đi giữa
 * các chỗ và làng luôn mở, không có ngõ cụt.
 */
import * as THREE from 'three';
import { G } from '../core/state';
import { block, mat, plasterTex, scene, texMat, woodTex } from './scene';

// ---- Chùa nhỏ góc tây-bắc, yên tĩnh ----
export var TEMPLE_POS = { x: -25.5, z: 15.5 };
export var TEMPLE_PRAY_SPOT = { x: -22.3, z: 15.5 };   // đứng thắp hương, ngoài vòng chặn chùa (cách 0,4m)
export var TEMPLE_SPOT = { x: -22.3, z: 13.9 };        // bà Năm ghé chùa buổi sớm
// ---- Rừng tre góc đông-bắc — đi xuyên được giữa các khóm, măng mọc ở rìa ----
export var GROVE_CENTER = { x: 26, z: 14 };
export var GROVE_CLUSTERS = [{ x: 24.8, z: 13.2 }, { x: 27.2, z: 14.4 }, { x: 25.6, z: 15.8 }];
export var GROVE_SHOOTS = [{ x: 23.6, z: 12.4 }, { x: 28.4, z: 13.0 }, { x: 24.6, z: 16.8 }];
export var GROVE_REST_SPOT = { x: 23.2, z: 14.6 };     // bác Hai nghỉ trưa trong rừng tre
// ---- Đồi ngắm ruộng ở mép nam, nhìn về ruộng lúa ----
export var HILL_POS = { x: 4, z: -19 };
export var HILL_REST_SPOT = { x: 1.0, z: -16.9 };      // ngồi ghế đá ngắm ruộng

// Biển vẽ bằng canvas, cùng kiểu biển trường / biển tạp hóa
function canvasSign(text, w, color) {
  var cv = document.createElement("canvas"); cv.width = 512; cv.height = 96;
  var cx = cv.getContext("2d");
  cx.fillStyle = "#fdf6e3"; cx.fillRect(0, 0, 512, 96);
  cx.fillStyle = color; cx.font = "bold 52px sans-serif"; cx.textAlign = "center";
  cx.fillText(text, 256, 66);
  return new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, 0.08),
    new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(cv) }));
}

/* ---- Chùa làng ---- */
(function buildTemple() {
  var g = new THREE.Group();
  // Nền gạch cao + thân chùa quét vôi vàng
  var base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.3, 3.2), texMat(woodTex));
  base.position.y = 0.15; base.receiveShadow = true; g.add(base);
  var walls = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.4, 2.6), texMat(plasterTex));
  walls.position.y = 1.5; walls.castShadow = true; walls.receiveShadow = true; g.add(walls);
  // Mái ngói hai dốc + tầng mái nhỏ trên nóc (kiểu chùa quê)
  var roofMat = mat(0x8c4a2e);
  [-1, 1].forEach(function (s) {
    var r = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 2.0), roofMat);
    r.position.set(0, 3.0, s * 0.85); r.rotation.x = s * 0.55; r.castShadow = true; g.add(r);
  });
  var tier = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.4), texMat(plasterTex));
  tier.position.y = 3.6; tier.castShadow = true; g.add(tier);
  [-1, 1].forEach(function (s) {
    var r2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.2), roofMat);
    r2.position.set(0, 4.25, s * 0.45); r2.rotation.x = s * 0.55; r2.castShadow = true; g.add(r2);
  });
  var spire = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.7, 8), mat(0xd6b26a));
  spire.position.y = 4.9; g.add(spire);
  // Cửa gỗ + biển chùa quay về phía làng (đông)
  var door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.9, 0.1), mat(0x7a4a21));
  door.position.set(0, 1.25, 1.32); g.add(door);
  var sign = canvasSign("CHÙA LÀNG", 2.6, "#8c4a2e");
  sign.position.set(0, 2.5, 1.36); g.add(sign);
  // Lư hương đồng trước cửa + hai đèn đá hai bên thềm
  var burner = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.4, 12), mat(0x8a6d3b));
  burner.position.set(0, 0.5, 2.0); burner.castShadow = true; g.add(burner);
  var incense = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5), mat(0xd43a2a));
  incense.position.set(0.08, 0.85, 2.0); g.add(incense);
  [-1.9, 1.9].forEach(function (s) {
    var lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.7, 8), mat(0x9a938a));
    lamp.position.set(s, 0.65, 1.9); lamp.castShadow = true; g.add(lamp);
    var cap = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.5), mat(0x7d7468));
    cap.position.set(s, 1.05, 1.9); g.add(cap);
  });
  g.position.set(TEMPLE_POS.x, 0, TEMPLE_POS.z);
  g.rotation.y = Math.PI / 2; // cửa quay về phía đông, hướng ra làng
  scene.add(g);
  // Nền chùa 4,2×3,2m — nửa đường chéo 2,65m nên vòng r=2,8 ôm kín cả thềm.
  block(TEMPLE_POS.x, TEMPLE_POS.z, 2.8);
})();

/* ---- Rừng tre ---- */
(function buildBambooGrove() {
  // Nền đất clearing dưới rừng tre cho nhận ra là một chỗ riêng
  var clearing = new THREE.Mesh(new THREE.CircleGeometry(4.0, 20), mat(0x7d9b4e));
  clearing.rotation.x = -Math.PI / 2; clearing.position.set(GROVE_CENTER.x, -0.005, GROVE_CENTER.z);
  clearing.receiveShadow = true; scene.add(clearing);
  // 3 khóm tre, mỗi khóm 5 cây — cùng mẫu bụi tre góc sân trong scene.ts,
  // chỉ khác là đặt ở tọa độ thế giới thay vì trong 1 group
  var poleMat = mat(0x86a860), leafMat = mat(0x639b41);
  GROVE_CLUSTERS.forEach(function (c) {
    for (var i = 0; i < 5; i++) {
      var h = 4.6 + Math.random() * 2.0;
      var px = c.x + (Math.random() - 0.5) * 1.0, pz = c.z + (Math.random() - 0.5) * 1.0;
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, h, 6), poleMat);
      pole.position.set(px, h / 2, pz);
      pole.rotation.z = (Math.random() - 0.5) * 0.08; pole.castShadow = true; scene.add(pole);
      var top = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 6), leafMat);
      top.position.set(px + (Math.random() - 0.5) * 0.4, h + 0.15, pz + (Math.random() - 0.5) * 0.4);
      top.scale.y = 0.7; scene.add(top);
    }
    block(c.x, c.z, 0.9); // khóm tre đặc — đi vòng qua, chừa lối giữa các khóm
  });
  // Măng non mọc ở rìa khóm — hái được, mỗi sáng mọc lại 3 cây
  window.__bambooShoots = [];
  GROVE_SHOOTS.forEach(function (s) {
    var sg = new THREE.Group();
    var body = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 8), mat(0xc9b458));
    body.position.y = 0.38; body.castShadow = true; sg.add(body);
    var tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 8), mat(0x7d9b4e));
    tip.position.y = 0.82; sg.add(tip);
    sg.position.set(s.x, 0, s.z); scene.add(sg);
    window.__bambooShoots.push({ x: s.x, z: s.z, group: sg });
  });
  refreshBambooShoots();
})();

// Đồng bộ măng hiện/ẩn theo G.bambooReady — gọi khi tải save và khi sang ngày mới
export function refreshBambooShoots() {
  if (!window.__bambooShoots) return;
  window.__bambooShoots.forEach(function (s, i) {
    s.group.visible = !!(G.bambooReady && G.bambooReady[i]);
  });
}

/* ---- Đồi ngắm ruộng ---- */
(function buildHillView() {
  // Gò đất thấp nhìn ra ruộng lúa
  var mound = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.3, 14), mat(0x6d8f57));
  mound.position.set(HILL_POS.x, 0.62, HILL_POS.z); mound.castShadow = true; mound.receiveShadow = true; scene.add(mound);
  var top = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), mat(0x7da05e));
  top.position.set(HILL_POS.x, 1.15, HILL_POS.z); top.scale.y = 0.45; scene.add(top);
  // Ghế đá ngồi ngắm ruộng — cùng mẫu ghế đá sân trường trong village.ts
  var bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.45), mat(0x9a938a));
  bench.position.set(1.0, 0.45, -17.6); bench.castShadow = true; scene.add(bench);
  [-0.6, 0.6].forEach(function (s) {
    var leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.4), mat(0x9a938a));
    leg.position.set(1.0 + s, 0.22, -17.6); scene.add(leg);
  });
  // Biển gỗ "ĐỒI NGẮM RUỘNG" cắm cạnh ghế
  var sign = canvasSign("ĐỒI NGẮM RUỘNG", 2.8, "#38618c");
  sign.position.set(2.2, 1.15, -16.6); sign.rotation.y = -0.5; scene.add(sign);
  [-0.85, 0.85].forEach(function (s) {
    var post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.1, 0.09), mat(0x7a4a21));
    post.position.set(2.2 + s * 0.95, 0.55, -16.6 + s * 0.45); scene.add(post);
  });
  block(HILL_POS.x, HILL_POS.z, 2.2);
})();
