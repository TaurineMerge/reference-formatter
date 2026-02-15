/**
 * OpenAlex Searcher
 * @module searchers/openalex-searcher
 *
 * Searcher for OpenAlex API - comprehensive academic database.
 *
 * **Coverage:**
 * - Global academic works (250M+ publications)
 * - Strong on English/Western publications
 * - Moderate coverage of Russian works (post-2000)
 * - Free, no API key required
 *
 * **Search Strategy:**
 * 1. DOI lookup (if available) - highest precision
 * 2. Exact title + year filter - high precision
 * 3. Fuzzy search by title + author - medium precision
 * 4. Fallback to title-only search - low precision
 *
 * **Rate Limits:**
 * - Polite pool: 100k requests/day (with email in User-Agent)
 * - No authentication required
 */

import fetch from "node-fetch";
import type { ParsedRecord } from "../types/searcher.types.js";
import { ISearcher } from "../interfaces/searcher.interface.js";

export class OpenAlexSearcher implements ISearcher {
  private readonly endpoint: string;
  private readonly userAgent: string;

  /**
   * Creates a new OpenAlex searcher instance.
   * @param userAgentEmail - Your email for polite pool access (100k req/day)
   */
  constructor(userAgentEmail: string) {
    this.endpoint = process.env.OPENALEX_API_BASE_URL || "https://api.openalex.org";
    this.userAgent = `llm-biblio-searcher (mailto:${userAgentEmail})`;
  }

  getName(): string {
    return "OpenAlex";
  }

  /**
   * Normalizes text specifically for OpenAlex search.
   *
   * **OpenAlex quirks:**
   * - Hyphens treated as word separators (must convert to spaces)
   * - Case-insensitive search
   * - Removes punctuation except spaces
   *
   * @param input - Raw text to normalize
   * @returns Normalized text optimized for OpenAlex
   */
  private normalizeForOpenAlex(input: string): string {
    return input
      .toLowerCase()
      .replace(/-/g, " ") // CRITICAL: OpenAlex treats hyphens as separators
      .replace(/[^\p{L}\p{N}\s]/gu, "") // Remove all punctuation except spaces
      .replace(/\s+/g, " ") // Collapse multiple spaces
      .trim();
  }

  /**
   * Builds optimal search query URL based on available data.
   *
   * **Strategy (in priority order):**
   * 1. **DOI filter** - 100% precision if DOI exists
   * 2. **Title + year filter** - ~90% precision for long titles
   * 3. **Fuzzy search** - ~60% precision for short titles
   * 4. **Title-only fallback** - ~40% precision (executed if primary returns 0 results)
   *
   * @param parsed - Parsed bibliographic record
   * @returns URL object with query parameters
   */
  private buildPrimaryQuery(parsed: ParsedRecord): URL {
    const url = new URL(`${this.endpoint}/works`);

    // ============================================
    // STRATEGY 1: DOI (absolute priority)
    // ============================================
    if (parsed.doi) {
      url.searchParams.set("filter", `doi:${parsed.doi.toLowerCase()}`);
      return url;
    }

    // ============================================
    // STRATEGY 2: Exact title search
    // ============================================
    // Only use if title is long enough to be distinctive (>20 chars)
    if (parsed.title?.normalized && parsed.title.normalized.length > 20) {
      const title = this.normalizeForOpenAlex(parsed.title.normalized);

      const filters: string[] = [`title.search:"${title}"`];

      // Add year filter if available (improves precision)
      if (parsed.year) {
        filters.push(`publication_year:${parsed.year}`);
      }

      // Add type filter for articles (improves precision)
      if (parsed.publicationType === "article") {
        filters.push("type:journal-article");
      }

      url.searchParams.set("filter", filters.join(","));
      return url;
    }

    // ============================================
    // STRATEGY 3: Fuzzy search (title + author)
    // ============================================
    const parts: string[] = [];

    if (parsed.title?.normalized) {
      parts.push(this.normalizeForOpenAlex(parsed.title.normalized));
    }

    if (parsed.author?.lastName) {
      parts.push(parsed.author.lastName);
    }

    url.searchParams.set("search", parts.join(" "));
    return url;
  }

  /**
   * Search OpenAlex for the given bibliographic record.
   *
   * **Automatic fallback:**
   * If primary search returns 0 results, automatically retries with relaxed criteria.
   *
   * @param parsed - Parsed bibliographic record
   * @param options - Search options
   * @param options.perPage - Number of results per page (default: 10)
   * @returns OpenAlex API response with results array
   *
   * @throws {Error} If API returns non-2xx status
   */
  async search(parsed: ParsedRecord, options: { perPage?: number } = {}): Promise<Record<string, unknown>> {
    const url = this.buildPrimaryQuery(parsed);
    url.searchParams.set("per-page", String(options.perPage ?? 10));

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": this.userAgent,
      },
    });

    if (!res.ok) {
      throw new Error(`OpenAlex error ${res.status}`);
    }

    const json = (await res.json()) as Record<string, unknown> & { results?: unknown[] };

    // ============================================
    // FALLBACK: Title-only search if 0 results
    // ============================================
    if (json.results?.length === 0 && parsed.title?.normalized) {
      const fallbackUrl = new URL(`${this.endpoint}/works`);
      fallbackUrl.searchParams.set("search", this.normalizeForOpenAlex(parsed.title.normalized));
      fallbackUrl.searchParams.set("per-page", String(options.perPage ?? 10));

      const fallbackRes = await fetch(fallbackUrl.toString(), {
        headers: { "User-Agent": this.userAgent },
      });

      if (fallbackRes.ok) {
        return (await fallbackRes.json()) as Record<string, unknown>;
      }
    }

    return json;
  }
}
