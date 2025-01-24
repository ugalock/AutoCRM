import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer, type Server } from "http";
import { setupVite, serveStatic, log } from "./vite";
import usersRouter from '@server/routes/users';
import ticketsRouter from '@server/routes/tickets';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.use('/users', usersRouter);
app.use('/tickets', ticketsRouter);

(async () => {
    try {
        log("Starting server initialization...");

        // Setup authentication
        // try {
        //     setupAuth(app);
        //     log("Authentication setup successful");
        // } catch (authError) {
        //     log(`Authentication setup failed: ${authError}`);
        //     process.exit(1);
        // }

        // Debug middleware for request logging
        // app.use((req, res, next) => {
        //     const start = Date.now();
        //     const path = req.path;
        //     let capturedJsonResponse: Record<string, any> | undefined = undefined;

        //     const originalResJson = res.json;
        //     res.json = function (bodyJson, ...args) {
        //         capturedJsonResponse = bodyJson;
        //         return originalResJson.apply(res, [bodyJson, ...args]);
        //     };

        //     res.on("finish", () => {
        //         const duration = Date.now() - start;
        //         if (path.startsWith("/api")) {
        //             let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        //             if (capturedJsonResponse) {
        //                 logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        //             }

        //             if (logLine.length > 80) {
        //                 logLine = logLine.slice(0, 79) + "…";
        //             }

        //             log(logLine);
        //         }
        //     });

        //     next();
        // });

        // Register routes and get server instance
        const server = createServer(app);

        // Error handling middleware
        app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
            const status = err.status || err.statusCode || 500;
            const message = err.message || "Internal Server Error";
            log(`[ERROR] ${status}: ${message}`);
            res.status(status).json({ message });
        });

        // Setup Vite or static serving
        console.log(app.get("env"));
        try {
            if (app.get("env") === "development") {
                await setupVite(app, server);
                log("Vite setup completed");
            } else {
                serveStatic(app);
                log("Static serving setup completed");
            }
        } catch (setupError) {
            log(`Frontend setup failed: ${setupError}`);
            process.exit(1);
        }

        // Start server on port 5000
        const PORT = 5000;
        server.listen(PORT, "0.0.0.0", () => {
            log(`Server started successfully on port ${PORT}`);
        });
    } catch (error) {
        log(`[FATAL] Server failed to start: ${error}`);
        process.exit(1);
    }
})();