// @ts-nocheck
/*
 * GameGiaDinh — src/world/festivalDecor.ts
 * GIAI ĐOẠN 4.2: trang trí 3D ngày lễ — CHỈ hiện trong ngày lễ, hôm sau
 * tự dọn. Dùng đúng kiểu dựng đồ sẵn có (hình khối đơn giản, vật liệu
 * trơn — như đèn lồng ở details.ts), không thêm hình nặng.
 *
 *  - Tết ("tet"): dãy đèn lồng đỏ treo trước hiên + 2 băng rôn đỏ 2 bên cửa.
 *  - Trung thu ("midautumn"): đèn lồng đủ màu quanh sân + trăng đêm TO
 *    gấp ~1,9 lần (phóng to nhóm trăng sẵn có window.__moonG, hôm sau
 *    trả lại cỡ cũ).
 *  - Sinh nhật / kỷ niệm ngày cưới / họ hàng sum họp ("birthday" /
 *    "anniversary" / "gathering"): bàn tiệc ngoài sân; sinh nhật và
 *    kỉ niệm có thêm bánh + bóng bay (bánh màu hồng sinh nhật, đỏ kỷ
 *    niệm); sum họp chỉ có bàn ăn chung, không bánh không bóng.
 * Trang trí dựng lười (lazy) lần đầu gọi showFestivalDecor() rồi chỉ
 * bật/tắt visible. Cố ý KHÔNG thêm vòng chặn va chạm: đồ lễ chỉ ở sân
 * một ngày, người chơi đi xuyên qua bàn một hôm không sao, mà thêm
 * vòng chặn lại có thể kẹt đường đi của dân làng (xem test đường đi).
 */
import * as THREE from 'three';
import { mat, scene } from './scene';

var built = false;
var tetGroup = null, moonGroup = null, partyGroup = null;
var cakeGroup = null, balloonGroup = null, cakeTopMat = null;
var moonBoosted = false;

function lanternMesh(color, x, y, z, r) {
  var g = new THREE.Group();
  var str = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 5), mat(0x5a3a22));
  str.position.y = 0.32; g.add(str);
  var body = new THREE.Mesh(new THREE.SphereGeometry(r || 0.22, 10, 8),
    new THREE.MeshBasicMaterial({ color: color }));
  body.scale.y = 0.82; g.add(body);
  var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.06, 8), mat(0xd9b84a));
  cap.position.y = 0.2; g.add(cap);
  g.position.set(x, y, z);
  return g;
}

