export class LLMClientService {
  /**
   * Constructor for LLMClientService
   * @param {object} logger - The logger object to use for logging
   */
  constructor(logger) {
    this.logger = logger;
    this.logger.debug("[LLMClientService] Initialized");
  }

  /**
   * Generate a completion for the given prompt using the provided LLM provider.
   * @param {object} provider - The LLM provider to use for generating the completion.
   * @param {string} systemPrompt - The system prompt to use for generating the completion.
   * @param {string} userPrompt - The user prompt to use for generating the completion.
   * @param {object} options - The options to use for generating the completion.
   * @param {number} options.maxRetries - The maximum number of times to retry the generation on error.
   * @param {number} options.retryDelay - The delay in milliseconds to wait before retrying the generation on error.
   * @param {boolean} options.returnFullResponse - Whether to return the full response from the LLM provider, or just the content.
   * @returns {Promise<string|object>} A promise for the generated completion, or the full response if options.returnFullResponse is true.
   * @throws {Error} If the LLM provider is invalid or if all attempts to generate the completion fail.
   */
  async generateCompletion(provider, systemPrompt, userPrompt, options = {}) {
    if (!provider || typeof provider.generateCompletion !== "function") {
      throw new Error("Valid LLM provider is required");
    }

    const defaultOptions = {
      maxRetries: 0,
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
   * Returns true if the given error is retryable, false otherwise.
   *
   * A retryable error is one that has a status of 429 (rate limit), 503 (service unavailable), or 504 (gateway timeout).
   * A retryable error is also one that has a message containing "timeout", "rate limit", "busy", or "try again".
   *
   * @param {Error} error The error to check
   * @returns {boolean} True if the error is retryable, false otherwise
   */
  shouldRetry(error) {
    const retryableStatuses = [429, 503, 504]; // Rate limit, service unavailable, gateway timeout
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
   * Calculates the retry delay for the given attempt and base delay.
   *
   * The retry delay is calculated as an exponential backoff with a random jitter added to prevent
   * thundering herd problem. The maximum retry delay is capped at 30 seconds.
   *
   * @param {number} attempt The attempt number (starts at 1)
   * @param {number} baseDelay The base delay in milliseconds
   * @returns {number} The retry delay in milliseconds
   */
  calculateRetryDelay(attempt, baseDelay) {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000);
  }

  /**
   * Normalizes an error to have a standard format.
   *
   * For errors with a status of 401, returns an error with the message "Invalid API key".
   * For errors with a status of 400, returns an error with the message "Invalid request: <error message>".
   * For all other errors, returns the error unchanged.
   *
   * @param {Error} error The error to normalize
   * @returns {Error} The normalized error
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
