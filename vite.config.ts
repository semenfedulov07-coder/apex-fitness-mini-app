import vinext from "vinext";
import { defineConfig } from "vite";

/**
 * Portable Vinext configuration.
 *
 * Vercel uses the native Next.js build from package.json. This file remains
 * available for developers who explicitly run Vinext locally and does not
 * depend on OpenAI Sites, Cloudflare Workers, Miniflare or ignored files.
 */
export default defineConfig({
  plugins: [vinext()],
});
