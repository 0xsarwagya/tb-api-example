import { ThingsBoardRestClient } from "../src/rest-client";
import { CsvParser } from "../src/parsers/csv-parser";
import { MILLISECONDS_PER_DAY } from "../src/utils/constants";

async function fetchAndExportToCsv() {
  const host = process.env.TB_HOST || "demo.thingsboard.io";
  const username = process.env.TB_USERNAME;
  const password = process.env.TB_PASSWORD;
  const jwtToken = process.env.TB_JWT_TOKEN;
  const deviceId = process.env.TB_DEVICE_ID;

  const useJwtToken = !!jwtToken;
  const useUsernamePassword = !!username && !!password;

  if (!useJwtToken && !useUsernamePassword) {
    console.error("❌ Authentication required!");
    console.error("\nPlease provide one of the following:");
    console.error("  Option 1: TB_USERNAME and TB_PASSWORD");
    console.error("  Option 2: TB_JWT_TOKEN (pre-authenticated JWT token)");
    console.error("\nAlso set TB_DEVICE_ID to specify which device to fetch from.");
    console.error("\nExample:");
    console.error("  TB_HOST=your-host TB_USERNAME=user TB_PASSWORD=pass TB_DEVICE_ID=device-id bun run fetch-csv");
    console.error("  TB_HOST=your-host TB_JWT_TOKEN=your-jwt-token TB_DEVICE_ID=device-id bun run fetch-csv");
    process.exit(1);
  }

  if (!deviceId) {
    console.error("❌ Please set TB_DEVICE_ID environment variable");
    process.exit(1);
  }

  const useHttps = !host.includes("localhost") && !host.includes("127.0.0.1");

  let client: ThingsBoardRestClient;

  if (useJwtToken) {
    console.log("🔑 Using JWT token authentication");
    client = new ThingsBoardRestClient({
      host,
      jwtToken: jwtToken!,
      useHttps,
    });
  } else {
    console.log("🔑 Using username/password authentication");
    client = new ThingsBoardRestClient({
      host,
      username: username!,
      password: password!,
      useHttps,
    });
  }

  const csvParser = new CsvParser(",", true);

  try {
    console.log("Fetching telemetry keys...");
    const keys = await client.getTelemetryKeys("DEVICE", deviceId);
    console.log(`✓ Found ${keys.length} telemetry keys:`, keys.join(", "));

    if (keys.length === 0) {
      console.log("No telemetry keys found. Exiting.");
      return;
    }

    const endTs = Date.now();
    const daysToFetch = 7;
    const startTs = endTs - daysToFetch * MILLISECONDS_PER_DAY;

    console.log("\nFetching telemetry data (last 7 days)...");
    const timeseries = await client.fetchTelemetry({
      entityType: "DEVICE",
      entityId: deviceId,
      keys: keys,
      startTs,
      endTs,
      limit: 10000,
    });

    console.log(`✓ Fetched telemetry data for ${keys.length} keys`);

    console.log("\nParsing telemetry data...");
    const parsedRows = csvParser.parse(timeseries);
    console.log(`✓ Parsed ${parsedRows.length} data points`);

    if (parsedRows.length === 0) {
      console.log("No data points to export. Exiting.");
      return;
    }

    const outputFile = `telemetry_export_${Date.now()}.csv`;
    console.log(`\nExporting to CSV: ${outputFile}...`);
    await csvParser.formatToFile(parsedRows, outputFile);
    console.log(`✓ Successfully exported to ${outputFile}`);

    console.log("\nFirst few rows:");
    const csvPreview = csvParser.format(parsedRows.slice(0, 5));
    console.log(csvPreview);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    client.logout();
  }
}

fetchAndExportToCsv();