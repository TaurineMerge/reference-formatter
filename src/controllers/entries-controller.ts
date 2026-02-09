import { injectable } from "tsyringe";
import { Parser } from "../services/parser-service.js";
import { OpenAlexSearcher } from "../infrastructure/data_providers/searchers/openalex-searcher.js";
import { ParsedRecord } from "../infrastructure/data_providers/types/searcher.types.js";
import "dotenv/config";

/**
 * Entries Controller
 * Handles API requests related to entries, orchestrating parsing of raw data into structured format.
 */
@injectable()
export class EntriesController {
  constructor(private parser: Parser) {}

  /**
   * Parse raw entry data into structured format
   * @param rawData Stringified entry data
   * @returns Parsed entry as JSON object
   * @throws {Error} If parsing fails
   */
  async parse(rawData: string): Promise<object> {
    const parsedData = await this.parser.parse(rawData);
    console.log("Parsed data:", parsedData);
    const parsedRecord: ParsedRecord = parsedData;
    const searcher = new OpenAlexSearcher(process.env.API_EMAIL || "");
    const searchResults = await searcher.search(parsedRecord);
    console.log("Search results:", searchResults);
    return { ...parsedRecord, searchResults };
  }
}
