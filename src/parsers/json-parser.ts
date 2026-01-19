import { BaseParser } from "./base-parser";
import type { ParsedTelemetryRow } from "../types";

export class JsonParser extends BaseParser {
  private readonly pretty: boolean;

  constructor(pretty: boolean = false) {
    super();
    this.pretty = pretty;
  }

  format(rows: ParsedTelemetryRow[]): string {
    if (this.pretty) {
      return JSON.stringify(rows, null, 2);
    }
    return JSON.stringify(rows);
  }

  async formatToFile(rows: ParsedTelemetryRow[], filePath: string): Promise<void> {
    const jsonContent = this.format(rows);
    await Bun.write(filePath, jsonContent);
  }
}