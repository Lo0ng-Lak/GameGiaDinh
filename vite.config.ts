import { defineConfig } from 'vite';

// Khai báo tối thiểu cho process.env (dự án không cài @types/node).
declare const process: { env: Record<string, string | undefined> };

// GitHub Pages: repo Lo0ng-Lak/GameGiaDinh ->
// https://lo0ng-lak.github.io/GameGiaDinh/
// Bản build trên GitHub Actions dùng base '/GameGiaDinh/';
// chạy local (npm run dev / preview) vẫn giữ base '/' như cũ.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/GameGiaDinh/' : '/',
});
