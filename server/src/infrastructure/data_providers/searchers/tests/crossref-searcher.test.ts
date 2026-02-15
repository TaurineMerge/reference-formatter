/**
 * Crossref Searcher Tests
 * @module searchers/tests/crossref-searcher.test
 *
 * Unit tests for CrossrefSearcher using Vitest
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CrossrefSearcher } from "../crossref-searcher.js";
import type { ParsedRecord } from "../../types/searcher.types.js";

// Mock fetch
vi.mock("node-fetch");
import fetch from "node-fetch";

const mockFetch = fetch as any;

describe("CrossrefSearcher", () => {
  let searcher: CrossrefSearcher;
  const testEmail = "test@example.com";

  beforeEach(() => {
    searcher = new CrossrefSearcher(testEmail);
    vi.clearAllMocks();
  });

  describe("constructor & getName", () => {
    it("should initialize with correct email in User-Agent", () => {
      const testEmail = "researcher@university.edu";
      const instance = new CrossrefSearcher(testEmail);
      expect(instance.getName()).toBe("Crossref");
    });

    it("should return 'Crossref' as name", () => {
      expect(searcher.getName()).toBe("Crossref");
    });
  });

  describe("search with DOI", () => {
    it("should search by DOI when provided", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: {
            items: [
              {
                DOI: "10.1234/test",
                title: ["Test Article"],
                author: [{ family: "Smith", given: "John" }],
              },
            ],
          },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        doi: "10.1234/test",
        title: { raw: "Test Article", normalized: "Test Article", keywords: [] },
        author: { raw: "Smith, J.", lastName: "Smith", initials: "J" },
        publicationType: "article",
      };

      const result = await searcher.search(parsed);

      expect(mockFetch).toHaveBeenCalled();
      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("filter")).toBe("doi:10.1234/test");
      expect(result.message.items).toHaveLength(1);
    });

    it("should set User-Agent header with email", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({ message: { items: [] } }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        doi: "10.5678/example",
      };

      await searcher.search(parsed);

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders["User-Agent"]).toBe(`llm-biblio-searcher (mailto:${testEmail})`);
    });
  });

  describe("search by author and title", () => {
    it("should search by author last name when DOI not provided", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: {
            items: [
              {
                title: ["Research Paper"],
                author: [{ family: "Johnson", given: "Alice" }],
              },
            ],
          },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Research Paper", normalized: "Research Paper", keywords: [] },
        author: { raw: "Johnson, A.", lastName: "Johnson", initials: "A" },
        publicationType: "article",
      };

      const result = await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("query.author")).toBe("Johnson");
      expect(result.message.items).toHaveLength(1);
    });

    it("should search by normalized title when provided", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { items: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: {
          raw: "Machine Learning in Healthcare",
          normalized: "machine learning healthcare",
          keywords: ["ml", "healthcare"],
        },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("query.title")).toBe("machine learning healthcare");
    });

    it("should include journal name for article type", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { items: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Article Title", normalized: "Article Title", keywords: [] },
        author: { raw: "Author, A.", lastName: "Author", initials: "A" },
        publicationType: "article",
        journal: { raw: "Nature", normalized: "Nature" },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("query.container-title")).toBe("Nature");
    });

    it("should not include journal filter for non-article types", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { items: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Book Title", normalized: "Book Title", keywords: [] },
        publicationType: "book",
        journal: { raw: "Some Journal", normalized: "Some Journal" },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("query.container-title")).toBeNull();
    });
  });

  describe("pagination options", () => {
    it("should use default perPage of 10", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { items: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("rows")).toBe("10");
    });

    it("should respect custom perPage option", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { items: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await searcher.search(parsed, { perPage: 25 });

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("rows")).toBe("25");
    });
  });

  describe("error handling", () => {
    it("should throw error on non-200 response", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        doi: "invalid-doi",
      };

      await expect(searcher.search(parsed)).rejects.toThrow("Crossref error 404");
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

      await expect(searcher.search(parsed)).rejects.toThrow("Crossref error 500");
    });

    it("should throw error on network failure", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await expect(searcher.search(parsed)).rejects.toThrow("Network error");
    });
  });

  describe("edge cases", () => {
    it("should handle empty parsed record gracefully", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { items: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {};

      const result = await searcher.search(parsed);

      expect(result.message.items).toEqual([]);
    });

    it("should handle record with null optional fields", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { items: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        doi: null,
        journal: null,
        isbn: null,
        year: null,
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("filter")).toBeNull();
      expect(callUrl.searchParams.get("query.container-title")).toBeNull();
    });

    it("should construct correct Crossref API URL", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { items: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        title: { raw: "Test", normalized: "Test", keywords: [] },
      };

      await searcher.search(parsed);

      const callUrl = mockFetch.mock.calls[0][0];
      expect(callUrl).toContain("https://api.crossref.org/works");
    });
  });

  describe("complex search scenarios", () => {
    it("should handle full author and title search with options", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: {
            items: [
              {
                DOI: "10.1234/example",
                title: ["Complete Test"],
              },
            ],
            "search-results": {
              query: { count: 1 },
            },
          },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        author: { raw: "Test, T.", lastName: "Test", initials: "T" },
        title: { raw: "Complete Test", normalized: "Complete Test", keywords: [] },
        publicationType: "article",
        journal: { raw: "Journal", normalized: "Journal" },
      };

      const result = await searcher.search(parsed, { perPage: 20 });

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("query.author")).toBe("Test");
      expect(callUrl.searchParams.get("query.title")).toBe("Complete Test");
      expect(callUrl.searchParams.get("query.container-title")).toBe("Journal");
      expect(callUrl.searchParams.get("rows")).toBe("20");
      expect(result.message.items).toHaveLength(1);
    });

    it("should prioritize DOI over author/title search", async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: { items: [] },
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const parsed: ParsedRecord = {
        doi: "10.9999/priority",
        author: { raw: "Test, T.", lastName: "Test", initials: "T" },
        title: { raw: "Title", normalized: "Title", keywords: [] },
      };

      await searcher.search(parsed);

      const callUrl = new URL(mockFetch.mock.calls[0][0]);
      expect(callUrl.searchParams.get("filter")).toBe("doi:10.9999/priority");
      expect(callUrl.searchParams.get("query.author")).toBeNull();
      expect(callUrl.searchParams.get("query.title")).toBeNull();
    });
  });
});
