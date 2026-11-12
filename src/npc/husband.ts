// @ts-nocheck
/*
 * GameGiaDinh — assets/src/npc/husband.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/npc/husband.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { mat, scene } from '../world/scene';

    /* ================== ANH CHỒNG — CHIỀU ĐI LÀM THUÊ VỀ ================== */
    export var husband, husbandParts = {};
    export var husbandPath = [
      new THREE.Vector3(30, 0, -14), new THREE.Vector3(16, 0, -13.4), new THREE.Vector3(4, 0, -9.5),
      new THREE.Vector3(-3, 0, -5), new THREE.Vector3(-7.6, 0, -2.2)
    ];
    (function buildHusband() {
      husband = new THREE.Group();
      [-0.11, 0.11].forEach(function (s, idx) {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.62, 0.14), mat(0x4a4a52));
        leg.position.y = -0.31;
        var piv = new THREE.Group(); piv.position.set(s, 0.78, 0); piv.add(leg); husband.add(piv);
        husbandParts[idx === 0 ? "legL" : "legR"] = piv;
      });
      var torso = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.66, 0.27), mat(0x7a6a4f));
      torso.position.y = 1.11; torso.castShadow = true; husband.add(torso);
      [-1, 1].forEach(function (s) {
        var piv = new THREE.Group(); piv.position.set(s * 0.31, 1.38, 0);
        var arm = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.58, 0.11), mat(0xe8b48c));
        arm.position.y = -0.26; piv.add(arm); husband.add(piv);
        husbandParts[s < 0 ? "armL" : "armR"] = piv;
      });
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0xd9a878));
      head.position.y = 1.68; head.castShadow = true; husband.add(head);
      var hat = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.17, 12), mat(0xd6b26a));
      hat.position.y = 1.84; husband.add(hat);
      // Bọc đồ nghề vác trên vai
      var bundle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.3), mat(0x38618c));
      bundle.position.set(0.3, 1.32, -0.24); husband.add(bundle);
      husband.position.copy(husbandPath[0]);
      husband.visible = false;
      scene.add(husband);
    })();

