import { describe, it, expect, beforeEach, vi } from "vitest";
import { LLMClientService } from "../llm-client-service.js";

describe("LLMClientService", () => {
  let mockProvider;
  let mockLogger;
  let service;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    mockProvider = {
      generateCompletion: vi.fn(),
    };

    service = new LLMClientService(
      mockProvider,
      "You are a helpful assistant",
      mockLogger,
      { maxRetries: 3 },
    );
  });

  describe("Constructor", () => {
    it("should initialize with valid provider", () => {
      expect(service).toBeDefined();
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[LLMClientService] Initialized with provider",
      );
    });

    it("should throw error when provider is null", () => {
      expect(() => {
        new LLMClientService(null, "prompt", mockLogger);
      }).toThrow("Valid LLM provider is required");
    });

    it("should throw error when provider lacks generateCompletion method", () => {
      expect(() => {
        new LLMClientService({}, "prompt", mockLogger);
      }).toThrow("Valid LLM provider is required");
    });

    it("should throw error when provider is undefined", () => {
      expect(() => {
        new LLMClientService(undefined, "prompt", mockLogger);
      }).toThrow("Valid LLM provider is required");
    });

    it("should set default options", () => {
      const customService = new LLMClientService(
        mockProvider,
        "prompt",
        mockLogger,
        { retryDelay: 2000 },
      );
      expect(customService).toBeDefined();
    });
  });

  describe("generateCompletion", () => {
    it("should return content on successful completion", async () => {
      const mockResponse = {
        content: "Test response",
        usage: { total_tokens: 50 },
        rawResponse: {},
      };

      mockProvider.generateCompletion.mockResolvedValue(mockResponse);

      const result = await service.generateCompletion("test prompt");

      expect(result).toBe("Test response");
      expect(mockProvider.generateCompletion).toHaveBeenCalledWith({
        systemPrompt: "You are a helpful assistant",
        userPrompt: "test prompt",
        options: expect.objectContaining({ maxRetries: 3 }),
      });
    });

    it("should return full response when returnFullResponse option is true", async () => {
      const mockResponse = {
        content: "Test response",
        usage: { total_tokens: 50 },
        rawResponse: { id: "123" },
      };

      mockProvider.generateCompletion.mockResolvedValue(mockResponse);

      const result = await service.generateCompletion("test prompt", {
        returnFullResponse: true,
      });

      expect(result).toEqual({
        content: "Test response",
        usage: { total_tokens: 50 },
        rawResponse: { id: "123" },
      });
    });

    it("should retry on retryable error", async () => {
      const retryableError = new Error("Rate limit exceeded");
      retryableError.status = 429;

      const mockResponse = {
        content: "Success after retry",
        usage: { total_tokens: 50 },
        rawResponse: {},
      };

      mockProvider.generateCompletion
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.generateCompletion("test prompt");

      expect(result).toBe("Success after retry");
      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(2);
    });

    it("should retry multiple times on consecutive retryable errors", async () => {
      const retryableError = new Error("Service unavailable");
      retryableError.status = 503;

      const mockResponse = {
        content: "Success after multiple retries",
        usage: { total_tokens: 50 },
        rawResponse: {},
      };

      mockProvider.generateCompletion
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.generateCompletion("test prompt");

      expect(result).toBe("Success after multiple retries");
      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(3);
    });

    it("should throw error when max retries exceeded", async () => {
      const retryableError = new Error("Timeout");
      retryableError.status = 504;

      mockProvider.generateCompletion.mockRejectedValue(retryableError);

      await expect(service.generateCompletion("test prompt")).rejects.toThrow(
        "Timeout",
      );

      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(3);
    });

    it("should throw non-retryable error immediately", async () => {
      const nonRetryableError = new Error("Invalid request");
      nonRetryableError.status = 400;

      mockProvider.generateCompletion.mockRejectedValue(nonRetryableError);

      await expect(service.generateCompletion("test prompt")).rejects.toThrow(
        "Invalid request: Invalid request",
      );

      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(1);
    });

    it("should retry on timeout message", async () => {
      const timeoutError = new Error("Request timeout");

      const mockResponse = {
        content: "Success after timeout retry",
        usage: { total_tokens: 50 },
        rawResponse: {},
      };

      mockProvider.generateCompletion
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.generateCompletion("test prompt");

      expect(result).toBe("Success after timeout retry");
      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(2);
    });

    it("should retry on rate limit message", async () => {
      const rateLimitError = new Error("Rate limit exceeded");

      const mockResponse = {
        content: "Success after rate limit",
        usage: { total_tokens: 50 },
        rawResponse: {},
      };

      mockProvider.generateCompletion
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(mockResponse);

      const result = await service.generateCompletion("test prompt");

      expect(result).toBe("Success after rate limit");
    });

    it("should log attempts and errors", async () => {
      const mockResponse = {
        content: "Test response",
        usage: { total_tokens: 100 },
        rawResponse: {},
      };

      mockProvider.generateCompletion.mockResolvedValue(mockResponse);

      await service.generateCompletion("test prompt");

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[LLMClientService] Attempt 1: Generating completion",
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.stringContaining("Tokens: 100"),
      );
    });

    it("should merge options correctly", async () => {
      const mockResponse = {
        content: "Test response",
        usage: { total_tokens: 75 },
        rawResponse: {},
      };

      mockProvider.generateCompletion.mockResolvedValue(mockResponse);

      await service.generateCompletion("test prompt", {
        temperature: 0.5,
      });

      expect(mockProvider.generateCompletion).toHaveBeenCalledWith({
        systemPrompt: "You are a helpful assistant",
        userPrompt: "test prompt",
        options: expect.objectContaining({
          temperature: 0.5,
          maxRetries: 3,
        }),
      });
    });

    it("should handle 401 status error", async () => {
      const authError = new Error("Unauthorized");
      authError.status = 401;

      mockProvider.generateCompletion.mockRejectedValue(authError);

      await expect(service.generateCompletion("test prompt")).rejects.toThrow(
        "Invalid API key",
      );
    });
  });

  describe("shouldRetry", () => {
    it("should return true for 429 status (rate limit)", () => {
      const error = new Error("Rate limit");
      error.status = 429;

      expect(service.shouldRetry(error)).toBe(true);
    });

    it("should return true for 503 status (service unavailable)", () => {
      const error = new Error("Service unavailable");
      error.status = 503;

      expect(service.shouldRetry(error)).toBe(true);
    });

    it("should return true for 504 status (gateway timeout)", () => {
      const error = new Error("Gateway timeout");
      error.status = 504;

      expect(service.shouldRetry(error)).toBe(true);
    });

    it("should return false for 400 status (bad request)", () => {
      const error = new Error("Bad request");
      error.status = 400;

      expect(service.shouldRetry(error)).toBe(false);
    });

    it("should return false for 401 status (unauthorized)", () => {
      const error = new Error("Unauthorized");
      error.status = 401;

      expect(service.shouldRetry(error)).toBe(false);
    });

    it("should return true for timeout message", () => {
      const error = new Error("Request timeout");

      expect(service.shouldRetry(error)).toBe(true);
    });

    it("should return true for rate limit message", () => {
      const error = new Error("Rate limit exceeded");

      expect(service.shouldRetry(error)).toBe(true);
    });

    it("should return true for busy message", () => {
      const error = new Error("Server is busy");

      expect(service.shouldRetry(error)).toBe(true);
    });

    it("should return true for try again message", () => {
      const error = new Error("Please try again later");

      expect(service.shouldRetry(error)).toBe(true);
    });

    it("should be case insensitive for message patterns", () => {
      const error1 = new Error("TIMEOUT");
      const error2 = new Error("Rate Limit");

      expect(service.shouldRetry(error1)).toBe(true);
      expect(service.shouldRetry(error2)).toBe(true);
    });

    it("should return false for unknown errors", () => {
      const error = new Error("Unknown error");

      expect(service.shouldRetry(error)).toBe(false);
    });

    it("should handle errors without message", () => {
      const error = new Error();
      error.status = 200;

      expect(service.shouldRetry(error)).toBe(false);
    });
  });

  describe("calculateRetryDelay", () => {
    it("should return exponential delay", () => {
      const delay1 = service.calculateRetryDelay(1, 1000);
      const delay2 = service.calculateRetryDelay(2, 1000);
      const delay3 = service.calculateRetryDelay(3, 1000);

      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay3).toBeGreaterThanOrEqual(4000);
    });

    it("should add jitter to delay", () => {
      const delays = [];
      for (let i = 0; i < 5; i++) {
        delays.push(service.calculateRetryDelay(1, 1000));
      }

      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });

    it("should cap delay at 30 seconds", () => {
      const delay = service.calculateRetryDelay(10, 1000);

      expect(delay).toBeLessThanOrEqual(30000);
    });

    it("should work with different base delays", () => {
      const delay500 = service.calculateRetryDelay(1, 500);
      const delay2000 = service.calculateRetryDelay(1, 2000);

      expect(delay500).toBeGreaterThanOrEqual(500);
      expect(delay2000).toBeGreaterThanOrEqual(2000);
    });
  });

  describe("normalizeError", () => {
    it("should convert 401 error to API key error", () => {
      const error = new Error("Unauthorized");
      error.status = 401;

      const normalized = service.normalizeError(error);

      expect(normalized.message).toBe("Invalid API key");
    });

    it("should convert 400 error to invalid request error", () => {
      const error = new Error("Invalid parameter");
      error.status = 400;

      const normalized = service.normalizeError(error);

      expect(normalized.message).toBe("Invalid request: Invalid parameter");
    });

    it("should return original error for other statuses", () => {
      const error = new Error("Server error");
      error.status = 500;

      const normalized = service.normalizeError(error);

      expect(normalized).toBe(error);
    });

    it("should return error without status unchanged", () => {
      const error = new Error("Generic error");

      const normalized = service.normalizeError(error);

      expect(normalized).toBe(error);
    });
  });

  describe("getSystemPrompt and setSystemPrompt", () => {
    it("should get system prompt", () => {
      const prompt = service.getSystemPrompt();

      expect(prompt).toBe("You are a helpful assistant");
    });

    it("should set new system prompt", () => {
      const newPrompt = "You are a translator";

      service.setSystemPrompt(newPrompt);

      expect(service.getSystemPrompt()).toBe(newPrompt);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[LLMClientService] System prompt updated",
      );
    });

    it("should use updated system prompt in completions", async () => {
      const newPrompt = "You are a code reviewer";
      service.setSystemPrompt(newPrompt);

      const mockResponse = {
        content: "Looks good",
        usage: { total_tokens: 20 },
        rawResponse: {},
      };

      mockProvider.generateCompletion.mockResolvedValue(mockResponse);

      await service.generateCompletion("review this code");

      expect(mockProvider.generateCompletion).toHaveBeenCalledWith({
        systemPrompt: newPrompt,
        userPrompt: "review this code",
        options: expect.any(Object),
      });
    });
  });

  describe("setProvider", () => {
    it("should set new provider", () => {
      const newProvider = {
        generateCompletion: vi.fn(),
      };

      service.setProvider(newProvider);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[LLMClientService] Provider updated",
      );
    });

    it("should throw error when provider is null", () => {
      expect(() => {
        service.setProvider(null);
      }).toThrow("Valid LLM provider is required");
    });

    it("should throw error when provider lacks generateCompletion", () => {
      expect(() => {
        service.setProvider({});
      }).toThrow("Valid LLM provider is required");
    });

    it("should use new provider for completions", async () => {
      const newProvider = {
        generateCompletion: vi.fn(),
      };

      const mockResponse = {
        content: "From new provider",
        usage: { total_tokens: 30 },
        rawResponse: {},
      };

      newProvider.generateCompletion.mockResolvedValue(mockResponse);

      service.setProvider(newProvider);

      const result = await service.generateCompletion("test");

      expect(result).toBe("From new provider");
      expect(newProvider.generateCompletion).toHaveBeenCalled();
      expect(mockProvider.generateCompletion).not.toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("should handle empty user prompt", async () => {
      const mockResponse = {
        content: "Response",
        usage: { total_tokens: 10 },
        rawResponse: {},
      };

      mockProvider.generateCompletion.mockResolvedValue(mockResponse);

      const result = await service.generateCompletion("");

      expect(result).toBe("Response");
    });

    it("should handle very long prompts", async () => {
      const longPrompt = "a".repeat(10000);
      const mockResponse = {
        content: "Response",
        usage: { total_tokens: 5000 },
        rawResponse: {},
      };

      mockProvider.generateCompletion.mockResolvedValue(mockResponse);

      const result = await service.generateCompletion(longPrompt);

      expect(result).toBe("Response");
    });

    it("should handle empty response content", async () => {
      const mockResponse = {
        content: "",
        usage: { total_tokens: 0 },
        rawResponse: {},
      };

      mockProvider.generateCompletion.mockResolvedValue(mockResponse);

      const result = await service.generateCompletion("test");

      expect(result).toBe("");
    });

    it("should handle concurrent completion requests", async () => {
      const mockResponse = {
        content: "Response",
        usage: { total_tokens: 20 },
        rawResponse: {},
      };

      mockProvider.generateCompletion.mockResolvedValue(mockResponse);

      const results = await Promise.all([
        service.generateCompletion("prompt 1"),
        service.generateCompletion("prompt 2"),
        service.generateCompletion("prompt 3"),
      ]);

      expect(results).toHaveLength(3);
      expect(mockProvider.generateCompletion).toHaveBeenCalledTimes(3);
    });
  });
});
