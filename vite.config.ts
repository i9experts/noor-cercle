import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// FIX: Removed lovable-tagger plugin — it's a Lovable platform-specific package
// that causes crashes in standard development environments (white screen / build error)

export default defineConfig({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
