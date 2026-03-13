import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 替换为你的GitHub仓库名（比如仓库叫todo-fullstack，就写/todo-fullstack/）
  base: "/你的仓库名/",
  server: {
    // 开发环境代理，解决本地跨域
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
