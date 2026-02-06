import express from "express";
import "dotenv/config";
import logger from "./utils/logger.js";

function main(dependencies: { logger?: typeof logger }) {
  const PORT = process.env.PORT || 3000;

  const logger = dependencies.logger || console;

  const app = express();

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });

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
}

main({ logger });
