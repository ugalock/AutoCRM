import { type Express } from "express";
import expressStaticGzip from "express-static-gzip";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
    const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
    });

    console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
    const vite = await createViteServer({
        ...viteConfig,
        configFile: false,
        customLogger: {
            ...viteLogger,
            error: (msg, options) => {
                if (
                    msg.includes("[TypeScript] Found 0 errors. Watching for file changes")
                ) {
                    log("no errors found", "tsc");
                    return;
                }

                if (msg.includes("[TypeScript] ")) {
                    const [errors, summary] = msg.split("[TypeScript] ", 2);
                    log(`${summary} ${errors}\u001b[0m`, "tsc");
                    return;
                } else {
                    viteLogger.error(msg, options);
                    process.exit(1);
                }
            },
        },
        server: {
            middlewareMode: true,
            hmr: { server },
        },
        appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
        const url = req.originalUrl;

        try {
            const clientTemplate = path.resolve(
                __dirname,
                "..",
                "client",
                "index.html",
            );

            // always reload the index.html file from disk incase it changes
            const template = await fs.promises.readFile(clientTemplate, "utf-8");
            const page = await vite.transformIndexHtml(url, template);
            res.status(200).set({ "Content-Type": "text/html" }).end(page);
        } catch (e) {
            vite.ssrFixStacktrace(e as Error);
            next(e);
        }
    });
}

export function serveStatic(app: Express) {
    // Look for the build directory in multiple possible locations
    const possiblePaths = [
        path.resolve(__dirname, "public"),
        path.resolve(__dirname, "..", "dist", "public"),
        path.resolve(__dirname, "..", "client", "dist"),
        // Amplify specific paths
        path.resolve(__dirname, "..", "client", "build"),
        process.env.STATIC_FILES_PATH // Allow override through env var
    ].filter(Boolean); // Remove undefined paths

    // Find the first path that exists
    const distPath = possiblePaths.find(p => p && fs.existsSync(p));

    if (!distPath) {
        throw new Error(
            `Could not find the build directory. Tried: ${possiblePaths.join(", ")}. Make sure to build the client first.`
        );
    }

    log(`Serving static files from: ${distPath}`);
    
    // Serve static files
    app.use(
        "/",
        expressStaticGzip(distPath, {
            enableBrotli: true,
            orderPreference: ["br"],
            serveStatic: {
                maxAge: "1y",
                cacheControl: true,
            },
        })
    );

    // Handle client-side routing by serving index.html for all unmatched routes
    app.use("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
    });
}
