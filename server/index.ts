import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Set NODE_ENV if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Create admin user if it doesn't exist
  try {
    const adminUser = await storage.getUserByUsername("admin");
    if (!adminUser) {
      // Get admin credentials from environment variables
    const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin";
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@example.com";
      
    console.log(`Creating default admin user (username: ${adminUsername}, password: ${adminPassword})`);
      
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
    // Create admin user
    await storage.createUser({
      username: adminUsername,
      password: hashedPassword,
      email: adminEmail,
      fullName: "Administrator",
      role: "admin"
    });
      
      console.log("Default admin user created successfully");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

    const port = 3000; // Sử dụng cổng 3000
  server.listen(port, "127.0.0.1", () => {
    log(`serving on port ${port}`);
  });
})();
