/**
 * Semantic Scholar Searcher
 * @module searchers/semantic-scholar-searcher
 *
 * Searcher for Semantic Scholar - AI-powered academic search.
 *
 * **Coverage:**
 * - 200M+ publications
 * - Strong on CS, physics, biomedicine
 * - Good abstracts and citation context
 * - Moderate Russian coverage
 *
 * **API Access:**
 * - Free tier: 100 requests/5 minutes
 * - Requires API key (free registration)
 * - Get key at: https://www.semanticscholar.org/product/api
 */

import fetch from "node-fetch";
import type { ParsedRecord } from "../types/searcher.types.js";
import { ISearcher } from "../interfaces/searcher.interface.js";

export class SemanticScholarSearcher implements ISearcher {
  private readonly endpoint = "https://api.semanticscholar.org/graph/v1/paper/search";
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("Semantic Scholar API key is required");
    }
    this.apiKey = apiKey;
  }

  getName(): string {
    return "SemanticScholar";
  }

  async search(parsed: ParsedRecord, options: { perPage?: number } = {}): Promise<any> {
    const url = new URL(this.endpoint);

    // Build query
    const queryParts: string[] = [];

    if (parsed.title?.normalized) {
      queryParts.push(parsed.title.normalized);
    }

    if (parsed.author?.lastName) {
      queryParts.push(parsed.author.lastName);
    }

    url.searchParams.set("query", queryParts.join(" "));
    url.searchParams.set("limit", String(options.perPage ?? 10));

    // Request fields
    url.searchParams.set("fields", "title,authors,year,abstract,citationCount,publicationDate");

    const res = await fetch(url.toString(), {
      headers: {
        "x-api-key": this.apiKey,
      },
    });

    if (!res.ok) {
      throw new Error(`Semantic Scholar error ${res.status}`);
    }

    return await res.json();
  }
}
