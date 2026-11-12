// @ts-nocheck
/*
 * GameGiaDinh — assets/src/world/weather.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/world/weather.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
import { G } from '../core/state';
import { ground, mat, road, scene, yard } from './scene';

    /* ================== LỚP CHÂN THẬT: cột điện, bóng mây, vũng nước, cầu vồng, xe máy ================== */
    (function buildRealism() {
      // Mặt đất để làm tối khi mưa ướt
      window.__groundMats = [ground.material, yard.material, road.material];
      // Vũng nước đọng sau mưa: mặt phẳng bóng loáng, hiện dần khi đất ướt
      window.__puddles = [];
      var pudMat = new THREE.MeshPhongMaterial({ color: 0x9fc6d8, shininess: 120, specular: 0xeaf7ff, transparent: true, opacity: 0, depthWrite: false });
      [[2, -6.4, 1.5], [-4.4, 5.9, 1.1], [8.8, -9.9, 1.3], [-13.2, 3.2, 1.0], [0.6, 0.8, 1.7], [-8.8, 1.8, 0.9]].forEach(function (ps) {
        var pm = new THREE.Mesh(new THREE.CircleGeometry(ps[2], 20), pudMat);
        pm.rotation.x = -Math.PI / 2; pm.position.set(ps[0], 0.02, ps[1]);
        pm.scale.set(1, 0.72, 1); pm.renderOrder = 1;
        scene.add(pm); window.__puddles.push(pm);
      });
      window.__puddleMat = pudMat;
      // Bóng mây trôi chầm chậm trên mặt đất — trời có mây là mặt đất có chỗ râm chỗ nắng
      window.__cloudShadows = [];
      var csMat = new THREE.MeshBasicMaterial({ color: 0x1c2b12, transparent: true, opacity: 0.10, depthWrite: false });
      for (var csi = 0; csi < 3; csi++) {
        var cs = new THREE.Mesh(new THREE.CircleGeometry(9 + csi * 3.5, 22), csMat);
        cs.rotation.x = -Math.PI / 2;
        cs.position.set(-50 + csi * 38, 0.025, -14 + csi * 13);
        cs.scale.set(1.5, 0.8, 1); cs.renderOrder = 1;
        scene.add(cs); window.__cloudShadows.push(cs);
      }
      // Cột điện bê tông + dây điện võng dọc đường làng
      var poleMat = mat(0x9a958c), wireMat = new THREE.LineBasicMaterial({ color: 0x2b2b2b, transparent: true, opacity: 0.75 });
      var poleTops = [];
      [-26, -10, 6, 22].forEach(function (px) {
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 6.8, 8), poleMat);
        pole.position.set(px, 3.4, -17.6); pole.castShadow = true; scene.add(pole);
        var arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.7), poleMat);
        arm.position.set(px, 6.15, -17.6); scene.add(arm);
        poleTops.push(px);
      });
      function wire(x1, x2, zOff) {
        var pts = [];
        for (var i = 0; i <= 16; i++) {
          var t = i / 16;
          pts.push(new THREE.Vector3(x1 + (x2 - x1) * t, 6.15 - Math.sin(t * Math.PI) * 0.55, -17.6 + zOff));
        }
        var wg = new THREE.BufferGeometry().setFromPoints(pts);
        scene.add(new THREE.Line(wg, wireMat));
      }
      for (var wi = 0; wi < poleTops.length - 1; wi++) { wire(poleTops[wi], poleTops[wi + 1], -0.75); wire(poleTops[wi], poleTops[wi + 1], 0.75); }
      // Cầu vồng sau cơn mưa rào: vài vòng cung mờ ở phía bắc, hiện một lúc rồi tan
      var rb = new THREE.Group();
      var rbCols = [0xe2483a, 0xef8f2e, 0xf2d13c, 0x6fae4e, 0x3e7dc2];
      window.__rainbowMats = [];
      rbCols.forEach(function (rc, ri) {
        var rm = new THREE.MeshBasicMaterial({ color: rc, transparent: true, opacity: 0, fog: false, depthWrite: false, side: THREE.DoubleSide });
        var arc = new THREE.Mesh(new THREE.TorusGeometry(58 - ri * 1.6, 0.75, 5, 42, Math.PI), rm);
        rb.add(arc); window.__rainbowMats.push(rm);
      });
      rb.position.set(-4, 0, -88); rb.renderOrder = -8; rb.frustumCulled = false;
      scene.add(rb);
      // Xe máy chạy qua đường làng: khung xe, hai bánh, người lái đội mũ bảo hiểm
      var bike = new THREE.Group();
      var tireM2 = mat(0x232326), bodyM2 = mat(0xb03030);
      [-0.42, 0.42].forEach(function (wx) {
        var w = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.05, 8, 16), tireM2);
        w.position.set(wx, 0.27, 0); bike.add(w);
      });
      var bBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.2), bodyM2);
      bBody.position.set(0.02, 0.48, 0); bBody.castShadow = true; bike.add(bBody);
      var bSeat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.24), mat(0x2b2b2b));
      bSeat.position.set(-0.12, 0.62, 0); bike.add(bSeat);
      var bCol = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 6), bodyM2);
      bCol.position.set(0.48, 0.72, 0); bCol.rotation.z = -0.35; bike.add(bCol);
      var rider = new THREE.Group();
      var rTorso = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.55, 0.24), mat(0x4a6a8c));
      rTorso.position.y = 0.55; rTorso.rotation.z = -0.18; rider.add(rTorso);
      var rHead = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat(0xe0aa7e));
      rHead.position.set(0.1, 0.98, 0); rider.add(rHead);
      var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.165, 10, 6), mat(0xe8a33d));
      helmet.position.set(0.1, 1.02, 0); helmet.scale.y = 0.72; rider.add(helmet);
      [-1, 1].forEach(function (s) {
        var rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.1), mat(0x3a3a42));
        rLeg.position.set(0.08, 0.12, s * 0.13); rLeg.rotation.z = -0.5; rider.add(rLeg);
        var rArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.09, 0.09), mat(0x4a6a8c));
        rArm.position.set(0.28, 0.62, s * 0.13); rArm.rotation.z = -0.95; rider.add(rArm);
      });
      rider.position.set(-0.05, 0.6, 0); bike.add(rider);
      bike.position.set(-36, 0, -15.4); bike.visible = false;
      scene.add(bike);
      window.__bike = bike;
    })();

    /* ================== PHASE 4.1: THỜI TIẾT THEO NGÀY + MÙA ==================
     * Mùa suy ra từ số ngày chơi, chu kỳ 60 ngày kiểu miền Nam Việt Nam:
     *   ngày 1–30: Mùa mưa — mưa/giông ~50% số ngày
     *   ngày 31–60: Mùa khô — mưa/giông chỉ ~10% số ngày
     * rồi lặp lại (ngày 61 lại là mùa mưa...). rollWeather() bốc thời tiết
     * mỗi sáng (nút "Ngày mới" gọi), rồi điều khiển cơn mưa rào có sẵn ở
     * main.ts: ngày mưa => mưa tới đúng giờ đã bốc, ngày nắng/mây => không
     * mưa (rainAt = Infinity). Mưa tưới miễn phí cả luống rau lẫn cây ăn
     * quả (xem startRain() trong main.ts). Giông = mưa lâu hơn + trời tối
     * hơn + có cơ hội nhỏ quật ngã 1 luống rau chín (xem startRain).
     * Mùa khô: rau khát nước héo nhanh gấp đôi (dryT tăng gấp đôi, main.ts).
     */
    export var SEASON_CYCLE = 60;            // 1 chu kỳ = 60 ngày: 30 mưa + 30 khô
    export var SEASON_RAINY_DAYS = 30;
    export var SEASONS = {
      rainy: { name: "Mùa mưa" },
      dry: { name: "Mùa khô" }
    };
    export var WEATHERS = {
      sunny: { name: "Nắng", icon: "☀️" },
      cloudy: { name: "Nhiều mây", icon: "⛅" },
      rain: { name: "Mưa rào", icon: "🌧️" },
      storm: { name: "Giông bão", icon: "⛈️" }
    };
    // Xác suất trong mùa mưa: mưa 35%, giông 15%, mây 25%, nắng 25%
    // (mưa/giông 50%). Trong mùa khô: mưa 7%, giông 3%, mây 25%, nắng 65%
    // (mưa/giông 10%).
    export var WEATHER_ODDS = {
      rainy: { rain: 0.35, storm: 0.15, cloudy: 0.25, sunny: 0.25 },
      dry: { rain: 0.07, storm: 0.03, cloudy: 0.25, sunny: 0.65 }
    };

    export function seasonOf(day) {
      var d = ((day - 1) % SEASON_CYCLE) + 1;
      return d <= SEASON_RAINY_DAYS ? "rainy" : "dry";
    }
    export function seasonName(s) { return (SEASONS[s] || SEASONS.rainy).name; }
    export function weatherName(w) { return (WEATHERS[w] || WEATHERS.sunny).name; }
    export function weatherIcon(w) { return (WEATHERS[w] || WEATHERS.sunny).icon; }
    export function weatherLabel(w, s) {
      return weatherIcon(w) + " " + weatherName(w) + " · " + seasonName(s);
    }
    // Bốc thời tiết cho ngày hiện tại (G.day), đặt giờ + độ dài cơn mưa.
    // Trả về loại thời tiết đã bốc.
    export function rollWeather() {
      var season = seasonOf(G.day);
      G.season = season;
      var odds = WEATHER_ODDS[season];
      var r = Math.random(), w;
      if (r < odds.rain) w = "rain";
      else if (r < odds.rain + odds.storm) w = "storm";
      else if (r < odds.rain + odds.storm + odds.cloudy) w = "cloudy";
      else w = "sunny";
      G.weather = w;
      G.rainToday = (w === "rain" || w === "storm");
      if (w === "storm") {
        G.rainAt = 660 + Math.random() * 180;   // giông tới sớm hơn: 11:00–14:00
        G.rainLen = 110;                        // giông mưa lâu gấp đôi mưa rào
      } else if (w === "rain") {
        G.rainAt = 780 + Math.random() * 150;   // mưa rào: 13:00–15:30 như cũ
        G.rainLen = 55;
      } else {
        G.rainAt = Infinity;                    // nắng/mây: hôm nay không mưa
        G.rainLen = 55;
      }
      G.raining = false; G.rainT = 0; G.rainedToday = false;
      G.stormHit = false; G.stormDamaged = false;
      return w;
    }
    // Dòng tóm tắt thời tiết cho bảng "Hết ngày" (day.ts).
    export function weatherSummaryText() {
      var s = seasonName(G.season || seasonOf(G.day));
      if (G.weather === "rain") return "Có mưa rào, rau được trời tưới · " + s;
      if (G.weather === "storm")
        return "Giông bão" + (G.stormHit ? ", quật ngã 1 luống rau chín" : ", rau được trời tưới") + " · " + s;
      if (G.weather === "cloudy") return "Trời nhiều mây, không mưa · " + s;
      return "Nắng cả ngày · " + s;
    }

