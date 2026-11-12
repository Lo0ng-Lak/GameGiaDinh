// @ts-nocheck
/*
 * GameGiaDinh — src/npc/walkAnim.ts
 * GIAI ĐOẠN 4.4: chuyển động nhân vật có sức sống — chỉ dùng thủ tục
 * (procedural) trên các khớp hộp đã có, KHÔNG rig xương, KHÔNG file
 * animation mới. Ba thứ rẻ tiền:
 *   1. Walk bob — người nhấp nhô nhẹ theo nhịp bước khi đang đi.
 *   2. Smooth facing — xoay mặt theo hướng đi từ từ (quay ngắn nhất
 *      qua vòng ±PI) thay vì bẻ ngoặt tức thì như cũ.
 *   3. Idle sway — đứng yên thì khẽ đung đưa (thở), tay buông.
 * Toàn bộ là hàm thuần + một hàm áp dụng duy nhất applyWalkAnim(),
 * để test Node kiểm chứng được; animate() thật chỉ gọi hàm này.
 * Bé An / anh chồng vẫn giữ nhịp chân tay riêng trong main.ts (vẫy
 * tay, lom khom...), chỉ mượn smoothFacing + walkBobY ở đây cho
 * hướng mặt và độ nhấp nhô — không đụng vào logic đi lại của họ.
 */
import * as THREE from 'three';

// Góc quay ngắn nhất từ current tới target, luôn trong (-PI, PI].
export function angleDelta(current, target) {
  var d = target - current;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

// Xoay mặt về hướng đi từ từ: tốc độ quay rate rad/s (mặc định 6 —
// quay ~1 vòng trong 1s, đủ nhanh để không lề mề, đủ chậm để thấy
// người xoay thân thay vì bẻ ngoặt). Trả về góc mới.
export function smoothFacing(current, target, dt, rate) {
  var r = rate || 6;
  var d = angleDelta(current, target);
  var maxStep = r * dt;
  if (d > maxStep) return current + maxStep;
  if (d < -maxStep) return current - maxStep;
  return target;
}

// Độ nhấp nhô theo nhịp bước: 0 khi đứng yên; khi đi thì |sin| theo
// nhịp bước (tNow * 8 giống nhịp chân cũ), biên độ 0.035m, tỉ lệ
// theo tốc độ (đi chậm nhấp ít, đi nhanh nhấp đủ).
export function walkBobY(tNow, moving, speed) {
  if (!moving) return 0;
  var s = Math.min(1, (speed || 1.6) / 2.5);
  return Math.abs(Math.sin(tNow * 8)) * 0.035 * s;
}

// Nhịp vung chân/tay khi đi bộ: biên độ 0.45 như cũ, 0 khi đứng.
export function walkSwing(tNow, moving) {
  return moving ? Math.sin(tNow * 8) * 0.45 : 0;
}

// Đung đưa lúc đứng yên: thân nghiêng rất nhẹ (±0.02 rad) theo nhịp
// thở chậm, tay khẽ đưa (±0.06). seed để mỗi người lệch pha nhau.
export function idleSway(tNow, seed) {
  var ph = (seed || 0) * 1.7;
  return {
    rotZ: Math.sin(tNow * 0.9 + ph) * 0.02,
    arm: Math.sin(tNow * 1.1 + ph) * 0.06
  };
}

// Áp dụng chuyển động lên 1 nhân vật (mesh + parts chân/tay).
// opts: { moving, dt, tNow, targetYaw, speed, seed }
//  - Đang đi: mặt xoay êm về targetYaw, thân nhấp nhô, chân tay vung.
//  - Đứng yên: chân tay về 0 dần, thân khẽ đung đưa, mặt giữ nguyên.
// Trả về { yaw, bobY } để test kiểm chứng (game không cần dùng).
export function applyWalkAnim(mesh, parts, opts) {
  var moving = !!opts.moving, dt = opts.dt || 0.016, tNow = opts.tNow || 0;
  var yaw = mesh.rotation.y;
  if (moving && opts.targetYaw != null) {
    yaw = smoothFacing(yaw, opts.targetYaw, dt, 6);
    mesh.rotation.y = yaw;
  }
  var bobY = walkBobY(tNow, moving, opts.speed);
  mesh.position.y = bobY;
  var sw = walkSwing(tNow, moving);
  if (parts) {
    if (parts.legL) parts.legL.rotation.x = sw;
    if (parts.legR) parts.legR.rotation.x = -sw;
    if (parts.armL) parts.armL.rotation.x = moving ? -sw * 0.7 : 0;
    if (parts.armR) parts.armR.rotation.x = moving ? sw * 0.7 : 0;
    if (!moving) {
      var sway = idleSway(tNow, opts.seed);
      mesh.rotation.z = sway.rotZ;
      if (parts.armL) parts.armL.rotation.x = sway.arm;
      if (parts.armR) parts.armR.rotation.x = -sway.arm;
    } else {
      mesh.rotation.z = 0;
    }
  }
  return { yaw: yaw, bobY: bobY };
}
