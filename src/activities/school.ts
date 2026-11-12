// @ts-nocheck
/*
 * GameGiaDinh — assets/src/activities/school.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/activities/school.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 */
import { G, SCHOOL_BELL } from '../core/state';
import { toast, updateHUD } from '../ui/hud';
import { sndBell } from '../world/sound';

    /* ================== ĐƯA CON TỚI TRƯỜNG ================== */
    export function deliverChild() {
      var onTime = G.minutes <= SCHOOL_BELL;
      G.schoolOnTime = onTime; G.childState = "school";
      G.childPlay.mood = onTime ? "vui" : "buon";   // tới trễ là bé buồn cả buổi chiều
      sndBell();
      if (onTime) {
        G.stars++;
        toast("Bé An vào lớp đúng giờ. Cô giáo khen bé ngoan! +1 sao vui vẻ", true);
      } else {
        toast("Bé An tới trường hơi trễ, bé cúi mặt buồn. Mai mình đi sớm hơn nhé.");
      }
      updateHUD();
    }

