export class LLMClientService {
  constructor(logger) {
    this.logger = logger;
    this.logger.debug("[LLMClientService] Initialized");
  }

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

  calculateRetryDelay(attempt, baseDelay) {
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000;
    return Math.min(exponentialDelay + jitter, 30000);
  }

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
