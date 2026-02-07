import "reflect-metadata";
import express from "express";
import { Server } from "http";
import "dotenv/config";
import logger from "./utils/logger.js";
import { setupDIContainer } from "./infrastructure/di/container.js";
import { registerEntriesRoutes } from "./routes/entries-routes.js";
import { errorMiddleware } from "./middlewares/error-middleware.js";

// Initialize DI container
setupDIContainer();

// Load environment variables and dependencies
const PORT = process.env.PORT || 3000;
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/entries", registerEntriesRoutes());

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error Middleware
app.use(errorMiddleware(logger));

// Start the server
const server: Server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Graceful shutdown
let isShuttingDown = false;

process.on("SIGTERM", async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info("SIGTERM: Starting shutdown");

  server.close(async () => {
    logger.info("HTTP server closed");
    // Additional time for cleanup tasks
    await new Promise((resolve) => setTimeout(resolve, 5000));
    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
});
