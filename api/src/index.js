import express from "express";
import "dotenv/config";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const staticPath = join(__dirname, "..", "..", "ui");

  const PORT = process.env.PORT || 3000;

  const app = express();

  app.use(express.static(staticPath));

  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server");
    server.close(() => {
      console.log("HTTP server closed");
    });
  });
}

main();
