// @ts-nocheck
/*
 * GameGiaDinh — assets/src/npc/child.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/npc/child.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { mat, scene } from '../world/scene';

    /* ================== BÉ AN (CON) ================== */
    export var child, childParts = {};
    export var childHome = new THREE.Vector3(-8.6, 0, -1.9);
    (function buildChild() {
      child = new THREE.Group();
      var legs = new THREE.Group();
      [-0.09, 0.09].forEach(function (s, idx) {
        var leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.42, 0.11), mat(0x38618c));
        leg.position.set(s, -0.21, 0);
        var legPivot = new THREE.Group(); legPivot.position.set(s, 0.44, 0);
        legPivot.add(leg); legs.add(legPivot);
        childParts[idx === 0 ? "legL" : "legR"] = legPivot;
      });
      child.add(legs);
      var body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.5, 0.24), mat(0xf3ede0));
      body.position.y = 0.7; body.castShadow = true; child.add(body);
      var pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.4, 0.16), mat(0xd43a2a));
      pack.position.set(0, 0.72, -0.2); child.add(pack);
      [-1, 1].forEach(function (s) {
        var armPivot = new THREE.Group(); armPivot.position.set(s * 0.26, 0.92, 0);
        var arm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.4, 0.09), mat(0xe8b48c));
        arm.position.y = -0.18; armPivot.add(arm); child.add(armPivot);
        childParts[s < 0 ? "armL" : "armR"] = armPivot;
      });
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), mat(0xe8b48c));
      head.position.y = 1.14; head.castShadow = true; child.add(head);
      var hair = new THREE.Mesh(new THREE.SphereGeometry(0.195, 12, 8), mat(0x2b2b2b));
      hair.position.y = 1.2; hair.scale.y = 0.72; child.add(hair);
      child.position.copy(childHome);
      child.rotation.y = 2.4;
      scene.add(child);
    })();

