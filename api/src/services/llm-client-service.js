/**
 * Orchestrates LLM completion requests with automatic retry logic and error handling.
 * Manages the communication between application code and LLM providers, handling transient failures gracefully.
 *
 * @class
 * @param {object} logger - Logger instance for debugging and error tracking
 */
export class LLMClientService {
  constructor(logger) {
    this.logger = logger;
    this.logger.debug("[LLMClientService] Initialized");
  }

  /**
   * Generates a completion from an LLM provider with automatic retry on transient failures.
   *
   * @param {ILLMProvider} provider - Provider instance to use for generation
   * @param {string} systemPrompt - System-level instructions for the model
   * @param {string} userPrompt - User's input/query
   * @param {object} [options={}] - Generation options
   * @param {number} [options.maxRetries=0] - Maximum retry attempts on retryable errors
   * @param {number} [options.retryDelay=1000] - Base delay in ms before retrying (uses exponential backoff)
   * @param {boolean} [options.returnFullResponse=false] - If true, returns full response object; if false, returns only content string
   *
   * @returns {Promise<string|object>} Generated content string, or full response object if returnFullResponse=true
   * @returns {string} returns.content - Generated text (when returnFullResponse=true)
   * @returns {object} returns.usage - Token usage statistics (when returnFullResponse=true)
   * @returns {object} returns.rawResponse - Original provider response (when returnFullResponse=true)
   *
   * @throws {Error} "Valid LLM provider is required" - If provider is missing or invalid
   * @throws {Error} "Invalid API key" - If provider returns 401 status
   * @throws {Error} "Invalid request: ..." - If provider returns 400 status
   * @throws {Error} Original error - After all retry attempts exhausted on retryable errors
   *
   * @example
   * // Simple usage
   * const content = await client.generateCompletion(
   *   provider,
   *   "You are a helpful assistant",
   *   "What is 2+2?"
   * );
   *
   * @example
   * // With retries and full response
   * const response = await client.generateCompletion(
   *   provider,
   *   "You are a helpful assistant",
   *   "Explain quantum computing",
   *   { maxRetries: 3, returnFullResponse: true }
   * );
   * console.log(response.usage.total_tokens);
   */
  async generateCompletion(provider, systemPrompt, userPrompt, options = {}) {
    if (!provider || typeof provider.generateCompletion !== "function") {
      throw new Error("Valid LLM provider is required");
    }

    const defaultOptions = {
      maxRetries: options.maxRetries ?? 0,
      retryDelay: options.retryDelay || 1000,
      ...options,
    };

    let lastError;

    for (let attempt = 1; attempt <= defaultOptions.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `[LLMClientService] Attempt ${attempt}: Generating completion`,
        );

        const response = await provider.generateCompletion({
          systemPrompt,
          userPrompt,
          options: defaultOptions,
        });

        this.logger.debug(
          `[LLMClientService] Completion generated. Tokens: ${response.usage?.total_tokens || "N/A"}`,
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

        this.logger.error(
          `[LLMClientService] Error (attempt ${attempt}/${defaultOptions.maxRetries}): ${error.message}`,
        );

        if (this.shouldRetry(error) && attempt < defaultOptions.maxRetries) {
          const delay = this.calculateRetryDelay(
            attempt,
            defaultOptions.retryDelay,
          );
          this.logger.warn(`[LLMClientService] Retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (attempt === defaultOptions.maxRetries || !this.shouldRetry(error)) {
          this.logger.error(
            `[LLMClientService] ${this.shouldRetry(error) ? "All attempts failed" : "Non-retryable error"}`,
          );
          throw this.normalizeError(lastError);
        }
      }
    }
  }

  /**
   * Determines if an error should trigger a retry attempt.
   *
   * Retryable conditions:
   * - HTTP 429 (Rate Limit Exceeded)
   * - HTTP 503 (Service Unavailable)
   * - HTTP 504 (Gateway Timeout)
   * - Error message contains: "timeout", "rate limit", "busy", "try again"
   *
   * @param {Error} error - Error to evaluate
   * @returns {boolean} True if error is transient and should be retried
   *
   * @private
   */
  shouldRetry(error) {
    const retryableStatuses = [429, 503, 504];
    const retryableMessages = [
      /timeout/i,
      /rate limit/i,
      /busy/i,
      /try again/i,
    ];

    if (error.status && retryableStatuses.includes(error.status)) {
      return true;
    }

    if (
      error.message &&
      retryableMessages.some((pattern) => pattern.test(error.message))
    ) {
      return true;
    }

    return false;
  }

  /**
   * Calculates retry delay using exponential backoff with jitter.
   *
   * Formula: min(baseDelay * 2^(attempt-1) + random(0-1000ms), 30000ms)
   *
   * @param {number} attempt - Current attempt number (1-based)
   * @param {number} baseDelay - Base delay in milliseconds
   * @returns {number} Calculated delay in milliseconds (capped at 30 seconds)
   *
   * @example
   * calculateRetryDelay(1, 1000) // ~1000-2000ms
   * calculateRetryDelay(2, 1000) // ~2000-3000ms
   * calculateRetryDelay(3, 1000) // ~4000-5000ms
   *
   * @private
   */
  calculateRetryDelay(attempt, baseDelay) {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000);
  }

  /**
   * Normalizes provider errors into consistent application-level errors.
   *
   * @param {Error} error - Original error from provider
   * @returns {Error} Normalized error with user-friendly message
   *
   * @example
   * // HTTP 401 → "Invalid API key"
   * // HTTP 400 → "Invalid request: <original message>"
   * // Other errors → unchanged
   *
   * @private
   */
  normalizeError(error) {
    if (error.status === 401) {
      return new Error("Invalid API key");
    }

    if (error.status === 400) {
      return new Error(`Invalid request: ${error.message}`);
    }

    return error;
  }
}
