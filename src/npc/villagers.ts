// @ts-nocheck
/*
 * GameGiaDinh — src/npc/villagers.ts
 * GIAI ĐOẠN 3: dân làng — 7 người có lịch sinh hoạt theo giờ trong ngày, đi
 * lại giữa nhà / ruộng / chợ / trường / ao, đứng đúng chỗ theo giờ. Nói chuyện
 * (E) để chào hỏi: lần đầu mỗi người mỗi ngày +1 sao vui vẻ ("làng xóm quý
 * nhau"); người bán ở sạp thì mở sạp chợ để bán hàng, ông Tư mở tiệm tạp hóa,
 * cô giáo nhận trứng gà cho lớp (nhiệm vụ "teacher").
 * Vị trí/tọa độ lấy từ world/village.ts. Lịch: phút trong ngày (330 = 5:30).
 */
import * as THREE from 'three';
import { G } from '../core/state';
import { saveGame } from '../core/save';
import { addMemory, checkQuestsAchievements } from '../events/quests';
import { toast } from '../ui/hud';
import { mat, scene, blockers } from '../world/scene';
import { FIELD_SPOT, GROCERY_FRONT, HOUSE_POS, HOUSE_FRONT, MARKET_STALLS, POND_SPOT, SCHOOL_YARD_SPOT, stallFront } from '../world/village';
import { GROVE_REST_SPOT, TEMPLE_SPOT } from '../world/places';
import { applyWalkAnim } from './walkAnim'; // PHASE 4.4: nhấp nhô + xoay mặt êm + đung đưa lúc đứng

