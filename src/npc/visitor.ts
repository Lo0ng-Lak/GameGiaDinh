// @ts-nocheck
/*
 * GameGiaDinh — assets/src/npc/visitor.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/npc/visitor.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { mat, scene, boxGeo, sphGeo, coneGeo, cylGeo } from '../world/scene';

    /* ================== BÀ TƯ HÀNG XÓM — QUA CHƠI, BIẾU HẠT GIỐNG ================== */
    export var visitor, visitorParts = {};
    export var visitPath = [
      new THREE.Vector3(9, 0, -10.2), new THREE.Vector3(2, 0, -7),
      new THREE.Vector3(-3, 0, -4.2), new THREE.Vector3(-7.3, 0, -1.3)
    ];
    (function buildVisitor() {
      visitor = new THREE.Group();
      [-0.1, 0.1].forEach(function (s, idx) {
        var leg = new THREE.Mesh(boxGeo(0.13, 0.58, 0.13), mat(0x33302e));
        leg.position.y = -0.29;
        var piv = new THREE.Group(); piv.position.set(s, 0.72, 0); piv.add(leg); visitor.add(piv);
        visitorParts[idx === 0 ? "legL" : "legR"] = piv;
      });
      var torso = new THREE.Mesh(boxGeo(0.48, 0.62, 0.26), mat(0x7a4a8c));
      torso.position.y = 1.03; torso.castShadow = true; visitor.add(torso);
      [-1, 1].forEach(function (s) {
        var piv = new THREE.Group(); piv.position.set(s * 0.29, 1.28, 0);
        var arm = new THREE.Mesh(boxGeo(0.1, 0.52, 0.1), mat(0x7a4a8c));
        arm.position.y = -0.24; piv.add(arm); visitor.add(piv);
        visitorParts[s < 0 ? "armL" : "armR"] = piv;
      });
      var head = new THREE.Mesh(sphGeo(0.19, 12, 10), mat(0xdca87e));
      head.position.y = 1.56; head.castShadow = true; visitor.add(head);
      // Tóc bạc búi sau + nón lá
      var bun = new THREE.Mesh(sphGeo(0.08, 8, 8), mat(0xcfcfcf));
      bun.position.set(0, 1.66, -0.14); visitor.add(bun);
      var hat = new THREE.Mesh(coneGeo(0.37, 0.16, 12), mat(0xd6b26a));
      hat.position.y = 1.74; visitor.add(hat);
      // Giỏ mây xách tay
      var basket = new THREE.Mesh(cylGeo(0.16, 0.12, 0.2, 9), mat(0xa8895a));
      basket.position.set(0.38, 0.78, 0); visitor.add(basket);
      visitor.position.copy(visitPath[0]);
      visitor.visible = false;
      scene.add(visitor);
    })();

