export type TelemetryValue = string | number | boolean | Record<string, unknown>;

export interface TelemetryData {
  [key: string]: TelemetryValue;
}

export interface TelemetryDataWithTimestamp {
  ts: number;
  values: TelemetryData;
}

export interface Attributes {
  [key: string]: TelemetryValue;
}

export interface AttributeUpdateResponse {
  client?: Attributes;
  shared?: Attributes;
}

export interface RpcRequest {
  id: number | string;
  method: string;
  params: Record<string, unknown>;
}

export interface RpcResponse {
  result?: unknown;
  error?: string;
}

export interface ClaimDeviceRequest {
  secretKey?: string;
  durationMs?: number;
}

export interface ProvisionDeviceRequest {
  deviceName: string;
  provisionDeviceKey: string;
  provisionDeviceSecret: string;
}

export interface FirmwareRequestParams {
  title: string;
  version: string;
}

export interface ThingsBoardClientConfig {
  host: string;
  accessToken: string;
  useHttps?: boolean;
}

export type EntityType =
  | "TENANT"
  | "CUSTOMER"
  | "USER"
  | "DASHBOARD"
  | "ASSET"
  | "DEVICE"
  | "ALARM"
  | "ENTITY_VIEW";

export type AggregationType = "MIN" | "MAX" | "AVG" | "SUM" | "COUNT" | "NONE";

export interface TelemetryDataPoint {
  ts: number;
  value: TelemetryValue;
}

export interface TelemetryTimeseries {
  [key: string]: TelemetryDataPoint[];
}

export interface FetchTelemetryOptions {
  entityType: EntityType;
  entityId: string;
  keys: string[];
  startTs?: number;
  endTs?: number;
  interval?: number;
  agg?: AggregationType;
  limit?: number;
}

export interface RestApiClientConfig {
  host: string;
  username?: string;
  password?: string;
  jwtToken?: string;
  useHttps?: boolean;
}

export interface ParsedTelemetryRow {
  timestamp: string;
  [key: string]: string | number | boolean;
}