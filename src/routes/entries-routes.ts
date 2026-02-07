import { Router } from "express";
import { resolveDependency } from "../infrastructure/di/container.js";
import { DITokens } from "../infrastructure/di/tokens.js";
import type { EntriesController } from "../controllers/entries-controller.js";

/**
 * Registers entries routes
 * Acts as HTTP adapter/presenter layer between Express and EntriesController
 */
export const registerEntriesRoutes = (): Router => {
  const router = Router();
  const controller = resolveDependency<EntriesController>(DITokens.EntriesController);

  // HTTP adapter - converts HTTP request/response to controller calls
  router.post("/", async (req, res, next) => {
    try {
      const entry = await controller.parse(JSON.stringify(req.body.entry));
      res.status(200).json(entry);
    } catch (err) {
      next(err);
    }
  });

  return router;
};
