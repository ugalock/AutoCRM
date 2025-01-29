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
      "@services": path.resolve(__dirname, "services"),
      "@": path.resolve(__dirname, "client", "src")
    }
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    target: "es2022"
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
    "process.env.VITE_SUPABASE_JWT_SECRET": JSON.stringify(process.env.VITE_SUPABASE_JWT_SECRET),
    "process.env.OPENAI_API_KEY": JSON.stringify(process.env.OPENAI_API_KEY),
    "process.env.LANGSMITH_TRACING": JSON.stringify(process.env.LANGSMITH_TRACING),
    "process.env.LANGSMITH_ENDPOINT": JSON.stringify(process.env.LANGSMITH_ENDPOINT),
    "process.env.LANGSMITH_API_KEY": JSON.stringify(process.env.LANGSMITH_API_KEY),
    "process.env.LANGSMITH_PROJECT": JSON.stringify(process.env.LANGSMITH_PROJECT)
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
    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    next(error);
  }
};
var softVerifyAuth = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    const { data: { user }, error: userError } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser();
    req.user = { id: user?.id, email: user?.email };
    next();
  } catch (error) {
    next(error);
  }
};

// server/src/routes/users.ts
var router = Router();
router.post("/", async (req, res) => {
  const { email, organization_id, user_id } = req.body;
  try {
    const { data: userData, error: dbError } = await supabase.from("users").insert([
      {
        id: user_id,
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
                employee:employees(role),
                customer:customers(is_org_admin),
                organization:organization_id(*)
            `).eq("id", userId).single();
    if (userError) throw userError;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
var users_default = router;

// server/src/routes/tickets.ts
import { Router as Router2 } from "express";
var router2 = Router2();
router2.use(verifyAuth);
router2.get("/", async (req, res) => {
  const userId = req.user?.id;
  try {
    const response = await supabase.from("tickets").select(`
                *,
                requester: users!tickets_customer_id_fkey(*),
                assignee: users!tickets_assigned_to_fkey(*),
                organization: users!tickets_customer_id_fkey (
                    organizations(*)                
                ),
                custom_fields: ticket_custom_fields(*),
                tags: ticket_tags(tag:tag_id(*)),
                ticket_status_history(*)
            `).or(`assigned_to.eq.${userId},customer_id.eq.${userId}`).order("changed_at", { referencedTable: "ticket_status_history", ascending: true });
    console.log(response);
    const { data: tickets, error: ticketError } = response;
    if (ticketError) throw ticketError;
    if (!tickets) {
      return res.json({ tickets: [] });
    }
    for (let ticket of tickets) {
      ticket.organization = ticket.organization.organizations;
    }
    res.json({
      tickets
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router2.get("/:ticketId", async (req, res) => {
  const { ticketId } = req.params;
  const userId = req.user?.id;
  try {
    const { data: ticket, error: ticketError } = await supabase.from("tickets").select(`
                *,
                requester: users!tickets_customer_id_fkey(*, customers(is_org_admin)),
                assignee: users!tickets_assigned_to_fkey(*, employees(role)),
                organization: users!tickets_customer_id_fkey (
                    organizations(*)                
                ),
                custom_fields: ticket_custom_fields(*),
                tags: ticket_tags(tag:tag_id(*)),
                ticket_status_history(*)
            `).eq("id", ticketId).order("changed_at", { referencedTable: "ticket_status_history", ascending: true }).single();
    if (ticketError) throw ticketError;
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    ticket.organization = ticket.organization.organizations;
    ticket.requester.role = { roleCategory: ticket.requester.customers.is_org_admin ? "manager" : "member" };
    ticket.assignee.role = { roleCategory: ticket.assignee.employees.role };
    const isCustomer = ticket.requester.id === userId;
    if (!isCustomer) {
      const isAgent = await supabase.from("employees").select("user_id").eq("user_id", userId).maybeSingle();
      if (!isAgent.data) {
        return res.status(403).json({ error: "Not authorized to view this ticket" });
      }
    }
    const { data: messages, error: messagesError } = await supabase.from("messages").select(`
                *,
                user: users!messages_user_id_fkey(*)
            `).eq("ticket_id", ticketId).order("created_at", { ascending: true });
    if (messagesError) throw messagesError;
    const { data: statuses, error: statusesError } = await supabase.from("ticket_statuses").select(`*`);
    if (statusesError) throw statusesError;
    const { data: statusHistory, error: statusHistoryError } = await supabase.from("ticket_status_history").select(`*`).eq("ticket_id", ticketId).order("changed_at", { ascending: true });
    if (statusHistoryError) throw statusHistoryError;
    res.json({
      data: {
        ticket,
        messages: messages || [],
        statuses,
        statusHistory: statusHistory || []
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router2.patch("/:ticketId", async (req, res) => {
  const { ticketId } = req.params;
  const userId = req.user?.id;
  const updates = req.body;
  try {
    const { data: ticket, error: ticketError } = await supabase.from("tickets").select("*").eq("id", ticketId).single();
    if (ticketError) throw ticketError;
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    if (ticket.customer_id !== userId && ticket.assigned_to !== userId) {
      const { data: user, error: userError } = await supabase.from("users").select(`
                    *,
                    customers(is_org_admin),
                    employees(role)
                `).eq("id", userId).maybeSingle();
      if (userError) throw userError;
      if (!user) {
        return res.status(403).json({ error: "Not authorized to update tickets" });
      }
      console.log(user);
      if (!user.customers.is_org_admin && user.employees.role !== "admin") {
        return res.status(403).json({ error: "Not authorized to update tickets" });
      }
    }
    if (updates.status) {
      if (ticket.status !== updates.status) {
        const { error: historyError } = await supabase.from("ticket_status_history").insert({
          ticket_id: ticketId,
          old_status: ticket.status,
          new_status: updates.status,
          changed_by: userId
        });
        if (historyError) throw historyError;
      }
      const closedStatuses = ["Closed", "Resolved", "Closed (Will Not Fix)"];
      if (closedStatuses.includes(updates.status) && !ticket.closed_at) {
        const { error: ticketNumberError } = await supabase.from("tickets").update({ closed_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", ticketId);
        if (ticketNumberError) throw ticketNumberError;
      } else if (ticket.closed_at && !closedStatuses.includes(updates.status)) {
        const { error: ticketNumberError } = await supabase.from("tickets").update({ closed_at: null }).eq("id", ticketId);
        if (ticketNumberError) throw ticketNumberError;
      }
    }
    const updateData = {};
    const allowedFields = ["status", "priority", "assigned_to", "team_id"];
    for (const field of allowedFields) {
      if (updates[field] !== void 0) {
        updateData[field] = updates[field];
      }
    }
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase.from("tickets").update(updateData).eq("id", ticketId);
      if (updateError) throw updateError;
    }
    res.json({ message: "Ticket updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router2.post("/", async (req, res) => {
  const userId = req.user?.id;
  const { team_id, subject, description, priority, customer_id, channel } = req.body;
  try {
    if (!team_id || !subject || !priority || !customer_id || !channel) {
      return res.status(400).json({
        error: "Missing required fields. Required: team_id, subject, priority, customer_id, channel"
      });
    }
    const allowedPriorities = ["urgent", "high", "normal", "low"];
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({
        error: `Invalid priority. Must be one of: ${allowedPriorities.join(", ")}`
      });
    }
    const { data: team, error: teamError } = await supabase.from("teams").select("*").eq("id", team_id).single();
    if (teamError || !team) {
      return res.status(400).json({ error: "Invalid team_id" });
    }
    const { data: ticket, error: ticketError } = await supabase.from("tickets").insert({
      team_id,
      subject,
      description,
      priority,
      customer_id,
      channel,
      status: "New"
    }).select().single();
    if (ticketError) throw ticketError;
    const { error: historyError } = await supabase.from("ticket_status_history").insert({
      ticket_id: ticket.id,
      old_status: null,
      new_status: "New",
      changed_by: userId
    });
    if (historyError) throw historyError;
    const { data, error: teamMembersError } = await supabase.rpc("get_team_members_with_open_tickets", { teamid: team_id });
    if (teamMembersError) throw teamMembersError;
    if (!data) return res.status(404).json({ error: "No team members found" });
    const teamMembers = data;
    teamMembers.sort((a, b) => b.open_ticket_count - a.open_ticket_count);
    const assignee = teamMembers[0].user_id;
    const { error: assigneeError } = await supabase.from("tickets").update({ assigned_to: assignee }).eq("id", ticket.id);
    if (assigneeError) throw assigneeError;
    res.status(201).json({
      message: "Ticket created successfully",
      data: ticket
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(400).json({ error: error.message });
  }
});
var tickets_default = router2;

// server/src/routes/teams.ts
import { Router as Router3 } from "express";

// server/src/types/types.ts
var AutoCRM = {
  id: "9066e91f-faa2-4a68-8749-af0582dd435c",
  name: "AutoCRM"
};

// server/src/routes/teams.ts
var router3 = Router3();
router3.use(verifyAuth);
router3.get("/", async (req, res) => {
  const userId = req.user?.id;
  try {
    const { data, error: userError } = await supabase.from("users").select(`
                *
            `).eq("id", userId).single();
    if (userError) throw userError;
    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = data;
    const response = await supabase.from("teams").select(`
                *,
                organizations(*)
            `).or(`organization_id.eq.${user.organization_id},organization_id.eq.${AutoCRM.id}`);
    const { data: teams, error: teamError } = response;
    if (teamError) throw teamError;
    if (!teams) {
      return res.status(404).json({ error: "No teams found" });
    }
    res.json({
      teams
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
router3.get("/all", async (req, res) => {
  const userId = req.user?.id;
  try {
    const { data, error: userError } = await supabase.from("users").select(`
                *
            `).eq("id", userId).single();
    if (userError) throw userError;
    if (!data) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = data;
    if (user.organization_id !== AutoCRM.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    const response = await supabase.from("teams").select(`
                *,
                organizations(*)
            `);
    const { data: teams, error: teamError } = response;
    if (teamError) throw teamError;
    if (!teams) {
      return res.status(404).json({ error: "No teams found" });
    }
    res.json({
      teams
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
var teams_default = router3;

// server/src/routes/kb.ts
import { Router as Router4 } from "express";

// db/types.ts
var AutoCRM2 = {
  id: "9066e91f-faa2-4a68-8749-af0582dd435c",
  name: "AutoCRM"
};

// server/src/routes/kb.ts
var router4 = Router4();
router4.get("/", softVerifyAuth, async (req, res) => {
  try {
    const { data: articles, error } = await supabase.from("knowledge_base").select(`
                *,
                organizations(*)
            `).or(`organization_id.eq.${AutoCRM2.id},organization_id.eq.${req.user?.id || "1"}`).order("organization_id").order("category").order("title");
    if (error) throw error;
    const groupedArticles = articles.reduce((acc, article) => {
      const orgName = article.organizations?.name || "General";
      const category = article.category || "Uncategorized";
      if (!acc[orgName]) {
        acc[orgName] = {};
      }
      if (!acc[orgName][category]) {
        acc[orgName][category] = [];
      }
      acc[orgName][category].push(article);
      return acc;
    }, {});
    res.json({ articles: groupedArticles });
  } catch (error) {
    console.error("Error fetching knowledge base articles:", error);
    res.status(500).json({ error: "Failed to fetch knowledge base articles" });
  }
});
var kb_default = router4;

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
app.use("/teams", teams_default);
app.use("/kb", kb_default);
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
