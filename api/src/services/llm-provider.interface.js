/**
 * @interface ILLMProvider
 * @description Base interface that all LLM providers must implement.
 * Defines the contract for generating completions from language models.
 *
 * @example
 * class OpenAIProvider extends ILLMProvider {
 *   async generateCompletion({ systemPrompt, userPrompt, options }) {
 *     // implementation
 *   }
 * }
 */
export class ILLMProvider {
  /**
   * Generates a completion from the LLM based on system and user prompts.
   * Must be implemented by any concrete provider.
   *
   * @abstract
   * @param {object} params - Parameters for generation
   * @param {string} params.systemPrompt - System-level instructions for the model
   * @param {string} params.userPrompt - User input/query
   * @param {object} [params.options] - Optional provider-specific options
   * @returns {Promise<ILLMResponse>} Standardized LLM response
   * @throws {Error} Throws if method is not implemented in subclass
   */
  async generateCompletion(params) {
    throw new Error("Method not implemented");
  }
}

/**
 * @class ILLMResponse
 * @description Standardized response from an LLM provider.
 * Encapsulates generated text along with usage metadata and original provider response.
 *
 * @param {string} content - Generated text from the model
 * @param {object|null} usage - Token usage statistics (provider-specific format)
 * @param {object} [rawResponse] - Original unmodified provider response
 *
 * @example
 * const response = new ILLMResponse("Hello world", { total_tokens: 5 }, rawProviderData);
 * console.log(response.content); // "Hello world"
 * console.log(response.usage.total_tokens); // 5
 */
export class ILLMResponse {
  constructor(content, usage, rawResponse) {
    this.content = content;
    this.usage = usage;
    this.rawResponse = rawResponse;
  }
}

/**
 * @class LLMProviderConfig
 * @description Configuration object for initializing LLM providers.
 * Defines model parameters, sampling settings, and connection options.
 *
 * @param {object} params - Configuration parameters
 * @param {string} [params.model] - Model identifier (e.g., "gpt-4o-mini")
 * @param {number} [params.temperature] - Sampling temperature (0–2, higher = more random)
 * @param {number} [params.maxTokens] - Maximum tokens to generate
 * @param {number} [params.topP] - Nucleus sampling threshold (0–1)
 * @param {number} [params.frequencyPenalty] - Penalize frequent tokens (-2 to 2)
 * @param {number} [params.presencePenalty] - Penalize repeated topics (-2 to 2)
 * @param {number} [params.timeout] - Request timeout in milliseconds
 * @param {number} [params.maxRetries] - Maximum retry attempts on failure
 * @param {object} [params.additionalParams={}] - Provider-specific extra parameters
 *
 * @example
 * const config = new LLMProviderConfig({
 *   model: "gpt-4o-mini",
 *   temperature: 0.7,
 *   maxTokens: 1024,
 *   topP: 0.9,
 *   frequencyPenalty: 0,
 *   presencePenalty: 0,
 *   timeout: 5000,
 *   maxRetries: 3,
 *   additionalParams: { logprobs: 5 }
 * });
 */
export class LLMProviderConfig {
  constructor({
    model,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    timeout,
    maxRetries,
    additionalParams = {},
  }) {
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.topP = topP;
    this.frequencyPenalty = frequencyPenalty;
    this.presencePenalty = presencePenalty;
    this.timeout = timeout;
    this.maxRetries = maxRetries;
    this.additionalParams = additionalParams;
  }
}
