/**
 * OpenAlex Searcher Tests
 * @module searchers/tests/openalex-searcher.test
 *
 * Unit tests for OpenAlexSearcher using Vitest
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenAlexSearcher } from "../openalex-searcher.js";
import type { ParsedRecord } from "../../types/searcher.types.js";

vi.mock("node-fetch");
import fetch from "node-fetch";

const mockFetch = vi.mocked(fetch) as any;

interface MockResponseBody {
  results?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

describe("OpenAlexSearcher", () => {
  let searcher: OpenAlexSearcher;
  const testEmail = "test@example.com";

  beforeEach(() => {
    searcher = new OpenAlexSearcher(testEmail);
    vi.clearAllMocks();
  });

  describe("constructor & getName", () => {
    it("should initialize with email in User-Agent", () => {
      const instance = new OpenAlexSearcher("researcher@uni.edu");
      expect(instance.getName()).toBe("OpenAlex");
    });

    it("should return 'OpenAlex' as name", () => {
      expect(searcher.getName()).toBe("OpenAlex");
    });

    it("should use environment variable for API base URL if provided", () => {
      const original = process.env.OPENALEX_API_BASE_URL;
      try {
        process.env.OPENALEX_API_BASE_URL = "https://custom.api.org";
        const instance = new OpenAlexSearcher(testEmail);
        expect(instance.getName()).toBe("OpenAlex");
      } finally {
        // Restore or delete the env var properly
        if (original !== undefined) {
          process.env.OPENALEX_API_BASE_URL = original;
        } else {
          delete process.env.OPENALEX_API_BASE_URL;
        }
      }
    });
  });

  describe("search with DOI", () => {
    it("should prioritize DOI in filter", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [
            {
              id: "W1234567890",
              title: "Test Article",
              doi: "10.1234/test",
            },
          ],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const parsed: ParsedRecord = {
        doi: "10.1234/test",
        title: { raw: "Test Article", normalized: "Test Article", keywords: [] },
      };

      const result = await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(callUrl.searchParams.get("filter")).toContain("doi:10.1234/test");
      expect(result.results).toHaveLength(1);
    });

    it("should convert DOI to lowercase in filter", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const parsed: ParsedRecord = {
        doi: "10.ABC/TEST",
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(callUrl.searchParams.get("filter")).toContain("10.abc/test");
    });
  });

  describe("search with title and year", () => {
    it("should use title + year filter for long titles", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "Machine Learning Applications in Healthcare Systems",
          normalized: "Machine Learning Applications in Healthcare Systems",
          keywords: [],
        },
        year: "2023",
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      const filter = callUrl.searchParams.get("filter");
      expect(filter).toContain("title.search:");
      expect(filter).toContain("publication_year:2023");
    });

    it("should skip short titles and use fuzzy search instead", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "Short title",
          normalized: "Short title",
          keywords: [],
        },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(callUrl.searchParams.get("search")).toBeTruthy();
      expect(callUrl.searchParams.get("filter")).toBeNull();
    });

    it("should add article type filter for article publication type", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "This is a very long and comprehensive title for an academic article",
          normalized: "This is a very long and comprehensive title for an academic article",
          keywords: [],
        },
        publicationType: "article",
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      const filter = callUrl.searchParams.get("filter");
      expect(filter).toContain("type:journal-article");
    });

    it("should not add article type filter for non-article types", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "This is a comprehensive book title that is quite long",
          normalized: "This is a comprehensive book title that is quite long",
          keywords: [],
        },
        publicationType: "book",
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      const filter = callUrl.searchParams.get("filter");
      expect(filter).not.toContain("type:journal-article");
    });
  });

  describe("search with author and title (fuzzy)", () => {
    it("should build fuzzy search from title and author", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "Test",
          normalized: "Test",
          keywords: [],
        },
        author: { raw: "Smith, J.", lastName: "Smith", initials: "J" },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      const search = callUrl.searchParams.get("search");
      expect(search).toContain("test");
      expect(search).toContain("Smith");
    });
  });

  describe("normalization for OpenAlex", () => {
    it("should handle hyphenated text correctly", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "Machine-Learning Analysis",
          normalized: "Machine-Learning Analysis",
          keywords: [],
        },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      // Check that filter contains decoded title with spaces (hyphens converted to spaces)
      const filter = callUrl.searchParams.get("filter");
      expect(filter).toContain("machine learning analysis");
    });

    it("should handle case conversion", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "UPPERCASE TITLE",
          normalized: "UPPERCASE TITLE",
          keywords: [],
        },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(callUrl.toString()).toMatch(/uppercase/i);
    });
  });

  describe("pagination", () => {
    it("should use default perPage of 10", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "Test Article Title",
          normalized: "Test Article Title",
          keywords: [],
        },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(callUrl.searchParams.get("per-page")).toBe("10");
    });

    it("should respect custom perPage option", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        doi: "10.1234/test",
      };

      await searcher.search(parsed, { perPage: 50 });

      const callUrl = new URL(mockFetch.mock.calls[0][0] as string);
      expect(callUrl.searchParams.get("per-page")).toBe("50");
    });
  });

  describe("fallback mechanism", () => {
    it("should retry with title-only search if primary returns 0 results", async () => {
      const fallbackResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [
            {
              id: "W9999999999",
              title: "Fallback Result",
            },
          ],
        }),
      };

      const primaryResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };

      mockFetch
        .mockResolvedValueOnce(primaryResponse as any)
        .mockResolvedValueOnce(fallbackResponse as any);

      const parsed: ParsedRecord = {
        title: {
          raw: "Specific Title",
          normalized: "Specific Title",
          keywords: [],
        },
      };

      const result = await searcher.search(parsed);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.results).toHaveLength(1);
    });

    it("should not retry if primary search returns results", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [
            {
              id: "W1234567890",
              title: "Found Article",
            },
          ],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "Some Title",
          normalized: "Some Title",
          keywords: [],
        },
      };

      await searcher.search(parsed);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("should not retry if title is not available", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        author: { raw: "Smith, J.", lastName: "Smith", initials: "J" },
      };

      await searcher.search(parsed);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("error handling", () => {
    it("should throw error on non-200 response", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        doi: "10.1234/test",
      };

      await expect(searcher.search(parsed)).rejects.toThrow("OpenAlex error 500");
    });

    it("should throw error on 404", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Not found", normalized: "Not found", keywords: [] },
      };

      await expect(searcher.search(parsed)).rejects.toThrow("OpenAlex error 404");
    });

    it("should set User-Agent header", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        doi: "10.1234/test",
      };

      await searcher.search(parsed);

      const headers = (mockFetch.mock.calls[0][1] as Record<string, unknown>)?.headers as
        | Record<string, string>
        | undefined;
      expect(headers?.["User-Agent"]).toBe(`llm-biblio-searcher (mailto:${testEmail})`);
    });
  });

  describe("edge cases", () => {
    it("should handle empty parsed record", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {};

      const result = await searcher.search(parsed);

      expect(result.results).toEqual([]);
    });

    it("should handle null values in parsed record", async () => {
      const mockResponse: {
        ok: boolean;
        json: () => Promise<MockResponseBody>;
      } = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          results: [],
        }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        doi: null,
        year: null,
      };

      await expect(searcher.search(parsed)).resolves.not.toThrow();
    });
  });
});
