import express from "express";
import "dotenv/config";
import logger from "./utils/logger.js";

function main(dependencies = {}) {
  const PORT = process.env.PORT || 3000;

  const logger = dependencies.logger || console;

  const app = express();

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });

  process.on("SIGTERM", () => {
    logger.info("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      logger.info("HTTP server closed");
    });
  });
}

main({ logger });
