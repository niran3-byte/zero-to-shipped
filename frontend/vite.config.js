import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Anything the app requests at /api/... is forwarded to the Express server.
    // In dev this is why we never hit a CORS error: the browser only ever talks
    // to localhost:5173, and Vite makes the cross-port request server-side.
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
