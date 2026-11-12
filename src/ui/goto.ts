// @ts-nocheck
/*
 * GameGiaDinh — assets/src/ui/goto.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/ui/goto.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { collide, player } from '../player/player';

    /* ================== NÚT ĐI TỚI ================== */
    export var gotoTargets = {
      well: { x: -4.5, z: 5.6, yaw: 0 }, garden: { x: 9.2, z: 9.2, yaw: 0.82 }, stall: { x: 9, z: -9, yaw: 0 },
      school: { x: 19.9, z: -12.4, yaw: -1.1 }, home: { x: -7.2, z: -1.2, yaw: 1.1 },
      pond: { x: 12.4, z: 5.4, yaw: -0.9 }, stove: { x: -14.2, z: 1.9, yaw: 0.75 }, coop: { x: -0.5, z: 5.6, yaw: 3.14 },
      // PHASE 4.3: 3 địa điểm mới ở rìa làng — đứng ngoài vòng chặn, quay mặt vào chỗ
      temple: { x: -22.3, z: 15.5, yaw: 1.57 }, grove: { x: 23, z: 11.6, yaw: -2.25 }, hill: { x: 1, z: -16.9, yaw: -0.96 }
    };
    document.querySelectorAll("[data-goto]").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = gotoTargets[b.dataset.goto]; if (!t) return;
        var c = collide(t.x, t.z); player.x = c.x; player.z = c.z; player.vx = 0; player.vz = 0;
        if (typeof t.yaw === "number") { player.yaw = t.yaw; player.yawT = t.yaw; player.pitch = -0.03; player.pitchT = -0.03; }
      });
    });

