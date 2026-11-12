// @ts-nocheck
/*
 * GameGiaDinh — assets/src/world/particles.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/world/particles.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { scene } from './scene';

    /* ================== HẠT HIỆU ỨNG: nước tưới tóe, đất xới, lá bay, cá quẫy ================== */
    export var PMAX = 340;
    export var pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3);
    export var pVel = new Float32Array(PMAX * 3), pLife = new Float32Array(PMAX), pGrav = new Float32Array(PMAX);
    for (var pInit = 0; pInit < PMAX; pInit++) { pPos[pInit * 3 + 1] = -60; }
    export var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    export var pPoints = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.085, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false }));
    pPoints.frustumCulled = false;
    scene.add(pPoints);
    export var pCursor = 0, _pc = new THREE.Color();
    export function spawnParticles(x, y, z, n, hex, spread, up, life, grav) {
      _pc.setHex(hex);
      for (var i = 0; i < n; i++) {
        var idx = pCursor; pCursor = (pCursor + 1) % PMAX;
        pPos[idx * 3] = x + (Math.random() - 0.5) * 0.25;
        pPos[idx * 3 + 1] = y;
        pPos[idx * 3 + 2] = z + (Math.random() - 0.5) * 0.25;
        pVel[idx * 3] = (Math.random() - 0.5) * spread;
        pVel[idx * 3 + 1] = up * (0.55 + Math.random() * 0.8);
        pVel[idx * 3 + 2] = (Math.random() - 0.5) * spread;
        var shade = 0.8 + Math.random() * 0.35;
        pCol[idx * 3] = _pc.r * shade; pCol[idx * 3 + 1] = _pc.g * shade; pCol[idx * 3 + 2] = _pc.b * shade;
        pLife[idx] = life * (0.6 + Math.random() * 0.7);
        pGrav[idx] = grav;
      }
      pGeo.attributes.color.needsUpdate = true;
    }
    export function updateParticles(dt) {
      var any = false;
      for (var i = 0; i < PMAX; i++) {
        if (pLife[i] <= 0) continue;
        any = true;
        pLife[i] -= dt;
        if (pLife[i] <= 0) { pPos[i * 3 + 1] = -60; continue; }
        pVel[i * 3 + 1] -= pGrav[i] * dt;
        pPos[i * 3] += pVel[i * 3] * dt;
        pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt;
        pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
        if (pPos[i * 3 + 1] < 0.03) { pPos[i * 3 + 1] = 0.03; pVel[i * 3 + 1] = 0; pVel[i * 3] *= 0.7; pVel[i * 3 + 2] *= 0.7; }
      }
      if (any) pGeo.attributes.position.needsUpdate = true;
    }

