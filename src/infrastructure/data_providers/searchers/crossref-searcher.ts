/**
 * Crossref Searcher
 * @module searchers/crossref-searcher
 *
 * Searcher for Crossref API - DOI registration agency.
 *
 * **Coverage:**
 * - 140M+ publications with DOIs
 * - Strong on journal articles, conferences
 * - Weak on Russian works (most lack DOIs)
 * - Free, no API key required
 *
 * **Best for:**
 * - Articles with DOIs
 * - Western academic journals
 * - Citation metadata
 *
 * **Limitations:**
 * - Poor Russian/Soviet coverage (<10% have DOIs)
 * - Books often missing
 */

import fetch from "node-fetch";
import type { ParsedRecord } from "../types/searcher.types.js";
import { ISearcher } from "../interfaces/searcher.interface.js";

export class CrossrefSearcher implements ISearcher {
  private readonly endpoint = "https://api.crossref.org/works";
  private readonly userAgent: string;

  constructor(userAgentEmail: string) {
    this.userAgent = `llm-biblio-searcher (mailto:${userAgentEmail})`;
  }

  getName(): string {
    return "Crossref";
  }

  async search(parsed: ParsedRecord, options: { perPage?: number } = {}): Promise<any> {
    const url = new URL(this.endpoint);

    // DOI lookup
    if (parsed.doi) {
      url.searchParams.set("filter", `doi:${parsed.doi}`);
    } else {
      // Query by author + title
      if (parsed.author?.lastName) {
        url.searchParams.set("query.author", parsed.author.lastName);
      }

      if (parsed.title?.normalized) {
        url.searchParams.set("query.title", parsed.title.normalized);
      }

      // Filter by journal for articles
      if (parsed.publicationType === "article" && parsed.journal?.normalized) {
        url.searchParams.set("query.container-title", parsed.journal.normalized);
      }
    }

    url.searchParams.set("rows", String(options.perPage ?? 10));

    const res = await fetch(url.toString(), {
      headers: { "User-Agent": this.userAgent },
    });

    if (!res.ok) {
      throw new Error(`Crossref error ${res.status}`);
    }

    return await res.json();
  }
}
