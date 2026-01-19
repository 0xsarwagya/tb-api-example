# ThingsBoard HTTP API Client

A TypeScript client library for interacting with ThingsBoard IoT platform via HTTP API. Built with Bun runtime for optimal performance.

## Features

### Device API (HTTP Device API)
- ✅ **Telemetry Upload** - Publish sensor data with or without timestamps
- ✅ **Attributes API** - Publish, request, and subscribe to device attributes
- ✅ **RPC API** - Server-side and client-side RPC support
- ✅ **Device Claiming** - Claim devices with secret keys
- ✅ **Device Provisioning** - Provision new devices
- ✅ **Firmware API** - Download firmware updates

### REST API (Telemetry Fetching & Export)
- ✅ **Fetch Telemetry** - Retrieve historical telemetry data from ThingsBoard
- ✅ **Modular Parsers** - CSV, JSON, and extensible parser system
- ✅ **CSV Export** - Export telemetry data to CSV format
- ✅ **Time Range Queries** - Fetch data for specific time ranges
- ✅ **Aggregation Support** - MIN, MAX, AVG, SUM, COUNT aggregations

### General
- ✅ **TypeScript Support** - Full type safety and IntelliSense
- ✅ **Modular Architecture** - Clean, extensible code structure

## Installation

```bash
bun install
```

## Quick Start

### Basic Usage

```typescript
import { ThingsBoardClient } from "./src/client";

const client = new ThingsBoardClient({
  host: "demo.thingsboard.io",
  accessToken: "YOUR_ACCESS_TOKEN",
  useHttps: true,
});

// Publish telemetry data
await client.publishTelemetry({
  temperature: 25.5,
  humidity: 60,
  pressure: 1013.25,
});
```

### Environment Variables

#### For Device API (publishing data):
```bash
export TB_HOST="demo.thingsboard.io"
export TB_ACCESS_TOKEN="your_device_access_token"
```

#### For REST API (fetching data):
```bash
export TB_HOST="demo.thingsboard.io"
export TB_USERNAME="your_username"
export TB_PASSWORD="your_password"
export TB_DEVICE_ID="your_device_id"
```

## API Reference

### Telemetry Upload

#### Simple Object Format

```typescript
await client.publishTelemetry({
  temperature: 42,
  humidity: 73,
});
```

#### Array Format

```typescript
await client.publishTelemetry([
  { temperature: 42 },
  { humidity: 73 },
]);
```

#### With Timestamp

```typescript
await client.publishTelemetry({
  ts: Date.now(),
  values: {
    temperature: 42,
    humidity: 73,
  },
});
```

### Attributes API

#### Publish Client-Side Attributes

```typescript
await client.publishAttributes({
  firmwareVersion: "1.0.0",
  deviceModel: "Sensor-2024",
  location: "Building A",
});
```

#### Request Attributes

```typescript
const attributes = await client.requestAttributes(
  ["firmwareVersion", "deviceModel"], // client keys
  ["location"] // shared keys
);
```

#### Subscribe to Attribute Updates

```typescript
const updates = await client.subscribeToAttributeUpdates(20000);
// Returns when shared attributes are updated or timeout occurs
```

### RPC API

#### Subscribe to Server-Side RPC

```typescript
const rpcRequest = await client.subscribeToRpc(20000);

if (rpcRequest) {
  console.log("Method:", rpcRequest.method);
  console.log("Params:", rpcRequest.params);
  
  // Respond to RPC
  await client.respondToRpc(rpcRequest.id, {
    result: "ok",
  });
}
```

#### Send Client-Side RPC

```typescript
const response = await client.sendRpcRequest({
  id: 1,
  method: "getTime",
  params: {},
});
```

### Device Claiming

```typescript
await client.claimDevice({
  secretKey: "your_secret_key",
  durationMs: 60000,
});
```

### Device Provisioning

```typescript
await client.provisionDevice({
  deviceName: "MyDevice",
  provisionDeviceKey: "your_provision_key",
  provisionDeviceSecret: "your_provision_secret",
});
```

### Firmware Download

```typescript
const firmwareBlob = await client.downloadFirmware({
  title: "firmware_v1",
  version: "1.0.0",
});
```

## REST API - Fetching Telemetry Data

### Initialize REST Client

```typescript
import { ThingsBoardRestClient } from "./src/rest-client";

const restClient = new ThingsBoardRestClient({
  host: "demo.thingsboard.io",
  username: "your_username",
  password: "your_password",
  useHttps: true,
});
```

### Get Telemetry Keys

```typescript
const keys = await restClient.getTelemetryKeys("DEVICE", deviceId);
console.log("Available keys:", keys);
```

### Fetch Latest Telemetry

```typescript
const latest = await restClient.getLatestTelemetry("DEVICE", deviceId, [
  "temperature",
  "humidity",
]);
```

### Fetch Historical Telemetry

```typescript
const endTs = Date.now();
const startTs = endTs - 7 * 24 * 60 * 60 * 1000; // Last 7 days

const timeseries = await restClient.fetchTelemetry({
  entityType: "DEVICE",
  entityId: deviceId,
  keys: ["temperature", "humidity", "pressure"],
  startTs,
  endTs,
  limit: 10000,
});
```

### Fetch with Aggregation

```typescript
const aggregated = await restClient.fetchTelemetry({
  entityType: "DEVICE",
  entityId: deviceId,
  keys: ["temperature"],
  startTs,
  endTs,
  interval: 3600000, // 1 hour intervals
  agg: "AVG", // Average aggregation
  limit: 100,
});
```

## Telemetry Parsing & Export

### CSV Export

```typescript
import { CsvParser } from "./src/parsers/csv-parser";

const csvParser = new CsvParser(",", true); // delimiter, includeHeaders

// Parse timeseries data
const rows = csvParser.parse(timeseries);

// Export to file
await csvParser.formatToFile(rows, "telemetry_export.csv");

// Or get CSV string
const csvString = csvParser.format(rows);
```

### JSON Export

```typescript
import { JsonParser } from "./src/parsers/json-parser";

const jsonParser = new JsonParser(true); // pretty print

const rows = jsonParser.parse(timeseries);
await jsonParser.formatToFile(rows, "telemetry_export.json");
```

### Custom Parser

Create your own parser by extending `BaseParser`:

```typescript
import { BaseParser } from "./src/parsers/base-parser";
import type { ParsedTelemetryRow } from "./src/types";

class CustomParser extends BaseParser {
  format(rows: ParsedTelemetryRow[]): string {
    // Your custom formatting logic
    return rows.map(row => /* format */).join("\n");
  }

  async formatToFile(rows: ParsedTelemetryRow[], filePath: string): Promise<void> {
    const content = this.format(rows);
    await Bun.write(filePath, content);
  }
}
```

## Examples

### Run Basic Example

```bash
bun run start
```

### Run RPC Example

```bash
bun run rpc
```

### Run Attributes Subscribe Example

```bash
bun run subscribe
```

### Fetch Telemetry and Export to CSV

```bash
bun run fetch-csv
```

### Fetch Specific Telemetry Keys

```bash
bun run fetch-keys
```

## Error Handling

The client throws errors for HTTP errors (400, 401, 404, etc.):

```typescript
try {
  await client.publishTelemetry({ temperature: 25 });
} catch (error) {
  if (error instanceof Error) {
    console.error("Error:", error.message);
  }
}
```

## API Documentation

For complete API documentation, refer to the [ThingsBoard HTTP API Reference](https://thingsboard.io/docs/reference/http-api/).

## License

This project is provided as-is for demonstration purposes.