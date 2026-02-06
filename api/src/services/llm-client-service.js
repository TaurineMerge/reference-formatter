export class LLMClientService {
  #systemPrompt;
  #provider;
  #defaultOptions;

  constructor(provider, systemPrompt, logger, options = {}) {
    if (!provider || typeof provider.generateCompletion !== "function") {
      throw new Error("Valid LLM provider is required");
    }

    this.logger = logger;
    this.#provider = provider;
    this.#systemPrompt = systemPrompt;
    this.#defaultOptions = {
      maxRetries: 0, // Retries are managed by the service instead
      retryDelay: options.retryDelay || 1000,
      ...options,
    };

    this.logger.debug("[LLMClientService] Initialized with provider");
  }

  async generateCompletion(userPrompt, options = {}) {
    const mergedOptions = {
      ...this.#defaultOptions,
      ...options,
    };

    let lastError;

    for (let attempt = 1; attempt <= mergedOptions.maxRetries; attempt++) {
      try {
        this.logger.debug(
          `[LLMClientService] Attempt ${attempt}: Generating completion`,
        );

        const response = await this.#provider.generateCompletion({
          systemPrompt: this.#systemPrompt,
          userPrompt,
          options: mergedOptions,
        });

        this.logger.debug(
          `[LLMClientService] Completion generated. Tokens: ${response.usage?.total_tokens || "N/A"}`,
        );

        if (mergedOptions.returnFullResponse) {
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
          `[LLMClientService] Error (attempt ${attempt}/${mergedOptions.maxRetries}): ${error.message}`,
        );

        if (this.shouldRetry(error) && attempt < mergedOptions.maxRetries) {
          const delay = this.calculateRetryDelay(
            attempt,
            mergedOptions.retryDelay,
          );
          this.logger.warn(`[LLMClientService] Retrying in ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        if (attempt === mergedOptions.maxRetries || !this.shouldRetry(error)) {
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

  getSystemPrompt() {
    return this.#systemPrompt;
  }

  setSystemPrompt(systemPrompt) {
    this.#systemPrompt = systemPrompt;
    this.logger.debug("[LLMClientService] System prompt updated");
  }

  setProvider(provider) {
    if (!provider || typeof provider.generateCompletion !== "function") {
      throw new Error("Valid LLM provider is required");
    }

    this.#provider = provider;
    this.logger.debug("[LLMClientService] Provider updated");
  }
}