// ---- Định nghĩa dân làng ----
export var VILLAGERS = [
  {
    id: "hai", name: "Bác Hai", role: "nông dân",
    shirt: 0x6b4a2e, pants: 0x33302e, skin: 0xc98d5f, hat: "nonla",
    home: HOUSE_POS.h1,
    lines: [
      "Bác Hai: \"Vụ này lúa tốt, nhà chị trồng rau cũng xanh mướt.\"",
      "Bác Hai: \"Sáng mai bác đi cày sớm, chiều qua chợ mua ít đồ.\"",
      "Bác Hai: \"Con bé An nhà chị ngoan, gặp bác là chào rõ to.\"",
      "Bác Hai: \"Trưa nắng bác vào rừng tre ngồi nghỉ, mát rượi, măng non mọc đầy.\""
    ],
    schedule: [
      { from: 330, to: 420, at: HOUSE_FRONT.h1[0] },
      { from: 420, to: 660, at: FIELD_SPOT },
      { from: 660, to: 780, at: HOUSE_FRONT.h1[0] },
      // PHASE 4.3: trưa nắng vào rừng tre góc đông-bắc ngồi nghỉ cho mát
      { from: 780, to: 930, at: GROVE_REST_SPOT },
      // Từ rừng tre về nhà: đi thẳng sẽ đâm vào khe giữa 2 vòng chặn chồng
      // nhau của nhà chính + ghế hiên, trượt (slide) kẹt cứng ở (-10,5,-2,5)
      // không tới được nhà (test đã bắt được). Đi vòng qua phía đông ao,
      // rồi theo đường làng phía bắc (z=-14,5) về nhà như anh Đức.
      { from: 930, to: 1140, at: HOUSE_FRONT.h1[0], via: [{ x: 20, z: -2 }, { x: 14, z: -14.5 }, { x: -14, z: -14.5 }] }
    ]
  },
  {
    id: "nam", name: "Bà Năm", role: "hàng xóm",
    shirt: 0x7a4a8c, pants: 0x33302e, skin: 0xdca87e, hat: "bun",
    home: HOUSE_POS.h1,
    lines: [
      "Bà Năm: \"Chị đảm đang quá, vườn rau nhà chị ai cũng khen.\"",
      "Bà Năm: \"Chiều bà ra cổng trường đón cháu, tiện ngắm các cháu chơi.\"",
      "Bà Năm: \"Hôm nào rảnh qua nhà bà uống nước chè xanh nhé.\"",
      "Bà Năm: \"Sáng nào bà cũng lên chùa thắp nén hương, cầu cho làng mình bình an.\""
    ],
    schedule: [
      // PHASE 4.3: buổi sớm bà lên chùa góc tây-bắc thắp hương, rồi mới về
      // làm việc; đầu ngày bà đứng ở chùa nên test đặt sẵn bà ở đó lúc 05:30
      { from: 330, to: 420, at: TEMPLE_SPOT },
      { from: 420, to: 660, at: { x: -3.5, z: -9.6 } },
      { from: 660, to: 900, at: HOUSE_FRONT.h1[1] },
      { from: 900, to: 960, at: { x: 21.5, z: -13.2 } },
      { from: 960, to: 1140, at: HOUSE_FRONT.h1[1] }
    ]
  },
  {
    id: "ba", name: "Cô Ba", role: "bán rau ở chợ",
    shirt: 0x3e7d5a, pants: 0x33302e, skin: 0xe8b48c, hat: "nonla", stall: "ba",
    home: HOUSE_POS.h2,
    lines: [
      "Cô Ba: \"Rau nhà chị tươi lắm, mang ra sạp cô, cô lấy giá cao hơn sạp làng.\"",
      "Cô Ba: \"Chợ sớm đông vui, chị bán rau xong thì ghé chơi nhé.\""
    ],
    schedule: [
      { from: 330, to: 390, at: HOUSE_FRONT.h2[0] },
      { from: 390, to: 1020, at: stallFront(MARKET_STALLS[0]), stall: "ba" },
      { from: 1020, to: 1140, at: HOUSE_FRONT.h2[0] }
    ]
  },
  {
    id: "lan", name: "Chị Lan", role: "bán trái cây ở chợ",
    shirt: 0xb0563a, pants: 0x33302e, skin: 0xe8b48c, hat: "nonla", stall: "lan",
    home: HOUSE_POS.h2,
    lines: [
      "Chị Lan: \"Xoài ổi nhà chị chín cây, chị Lan lấy hết, giá chợ cao hơn.\"",
      "Chị Lan: \"Trứng gà trứng vịt cũng mang qua đây, chị mua cả.\""
    ],
    schedule: [
      { from: 330, to: 420, at: HOUSE_FRONT.h2[1] },
      { from: 420, to: 1020, at: stallFront(MARKET_STALLS[1]), stall: "lan" },
      { from: 1020, to: 1140, at: HOUSE_FRONT.h2[1] }
    ]
  },
  {
    id: "duc", name: "Anh Đức", role: "bán đồ khô ở chợ",
    shirt: 0x38618c, pants: 0x33302e, skin: 0xc98d5f, hat: "nonla", stall: "duc",
    home: HOUSE_POS.h1,
    lines: [
      "Anh Đức: \"Nhà chị có gì bán, mang qua sạp anh — anh lấy tất, giá chợ.\"",
      "Anh Đức: \"Sáng anh câu được con cá to ở ao làng, chiều mang ra chợ bán.\""
    ],
    schedule: [
      { from: 330, to: 360, at: POND_SPOT },
      // Từ ao về nhà: đi thẳng sẽ đâm gần như xuyên tâm vòng chặn nhà
      // chính nên trượt rất chậm, không kịp về trong 60 phút. Đi vòng qua
      // đường làng phía bắc (z=-14.5) rồi mới về nhà.
      { from: 360, to: 420, at: HOUSE_FRONT.h1[2], via: [{ x: -2, z: -14.5 }, { x: -14, z: -14.5 }] },
      { from: 420, to: 960, at: stallFront(MARKET_STALLS[2]), stall: "duc" },
      { from: 960, to: 1080, at: POND_SPOT },
      { from: 1080, to: 1140, at: HOUSE_FRONT.h1[2], via: [{ x: -2, z: -14.5 }, { x: -14, z: -14.5 }] }
    ]
  },
  {
    id: "tu", name: "Ông Tư", role: "chủ tiệm tạp hóa",
    shirt: 0x2e5a8c, pants: 0x33302e, skin: 0xc98d5f, hat: null,
    home: { x: -12, z: -14 },
    lines: [
      "Ông Tư: \"Tiệm nhà tôi có bánh, nước mắm, gạo mới — chị mua gì cho nhà cứ lấy.\"",
      "Ông Tư: \"Chị mua đồ nhà là tôi mừng, cả làng quen nhau cả mà.\""
    ],
    schedule: [
      { from: 330, to: 360, at: { x: -14.8, z: -13.8 } },
      { from: 360, to: 1080, at: GROCERY_FRONT },
      { from: 1080, to: 1140, at: { x: -14.8, z: -13.8 } }
    ]
  },
  {
    id: "giao", name: "Cô giáo", role: "giáo viên tiểu học",
    shirt: 0xf3ede0, pants: 0x2e2a33, skin: 0xe8b48c, hat: null, teacher: true,
    home: HOUSE_POS.h2,
    lines: [
      "Cô giáo: \"Bé An ngoan lắm, đọc chữ to rõ nhất lớp.\"",
      "Cô giáo: \"Lớp cần trứng gà để nấu ăn trưa cho các cháu, chị có thì mang cho cô nhé.\"",
      "Cô giáo: \"Cảm ơn chị, các cháu có bữa trưa ngon là nhờ nhà mình đấy.\""
    ],
    schedule: [
      { from: 330, to: 420, at: HOUSE_FRONT.h2[2] },
      { from: 420, to: 990, at: SCHOOL_YARD_SPOT },
      { from: 990, to: 1140, at: HOUSE_FRONT.h2[2] }
    ]
  }
];

