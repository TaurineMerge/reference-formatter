/**
 * Base interface that all LLM providers must implement.
 * Defines the contract for generating completions from language models.
 *
 * @example
 * class OpenAIProvider implements ILLMProvider {
 *   async generateCompletion({ systemPrompt, userPrompt, options }) {
 *     // implementation
 *   }
 * }
 */
export interface ILLMProvider {
  /**
   * Generates a completion from the LLM based on system and user prompts.
   * @param params - Parameters for generation
   * @throws {Error} Throws if method is not implemented in provider
   */
  generateCompletion(params: {
    systemPrompt: string;
    userPrompt: string;
    options?: Record<string, unknown>;
  }): Promise<ILLMResponse>;
}

/**
 * Standardized response from an LLM provider.
 * Encapsulates generated text along with usage metadata and original provider response.
 *
 * @example
 * const response = new ILLMResponse("Hello world", { total_tokens: 5 }, rawProviderData);
 * console.log(response.content); // "Hello world"
 */
export class ILLMResponse {
  /** Generated text from the model */
  content: string;
  /** Token usage statistics (provider-specific format) */
  usage: Record<string, unknown> | null;
  /** Original unmodified provider response */
  rawResponse?: Record<string, unknown>;

  constructor(
    content: string,
    usage: Record<string, unknown> | null,
    rawResponse?: Record<string, unknown>
  ) {
    this.content = content;
    this.usage = usage;
    this.rawResponse = rawResponse;
  }
}

/**
 * Configuration object for initializing LLM providers.
 * Defines model parameters, sampling settings, and connection options.
 *
 * @example
 * const config = new LLMProviderConfig({
 *   model: "gpt-4o-mini",
 *   temperature: 0.7,
 *   maxTokens: 1024,
 * });
 */
export class LLMProviderConfig {
  /** Model identifier (e.g., "gpt-4o-mini") */
  model?: string;
  /** Sampling temperature (0–2, higher = more random) */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Nucleus sampling threshold (0–1) */
  topP?: number;
  /** Penalize frequent tokens (-2 to 2) */
  frequencyPenalty?: number;
  /** Penalize repeated topics (-2 to 2) */
  presencePenalty?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts on failure */
  maxRetries?: number;
  /** Provider-specific extra parameters */
  additionalParams: Record<string, unknown>;

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
  }: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    timeout?: number;
    maxRetries?: number;
    additionalParams?: Record<string, unknown>;
  } = {}) {
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
