import type { TelemetryTimeseries, ParsedTelemetryRow } from "../types";

export interface TelemetryParser {
  parse(timeseries: TelemetryTimeseries): ParsedTelemetryRow[];
  format(rows: ParsedTelemetryRow[]): string;
  formatToFile(rows: ParsedTelemetryRow[], filePath: string): Promise<void>;
}

export abstract class BaseParser implements TelemetryParser {
  abstract format(rows: ParsedTelemetryRow[]): string;
  abstract formatToFile(rows: ParsedTelemetryRow[], filePath: string): Promise<void>;

  parse(timeseries: TelemetryTimeseries): ParsedTelemetryRow[] {
    const timestampToValues = this.buildTimestampMap(timeseries);
    const sortedTimestamps = this.getSortedTimestamps(timestampToValues);
    const allKeys = this.getAllKeys(timeseries);

    return sortedTimestamps.map((ts) =>
      this.createRowForTimestamp(ts, allKeys, timestampToValues)
    );
  }

  private buildTimestampMap(
    timeseries: TelemetryTimeseries
  ): Map<number, Map<string, unknown>> {
    const timestampToValues = new Map<number, Map<string, unknown>>();

    for (const [key, dataPoints] of Object.entries(timeseries)) {
      for (const point of dataPoints) {
        if (!timestampToValues.has(point.ts)) {
          timestampToValues.set(point.ts, new Map<string, unknown>());
        }
        const valuesAtTimestamp = timestampToValues.get(point.ts)!;
        valuesAtTimestamp.set(key, point.value);
      }
    }

    return timestampToValues;
  }

  private getSortedTimestamps(
    timestampToValues: Map<number, Map<string, unknown>>
  ): number[] {
    return Array.from(timestampToValues.keys()).sort((a, b) => a - b);
  }

  private getAllKeys(timeseries: TelemetryTimeseries): string[] {
    return Object.keys(timeseries);
  }

  private createRowForTimestamp(
    ts: number,
    allKeys: string[],
    timestampToValues: Map<number, Map<string, unknown>>
  ): ParsedTelemetryRow {
    const row: ParsedTelemetryRow = {
      timestamp: this.formatTimestamp(ts),
    };

    const valuesAtTimestamp = timestampToValues.get(ts)!;
    for (const key of allKeys) {
      const value = valuesAtTimestamp.get(key);
      row[key] = this.formatValue(value);
    }

    return row;
  }

  protected formatTimestamp(ts: number): string {
    const date = new Date(ts);
    const isoString = date.toISOString();
    return isoString.replace("T", " ").replace("Z", "").slice(0, 19);
  }

  private isPrimitiveValue(value: unknown): boolean {
    return (
      typeof value === "boolean" ||
      typeof value === "number" ||
      typeof value === "string"
    );
  }

  protected formatValue(value: unknown): string | number | boolean {
    if (value === null || value === undefined) {
      return "";
    }

    if (this.isPrimitiveValue(value)) {
      return value as string | number | boolean;
    }

    if (Array.isArray(value) || typeof value === "object") {
      return JSON.stringify(value);
    }

    return String(value);
  }
}