// @ts-nocheck
/*
 * GameGiaDinh — assets/src/ui/structure.js
 * Module tach tu ban index.html gon (v8) — GIU NGUYEN logic, khong viet lai.
 * Duong dan dich khi chuyen sang TypeScript + Vite: src/ui/structure.ts
 * Xem assets/CAU-TRUC-DU-AN.md de biet ban do module va lo trinh chuyen doi.
 *
 * Module MOI o ban tach cau truc: chi lam nhiem vu mo/dong bang "Cau truc code"
 * o man hinh bat dau — khong cham vao logic choi.
 */
(function () {
  var openBtn = document.getElementById("btn-structure");
  var closeBtn = document.getElementById("struct-close");
  var overlay = document.getElementById("struct-overlay");
  if (!openBtn || !closeBtn || !overlay) return;
  openBtn.addEventListener("click", function () { overlay.classList.add("show"); });
  closeBtn.addEventListener("click", function () { overlay.classList.remove("show"); });
  overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.classList.remove("show"); });
})();
