import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { Agent } from "node:https";


const BACKEND = "https://stoa-api-production-58bd.up.railway.app";
const BACKEND_IP = "151.101.66.15"; // resolved via nslookup + 8.8.8.8

// Custom HTTPS agent — local DNS can't resolve railway.app, so we hardcode the IP
const proxyAgent = new Agent({
  rejectUnauthorized: false,
  lookup: (_hostname: string, options: any, cb: any) => {
    if (typeof options === "function") {
      cb = options;
      options = {};
    }
    cb(null, [{ address: BACKEND_IP, family: 4 }]);
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: BACKEND,
        changeOrigin: true,
        agent: proxyAgent,
      },
      "/v1": {
        target: BACKEND,
        changeOrigin: true,
        agent: proxyAgent,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
