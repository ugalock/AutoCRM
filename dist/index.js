// server/index.ts
import express2 from "express";
import cors from "cors";
import path3 from "path";
import { fileURLToPath as fileURLToPath3 } from "url";
import { createServer } from "http";

// server/vite.ts
import express from "express";
import fs from "fs";
import path2, { dirname as dirname2 } from "path";
import { fileURLToPath as fileURLToPath2 } from "url";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = dirname(__filename);
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  },
  define: {
    "process.env.VITE_SUPABASE_URL": JSON.stringify(process.env.VITE_SUPABASE_URL),
    "process.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    "process.env.VITE_SUPABASE_JWT_SECRET": JSON.stringify(process.env.VITE_SUPABASE_JWT_SECRET)
  }
});

// server/vite.ts
var __filename2 = fileURLToPath2(import.meta.url);
var __dirname2 = dirname2(__filename2);
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        if (msg.includes("[TypeScript] Found 0 errors. Watching for file changes")) {
          log("no errors found", "tsc");
          return;
        }
        if (msg.includes("[TypeScript] ")) {
          const [errors, summary] = msg.split("[TypeScript] ", 2);
          log(`${summary} ${errors}\x1B[0m`, "tsc");
          return;
        } else {
          viteLogger.error(msg, options);
          process.exit(1);
        }
      }
    },
    server: {
      middlewareMode: true,
      hmr: { server }
    },
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        __dirname2,
        "..",
        "client",
        "index.html"
      );
      const template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(__dirname2, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/src/routes/users.ts
import { Router } from "express";

// db/index.ts
import { createClient } from "@supabase/supabase-js";
var supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || ""
);

// server/src/middleware/auth.ts
var verifyAuth = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { data: dbUser, error: dbError } = await supabase.from("users").select("*").eq("email", user.email).single();
    if (dbError || !dbUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.user = dbUser;
    next();
  } catch (error) {
    next(error);
  }
};

// server/src/routes/users.ts
var router = Router();
router.post("/", async (req, res) => {
  const { email, password, organization_id } = req.body;
  try {
    const { data: userData, error: dbError } = await supabase.from("users").insert([
      {
        email,
        organization_id
      }
    ]).select().single();
    if (dbError) throw dbError;
    if (organization_id === "9066e91f-faa2-4a68-8749-af0582dd435c") {
      const { error: employeeError } = await supabase.from("employees").insert([
        {
          user_id: userData.id,
          role: "agent"
          // Default role for new employees
        }
      ]);
      if (employeeError) throw employeeError;
    } else {
      const { error: customerError } = await supabase.from("customers").insert([
        {
          user_id: userData.id,
          is_org_admin: false
          // Default for new customers
        }
      ]);
      if (customerError) throw customerError;
    }
    res.status(201).json(userData);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router.get("/:userId", verifyAuth, async (req, res) => {
  const userId = req.params.userId;
  try {
    const { data: user, error: userError } = await supabase.from("users").select(`
                *,
                employee:employees(
                    id,
                    role,
                    team_id
                ),
                customer:customers(
                    id,
                    is_org_admin,
                    organization:organization_id(*)
                )
            `).eq("id", userId).single();
    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
var users_default = router;

// server/src/routes/tickets.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.get("/", verifyAuth, async (req, res) => {
  const userId = req.user?.id;
  console.log(userId);
  try {
    const response = await supabase.from("tickets").select().eq("assigned_to", userId);
    console.log(response);
    const { data: tickets, error: ticketError } = response;
    if (ticketError) throw ticketError;
    if (!tickets) {
      return res.json({ tickets: [] });
    }
    for (let ticket of tickets) {
    }
    res.json({
      tickets
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router2.get("/:ticketId", verifyAuth, async (req, res) => {
  const { ticketId } = req.params;
  const userId = req.user?.id;
  try {
    const { data: ticket, error: ticketError } = await supabase.from("tickets").select(`
                *,
                customer:customer_id(id, user_id),
                assigned_to:assigned_to_id(id, user_id),
                team:team_id(*),
                tags:ticket_tags(tag:tag_id(*))
            `).eq("id", ticketId).single();
    if (ticketError) throw ticketError;
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    const isAgent = await supabase.from("employees").select("id").eq("user_id", userId).maybeSingle();
    const isCustomer = ticket.customer.user_id === userId;
    if (!isAgent.data && !isCustomer) {
      return res.status(403).json({ error: "Not authorized to view this ticket" });
    }
    const { data: messages, error: messagesError } = await supabase.from("messages").select("*").eq("ticket_id", ticketId).order("created_at", { ascending: true });
    if (messagesError) throw messagesError;
    res.json({
      ...ticket,
      messages: messages || []
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
var tickets_default = router2;

// server/index.ts
var __filename3 = fileURLToPath3(import.meta.url);
var __dirname3 = path3.dirname(__filename3);
var app = express2();
var PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express2.json());
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});
app.use("/users", users_default);
app.use("/tickets", tickets_default);
(async () => {
  try {
    log("Starting server initialization...");
    const server = createServer(app);
    app.use((err, _req, res, _next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`[ERROR] ${status}: ${message}`);
      res.status(status).json({ message });
    });
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
    const PORT2 = 5e3;
    server.listen(PORT2, "0.0.0.0", () => {
      log(`Server started successfully on port ${PORT2}`);
    });
  } catch (error) {
    log(`[FATAL] Server failed to start: ${error}`);
    process.exit(1);
  }
})();
