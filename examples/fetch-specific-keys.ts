import { ThingsBoardRestClient } from "../src/rest-client";
import { CsvParser } from "../src/parsers/csv-parser";
import { MILLISECONDS_PER_DAY } from "../src/utils/constants";

async function fetchSpecificKeys() {
  const host = process.env.TB_HOST || "demo.thingsboard.io";
  const username = process.env.TB_USERNAME || "YOUR_USERNAME";
  const password = process.env.TB_PASSWORD || "YOUR_PASSWORD";
  const deviceId = process.env.TB_DEVICE_ID || "YOUR_DEVICE_ID";

  if (username === "YOUR_USERNAME" || password === "YOUR_PASSWORD") {
    console.error("Please set TB_USERNAME and TB_PASSWORD environment variables");
    process.exit(1);
  }

  if (deviceId === "YOUR_DEVICE_ID") {
    console.error("Please set TB_DEVICE_ID environment variable");
    process.exit(1);
  }

  const client = new ThingsBoardRestClient({
    host,
    username,
    password,
    useHttps: true,
  });

  const csvParser = new CsvParser(",", true);

  const specificKeys = [
    "abnormalSleep",
    "awakeDuration",
    "breathInform",
    "breathValue",
    "deepSleepDuration",
    "getIntoBed",
    "heartBeat",
    "heartRateValue",
    "humanDistance",
    "humanPosition",
    "id",
    "lightSleepDuration",
    "locationOutOfBounds",
    "method",
    "motionStatus",
    "movementSigns",
    "seconds",
    "sleepComprehensiveStatus",
    "sleepQualityAnalysis",
    "sleepScore",
    "sleepStartTime",
    "sleepStatus",
    "someoneExists",
  ];

  try {
    console.log("Fetching telemetry data for specific keys...");
    const endTs = Date.now();
    const daysToFetch = 30;
    const startTs = endTs - daysToFetch * MILLISECONDS_PER_DAY;

    const timeseries = await client.fetchTelemetry({
      entityType: "DEVICE",
      entityId: deviceId,
      keys: specificKeys,
      startTs,
      endTs,
      limit: 10000,
    });

    const availableKeys = Object.keys(timeseries);
    console.log(`✓ Fetched telemetry data for ${availableKeys.length} keys`);
    console.log(`Available keys: ${availableKeys.join(", ")}`);

    console.log("\nParsing telemetry data...");
    const parsedRows = csvParser.parse(timeseries);
    console.log(`✓ Parsed ${parsedRows.length} data points`);

    if (parsedRows.length === 0) {
      console.log("No data points to export. Exiting.");
      return;
    }

    const outputFile = `sleep_telemetry_export_${Date.now()}.csv`;
    console.log(`\nExporting to CSV: ${outputFile}...`);
    await csvParser.formatToFile(parsedRows, outputFile);
    console.log(`✓ Successfully exported to ${outputFile}`);

    console.log("\nSample data (first 3 rows):");
    const csvPreview = csvParser.format(parsedRows.slice(0, 3));
    console.log(csvPreview);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    client.logout();
  }
}

fetchSpecificKeys();