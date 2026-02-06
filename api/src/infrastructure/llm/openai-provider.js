import OpenAI from "openai";
import {
  ILLMProvider,
  ILLMResponse,
  LLMProviderConfig,
} from "../../services/llm-provider.interface.js";

/**
 * @class OpenAIProvider
 * @implements {ILLMProvider}
 * @description OpenAI API implementation of the LLM provider interface.
 * Handles chat completion requests, applies configuration defaults, and normalizes errors.
 *
 *
 * Creates a new OpenAI provider instance.
 *
 * @param {string} apiKey - OpenAI API key (required)
 * @param {LLMProviderConfig} [config={}] - Optional provider configuration
 *
 * @throws {Error} "OpenAI API key is required" - If apiKey is null, undefined, or empty
 *
 *
 * @example
 * const provider = new OpenAIProvider("sk-...", new LLMProviderConfig({
 *   model: "gpt-4",
 *   temperature: 0.5,
 *   maxTokens: 1000
 * }));
 */
export class OpenAIProvider extends ILLMProvider {
  constructor(apiKey, config = new LLMProviderConfig({})) {
    super();

    if (!apiKey) {
      throw new Error("OpenAI API key is required");
    }

    this.client = new OpenAI({
      apiKey,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
    });

    this.config = {
      model: config.model || "gpt-4o-mini",
      temperature: config.temperature || 0.7,
      maxTokens: config.maxTokens || 256,
      topP: config.topP || 1,
      frequencyPenalty: config.frequencyPenalty || 0,
      presencePenalty: config.presencePenalty || 0,
      ...config.additionalParams,
    };
  }

  /**
   * Generates a chat completion using OpenAI's API.
   *
   * @param {object} params - Parameters for generation
   * @param {string} params.systemPrompt - System-level instructions for the model
   * @param {string} params.userPrompt - User's input/query
   * @param {object} [params.options={}] - Optional overrides
   * @param {object} [params.options.params] - Override default config parameters
   *
   * @returns {Promise<ILLMResponse>} Standardized response object
   * @returns {string} returns.content - Generated completion text
   * @returns {object} returns.usage - Token usage statistics
   * @returns {number} returns.usage.total_tokens - Total tokens used
   * @returns {number} returns.usage.prompt_tokens - Tokens in prompt
   * @returns {number} returns.usage.completion_tokens - Tokens in completion
   * @returns {object} returns.rawResponse - Original OpenAI API response
   *
   * @throws {Error} Normalized error with `.status` and `.originalError` properties
   *
   * @example
   * const response = await provider.generateCompletion({
   *   systemPrompt: "You are a helpful assistant",
   *   userPrompt: "Explain async/await",
   *   options: { params: { temperature: 0.3 } }
   * });
   * console.log(response.content);
   * console.log(response.usage.total_tokens);
   */
  async generateCompletion({ systemPrompt, userPrompt, options = {} }) {
    const params = {
      ...this.config,
      ...options.params,
    };

    try {
      const response = await this.client.chat.completions.create({
        model: params.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: params.temperature,
        max_tokens: params.maxTokens,
        top_p: params.topP,
        frequency_penalty: params.frequencyPenalty,
        presence_penalty: params.presencePenalty,
        ...params.additionalParams,
      });

      return new ILLMResponse(
        response.choices[0].message.content,
        response.usage,
        response,
      );
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  /**
   * Normalizes OpenAI SDK errors into a consistent format for upstream handling.
   *
   * Adds `.status` and `.originalError` properties to facilitate uniform error handling.
   *
   * @param {Error} error - Original OpenAI SDK error
   * @returns {Error} Normalized error with additional metadata
   *
   * @private
   */
  normalizeError(error) {
    if (error.name === "APIError" || error.status) {
      const normalized = new Error(error.message);
      normalized.status = error.status;
      normalized.originalError = error;
      return normalized;
    }
    return error;
  }
}