function build() {
  if (built) return;
  built = true;
  // --- Tết: đèn lồng đỏ trước hiên + băng rôn đỏ 2 bên cửa chính ---
  tetGroup = new THREE.Group();
  for (var i = 0; i < 6; i++)
    tetGroup.add(lanternMesh(0xd4573a, -13.6 + i * 1.8, 2.6, -2.0, 0.22));
  [[-12.6, -1.9], [-5.8, -1.9]].forEach(function (bp) {
    var banner = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.06), mat(0xc0392b));
    banner.position.set(bp[0], 1.4, bp[1]); banner.castShadow = true; tetGroup.add(banner);
    var trim = new THREE.Mesh(new THREE.BoxGeometry(0.84, 1.84, 0.07), mat(0xd9b84a));
    trim.position.set(bp[0], 1.4, bp[1]); trim.scale.set(1, 1, 0.4); tetGroup.add(trim);
    var inner = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.68, 0.08), mat(0xc0392b));
    inner.position.set(bp[0], 1.4, bp[1]); tetGroup.add(inner);
  });
  tetGroup.visible = false;
  scene.add(tetGroup);

  // --- Trung thu: đèn lồng đủ màu quanh sân (trăng to xử lý riêng) ---
  moonGroup = new THREE.Group();
  var cols = [0xd4573a, 0xe8a33d, 0xf2a7c3, 0x6fae4e, 0xd4573a, 0xffd94d, 0xe2483a, 0x3e7dc2];
  [[-4, 2.5, 5], [2, 2.5, 7], [10, 2.5, 6], [-14, 2.5, 2],
   [6, 2.5, -6], [14, 2.5, -4], [-2, 2.5, -8], [18, 2.5, 0]].forEach(function (lp, i) {
    moonGroup.add(lanternMesh(cols[i % cols.length], lp[0], lp[1], lp[2], 0.2));
  });
  moonGroup.visible = false;
  scene.add(moonGroup);

  // --- Bàn tiệc ngoài sân: bàn + ghế đẩu; bánh + bóng bay chỉ ngày vui ---
  partyGroup = new THREE.Group();
  var table = new THREE.Group();
  var top = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.12, 1.1), mat(0x8a5a2b));
  top.position.y = 0.78; top.castShadow = true; table.add(top);
  [[-0.85, -0.45], [0.85, -0.45], [-0.85, 0.45], [0.85, 0.45]].forEach(function (lg) {
    var leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.75, 0.1), mat(0x7a4a21));
    leg.position.set(lg[0], 0.38, lg[1]); table.add(leg);
  });
  [[-1.5, 0.3], [1.5, -0.3]].forEach(function (st) {
    var stool = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.42, 10), mat(0xa8895a));
    stool.position.set(st[0], 0.21, st[1]); stool.castShadow = true; table.add(stool);
  });
  table.position.set(-5.5, 0, 0.5);
  partyGroup.add(table);
  // Bánh sinh nhật / kỷ niệm trên bàn
  cakeGroup = new THREE.Group();
  var cake = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.22, 14), mat(0xfdf6e3));
  cake.position.y = 0.95; cake.castShadow = true; cakeGroup.add(cake);
  cakeTopMat = new THREE.MeshBasicMaterial({ color: 0xf2a7c3 });
  var cakeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.12, 12), cakeTopMat);
  cakeTop.position.y = 1.1; cakeGroup.add(cakeTop);
  [[-0.12, 0], [0.12, 0], [0, 0.14]].forEach(function (cp, ci) {
    var candle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 6),
      mat([0xe2483a, 0xffd94d, 0x3e7dc2][ci]));
    candle.position.set(cp[0], 1.22, cp[1]); cakeGroup.add(candle);
  });
  cakeGroup.position.set(-5.5, 0, 0.5);
  partyGroup.add(cakeGroup);
  // Bóng bay 3 màu buộc quanh bàn
  balloonGroup = new THREE.Group();
  [[-6.8, 2.2, 0.2, 0xe2483a], [-4.2, 2.4, 0.9, 0xffd94d], [-5.5, 2.5, -0.6, 0x3e7dc2]].forEach(function (bl) {
    var b = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), mat(bl[3]));
    b.position.set(bl[0], bl[1], bl[2]); b.scale.y = 1.15; balloonGroup.add(b);
    var str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, bl[1] - 0.85, 4), mat(0xdddddd));
    str.position.set(bl[0], (bl[1] + 0.85) / 2, bl[2]); balloonGroup.add(str);
  });
  partyGroup.add(balloonGroup);
  partyGroup.visible = false;
  scene.add(partyGroup);
}

function setMoonBoost(on) {
  moonBoosted = on;
  if (window.__moonG) window.__moonG.scale.set(on ? 1.9 : 1, on ? 1.9 : 1, on ? 1.9 : 1);
}

// kind: "tet" | "midautumn" | "birthday" | "anniversary" | "gathering" | null
export function showFestivalDecor(kind) {
  build();
  tetGroup.visible = (kind === "tet");
  moonGroup.visible = (kind === "midautumn");
  setMoonBoost(kind === "midautumn");
  var party = (kind === "birthday" || kind === "anniversary" || kind === "gathering");
  partyGroup.visible = party;
  if (party) {
    var isPartyOnly = (kind === "gathering");
    cakeGroup.visible = !isPartyOnly;
    balloonGroup.visible = !isPartyOnly;
    if (!isPartyOnly && cakeTopMat)
      cakeTopMat.color.setHex(kind === "anniversary" ? 0xd4573a : 0xf2a7c3);
  }
}

// Trạng thái trang trí — test đọc để kiểm chứng, không dùng trong game.
export function festivalDecorState() {
  build();
  return {
    tet: !!tetGroup.visible,
    moon: !!moonGroup.visible,
    party: !!partyGroup.visible,
    cake: !!cakeGroup.visible,
    balloons: !!balloonGroup.visible,
    moonBoost: moonBoosted,
    cakeColor: cakeTopMat ? cakeTopMat.color.hex : null
  };
}
