import "reflect-metadata";
import { container, InjectionToken } from "tsyringe";
import { LLMProviderConfig } from "../../services/llm-provider.interface.js";
import { OpenAIProvider } from "../llm/openai-provider.js";
import { LLMClientService } from "../../services/llm-client-service.js";
import { Parser } from "../../services/parser-service.js";
import { EntriesController } from "../../controllers/entries-controller.js";
import logger from "../../utils/logger.js";
import { DITokens } from "./tokens.js";

/**
 * Initializes and configures the dependency injection container.
 * Registers all singleton and transient services used throughout the application.
 */
export function setupDIContainer(): void {
  // Register logger as singleton
  container.registerInstance("logger", logger);

  // Register LLM Provider Configuration
  const llmConfig = new LLMProviderConfig({
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    temperature: parseFloat(process.env.LLM_TEMPERATURE || "0.7"),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || "256", 10),
  });

  // Register OpenAI Provider as singleton using Symbol token
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }
  const llmProvider = new OpenAIProvider(apiKey, llmConfig);
  container.registerInstance(DITokens.LLMProvider, llmProvider);

  // Register LLMClientService as singleton
  const llmClientService = new LLMClientService(logger);
  container.registerInstance(DITokens.LLMClientService, llmClientService);

  // Register Parser as singleton
  const parser = new Parser(llmClientService, llmProvider, logger);
  container.registerInstance(DITokens.Parser, parser);

  // Register EntriesController as singleton
  const entriesController = new EntriesController(parser);
  container.registerInstance(DITokens.EntriesController, entriesController);
}

/**
 * Resolves dependencies from the DI container.
 * Usage: const service = resolveDependency(DITokens.Parser);
 */
export function resolveDependency<T>(token: InjectionToken<T>): T {
  return container.resolve(token);
}

export { container };
