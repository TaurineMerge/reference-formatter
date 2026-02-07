/**
 * DI Container Tokens
 * These tokens are used to identify dependencies in the DI container
 */
import { LLMClientService } from "../../services/llm-client-service.js";
import { Parser } from "../../services/parser-service.js";
import { EntriesController } from "../../controllers/entries-controller.js";

export const DITokens = {
  LLMProvider: Symbol("ILLMProvider"),
  LLMClientService: LLMClientService,
  Parser: Parser,
  EntriesController: EntriesController,
};
