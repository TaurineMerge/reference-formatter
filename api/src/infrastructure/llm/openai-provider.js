import OpenAI from "openai";
import {
  ILLMProvider,
  ILLMResponse,
  LLMProviderConfig,
} from "../../services/llm-provider.interface.js";

export class OpenAIProvider extends ILLMProvider {
  /**
   * Constructor for OpenAIProvider.
   * @param {string} apiKey - The OpenAI API key to use for generating completions.
   * @param {LLMProviderConfig} [config] - The configuration for the OpenAI provider.
   * @throws {Error} If the OpenAI API key is missing or invalid.
   */
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
   * Generates a completion for the given prompt using the provided parameters.
   * @param {{ systemPrompt: string, userPrompt: string, options: object }} params - The parameters for generating the completion.
   * @param {object} params.systemPrompt - The system prompt to use for generating the completion.
   * @param {string} params.userPrompt - The user prompt to use for generating the completion.
   * @param {object} [params.options] - The options for generating the completion.
   * @param {object} [params.options.params] - The additional parameters to pass to the OpenAI provider.
   * @returns {Promise<ILLMResponse>} A promise for the generated completion, or the full response if options.returnFullResponse is true.
   * @throws {Error} If the OpenAI provider is invalid or if all attempts to generate the completion fail.
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
   * Normalizes an error to have a standard format.
   * If the error is an APIError or has a status property, returns an error with the message and status properties set.
   * Otherwise, returns the error unchanged.
   * @param {Error} error The error to normalize
   * @returns {Error} The normalized error
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
