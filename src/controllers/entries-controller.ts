import { injectable } from "tsyringe";
import { Parser } from "../services/parser-service.js";

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
    return this.parser.parse(rawData);
  }
}
