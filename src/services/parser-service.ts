import { injectable } from "tsyringe";
import pino from "pino";
import { PARSER_SYSTEM_PROMPT } from "../helpers/parser-llm-sys-prompt.js";
import type { ILLMProvider } from "./llm-provider.interface.js";
import { LLMClientService } from "./llm-client-service.js";

/**
 * Orchestrates parsing of unstructured text into structured JSON using an LLM.
 * Handles system prompts, provider selection, and client service orchestration.
 *
 * @class
 * @param {LLMClientService} llmClientService - Service to manage LLM completion requests
 * @param {ILLMProvider} llmProvider - LLM provider instance (e.g., OpenAIProvider)
 * @param {object} #logger - Logger instance for debug and error tracking
 * @param {string} [systemPrompt=PARSER_SYSTEM_PROMPT] - Instructions guiding parsing behavior
 *
 * @example
 * const parser = new Parser(
 *   clientService,
 *   openaiProvider,
 *   #logger,
 *   "You are a JSON parser. Extract structured data from raw text."
 * );
 */
@injectable()
export class Parser {
  #systemPrompt: string;
  #llmProvider: ILLMProvider;
  #llmClientService: LLMClientService;
  #logger: pino.Logger;

  constructor(
    llmClientService: LLMClientService,
    llmProvider: ILLMProvider,
    logger: pino.Logger,
    systemPrompt = PARSER_SYSTEM_PROMPT
  ) {
    this.#logger = logger;
    this.#systemPrompt = systemPrompt;
    this.#llmProvider = llmProvider;
    this.#llmClientService = llmClientService;
    this.#logger.debug("[Parser] Initialized");
  }

  /**
   * Parses raw text into a structured JSON object using the configured LLM provider.
   * Retries and error handling are delegated to the LLM client service.
   *
   * @param {string} input - Raw text input to parse
   * @returns {Promise<object>} Parsed JSON object
   *
   * @throws {SyntaxError} If the LLM response is not valid JSON
   * @throws {Error} If LLM request fails (network errors, API errors, or provider errors)
   *
   * @example
   * const result = await parser.parse("John Doe, age 30, lives in New York");
   * // Returns: { name: "John Doe", age: 30, city: "New York" }
   */
  async parse(input: string): Promise<object> {
    this.#logger.debug(`[Parser] Parsing input: ${input}`);
    try {
      const response = await this.#llmClientService.generateCompletion(
        this.#llmProvider,
        this.#systemPrompt,
        input,
        {}
      );
      const content = typeof response === "string" ? response : response.content;
      return JSON.parse(content);
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        this.#logger.error(`[Parser] Error parsing input: ${error.message}`);
        throw error;
      }
      this.#logger.error(
        `[Parser] LLM request failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }

  /**
   * Updates the system prompt guiding the parsing behavior.
   *
   * @param {string} systemPrompt - New system prompt
   */
  setSystemPrompt(systemPrompt: string): void {
    this.#systemPrompt = systemPrompt;
    this.#logger.debug("[Parser] System prompt updated");
  }

  /**
   * Updates the LLM provider instance used for parsing.
   *
   * @param {ILLMProvider} llmProvider - New LLM provider
   */
  setLLMProvider(llmProvider: ILLMProvider): void {
    this.#llmProvider = llmProvider;
    this.#logger.debug("[Parser] LLM provider updated");
  }

  /**
   * Updates the LLM client service instance used for managing requests.
   *
   * @param {LLMClientService} llmClientService - New client service instance
   */
  setLLMClientService(llmClientService: LLMClientService): void {
    this.#llmClientService = llmClientService;
    this.#logger.debug("[Parser] LLM client service updated");
  }

  /**
   * Returns the current system prompt.
   *
   * @returns {string} Current system prompt
   */
  getSystemPrompt(): string {
    return this.#systemPrompt;
  }

  /**
   * Returns the current LLM provider.
   *
   * @returns {ILLMProvider} Current provider instance
   */
  getLLMProvider(): ILLMProvider {
    return this.#llmProvider;
  }

  /**
   * Returns the current LLM client service.
   *
   * @returns {LLMClientService} Current client service instance
   */
  getLLMClientService(): LLMClientService {
    return this.#llmClientService;
  }
}
