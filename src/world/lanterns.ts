// @ts-nocheck
/*
 * GameGiaDinh — src/world/lanterns.ts
 * GIAI ĐOẠN 4.4: đèn chập tối — nối tiếp mẫu đèn hiên đã có (ambient.ts:
 * 1 PointLight __porchLight + bóng đèn) và 2 đèn lồng đỏ sửa nhà
 * (upgrades.ts, chỉ đổi màu trong daylight.ts).
 *
 * Thêm đúng 2 PointLight thật (rẻ, cường độ thấp, tầm ngắn):
 *   1. Đèn lồng sạp chợ — treo trước sạp giữa (-2,-11.5), sáng ấm
 *      17:00–17:30, tắt hẳn ban ngày.
 *   2. Đèn đá chùa — 1 PointLight trước cửa chùa (-23.6,15.5) chung
 *      cho 2 bóng đèn đá 2 bên thềm (chỉ có bóng phát sáng, không
 *      thêm đèn riêng cho từng bóng).
 * Cộng với đèn hiên + đèn bếp củi đã có, tổng cộng scene có 4
 * PointLight — không thêm nữa. Bóng đèn dùng MeshBasicMaterial
 * (tự phát sáng, không tốn đèn) nên ban ngày chúng chỉ là bóng mờ.
 * Bật/tắt theo lanternLevel() ở daylight.ts — cùng một mốc với đèn
 * hiên (0 trước 17:00, 1 lúc 17:30), giông không làm tắt đèn.
 * Không lưu save: trạng thái đèn suy ra từ giờ trong ngày nên save
 * cũ vẫn tải bình thường, không cần trường mới.
 */
import * as THREE from 'three';
import { G } from '../core/state';
import { lanternLevel } from './daylight';
import { cylGeo, mat, scene, sphGeo } from './scene';

// Sạp giữa chợ (chị Lan) làm điểm treo đèn chung cho cả dãy sạp.
export var STALL_LANTERN_POS = { x: -2, y: 2.0, z: -10.6 };
// Cửa chùa quay về phía đông; 2 đèn đá ở thềm chùa (xem places.ts:
// local (±1.9,1.05,1.9), chùa xoay PI/2 -> world (-23.6, ~, 13.6/17.4)).
export var TEMPLE_LAMP_POS = [
  { x: -23.6, y: 1.25, z: 13.6 },
  { x: -23.6, y: 1.25, z: 17.4 }
];
export var TEMPLE_LIGHT_POS = { x: -23.6, y: 1.6, z: 15.5 };

export var stallLight = null, templeLight = null;
export var stallBulbMat = null, templeBulbMats = [];

(function buildLanterns() {
  // ---- Đèn lồng sạp chợ: dây treo + lồng đèn giấy đỏ + bóng sáng ----
  var str = new THREE.Mesh(cylGeo(0.012, 0.012, 0.35, 5), mat(0x5a3a22));
  str.position.set(STALL_LANTERN_POS.x, STALL_LANTERN_POS.y + 0.3, STALL_LANTERN_POS.z);
  scene.add(str);
  stallBulbMat = new THREE.MeshBasicMaterial({ color: 0xd4573a });
  var bulb = new THREE.Mesh(sphGeo(0.17, 10, 8), stallBulbMat);
  bulb.scale.y = 0.82;
  bulb.position.set(STALL_LANTERN_POS.x, STALL_LANTERN_POS.y, STALL_LANTERN_POS.z);
  scene.add(bulb);
  window.__stallBulb = bulb;
  // 1 PointLight ấm, tầm 9m — chỉ đủ sáng dãy sạp, không rọi cả làng.
  stallLight = new THREE.PointLight(0xffb45e, 0, 9, 1.8);
  stallLight.position.set(STALL_LANTERN_POS.x, STALL_LANTERN_POS.y, STALL_LANTERN_POS.z);
  scene.add(stallLight);
  window.__stallLight = stallLight;

  // ---- Đèn đá chùa: 2 bóng sáng trên đầu đèn đá + 1 PointLight chung ----
  TEMPLE_LAMP_POS.forEach(function (p) {
    var bm = new THREE.MeshBasicMaterial({ color: 0x8a8378 });
    var b = new THREE.Mesh(sphGeo(0.11, 8, 8), bm);
    b.position.set(p.x, p.y, p.z);
    scene.add(b);
    templeBulbMats.push(bm);
  });
  window.__templeBulbs = templeBulbMats;
  templeLight = new THREE.PointLight(0xffc46b, 0, 8, 1.8);
  templeLight.position.set(TEMPLE_LIGHT_POS.x, TEMPLE_LIGHT_POS.y, TEMPLE_LIGHT_POS.z);
  scene.add(templeLight);
  window.__templeLight = templeLight;
})();

// Trạng thái đèn — test đọc để kiểm chứng, không dùng trong game.
export function lanternsState() {
  return {
    level: lanternLevel(G.minutes),
    stall: stallLight ? stallLight.intensity : 0,
    temple: templeLight ? templeLight.intensity : 0,
    stallBulb: stallBulbMat ? stallBulbMat.color.hex : null,
    templeBulb: templeBulbMats.length ? templeBulbMats[0].color.hex : null
  };
}

// Cập nhật đèn theo giờ — gọi trong khối hudT của main.ts ngay sau
// updateSky() (0.2s/lần, đủ mượt cho đèn sáng dần, không tốn khung hình).
// Nhấp nháy rất nhẹ (±5%, chu kỳ ~2s) cho ánh đèn có sức sống; giông
// không tắt đèn — đèn chập tối chỉ theo giờ, không theo thời tiết.
export function updateLanterns(tNow) {
  var lk = lanternLevel(G.minutes);
  var flick = 0.95 + 0.05 * Math.sin((tNow || 0) * 2.8);
  if (stallLight) stallLight.intensity = lk * 0.85 * flick;
  if (templeLight) templeLight.intensity = lk * 0.7 * flick;
  if (stallBulbMat) stallBulbMat.color.setHex(lk > 0 ? 0xffc46b : 0xd4573a);
  templeBulbMats.forEach(function (bm) {
    bm.color.setHex(lk > 0 ? 0xffd97a : 0x8a8378);
  });
}
