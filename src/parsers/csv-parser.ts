import { BaseParser } from "./base-parser";
import type { ParsedTelemetryRow } from "../types";
import { CSV_DELIMITER, CSV_QUOTE, CSV_NEWLINE } from "../utils/constants";

const EMPTY_STRING = "";
const DOUBLE_QUOTE = '""';

export class CsvParser extends BaseParser {
  private readonly delimiter: string;
  private readonly includeHeaders: boolean;

  constructor(
    delimiter: string = CSV_DELIMITER,
    includeHeaders: boolean = true
  ) {
    super();
    this.delimiter = delimiter;
    this.includeHeaders = includeHeaders;
  }

  format(rows: ParsedTelemetryRow[]): string {
    if (rows.length === 0) {
      return EMPTY_STRING;
    }

    const headers = this.extractHeaders(rows);
    const lines = this.buildLines(rows, headers);

    return lines.join(CSV_NEWLINE);
  }

  private extractHeaders(rows: ParsedTelemetryRow[]): string[] {
    return Object.keys(rows[0]);
  }

  private buildLines(
    rows: ParsedTelemetryRow[],
    headers: string[]
  ): string[] {
    const lines: string[] = [];

    if (this.includeHeaders) {
      lines.push(this.escapeRow(headers));
    }

    for (const row of rows) {
      const values = this.extractRowValues(row, headers);
      lines.push(this.escapeRow(values));
    }

    return lines;
  }

  private extractRowValues(
    row: ParsedTelemetryRow,
    headers: string[]
  ): (string | number | boolean)[] {
    return headers.map((header) => row[header] ?? EMPTY_STRING);
  }

  async formatToFile(rows: ParsedTelemetryRow[], filePath: string): Promise<void> {
    const csvContent = this.format(rows);
    await Bun.write(filePath, csvContent);
  }

  private needsEscaping(stringValue: string): boolean {
    return (
      stringValue.includes(this.delimiter) ||
      stringValue.includes(CSV_QUOTE) ||
      stringValue.includes(CSV_NEWLINE)
    );
  }

  private escapeQuotes(stringValue: string): string {
    return stringValue.replace(/"/g, DOUBLE_QUOTE);
  }

  private escapeRow(values: (string | number | boolean)[]): string {
    return values
      .map((value) => {
        const stringValue = String(value);
        if (this.needsEscaping(stringValue)) {
          return `${CSV_QUOTE}${this.escapeQuotes(stringValue)}${CSV_QUOTE}`;
        }
        return stringValue;
      })
      .join(this.delimiter);
  }
}