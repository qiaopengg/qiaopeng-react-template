import path from "node:path";
import process from "node:process";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteBabel from "vite-plugin-babel";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    viteBabel({
      babelConfig: {
        plugins: [["babel-plugin-react-compiler", {}]]
      }
    }),
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-is": "react"
    }
  },
  build: {
    cssCodeSplit: true,
    sourcemap: process.env.NODE_ENV !== "production",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-dom/client", "react-dom/server"],
          "ui-vendor": [
            "@radix-ui/react-avatar",
            "@radix-ui/react-collapsible",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-popover",
            "@radix-ui/react-select",
            "@radix-ui/react-separator",
            "@radix-ui/react-slot",
            "@radix-ui/react-tooltip"
          ],
          "utils-vendor": ["clsx", "tailwind-merge", "class-variance-authority"],
          "form-router-vendor": ["react-hook-form", "@hookform/resolvers", "react-router", "zod"],
          "misc-vendor": ["date-fns", "lucide-react", "sonner"]
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split(".") || [];
          let extType = info[info.length - 1];

          if (/\.(?:mp4|webm|ogg|mp3|wav|flac|aac)$/i.test(assetInfo.name || "")) {
            extType = "media";
          } else if (/\.(?:png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || "")) {
            extType = "images";
          } else if (/\.(?:woff2?|eot|ttf|otf)$/i.test(assetInfo.name || "")) {
            extType = "fonts";
          }

          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js"
      }
    },
    minify: "esbuild",
    target: ["es2020", "chrome80", "safari13"],
    cssTarget: ["es2020", "chrome80", "safari13"]
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router",
      "react-hook-form",
      "@hookform/resolvers/zod",
      "zod",
      "clsx",
      "tailwind-merge"
    ]
  },
  // experimental: {
  //   renderBuiltUrl(filename) {
  //     return `/${filename}`;
  //   }
  // },
  define: {
    __DEV__: process.env.NODE_ENV === "development"
  }
});
