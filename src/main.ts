// @ts-nocheck
/*
 * GameGiaDinh — assets/src/main.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/main.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import * as THREE from 'three';
// Side-effect modules (no exports): run their builders / attach handlers.
import './world/weather';
import './world/ambient';
import './world/details';
import './world/upgrades'; // PHASE 2: tivi, tủ lạnh, xe máy, chuồng gà mở rộng, sửa nhà
import './ui/goto';
import './ui/structure';
import { currentTarget, findTarget, refreshEggs, setCurrentTarget, thiefSteal } from './activities/interactions';
import { deliverChild } from './activities/school';
import { CROPS, LIVESTOCK } from './core/data';
import { endDay } from './core/day';
import { SAVE_KEY, applySave, pendingSave, readSave, saveGame, setPendingSave } from './core/save';
import { DAY_END, G, SCHOOL_BELL, fmt } from './core/state';
import { rollPrices, shopOverlay } from './economy/shop';
import { applyUpgrades } from './world/upgrades';
import { addMemory, rollQuests } from './events/quests';
import { drawCrop, plots } from './farming/garden';
import { chickenLayCount, refreshDuckEggs } from './farming/livestock';
import { child, childHome, childParts } from './npc/child';
import { husband, husbandParts, husbandPath } from './npc/husband';
import { thief, thiefParts, thiefPath } from './npc/thief';
import { visitPath, visitor, visitorParts } from './npc/visitor';
import { updateVillagers } from './npc/villagers'; // PHASE 3: dân làng đi lại theo lịch sinh hoạt
import { SCHOOL_PLAY_SPOT } from './world/village'; // PHASE 3: sân trường bé An ra chơi
import { collide, finePointer, joyVec, keys, mouseLocked, overlayOpen, player, tryLandscapeLock, tryLock } from './player/player';
import { el, objectiveText, toast, updateHUD } from './ui/hud';
import { gatePos, schoolPos } from './world/buildings';
import { updateSky } from './world/daylight';
import { updateParticles } from './world/particles';
import { _sv, buffalo, camera, chickens, clouds, fireflies, hemi, renderer, scene, skyDome, sun, sunDisc, sunGlow, wellBucket } from './world/scene';
import { AC, beep, initAmbient, setAC, sndBark, sndBell, sndCluck, sndCoin, sndHarvest, sndPour, sndRooster, sndStepReal, startBikeSound, stopBikeSound, updateAmbient, updateBikeSound } from './world/sound';

    /* ================== BẮT ĐẦU ================== */
    // Có nhà đang lưu trong trình duyệt thì cho chơi tiếp đúng ngày đó
    setPendingSave(readSave());
    if (pendingSave && pendingSave.day) {
      el("save-info").style.display = "block";
      el("save-info").textContent = "Nhà mình đang sống tới ngày " + pendingSave.day +
        " — tiền " + fmt(pendingSave.money || 0) + ", " + (pendingSave.stars || 0) +
        " sao vui vẻ, quỹ sửa nhà " + fmt(pendingSave.savings || 0) + ". Bấm nút dưới để sống tiếp ngày đó.";
      el("btn-start").textContent = "Tiếp tục ngày " + pendingSave.day + " của nhà mình";
      el("btn-new-game").style.display = "block";
    }
    el("btn-new-game").addEventListener("click", function () {
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      setPendingSave(null);
      el("save-info").style.display = "none";
      el("btn-new-game").style.display = "none";
      el("btn-start").textContent = "Ra sân, bắt đầu ngày mới";
      toast("Đã xóa nhà cũ. Bấm nút bắt đầu để lập nhà mới từ ngày 1.");
    });
    el("btn-start").addEventListener("click", function () {
      el("start-overlay").classList.remove("show");
      if (pendingSave) { applySave(pendingSave); setPendingSave(null); rollQuests(); }
      // PHASE 2: giá bán theo ngày (ban đầu chưa có thì quay mới) + hiện đồ đã mua
      if (!G.priceDay || Object.keys(G.priceDay).length === 0) rollPrices();
      applyUpgrades();
      G.started = true;
      tryLock();
      tryLandscapeLock();
      try { setAC(new (window.AudioContext || window.webkitAudioContext)()); } catch (e) { setAC(null); }
      initAmbient();
      toast("Chào buổi sáng! Bé An đang chờ ở hiên nhà để đi học.");
      updateHUD();
    });

    /* ================== VÒNG LẶP CHÍNH ================== */
    export var clockT = new THREE.Clock();
    export var fpsEMA = 60, prLevel = 0, prTimer = 0;
    export var PR_STEPS = [2, 1.75, 1.5, 1.3, 1.15, 1];
    export var stepSndT = 0, promptEl = el("prompt"), promptText = el("prompt-text"), objEl = el("objective");
    export var hudT = 0;
    export function animate() {
      requestAnimationFrame(animate);
      var dt = Math.min(clockT.getDelta(), 0.1);
      var tNow = clockT.elapsedTime;

      if (G.started && !G.dayOver) {
        // Đồng hồ game: 1 giây thật = 1,5 phút trong game
        G.minutes += dt * 1.5;
        if (G.minutes >= DAY_END) { G.minutes = DAY_END; endDay(); }
        // Bé chưa ai đưa mà quá 9:00 -> bà Tư đưa hộ
        if (G.childState === "home" && G.minutes > 540) {
          G.childState = "away"; child.visible = false;
          toast("Bà Tư hàng xóm thấy trễ nên đưa bé An đi học hộ rồi.");
        }
        // Gà trống gáy lúc tảng sáng + chuông trường điểm đúng 7:30 — âm thanh quen thuộc của buổi sáng quê
        if (!G.roosterDone && G.minutes >= 332) { G.roosterDone = true; sndRooster(); }
        if (!G.bellDone && G.minutes >= SCHOOL_BELL) {
          G.bellDone = true; sndBell();
          if (G.childState === "home" || G.childState === "follow") toast("Chuông trường điểm 7:30 rồi — nhanh chân đưa bé An tới lớp kẻo trễ!");
        }
        // Cây lớn
        plots.forEach(function (p) {
          if (p.state === "growing" && p.watered) {
            var c = CROPS[p.type];
            p.progress += dt / c.grow;
            // Tới nửa đường mà cần 2 lần tưới thì đất khô, chờ tưới tiếp
            if (c.waters === 2 && p.waterings === 1 && p.progress >= 0.5) {
              p.watered = false; p.progress = 0.5; drawCrop(p);
              toast(c.name + " khô nước rồi — tưới thêm lần nữa nhé.");
            }
            if (p.progress >= 1) {
              p.progress = 1; p.state = "mature"; drawCrop(p); sndHarvest();
              toast(c.name + " đã chín, thu hoạch thôi!");
            } else if (Math.floor(p.progress * 20) !== p._lastStage) {
              p._lastStage = Math.floor(p.progress * 20);
              if (p._lastStage % 7 === 0) drawCrop(p);
            }
          }
          // Để khô lâu thì cây héo dần — đếm thời gian khát nước của từng luống
          if (p.state === "growing" && !p.watered) {
            p.dryT += dt;
            if (p.dryT > 7 && !p._wilted) { p._wilted = true; drawCrop(p); }
          } else if (p._wilted) { p._wilted = false; }
          // Dấu hiệu nhấp nhô
          p.markGroup.children.forEach(function (mk) {
            if (mk.name === "drop") mk.position.y += Math.sin(tNow * 3 + p.x) * 0.0009;
            if (mk.name === "ring") { var s = 1 + Math.sin(tNow * 2.4) * 0.05; mk.scale.set(s, s, 1); }
          });
        });
        // (Cây ăn quả lớn theo ngày — xem overnightTrees() ở cuối ngày, không
        // lớn dần theo giây nữa, để khớp với tuổi cây tính bằng ngày.)
      }

      /* --- Di chuyển --- */
      var fwd = 0, strafe = 0;
      if (G.started && !G.dayOver && !shopOverlay.classList.contains("show") && !el("quest-overlay").classList.contains("show")) {
        if (keys.KeyW || keys.ArrowUp) fwd += 1;
        if (keys.KeyS || keys.ArrowDown) fwd -= 1;
        if (keys.KeyA || keys.ArrowLeft) strafe -= 1;
        if (keys.KeyD || keys.ArrowRight) strafe += 1;
        fwd += -joyVec.y; strafe += joyVec.x;
      }
      var mag = Math.hypot(fwd, strafe);
      if (mag > 1) { fwd /= mag; strafe /= mag; }
      // Đi bộ có quán tính như người thật: tăng tốc dần, dừng cũng trượt một chút, không giật cục
      var sin = Math.sin(player.yaw), cos = Math.cos(player.yaw);
      var walkSpeed = G.owned.bike ? 6.2 : 4.4; // PHASE 2: có xe máy thì đi nhanh hơn ~40%
      var tvx = (-sin * fwd + cos * strafe) * walkSpeed;
      var tvz = (-cos * fwd - sin * strafe) * walkSpeed;
      var acc = 1 - Math.exp(-dt * 9);
      player.vx += (tvx - player.vx) * acc;
      player.vz += (tvz - player.vz) * acc;
      player.speed = Math.hypot(player.vx, player.vz);
      player.moving = player.speed > 0.35;
      if (player.speed > 0.02) {
        var nc = collide(player.x + player.vx * dt, player.z + player.vz * dt);
        if (nc.x === player.x + player.vx * dt) {} else player.vx *= 0.4;
        if (nc.z === player.z + player.vz * dt) {} else player.vz *= 0.4;
        player.x = nc.x; player.z = nc.z;
        player.bobT += dt * (4.5 + player.speed * 1.15);
        stepSndT += dt;
        if (stepSndT > 1.9 / Math.max(1.6, player.speed)) { stepSndT = 0; sndStepReal(); }
      }
      // Nhìn quanh cũng có quán tính: đầu quay êm theo chuột chứ không giật theo từng pixel
      var lookAcc = 1 - Math.exp(-dt * 20);
      player.yaw += (player.yawT - player.yaw) * lookAcc;
      player.pitch += (player.pitchT - player.pitch) * lookAcc;
      // Cúi người xuống khi gieo hạt / thu hoạch / làm việc nặng
      var dipY = 0;
      if (G.dipT > 0) { G.dipT -= dt; dipY = -0.085 * Math.sin(Math.max(0, G.dipT) / 0.32 * Math.PI); }
      var bobY = player.moving ? Math.abs(Math.sin(player.bobT)) * 0.05 * Math.min(1, player.speed / 3) : Math.sin(tNow * 1.6) * 0.012;
      camera.position.set(player.x, 1.6 + bobY + dipY, player.z);
      camera.rotation.order = "YXZ";
      camera.rotation.y = player.yaw;
      camera.rotation.x = player.pitch + (player.moving ? Math.sin(player.bobT * 2) * 0.004 : 0) + dipY * 0.55;
      camera.rotation.z = (player.moving ? Math.sin(player.bobT) * 0.006 : 0) + Math.sin(tNow * 0.9) * 0.0016;

      /* --- Bé An --- */
      // Tan học lúc 16:40: bé tự đi bộ từ cổng trường về nhà, không đứng chờ ai đón
      if (G.started && !G.dayOver && G.childState === "school" && !child.visible && G.minutes >= 1000) {
        G.childState = "return"; G.childPlay.wp = 0;
        child.position.copy(gatePos); child.visible = true;
        toast("Bé An tan học rồi — bé đang tự đi bộ về nhà.");
      }
      if (child.visible) {
        if (G.childState === "follow") {
          var dx = player.x - child.position.x, dz = player.z - child.position.z;
          var d = Math.hypot(dx, dz);
          if (d > 1.15) {
            var cs = Math.min(d - 0.9, dt * 3.6);
            child.position.x += dx / d * cs; child.position.z += dz / d * cs;
            child.rotation.y = Math.atan2(dx, dz);
            var sw = Math.sin(tNow * 9) * 0.5;
            childParts.legL.rotation.x = sw; childParts.legR.rotation.x = -sw;
            childParts.armL.rotation.x = -sw * 0.7; childParts.armR.rotation.x = sw * 0.7;
          } else {
            childParts.legL.rotation.x *= 0.8; childParts.legR.rotation.x *= 0.8;
            childParts.armL.rotation.x *= 0.8; childParts.armR.rotation.x *= 0.8;
          }
          if (Math.hypot(player.x - gatePos.x, player.z - gatePos.z) < 2.1 &&
              Math.hypot(child.position.x - gatePos.x, child.position.z - gatePos.z) < 4.5) deliverChild();
        } else if (G.childState === "school") {
          // Bé đi từ cổng vào cửa trường rồi khuất
          var tx = schoolPos.x - child.position.x, tz = (schoolPos.z + 2.4) - child.position.z;
          var td = Math.hypot(tx, tz);
          if (td > 0.3) {
            child.position.x += tx / td * dt * 2.2; child.position.z += tz / td * dt * 2.2;
            child.rotation.y = Math.atan2(tx, tz);
            var sw2 = Math.sin(tNow * 9) * 0.5;
            childParts.legL.rotation.x = sw2; childParts.legR.rotation.x = -sw2;
            childParts.armR.rotation.x = Math.PI + Math.sin(tNow * 6) * 0.3; // vẫy tay
          } else child.visible = false;
        } else if (G.childState === "return") {
          // Bé tự đi bộ về theo đường làng, tới hiên thì chuyển sang chơi quanh sân
          var rPath = [[16, -13.4], [4, -9.5], [-3, -5], [-7.6, -2.2]];
          var rp = rPath[G.childPlay.wp];
          if (rp) {
            var rdx = rp[0] - child.position.x, rdz = rp[1] - child.position.z;
            var rdd = Math.hypot(rdx, rdz);
            if (rdd < 0.35) {
              G.childPlay.wp++;
              if (G.childPlay.wp >= rPath.length) {
                G.childState = "play"; G.childPlay.spot = -1; G.childPlay.pauseT = 1;
                toast("Bé An về tới nhà rồi: \"Con chào mẹ! Con tự đi bộ về được rồi nè.\"");
              }
            } else {
              child.position.x += rdx / rdd * dt * 2.3; child.position.z += rdz / rdd * dt * 2.3;
              child.rotation.y = Math.atan2(rdx, rdz);
              var rsw = Math.sin(tNow * 9) * 0.5;
              childParts.legL.rotation.x = rsw; childParts.legR.rotation.x = -rsw;
              childParts.armL.rotation.x = -rsw * 0.7; childParts.armR.rotation.x = rsw * 0.7;
            }
          }
        } else if (G.childState === "play") {
          // Bé có đời sống riêng: chạy chơi quanh sân, ngắm gà, ngồi với chó mực, tối thì về hiên học bài
          var cp = G.childPlay;
          if (G.cookedToday && cp.mood === "buon") cp.mood = "vui";   // có cơm ngon mẹ nấu là hết buồn
          var spots = [
            { x: childHome.x, z: childHome.z },                                        // hiên nhà
            { x: window.__dogHome.x + 0.9, z: window.__dogHome.z + 0.4 },             // chơi với chó mực
            { x: 5.5, z: 5.5 },                                                        // đầu vườn rau
            { x: 11.5, z: 4.0 },                                                       // bờ ao ngắm cá
            { x: -1.2, z: 4.2 },                                                       // gần chuồng gà xem gà
            { x: SCHOOL_PLAY_SPOT.x, z: SCHOOL_PLAY_SPOT.z }                          // PHASE 3: ra sân trường chơi
          ];
          if (window.__bananas && window.__bananas[0]) spots.push({ x: window.__bananas[0].x + 1, z: window.__bananas[0].z + 1 });
          var homework = G.minutes >= 1110;   // 18:30 trở đi: về hiên ngồi học bài
          if (cp.spot < 0 || cp.pauseT <= 0) {
            if (homework) cp.spot = 0;
            else { var ns = Math.floor(Math.random() * spots.length); cp.spot = ns === cp.spot ? (ns + 1) % spots.length : ns; }
            cp.pauseT = homework ? 999 : 5 + Math.random() * 7;
          }
          var sp = spots[cp.spot];
          var sdx = sp.x - child.position.x, sdz = sp.z - child.position.z;
          var sdd = Math.hypot(sdx, sdz);
          if (sdd > 0.3) {
            child.position.x += sdx / sdd * dt * 2.5; child.position.z += sdz / sdd * dt * 2.5;
            child.rotation.y = Math.atan2(sdx, sdz);
            var psw = Math.sin(tNow * 10) * 0.55;
            childParts.legL.rotation.x = psw; childParts.legR.rotation.x = -psw;
            childParts.armL.rotation.x = -psw * 0.7; childParts.armR.rotation.x = psw * 0.7;
            child.position.y = Math.abs(Math.sin(tNow * 5)) * 0.03;
          } else {
            cp.pauseT -= dt;
            childParts.legL.rotation.x *= 0.8; childParts.legR.rotation.x *= 0.8;
            childParts.armL.rotation.x *= 0.85;
            // Đứng chơi: lúc vẫy tay, lúc nhảy nhót; buồn thì tay buông thõng, ít nhúc nhích
            childParts.armR.rotation.x = cp.mood === "vui" ? Math.sin(tNow * 2.2) * 0.35 - 0.15 : 0.12;
            child.position.y = cp.mood === "vui" && !homework ? Math.abs(Math.sin(tNow * 3.1)) * 0.035 : 0;
            cp.lineT -= dt;
            if (cp.lineT <= 0) {
              cp.lineT = 38 + Math.random() * 25;
              if (Math.hypot(player.x - child.position.x, player.z - child.position.z) < 7.5) {
                var lines = homework
                  ? ["Bé An: \"Mẹ ơi, bài toán này khó quá, mai mẹ giảng con nhé.\"", "Bé An đang chăm chú viết bài, thỉnh thoảng ngẩng lên cười với mẹ."]
                  : cp.mood === "vui"
                    ? ["Bé An: \"Hôm nay cô khen con đọc chữ to rõ nhất lớp!\"", "Bé An: \"Mẹ ơi, con gà mái mơ đẻ trứng to ơi là to!\"", "Bé An: \"Chút nữa ăn cơm, con phụ mẹ dọn bát nhé.\"", "Bé An hát líu lo một bài cô mới dạy ở lớp."]
                    : ["Bé An: \"Sáng nay con tới lớp trễ, cô nhắc… con buồn.\"", "Bé An ngồi ôm cặp, hôm nay bé ít nói hơn mọi ngày."];
                toast(lines[Math.floor(Math.random() * lines.length)]);
              }
            }
          }
        } else if (G.childState === "home") {
          // Đứng chờ ở hiên, thỉnh thoảng vẫy tay gọi mẹ
          childParts.armR.rotation.x = Math.PI * 0.85 + Math.sin(tNow * 5) * 0.25;
          childParts.armL.rotation.x = 0;
          child.position.y = Math.abs(Math.sin(tNow * 2.2)) * 0.03;
        }
      }
      // PHASE 3: dân làng đi lại theo lịch sinh hoạt — nhà, ruộng, chợ, trường
      updateVillagers(dt, tNow);
      if (window.__gateRing) window.__gateRing.material.opacity = G.childState === "follow" ? 0.65 + Math.sin(tNow * 4) * 0.3 : 0.3;
      if (window.__flag) window.__flag.rotation.y = Math.sin(tNow * 3) * 0.25;
      if (window.__cloths) window.__cloths.forEach(function (c, i) { c.rotation.x = Math.sin(tNow * (1.1 + G.wind * 1.5) + i * 1.3) * (0.05 + G.wind * 0.17); });
      if (buffalo) { var tl = buffalo.getObjectByName("tail"); if (tl) tl.rotation.x = Math.sin(tNow * 1.7) * 0.4; }
      if (wellBucket) wellBucket.position.y = 1.55 + Math.sin(tNow * 1.3) * 0.05;

      /* --- Gà đi lại --- */
      chickens.forEach(function (c, i) {
        var u = c.userData; u.t += dt;
        if (u.t > 3 + i) { u.t = 0; u.ang = Math.random() * Math.PI * 2; }
        // Người tới gần quá thì gà giật mình chạy tản ra, y như gà thật ngoài sân
        var cdx = c.position.x - player.x, cdz = c.position.z - player.z;
        var cdist = Math.hypot(cdx, cdz);
        if (cdist < 1.3 && cdist > 0.01) {
          u.ang = Math.atan2(cdx, cdz); u.flee = 2.4;
          if (Math.random() < dt * 0.8) sndCluck();
        }
        var cSpd = u.speed * (u.flee || 1);
        if (u.flee) u.flee = Math.max(1, u.flee - dt * 2.2);
        var nx = c.position.x + Math.sin(u.ang) * cSpd * dt;
        var nz = c.position.z + Math.cos(u.ang) * cSpd * dt;
        if (nx < -14 || nx > 10 || nz < -6 || nz > 11) { u.ang += Math.PI; }
        else { c.position.x = nx; c.position.z = nz; }
        c.rotation.y = u.ang;
        var head = c.getObjectByName("head");
        if (head) head.position.y = 0.42 + (Math.sin(tNow * 6 + i * 2) > 0.6 ? -0.09 : 0);
      });

      /* --- Hoạt động mới: gà đẻ, cá cắn, chuối chín, chồng về --- */
      if (G.started && !G.dayOver) {
        if (G.smokeBoost > 0) G.smokeBoost -= dt;
        // Cho gà ăn rồi thì chờ đẻ trứng
        if (G.chicken.fed && G.chicken.ready === 0) {
          G.chicken.timer -= dt;
          if (G.chicken.timer <= 0) {
            G.chicken.ready = chickenLayCount(); // PHASE 2: chuồng mở rộng thì đẻ 5–7 trứng
            refreshEggs(); sndCluck();
            toast("Gà đẻ trứng rồi — ra ổ ở chuồng gà nhặt trứng!");
          }
        }
        // PHASE 2: cho vịt ăn rồi thì chờ đẻ trứng vịt ở bờ ao
        if (G.ducks.owned && G.ducks.fed && G.ducks.ready === 0) {
          G.ducks.timer -= dt;
          if (G.ducks.timer <= 0) {
            G.ducks.ready = LIVESTOCK.duckFlock.eggMin + Math.floor(Math.random() * (LIVESTOCK.duckFlock.eggMax - LIVESTOCK.duckFlock.eggMin + 1));
            refreshDuckEggs(); sndCluck();
            toast("Vịt đẻ trứng rồi — ra ổ ở bờ ao nhặt trứng vịt!");
          }
        }
        // Câu cá: chờ -> cắn câu (1,6 giây để giật) -> tuột
        if (G.fish.state !== "idle") {
          var fdx = player.x - window.__fishPos.x, fdz = player.z - window.__fishPos.z;
          if (Math.hypot(fdx, fdz) > 5) {
            G.fish.state = "idle"; window.__bobber.visible = false;
            toast("Đi xa quá, thu cần rồi.");
          } else {
            G.fish.t -= dt;
            if (G.fish.state === "wait" && G.fish.t <= 0) {
              G.fish.state = "bite"; G.fish.t = 1.6; beep(1250, 0.09, "square", 0.08);
              toast("Cá cắn câu! Bấm E giật cần ngay!");
            } else if (G.fish.state === "bite" && G.fish.t <= 0) {
              G.fish.state = "idle"; window.__bobber.visible = false;
              toast("Cá tuột mất rồi… thả câu lại nhé.");
            }
          }
        }
        if (window.__bobber && window.__bobber.visible) {
          window.__bobber.position.y = G.fish.state === "bite"
            ? 0.01 + Math.sin(tNow * 11) * 0.02
            : 0.06 + Math.sin(tNow * 2.2) * 0.018;
          window.__bobber.rotation.y = tNow * 0.8;
        }
        // Chuối hái rồi thì ra buồng mới
        (window.__bananas || []).forEach(function (b) {
          if (!b.ripe) {
            b.timer -= dt;
            if (b.timer <= 0) {
              b.ripe = true; b.mat.color.setHex(0xf2d13c); b.bunch.scale.set(1, 1.3, 1);
            }
          }
        });
        /* --- Sự kiện bất ngờ 1: trộm lẻn vào sân hốt đồ --- */
        var thE = G.thief;
        if (thE.state === "none" && G.thiefDay && G.minutes >= G.thiefAt) {
          thE.state = "in"; thE.wp = 1;
          thief.visible = true; thief.position.copy(thiefPath[0]);
          sndBark();
          toast("Chó sủa ầm ĩ ngoài hiên — có kẻ lạ đang lẻn vào sân!");
        }
        if (thief.visible && (thE.state === "in" || thE.state === "out" || thE.state === "flee")) {
          var tTgt = thE.state === "flee" ? thiefPath[0] : thiefPath[thE.wp];
          var tSpd = thE.state === "in" ? 2.0 : thE.state === "out" ? 3.5 : 4.4;
          var tdx = tTgt.x - thief.position.x, tdz = tTgt.z - thief.position.z;
          var tdd = Math.hypot(tdx, tdz);
          if (tdd < 0.3) {
            if (thE.state === "in") {
              thE.wp++;
              if (thE.wp >= thiefPath.length) { thE.state = "steal"; thE.t = 2.5; thief.rotation.y = Math.PI; }
            } else if (thE.state === "out") {
              thE.wp--;
              if (thE.wp < 0) {
                thief.visible = false; thE.state = "done";
                if (thE.loot > 0) {
                  thE.result = "Trộm chạy thoát, mất " + thE.lootTxt;
                  toast("Trộm chạy thoát rồi! Nó mang theo " + thE.lootTxt + ". Hôm sau nhớ để ý tiếng chó sủa.");
                } else {
                  thE.result = "Trộm chạy thoát tay không";
                  toast("Trộm chạy thoát, may mà nó chưa lấy được gì.");
                }
                updateHUD();
              }
            } else { thief.visible = false; thE.state = "done"; }
          } else {
            thief.position.x += tdx / tdd * dt * tSpd;
            thief.position.z += tdz / tdd * dt * tSpd;
            thief.rotation.y = Math.atan2(tdx, tdz);
            var tsw = Math.sin(tNow * (thE.state === "in" ? 6 : 10.5)) * 0.5;
            thiefParts.legL.rotation.x = tsw; thiefParts.legR.rotation.x = -tsw;
            thiefParts.armL.rotation.x = -tsw * 0.5; thiefParts.armR.rotation.x = tsw * 0.5;
          }
        } else if (thief.visible && thE.state === "steal") {
          thE.t -= dt;
          thief.position.y = -0.05 + Math.abs(Math.sin(tNow * 3)) * 0.03;  // lom khom hốt đồ
          if (thE.t <= 0) {
            thief.position.y = 0;
            thiefSteal();
            thE.state = "out"; thE.wp = thiefPath.length - 2;
            if (thE.loot > 0) toast("Trộm hốt được đồ rồi, đang vác bao chạy ra đường! Đuổi theo mau!");
            else toast("Trộm lục lọi chuồng gà mà chưa lấy được gì — đuổi nó đi!");
          }
        }
        /* --- Chó mực canh nhà: có trộm thì chạy ra sủa đuổi theo, hết chuyện thì về hiên nằm --- */
        if (window.__dog) {
          var dg = window.__dog, dgHome = window.__dogHome;
          if (thief.visible && (thE.state === "in" || thE.state === "steal" || thE.state === "out")) {
            var gx = thief.position.x - dg.position.x, gz = thief.position.z - dg.position.z;
            var gd = Math.hypot(gx, gz);
            if (gd > 1.7) { dg.position.x += gx / gd * dt * 4.6; dg.position.z += gz / gd * dt * 4.6; }
            if (gd > 0.1) dg.rotation.y = Math.atan2(-gz, gx);
            dg.position.y = Math.abs(Math.sin(tNow * 10)) * 0.06;
            G._barkT = (G._barkT || 0) - dt;
            if (G._barkT <= 0) { G._barkT = 1.5 + Math.random() * 0.9; sndBark(); }
          } else if (dg.position.distanceTo(dgHome) > 0.25) {
            var ghx = dgHome.x - dg.position.x, ghz = dgHome.z - dg.position.z;
            var ghd = Math.hypot(ghx, ghz);
            dg.position.x += ghx / ghd * dt * 2.4; dg.position.z += ghz / ghd * dt * 2.4;
            dg.rotation.y = Math.atan2(-ghz, ghx);
            dg.position.y = Math.abs(Math.sin(tNow * 8)) * 0.05;
          } else { dg.position.y = 0; dg.rotation.y = -0.7; }
        }
        /* --- Sự kiện bất ngờ 2: bà Tư hàng xóm qua chơi --- */
        var vsE = G.visit;
        if (vsE.state === "none" && G.minutes >= G.visitAt) {
          vsE.state = "walking"; vsE.wp = 1;
          visitor.visible = true; visitor.position.copy(visitPath[0]);
          toast("Bà Tư hàng xóm xách giỏ qua chơi nhà mình kìa.");
        }
        if (visitor.visible && (vsE.state === "walking" || vsE.state === "leaving")) {
          var vTgt = visitPath[vsE.wp];
          var vdx = vTgt.x - visitor.position.x, vdz = vTgt.z - visitor.position.z;
          var vdd = Math.hypot(vdx, vdz);
          if (vdd < 0.25) {
            if (vsE.state === "walking") {
              vsE.wp++;
              if (vsE.wp >= visitPath.length) { vsE.state = "here"; vsE.t = 0; visitor.rotation.y = -2.2; }
            } else {
              vsE.wp--;
              if (vsE.wp < 0) { visitor.visible = false; vsE.state = "done"; }
            }
          } else {
            visitor.position.x += vdx / vdd * dt * 1.9;
            visitor.position.z += vdz / vdd * dt * 1.9;
            visitor.rotation.y = Math.atan2(vdx, vdz);
            var vsw = Math.sin(tNow * 7) * 0.4;
            visitorParts.legL.rotation.x = vsw; visitorParts.legR.rotation.x = -vsw;
            visitorParts.armL.rotation.x = -vsw * 0.6; visitorParts.armR.rotation.x = vsw * 0.6;
          }
        }
        if (vsE.state === "here") {
          vsE.t += dt;
          visitorParts.legL.rotation.x *= 0.8; visitorParts.legR.rotation.x *= 0.8;
          visitorParts.armL.rotation.x *= 0.8;
          visitorParts.armR.rotation.x = Math.sin(tNow * 1.6) * 0.1;
          if ((vsE.talked && vsE.t > 25) || vsE.t > 110) {
            vsE.state = "leaving"; vsE.wp = visitPath.length - 2;
            toast("Bà Tư về rồi. Hẹn bà hôm khác qua chơi.");
          }
        }
        /* --- Sự kiện bất ngờ 3: mưa rào — rau được tưới miễn phí --- */
        if (!G.rainedToday && G.minutes >= G.rainAt) {
          G.rainedToday = true; G.raining = true; G.rainT = 55;
          if (window.__rain) window.__rain.visible = true;
          var wateredN = 0;
          plots.forEach(function (p) { if (p.state === "growing" && !p.watered) { p.watered = true; wateredN++; drawCrop(p); } });
          toast(wateredN > 0
            ? "Mưa rào đổ xuống bất chợt! " + wateredN + " luống rau được trời tưới miễn phí."
            : "Mưa rào đổ xuống bất chợt! Ngồi hiên ngắm mưa quê một lát.");
        }
        if (G.raining) {
          G.rainT -= dt;
          if (G.rainT <= 0) {
            G.raining = false;
            if (window.__rain) window.__rain.visible = false;
            G.rainbowT = 45;
            toast("Mưa tạnh rồi. Nhìn về phía bắc xem — có cầu vồng sau mưa kìa!");
          }
        }
        // Anh đi làm thuê về — mỗi ngày một giờ khác nhau, có hôm sớm có hôm tối mịt
        if (G.husband.state === "notyet" && G.minutes >= G.husbandAt) {
          G.husband.state = "walking"; G.husband.wp = 1;
          husband.visible = true;
          toast(G.noWorkToday
            ? "Anh về sớm hơn mọi hôm — hình như hôm nay không có việc làm."
            : "Anh đi làm về rồi — đang đi bộ từ đầu đường về nhà.");
        }
      }
      if (husband.visible && G.husband.state === "walking") {
        var wp = husbandPath[G.husband.wp];
        var hx = wp.x - husband.position.x, hz = wp.z - husband.position.z;
        var hd = Math.hypot(hx, hz);
        if (hd < 0.25) {
          G.husband.wp++;
          if (G.husband.wp >= husbandPath.length) {
            G.husband.state = "home"; G.husbandMode = "rest"; G.husbandT = 20 + Math.random() * 20;
            husband.rotation.y = 2.3;
            // Tiền công không ngày nào giống ngày nào: hôm việc nặng được thưởng, hôm nửa buổi, hôm mất việc
            if (G.noWorkToday) {
              G.husband.wage = 0;
              toast("Anh: \"Hôm nay chủ cho nghỉ, không có việc… mai anh ra đồng sớm kiếm việc khác.\" Nhà mình thắt lưng buộc bụng một bữa vậy.", true);
              addMemory("Một ngày anh mất việc làm thuê, cả nhà đạm bạc mà vẫn vui.");
            } else {
              var wr = Math.random();
              if (wr < 0.15) G.husband.wage = Math.round((85000 + Math.random() * 30000) / 1000) * 1000;       // việc nặng, chủ thưởng thêm
              else if (wr < 0.32) G.husband.wage = Math.round((20000 + Math.random() * 12000) / 1000) * 1000;  // làm nửa buổi
              else G.husband.wage = Math.round((38000 + Math.random() * 34000) / 1000) * 1000;                  // ngày thường
              G.money += G.husband.wage; G.totalEarned += G.husband.wage; sndCoin();
              toast(wr < 0.15
                ? "Anh về tới nhà, mặt mày hớn hở: việc nặng mà chủ thưởng hậu — tiền công hôm nay " + fmt(G.husband.wage) + "!"
                : "Anh về tới nhà, đưa vợ tiền công hôm nay: " + fmt(G.husband.wage) + ".", true);
            }
            updateHUD(); saveGame();
          }
        } else {
          husband.position.x += hx / hd * dt * 2.3;
          husband.position.z += hz / hd * dt * 2.3;
          husband.rotation.y = Math.atan2(hx, hz);
          var hsw = Math.sin(tNow * 8) * 0.45;
          husbandParts.legL.rotation.x = hsw; husbandParts.legR.rotation.x = -hsw;
          husbandParts.armL.rotation.x = -hsw * 0.6; husbandParts.armR.rotation.x = hsw * 0.6;
        }
      } else if (husband.visible && G.husband.state === "home") {
        // Anh không đứng yên chờ ai: nghỉ một lát rồi tự kiếm việc phụ vợ — tưới luống khô, chẻ củi ở bếp
        var hHome = husbandPath[husbandPath.length - 1];
        var hMoving = false;
        function husbandWalk(tx, tz, spd) {
          var dx = tx - husband.position.x, dz = tz - husband.position.z;
          var dd = Math.hypot(dx, dz);
          if (dd < 0.3) return true;
          husband.position.x += dx / dd * dt * spd;
          husband.position.z += dz / dd * dt * spd;
          husband.rotation.y = Math.atan2(dx, dz);
          hMoving = true;
          return false;
        }
        if (G.husbandMode === "rest") {
          G.husbandT -= dt;
          if (G.husbandT <= 0) {
            var dryPlot = null;
            plots.forEach(function (p) { if (!dryPlot && p.state === "growing" && !p.watered) dryPlot = p; });
            if (dryPlot) {
              G.husbandMode = "go"; G.husbandPlot = dryPlot;
              G.husbandTx = dryPlot.x + 1.4; G.husbandTz = dryPlot.z;
            } else {
              G.husbandMode = "go"; G.husbandPlot = null;
              G.husbandTx = window.__stovePos.x + 1.6; G.husbandTz = window.__stovePos.z + 0.6;
            }
          }
        } else if (G.husbandMode === "go") {
          if (husbandWalk(G.husbandTx, G.husbandTz, 2.1)) { G.husbandMode = "work"; G.husbandT = G.husbandPlot ? 2.2 : 6; }
        } else if (G.husbandMode === "work") {
          G.husbandT -= dt;
          husbandParts.armR.rotation.x = G.husbandPlot ? Math.sin(tNow * 3) * 0.3 - 0.5 : Math.sin(tNow * 7) * 0.7 - 0.4;
          if (G.husbandT <= 0) {
            if (G.husbandPlot && G.husbandPlot.state === "growing" && !G.husbandPlot.watered) {
              var hp = G.husbandPlot;
              hp.watered = true; hp.waterings++; hp.dryT = 0; hp._wilted = false; drawCrop(hp);
              sndPour();
              if (Math.hypot(player.x - hp.x, player.z - hp.z) < 10) toast("Anh tưới giúp luống " + CROPS[hp.type].name + " đang khô nước.");
            }
            G.husbandMode = "back";
          }
        } else if (G.husbandMode === "back") {
          if (husbandWalk(hHome.x, hHome.z, 2.1)) {
            G.husbandMode = "rest"; G.husbandT = 25 + Math.random() * 30;
            husband.rotation.y = 2.3;
          }
        }
        if (hMoving) {
          var hsw2 = Math.sin(tNow * 8) * 0.45;
          husbandParts.legL.rotation.x = hsw2; husbandParts.legR.rotation.x = -hsw2;
          husbandParts.armL.rotation.x = -hsw2 * 0.6; husbandParts.armR.rotation.x = hsw2 * 0.6;
        } else if (G.husbandMode !== "work") {
          husbandParts.legL.rotation.x *= 0.8; husbandParts.legR.rotation.x *= 0.8;
          husbandParts.armL.rotation.x *= 0.8;
          husbandParts.armR.rotation.x = Math.sin(tNow * 1.4) * 0.08;
        }
      }
      // Khói bếp bốc lên (nấu cơm thì bốc mạnh)
      if (window.__smoke) {
        var sBoost = G.cookedToday || G.smokeBoost > 0 ? 1.5 : 0.55;
        window.__smoke.forEach(function (sp2) {
          var sph = (tNow * 0.13 * sBoost + sp2.userData.ph) % 1;
          sp2.position.set(-17.4 + sph * (0.4 + G.wind * 1.3) + Math.sin(tNow * 0.8 + sp2.userData.ph * 9) * 0.13, 2.75 + sph * 2.4, -1.4 + sph * 0.35);
          var ssc = 0.7 + sph * 2; sp2.scale.set(ssc, ssc, 1);
          sp2.material.opacity = 0.32 * (1 - sph) * (G.smokeBoost > 0 ? 1.3 : 1);
        });
      }
      // Đàn chim bay ngang + lá rơi
      if (window.__birds) window.__birds.forEach(function (b) {
        var bu = b.userData;
        b.position.x = -135 + ((tNow * 4.6 + bu.off * 16) % 285);
        b.position.y = 24 + bu.row + Math.sin(tNow * 0.9 + bu.off) * 0.6;
        b.position.z = -58 + bu.row * 7 + Math.sin(tNow * 0.25 + bu.off) * 2.5;
        var bfl = Math.sin(tNow * 7 + bu.off) * 0.5;
        bu.wl.rotation.z = bfl * 0.45; bu.wr.rotation.z = -bfl * 0.45;
        b.rotation.z = Math.sin(tNow * 0.6 + bu.off) * 0.06;
      });
      if (window.__leaves) {
        var lpos = window.__leaves.geometry.attributes.position;
        for (var li2 = 0; li2 < window.__leafBase.length; li2++) {
          var lb = window.__leafBase[li2], cyc = (tNow * 0.085 + lb.ph) % 1;
          lpos.setXYZ(li2, lb.x + Math.sin(tNow * 0.7 + lb.ph * 8) * 0.55, 3.4 - cyc * 3.35, lb.z + Math.cos(tNow * 0.5 + lb.ph * 6) * 0.3);
        }
        lpos.needsUpdate = true;
      }

      /* --- Mục tiêu + gợi ý + HUD --- */
      hudT += dt;
      if (hudT > 0.2) {
        hudT = 0;
        setCurrentTarget((G.started && !G.dayOver) ? findTarget() : null);
        if (currentTarget) {
          promptText.textContent = currentTarget.label;
          promptEl.classList.add("show");
          promptEl.querySelector(".key").textContent = document.body.classList.contains("touch") ? "Chạm" : "E";
        } else promptEl.classList.remove("show");
        var lh = el("lock-hint");
        if (lh) lh.classList.toggle("show", !!(G.started && !G.dayOver && !mouseLocked && finePointer && !overlayOpen()));
        if (G.started) {
          objEl.innerHTML = objectiveText(); updateHUD();
          // Tự lưu nhà mỗi ~5 giây để tắt trang mở lại vẫn sống tiếp được
          G._saveT = (G._saveT || 0) + 0.2;
          if (G._saveT >= 5) { G._saveT = 0; saveGame(); }
        }
        updateSky();
        // Đang mưa rào: nắng dịu lại, sương mù dày hơn
        if (G.raining) { sun.intensity *= 0.5; hemi.intensity *= 0.75; scene.fog.near = 20; scene.fog.far = 58; }
        else { scene.fog.near = 34; scene.fog.far = 95; }
      }
      fireflies.position.y = Math.sin(tNow * 0.7) * 0.15;
      /* --- Trời, mây, mặt nước, bướm: chuyển động nền --- */
      skyDome.position.copy(camera.position);
      _sv.set(sun.position.x - player.x, sun.position.y - 1.6, sun.position.z - player.z).normalize();
      sunDisc.position.copy(camera.position).addScaledVector(_sv, 205);
      sunDisc.lookAt(camera.position);
      sunGlow.position.copy(sunDisc.position);
      clouds.forEach(function (c) { c.position.x += c.userData.speed * dt; if (c.position.x > 170) c.position.x = -170; });
      if (window.__rain && window.__rain.visible) window.__rain.position.set(player.x, -((tNow * 9) % 4), player.z);
      if (window.__ripples) window.__ripples.forEach(function (rp) {
        var ph = (tNow * 0.22 + rp.userData.off) % 1;
        var rs = 0.3 + ph * 1.6; rp.scale.set(rs, rs, 1);
        rp.material.opacity = 0.45 * (1 - ph);
      });
      if (window.__bflies) window.__bflies.forEach(function (bf) {
        var u = bf.userData, a = tNow * u.sp + u.ph;
        bf.position.set(u.cx + Math.cos(a) * u.r, 0.75 + Math.sin(tNow * 2.1 + u.ph) * 0.22, u.cz + Math.sin(a) * u.r);
        bf.rotation.y = -a;
        var fl = Math.sin(tNow * 13 + u.ph) * 0.85;
        u.wl.rotation.y = fl; u.wr.rotation.y = -fl;
      });
      if (window.__dust) { window.__dust.rotation.y = tNow * 0.008; window.__dust.position.y = Math.sin(tNow * 0.24) * 0.12; }
      /* --- Chi tiết sống: trăng, chó vẫy đuôi, vịt bơi, chuồn chuồn, lửa bếp, bù nhìn --- */
      if (window.__moonG) {
        _sv.set(-0.42, 0.34, -0.84).normalize();
        window.__moonG.position.copy(camera.position).addScaledVector(_sv, 205);
        window.__moonG.lookAt(camera.position);
      }
      if (window.__dogTail) window.__dogTail.rotation.y = Math.sin(tNow * 2.4) * 0.45;
      if (window.__ducks) window.__ducks.forEach(function (dk) {
        dk.a += dt * dk.sp;
        dk.g.position.set(dk.cx + Math.cos(dk.a) * dk.r, 0.05 + Math.sin(tNow * 1.8 + dk.ph) * 0.02, dk.cz + Math.sin(dk.a) * dk.r);
        dk.g.rotation.y = -dk.a;
      });
      if (window.__dragonflies) window.__dragonflies.forEach(function (df) {
        var da = tNow * df.sp + df.ph;
        df.g.position.set(15.5 + Math.cos(da) * df.r, 0.65 + Math.sin(tNow * 2.3 + df.ph) * 0.25, 3 + Math.sin(da * 1.3) * df.r * 0.8);
        df.g.rotation.y = -da;
        var flap = Math.sin(tNow * 42 + df.ph) * 0.55;
        df.w1.rotation.x = flap; df.w2.rotation.x = flap;
      });
      if (window.__stoveLight) {
        var fireBase = (G.smokeBoost > 0 || G.cookedToday) ? 0.6 : 0.32;
        if (G.minutes > 1020) fireBase += 0.22;
        window.__stoveLight.intensity = fireBase * (0.85 + Math.random() * 0.3);
        if (window.__coalMat) window.__coalMat.color.setHSL(0.05, 0.95, 0.45 + Math.random() * 0.14);
      }
      if (window.__scarecrow) window.__scarecrow.rotation.z = Math.sin(tNow * 0.9) * 0.03;
      /* --- Lớp chân thật: gió, đất ướt + vũng nước sau mưa, cầu vồng, bóng mây, xe máy qua đường --- */
      G.wind = Math.max(0.12, Math.min(1, 0.55 + 0.5 * Math.sin(tNow * 0.11) * Math.sin(tNow * 0.043 + 1.7)));
      var wetTgt = G.raining ? 1 : 0;
      G.wet += (wetTgt - G.wet) * Math.min(1, dt * (G.raining ? 0.22 : 0.025));
      if (window.__groundMats) {
        var gshade = 1 - 0.32 * G.wet;
        window.__groundMats.forEach(function (gm) { gm.color.setRGB(gshade, gshade, gshade); });
      }
      if (window.__puddleMat) window.__puddleMat.opacity = Math.max(0, G.wet - 0.3) * 0.8;
      if (G.rainbowT > 0) G.rainbowT -= dt;
      if (window.__rainbowMats) {
        var rbO = 0;
        if (G.rainbowT > 0) rbO = 0.36 * Math.min(1, (45 - G.rainbowT) / 4 + 0.1) * Math.min(1, G.rainbowT / 7);
        window.__rainbowMats.forEach(function (rm) { rm.opacity = rbO; });
      }
      if (window.__cloudShadows) window.__cloudShadows.forEach(function (cs, csi2) {
        cs.position.x += dt * (1.0 + G.wind * 1.8 + csi2 * 0.3);
        if (cs.position.x > 75) cs.position.x = -75;
      });
      var bk = G.bike;
      if (window.__bike) {
        if (bk.state === "idle" && G.started && !G.dayOver) {
          bk.t -= dt;
          if (bk.t <= 0) {
            bk.state = "run";
            bk.dir = Math.random() < 0.5 ? 1 : -1;
            bk.z = bk.dir > 0 ? -15.5 : -13.2;
            bk.x = bk.dir > 0 ? -37 : 39;
            window.__bike.visible = true;
            window.__bike.position.set(bk.x, 0, bk.z);
            window.__bike.rotation.y = bk.dir > 0 ? 0 : Math.PI;
            startBikeSound();
          }
        } else if (bk.state === "run") {
          bk.x += bk.dir * 9.5 * dt;
          window.__bike.position.x = bk.x;
          window.__bike.position.y = Math.abs(Math.sin(tNow * 22)) * 0.015;
          updateBikeSound();
          if ((bk.dir > 0 && bk.x > 41) || (bk.dir < 0 && bk.x < -39)) {
            bk.state = "idle"; bk.t = 25 + Math.random() * 45;
            window.__bike.visible = false; stopBikeSound();
          }
        }
      }
      updateParticles(dt);
      if (G.started) updateAmbient(dt);
      /* --- Tự chỉnh độ nét theo sức máy: máy yếu hạ phân giải cho mượt, máy khỏe nâng lên đẹp --- */
      if (dt > 0.0001) fpsEMA = fpsEMA * 0.95 + (1 / dt) * 0.05;
      prTimer += dt;
      if (prTimer > 2.5) {
        prTimer = 0;
        var maxPR = Math.min(window.devicePixelRatio || 1, 2);
        if (fpsEMA < 42 && prLevel < PR_STEPS.length - 1) { prLevel++; renderer.setPixelRatio(Math.min(maxPR, PR_STEPS[prLevel])); }
        else if (fpsEMA > 57 && prLevel > 0) { prLevel--; renderer.setPixelRatio(Math.min(maxPR, PR_STEPS[prLevel])); }
      }
      renderer.render(scene, camera);
    }

    window.addEventListener("resize", function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    updateHUD();
    updateSky();
    animate();