// ---- Vẽ người (mẫu như bà Tư: chân có khớp, tay có khớp, đầu, nón/tóc) ----
export var villagerMeshes = {};
export var villagerParts = {};
function makeVillagerFigure(def) {
  var v = new THREE.Group();
  var parts = {};
  [-0.1, 0.1].forEach(function (s, idx) {
    var leg = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.58, 0.13), mat(def.pants));
    leg.position.y = -0.29;
    var piv = new THREE.Group(); piv.position.set(s, 0.72, 0); piv.add(leg); v.add(piv);
    parts[idx === 0 ? "legL" : "legR"] = piv;
  });
  var torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.62, 0.26), mat(def.shirt));
  torso.position.y = 1.03; torso.castShadow = true; v.add(torso);
  [-1, 1].forEach(function (s) {
    var piv = new THREE.Group(); piv.position.set(s * 0.29, 1.28, 0);
    var arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.52, 0.1), mat(def.shirt));
    arm.position.y = -0.24; piv.add(arm); v.add(piv);
    parts[s < 0 ? "armL" : "armR"] = piv;
  });
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), mat(def.skin));
  head.position.y = 1.56; head.castShadow = true; v.add(head);
  if (def.hat === "nonla") {
    var hat = new THREE.Mesh(new THREE.ConeGeometry(0.37, 0.16, 12), mat(0xd6b26a));
    hat.position.y = 1.74; v.add(hat);
  } else if (def.hat === "bun") {
    var bun = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), mat(0xcfcfcf));
    bun.position.set(0, 1.66, -0.14); v.add(bun);
    var hat2 = new THREE.Mesh(new THREE.ConeGeometry(0.37, 0.16, 12), mat(0xd6b26a));
    hat2.position.y = 1.74; v.add(hat2);
  }
  return { group: v, parts: parts };
}
VILLAGERS.forEach(function (def) {
  var f = makeVillagerFigure(def);
  villagerMeshes[def.id] = f.group;
  villagerParts[def.id] = f.parts;
  var seg = currentSegment(def, 330);
  f.group.position.set(seg.at.x, 0, seg.at.z);
  scene.add(f.group);
});

// ---- Lịch sinh hoạt ----
export function currentSegment(def, minutes) {
  var m = minutes == null ? G.minutes : minutes;
  for (var i = 0; i < def.schedule.length; i++) {
    var s = def.schedule[i];
    if (m >= s.from && m < s.to) return s;
  }
  return def.schedule[def.schedule.length - 1];
}
export function villagerById(id) {
  for (var i = 0; i < VILLAGERS.length; i++) if (VILLAGERS[i].id === id) return VILLAGERS[i];
  return null;
}
export function villagerAtStall(def) {
  var seg = currentSegment(def);
  return seg.stall || null; // 'ba' | 'lan' | 'duc' khi đang đứng bán ở sạp, không thì null
}

