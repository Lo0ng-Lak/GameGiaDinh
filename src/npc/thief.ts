// @ts-nocheck
/*
 * GameGiaDinh — assets/src/npc/thief.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/npc/thief.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { mat, scene, boxGeo, sphGeo } from '../world/scene';

    /* ================== GÃ TRỘM — LẺN VÀO SÂN HỐT ĐỒ, PHẢI ĐUỔI RA ================== */
    export var thief, thiefParts = {};
    export var thiefPath = [
      new THREE.Vector3(30, 0, -14), new THREE.Vector3(20, 0, -12), new THREE.Vector3(10, 0, -5.5),
      new THREE.Vector3(3, 0, 1.5), new THREE.Vector3(-0.2, 0, 6.6)
    ];
    (function buildThief() {
      thief = new THREE.Group();
      [-0.11, 0.11].forEach(function (s, idx) {
        var leg = new THREE.Mesh(boxGeo(0.14, 0.62, 0.14), mat(0x2e2e33));
        leg.position.y = -0.31;
        var piv = new THREE.Group(); piv.position.set(s, 0.78, 0); piv.add(leg); thief.add(piv);
        thiefParts[idx === 0 ? "legL" : "legR"] = piv;
      });
      var torso = new THREE.Mesh(boxGeo(0.5, 0.66, 0.27), mat(0x3a3f4a));
      torso.position.y = 1.11; torso.castShadow = true; thief.add(torso);
      [-1, 1].forEach(function (s) {
        var piv = new THREE.Group(); piv.position.set(s * 0.31, 1.38, 0);
        var arm = new THREE.Mesh(boxGeo(0.11, 0.58, 0.11), mat(0x3a3f4a));
        arm.position.y = -0.26; piv.add(arm); thief.add(piv);
        thiefParts[s < 0 ? "armL" : "armR"] = piv;
      });
      var head = new THREE.Mesh(sphGeo(0.2, 12, 10), mat(0xc99878));
      head.position.y = 1.68; head.castShadow = true; thief.add(head);
      // Mũ lưỡi trai kéo sụp + khẩu trang che mặt
      var cap = new THREE.Mesh(sphGeo(0.21, 12, 6), mat(0x23232a));
      cap.position.y = 1.76; cap.scale.y = 0.55; thief.add(cap);
      var brim = new THREE.Mesh(boxGeo(0.3, 0.03, 0.22), mat(0x23232a));
      brim.position.set(0, 1.72, 0.22); thief.add(brim);
      var mask = new THREE.Mesh(boxGeo(0.26, 0.14, 0.05), mat(0x555c66));
      mask.position.set(0, 1.6, 0.17); thief.add(mask);
      // Bao tải vác sau lưng — hốt được đồ thì phình to
      var sack = new THREE.Mesh(sphGeo(0.3, 10, 8), mat(0x8a6f45));
      sack.scale.set(1, 1.15, 0.8); sack.position.set(0, 1.15, -0.32); sack.castShadow = true; thief.add(sack);
      thiefParts.sack = sack;
      thief.position.copy(thiefPath[0]);
      thief.visible = false;
      scene.add(thief);
    })();

