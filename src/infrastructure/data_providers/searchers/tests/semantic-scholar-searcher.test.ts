/**
 * Semantic Scholar Searcher Tests
 * @module searchers/tests/semantic-scholar-searcher.test
 *
 * Unit tests for SemanticScholarSearcher using Vitest
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { SemanticScholarSearcher } from "../semantic-scholar-searcher.js";
import type { ParsedRecord } from "../../types/searcher.types.js";

vi.mock("node-fetch");
import fetch from "node-fetch";

const mockFetch = vi.mocked(fetch) as any;

interface SemanticScholarResponse {
  total: number;
  offset: number;
  next: number;
  data: Array<{
    paperId: string;
    title: string;
    authors: Array<{ name: string }>;
    year: number;
    abstract: string;
    citationCount: number;
    publicationDate: string;
  }>;
}

describe("SemanticScholarSearcher", () => {
  let searcher: SemanticScholarSearcher;
  const testApiKey = "test-api-key-12345";

  beforeEach(() => {
    searcher = new SemanticScholarSearcher(testApiKey);
    vi.clearAllMocks();
  });

  describe("constructor & getName", () => {
    it("should initialize with API key", () => {
      const instance = new SemanticScholarSearcher("valid-key");
      expect(instance.getName()).toBe("SemanticScholar");
    });

    it("should return 'SemanticScholar' as name", () => {
      expect(searcher.getName()).toBe("SemanticScholar");
    });

    it("should throw error if API key is empty string", () => {
      expect(() => new SemanticScholarSearcher("")).toThrow("Semantic Scholar API key is required");
    });

    it("should throw error if API key is not provided", () => {
      expect(() => new SemanticScholarSearcher("")).toThrow("Semantic Scholar API key is required");
    });
  });

  describe("search with title and author", () => {
    it("should build query from title and author", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 1,
          offset: 0,
          next: 0,
          data: [
            {
              paperId: "abc123",
              title: "Test Paper",
              authors: [{ name: "Smith" }],
              year: 2023,
              abstract: "Test abstract",
              citationCount: 5,
              publicationDate: "2023-01-01",
            },
          ],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test Paper", normalized: "Test Paper", keywords: [] },
        author: { raw: "Smith, J.", lastName: "Smith", initials: "J" },
      };

      const result = await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      const query = callUrl.searchParams.get("query");
      expect(query).toContain("Test Paper");
      expect(query).toContain("Smith");
      expect(result.data).toHaveLength(1);
    });

    it("should include title in query when available", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 0,
          offset: 0,
          next: 0,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "Machine Learning",
          normalized: "Machine Learning",
          keywords: [],
        },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      const query = callUrl.searchParams.get("query");
      expect(query).toBe("Machine Learning");
    });

    it("should include author in query when available", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 0,
          offset: 0,
          next: 0,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        author: { raw: "Johnson, A.", lastName: "Johnson", initials: "A" },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      const query = callUrl.searchParams.get("query");
      expect(query).toBe("Johnson");
    });

    it("should handle empty query gracefully", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 0,
          offset: 0,
          next: 0,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {};

      const result = await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      const query = callUrl.searchParams.get("query");
      expect(query).toBe("");
      expect(result.data).toEqual([]);
    });
  });

  describe("API key handling", () => {
    it("should include API key in x-api-key header", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 0,
          offset: 0,
          next: 0,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const testKey = "secret-api-key-xyz";
      const instance = new SemanticScholarSearcher(testKey);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await instance.search(parsed);

      const headers = (mockFetch.mock.calls[0][1] as Record<string, unknown>)?.headers as
        | Record<string, string>
        | undefined;
      expect(headers?.["x-api-key"]).toBe(testKey);
    });

    it("should use API key from constructor", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 0,
          offset: 0,
          next: 0,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        author: { raw: "Author", lastName: "Author", initials: "A" },
      };

      await searcher.search(parsed);

      const headers = (mockFetch.mock.calls[0][1] as Record<string, unknown>)?.headers as
        | Record<string, string>
        | undefined;
      expect(headers?.["x-api-key"]).toBe(testApiKey);
    });
  });

  describe("pagination options", () => {
    it("should use default limit of 10", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 100,
          offset: 0,
          next: 10,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(callUrl.searchParams.get("limit")).toBe("10");
    });

    it("should respect custom perPage option", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 100,
          offset: 0,
          next: 25,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await searcher.search(parsed, { perPage: 25 });

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(callUrl.searchParams.get("limit")).toBe("25");
    });
  });

  describe("response fields", () => {
    it("should request specific fields in response", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 0,
          offset: 0,
          next: 0,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      const fields = callUrl.searchParams.get("fields");
      expect(fields).toBe("title,authors,year,abstract,citationCount,publicationDate");
    });
  });

  describe("response handling", () => {
    it("should return full response object", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 5,
          offset: 0,
          next: 5,
          data: [
            {
              paperId: "paper1",
              title: "First Paper",
              authors: [{ name: "Author One" }],
              year: 2023,
              abstract: "Abstract 1",
              citationCount: 10,
              publicationDate: "2023-01-15",
            },
          ],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Papers", normalized: "Papers", keywords: [] },
      };

      const result = await searcher.search(parsed);

      expect(result.total).toBe(5);
      expect(result.offset).toBe(0);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe("First Paper");
    });

    it("should handle empty results", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 0,
          offset: 0,
          next: 0,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Nonexistent Paper", normalized: "Nonexistent Paper", keywords: [] },
      };

      const result = await searcher.search(parsed);

      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should throw error on non-200 response", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await expect(searcher.search(parsed)).rejects.toThrow("Semantic Scholar error 401");
    });

    it("should throw error on 429 rate limit", async () => {
      const mockResponse = {
        ok: false,
        status: 429,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        author: { raw: "Smith", lastName: "Smith", initials: "S" },
      };

      await expect(searcher.search(parsed)).rejects.toThrow("Semantic Scholar error 429");
    });

    it("should throw error on 500 server error", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await expect(searcher.search(parsed)).rejects.toThrow("Semantic Scholar error 500");
    });

    it("should throw error on network failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network timeout"));

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await expect(searcher.search(parsed)).rejects.toThrow("Network timeout");
    });
  });

  describe("endpoint URL", () => {
    it("should use correct Semantic Scholar API endpoint", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 0,
          offset: 0,
          next: 0,
          data: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await searcher.search(parsed);

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("https://api.semanticscholar.org/graph/v1/paper/search");
    });
  });

  describe("complex scenarios", () => {
    it("should handle full search with all parameters", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<SemanticScholarResponse>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          total: 2,
          offset: 0,
          next: 2,
          data: [
            {
              paperId: "p1",
              title: "Paper One",
              authors: [{ name: "Author A" }, { name: "Author B" }],
              year: 2023,
              abstract: "This is the first paper",
              citationCount: 25,
              publicationDate: "2023-06-01",
            },
            {
              paperId: "p2",
              title: "Paper Two",
              authors: [{ name: "Author C" }],
              year: 2022,
              abstract: "This is the second paper",
              citationCount: 12,
              publicationDate: "2022-03-15",
            },
          ],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "Machine Learning in Healthcare",
          normalized: "Machine Learning in Healthcare",
          keywords: ["ml", "healthcare"],
        },
        author: { raw: "Smith, J.", lastName: "Smith", initials: "J" },
        year: "2023",
      };

      const result = await searcher.search(parsed, { perPage: 20 });

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(callUrl.searchParams.get("query")).toContain("Machine Learning in Healthcare");
      expect(callUrl.searchParams.get("query")).toContain("Smith");
      expect(callUrl.searchParams.get("limit")).toBe("20");
      expect(result.total).toBe(2);
      expect(result.data[0].citationCount).toBe(25);
    });
  });
});