// ---- Di chuyển theo lịch — gọi mỗi khung từ main.ts animate() ----
// Dân làng đi bộ cũng trượt quanh vật cản như người chơi (blockers là các
// hình tròn ở scene.ts) — trước đây họ đi thẳng tới mục tiêu nên đi xuyên
// nhà chính, xuyên sạp chợ, xuyên cả tiệm tạp hóa. Trượt theo mép vòng
// chặn thì tới được đích mà không xuyên vật thể; đích phải nằm ngoài vòng
// chặn thì mới tới được (xem test/npc-pathing.test.mjs kiểm tra điều đó).
function slide(nx, nz) {
  for (var pass = 0; pass < 3; pass++) {
    var moved = false;
    for (var i = 0; i < blockers.length; i++) {
      var b = blockers[i], dx = nx - b.x, dz = nz - b.z, d = Math.hypot(dx, dz);
      if (d < b.r && d > 0.0001) { nx = b.x + dx / d * b.r; nz = b.z + dz / d * b.r; moved = true; }
    }
    if (!moved) break;
  }
  nx = Math.max(-27, Math.min(31, nx));
  nz = Math.max(-20.5, Math.min(19, nz));
  return { x: nx, z: nz };
}
export function updateVillagers(dt, tNow) {
  if (!G.started || G.dayOver) return;
  VILLAGERS.forEach(function (def, vi) {
    var mesh = villagerMeshes[def.id];
    var parts = villagerParts[def.id];
    var seg = currentSegment(def);
    // Đổi ca thì đi lại từ điểm via đầu tiên; via là các điểm trung gian
    // đi qua theo thứ tự trước khi tới đích (đi vòng qua vật cản lớn).
    if (def._seg !== seg) { def._seg = seg; def._via = 0; }
    if (def._via == null) def._via = 0;
    var pts = (seg.via || []).concat([seg.at]);
    if (def._via >= pts.length) def._via = pts.length - 1;
    var target = pts[def._via];
    var dx = target.x - mesh.position.x, dz = target.z - mesh.position.z;
    var d = Math.hypot(dx, dz);
    var moving = false, targetYaw = null;
    if (d > 0.3) {
      var step = Math.min(d, dt * 1.6); // đi bộ làng quê, không chạy
      var s = slide(mesh.position.x + dx / d * step, mesh.position.z + dz / d * step);
      mesh.position.x = s.x; mesh.position.z = s.z;
      moving = true; targetYaw = Math.atan2(dx, dz);
    } else if (def._via < pts.length - 1) {
      def._via++; // tới điểm via thì đi tiếp điểm sau
    }
    // PHASE 4.4: xoay mặt êm về hướng đi (không bẻ ngoặt), thân nhấp
    // nhô theo nhịp bước, đứng yên thì khẽ đung đưa thay cho đứng đơ.
    applyWalkAnim(mesh, parts, { moving: moving, dt: dt, tNow: tNow, targetYaw: targetYaw, speed: 1.6, seed: vi });
  });
}

// ---- Chào hỏi: lần đầu mỗi người mỗi ngày +1 sao ----
export function greetVillager(id) {
  var def = villagerById(id);
  if (!def) return;
  if (!G.greetedIds[id]) {
    G.greetedIds[id] = true; G.greetedToday++; G.stars++;
    toast(def.lines[Math.floor(Math.random() * def.lines.length)] + " (Chào hàng xóm lần đầu hôm nay, +1 sao vui vẻ)", true);
    addMemory("Chào hỏi " + def.name + " ở làng.");
    saveGame();
  } else {
    toast(def.lines[Math.floor(Math.random() * def.lines.length)]);
  }
}

// ---- Cho cô giáo trứng gà cho lớp (nhiệm vụ "teacher") ----
export function giveToTeacher() {
  var q = null;
  G.quests.forEach(function (qq) { if (qq.id === "teacher") q = qq; });
  if (!q) {
    toast("Cô giáo: \"Hôm nay cô không cần gì đâu, chị cứ lo việc nhà đi. Mai lớp cần trứng thì cô nhắn.\"");
    return false;
  }
  if (q.done) { toast("Cô giáo: \"Trứng hôm nay đủ rồi, cảm ơn chị nhiều nhé!\""); return false; }
  if ((G.produce.trung || 0) < 2) {
    toast("Cô giáo cần 2 trứng gà cho lớp — trong giỏ chị mới có " + (G.produce.trung || 0) + " quả. Ra chuồng gà nhặt thêm nhé.");
    return false;
  }
  G.produce.trung -= 2; G.teacherEggsToday += 2;
  toast("Đã đưa cô giáo 2 trứng gà cho lớp nấu ăn trưa.", true);
  checkQuestsAchievements();
  saveGame();
  return true;
}
