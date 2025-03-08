import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
import compression from 'vite-plugin-compression';
// import tailwindcss from '@tailwindcss/vite';

dotenv.config();
// console.log(process.env);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
    plugins: [
	react(),
	compression({
		algorithm: 'brotliCompress',
      		threshold: 10240, // Only compress files larger than 10KB
    	}),
    ],
    resolve: {
        alias: {
            "@db": path.resolve(__dirname, "db"),
            "@services": path.resolve(__dirname, "services"),
            "@": path.resolve(__dirname, "client", "src"),
        },
    },
    root: path.resolve(__dirname, "client"),
    build: {
        outDir: path.resolve(__dirname, "dist/public"),
        emptyOutDir: true,
        target: "es2022",
    },
    server: {
        proxy: {
            '/': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            },
        },
    },
    define: {
        "process.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL),
        "process.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
        "process.env.VITE_SUPABASE_JWT_SECRET": JSON.stringify(process.env.VITE_SUPABASE_JWT_SECRET),
        "process.env.OPENAI_API_KEY": JSON.stringify(process.env.OPENAI_API_KEY),
        "process.env.LANGSMITH_TRACING": JSON.stringify(process.env.LANGSMITH_TRACING),
        "process.env.LANGSMITH_ENDPOINT": JSON.stringify(process.env.LANGSMITH_ENDPOINT),
        "process.env.LANGSMITH_API_KEY": JSON.stringify(process.env.LANGSMITH_API_KEY),
        "process.env.LANGSMITH_PROJECT": JSON.stringify(process.env.LANGSMITH_PROJECT),
    },
});
