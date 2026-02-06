import OpenAI from "openai";
import {
  ILLMProvider,
  ILLMResponse,
  LLMProviderConfig,
} from "../../services/llm-provider.interface.js";

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
