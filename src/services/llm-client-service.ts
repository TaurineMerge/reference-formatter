import { injectable } from "tsyringe";
import pino from "pino";
import { ILLMProvider, ILLMResponse } from "./llm-provider.interface.js";

interface GenerateCompletionOptions {
  maxRetries?: number;
  retryDelay?: number;
  returnFullResponse?: boolean;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}
/**
 * Orchestrates LLM completion requests with automatic retry logic and error handling.
 * Manages the communication between application code and LLM providers, handling transient failures gracefully.
 */
@injectable()
export class LLMClientService {
  #logger: pino.Logger;

  constructor(logger: pino.Logger) {
    this.#logger = logger;
    this.#logger.debug("[LLMClientService] Initialized");
  }

  /**
   * Generates a completion from an LLM provider with automatic retry on transient failures.
   * @throws {Error} "Valid LLM provider is required" - If provider is missing or invalid
   * @throws {Error} "Invalid API key" - If provider returns 401 status
   * @throws {Error} "Invalid request: ..." - If provider returns 400 status
   */
  async generateCompletion(
    provider: ILLMProvider,
    systemPrompt: string,
    userPrompt: string,
    options: GenerateCompletionOptions = {}
  ): Promise<string | ILLMResponse> {
    if (!provider || typeof provider.generateCompletion !== "function") {
      throw new Error("Valid LLM provider is required");
    }

    const defaultOptions = {
      maxRetries: options.maxRetries ?? 1,
      retryDelay: options.retryDelay || 1000,
      ...options,
    };

    let lastError;

    for (let attempt = 1; attempt <= defaultOptions.maxRetries; attempt++) {
      try {
        this.#logger.debug(`[LLMClientService] Attempt ${attempt}: Generating completion`);

        const response = await provider.generateCompletion({
          systemPrompt,
          userPrompt,
          options: defaultOptions,
        });

        this.#logger.debug(
          `[LLMClientService] Completion generated. Tokens: ${response.usage?.total_tokens || "N/A"}`
        );

        if (defaultOptions.returnFullResponse) {
          return {
            content: response.content,
            usage: response.usage,
            rawResponse: response.rawResponse,
          };
        }

        return response.content;
      } catch (error) {
        lastError = error;

        const errorMessage = error instanceof Error ? error.message : String(error);
        this.#logger.error(
          `[LLMClientService] Error (attempt ${attempt}/${defaultOptions.maxRetries}): ${errorMessage}`
        );

        if (this.shouldRetry(error) && attempt < defaultOptions.maxRetries) {
          const delay = this.calculateRetryDelay(attempt, defaultOptions.retryDelay);
          this.#logger.warn(`[LLMClientService] Retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (attempt === defaultOptions.maxRetries || !this.shouldRetry(error)) {
          this.#logger.error(
            `[LLMClientService] ${this.shouldRetry(error) ? "All attempts failed" : "Non-retryable error"}`
          );
          throw this.normalizeError(lastError);
        }
      }
    }

    throw this.normalizeError(lastError);
  }

  /**
   * Determines if an error should trigger a retry attempt.
   * Retryable: HTTP 429, 503, 504 or messages with "timeout", "rate limit", "busy", "try again"
   */
  private shouldRetry(error: unknown): boolean {
    const retryableStatuses = [429, 503, 504];
    const retryableMessages = [/timeout/i, /rate limit/i, /busy/i, /try again/i];

    if (error instanceof Error) {
      const apiError = error as unknown as Record<string, unknown>;
      if (apiError.status && retryableStatuses.includes(apiError.status as number)) {
        return true;
      }

      if (error.message && retryableMessages.some((pattern) => pattern.test(error.message))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculates retry delay using exponential backoff with jitter.
   * Formula: min(baseDelay * 2^(attempt-1) + random(0-1000ms), 30000ms)
   */
  private calculateRetryDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000);
  }

  /**
   * Normalizes provider errors into consistent application-level errors.
   * HTTP 401 → "Invalid API key", 400 → "Invalid request: ..."
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      const apiError = error as unknown as Record<string, unknown>;
      if (apiError.status === 401) {
        return new Error("Invalid API key");
      }

      if (apiError.status === 400) {
        return new Error(`Invalid request: ${error.message}`);
      }
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}
