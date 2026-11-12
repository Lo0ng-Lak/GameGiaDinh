// @ts-nocheck
/*
 * GameGiaDinh — assets/src/player/player.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/player/player.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { doInteract } from '../activities/interactions';
import { G } from '../core/state';
import { el, selectSeed } from '../ui/hud';
import { blockers, renderer } from '../world/scene';

    /* ================== NGƯỜI CHƠI (POV) ================== */
    export var player = { x: 13.5, z: 12.5, yaw: 0.85, pitch: -0.04, yawT: 0.85, pitchT: -0.04, vx: 0, vz: 0, bobT: 0, moving: false, speed: 0 };
    export var keys = {};
    document.addEventListener("keydown", function (e) {
      keys[e.code] = true;
      if (e.code === "KeyE") doInteract();
      if (e.code === "Digit1") selectSeed("cai");
      if (e.code === "Digit2") selectSeed("cachua");
      if (e.code === "Digit3") selectSeed("bido");
      if (e.code === "Digit4") selectSeed("ngo");
    });
    document.addEventListener("keyup", function (e) { keys[e.code] = false; });

    // Nhìn quanh: khóa chuột (pointer lock) — bấm 1 lần vào cảnh rồi di chuột tự do,
    // không cần giữ. Khóa không được thì kéo chuột như cũ; điện thoại thì vuốt.
    export var dragging = false, lastPX = 0, lastPY = 0;
    export var mouseLocked = false;
    export var finePointer = !!(window.matchMedia && window.matchMedia("(pointer: fine)").matches);
    export function overlayOpen() {
      return el("start-overlay").classList.contains("show") ||
             document.querySelectorAll(".overlay.show").length > 0;
    }
    export function tryLock() {
      if (!finePointer || mouseLocked || !G.started || G.dayOver || overlayOpen()) return;
      try {
        var rp = renderer.domElement.requestPointerLock();
        if (rp && rp.catch) rp.catch(function () {});
      } catch (err) { /* iframe không cho khóa chuột: dùng kéo như cũ */ }
    }
    document.addEventListener("pointerlockchange", function () {
      mouseLocked = document.pointerLockElement === renderer.domElement;
      dragging = false;
    });
    document.addEventListener("pointerlockerror", function () { mouseLocked = false; });
    export function exitLock() { if (mouseLocked) document.exitPointerLock(); }
    // Điện thoại: xin xoay ngang khi bắt đầu chơi (cần cử chỉ người dùng).
    // Thất bại thì thôi (iOS không cho khóa xoay, một số trình duyệt chặn) —
    // lớp phủ nhắc xoay ngang là dự phòng, game vẫn chạy bình thường.
    export function tryLandscapeLock() {
      try {
        var isTouch = document.body.classList.contains("touch") ||
                      (navigator.maxTouchPoints || 0) > 0 || "ontouchstart" in window;
        if (!isTouch) return;
        var scr = window.screen, orientation = scr && scr.orientation;
        if (!orientation || typeof orientation.lock !== "function") return;
        var doLock = function () {
          try {
            var r = orientation.lock("landscape");
            if (r && typeof r.catch === "function") r.catch(function () {});
          } catch (e) {}
        };
        var docEl = document.documentElement;
        var reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
        if (reqFs) {
          try {
            var p = reqFs.call(docEl);
            if (p && typeof p.then === "function") { p.then(doLock, doLock); return; }
          } catch (e) {}
        }
        doLock();
      } catch (e) {}
    }
    export var joyVec = { x: 0, y: 0 }, joyActive = false;
    export var joyEl = document.getElementById("joy"), knobEl = document.getElementById("joy-knob");
    export function isTouchUI(el) { return el.closest("#toolbar,#goto,#hud-top,.overlay,#joy,#btn-act,#prompt"); }
    renderer.domElement.addEventListener("pointerdown", function (e) {
      if (mouseLocked) { doInteract(); return; }
      dragging = true; lastPX = e.clientX; lastPY = e.clientY;
      tryLock();
    });
    window.addEventListener("pointermove", function (e) {
      if (joyActive && e.pointerId === joyPointerId) {
        var r = joyEl.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        var len = Math.hypot(dx, dy), max = r.width / 2 - 8;
        if (len > max) { dx *= max / len; dy *= max / len; }
        knobEl.style.transform = "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))";
        joyVec.x = dx / max; joyVec.y = dy / max;
        return;
      }
      if (mouseLocked) {
        player.yawT -= (e.movementX || 0) * 0.0023;
        player.pitchT -= (e.movementY || 0) * 0.0021;
        player.pitchT = Math.max(-1.1, Math.min(1.1, player.pitchT));
        return;
      }
      if (!dragging) return;
      player.yawT -= (e.clientX - lastPX) * 0.0042;
      player.pitchT -= (e.clientY - lastPY) * 0.0035;
      player.pitchT = Math.max(-1.1, Math.min(1.1, player.pitchT));
      lastPX = e.clientX; lastPY = e.clientY;
    });
    window.addEventListener("pointerup", function () { dragging = false; });
    // Chạm lần đầu -> bật joystick trên thiết bị cảm ứng
    window.addEventListener("touchstart", function () { document.body.classList.add("touch"); }, { once: true, passive: true });

    export var joyPointerId = null;
    joyEl.addEventListener("pointerdown", function (e) {
      joyActive = true; joyPointerId = e.pointerId; joyEl.setPointerCapture(e.pointerId);
      e.stopPropagation();
    });
    joyEl.addEventListener("pointerup", function () {
      joyActive = false; joyVec.x = 0; joyVec.y = 0;
      knobEl.style.transform = "translate(-50%,-50%)";
    });
    joyEl.addEventListener("pointercancel", function () {
      joyActive = false; joyVec.x = 0; joyVec.y = 0;
      knobEl.style.transform = "translate(-50%,-50%)";
    });
    document.getElementById("btn-act").addEventListener("click", function () { doInteract(); });
    document.getElementById("prompt").addEventListener("click", function () { doInteract(); });

    export function collide(nx, nz) {
      for (var i = 0; i < blockers.length; i++) {
        var b = blockers[i], dx = nx - b.x, dz = nz - b.z, d = Math.hypot(dx, dz);
        if (d < b.r && d > 0.0001) { nx = b.x + dx / d * b.r; nz = b.z + dz / d * b.r; }
      }
      nx = Math.max(-27, Math.min(31, nx));
      nz = Math.max(-20.5, Math.min(19, nz));
      return { x: nx, z: nz };
    }

