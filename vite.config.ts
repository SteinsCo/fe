import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_PROXY_TARGET ?? "http://localhost:8081";

  return {
    plugins: [react(), tsconfigPaths()],
    server: {
      port: 5173,
      // dev에서는 backend로 프록시하여 same-origin으로 작동 (CORS 문제 회피)
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/healthz": { target: apiTarget, changeOrigin: true },
      },
    },
    preview: {
      port: 5173,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/healthz": { target: apiTarget, changeOrigin: true },
      },
    },
  };
});
