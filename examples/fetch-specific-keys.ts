import { ThingsBoardRestClient } from "../src/rest-client";
import { CsvParser } from "../src/parsers/csv-parser";
import { MILLISECONDS_PER_DAY } from "../src/utils/constants";

async function fetchSpecificKeys() {
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
    console.error("  Option 1: TB_USERNAME and TB_PASSWORD (recommended)");
    console.error("  Option 2: TB_JWT_TOKEN (pre-authenticated JWT token)");
    console.error("\n⚠️  Note: TB_ACCESS_TOKEN (device access token) cannot be used for REST API.");
    console.error("   Device access tokens are only for HTTP Device API (publishing data).");
    console.error("   REST API (fetching data) requires user credentials.");
    console.error("\nAlso set TB_DEVICE_ID to specify which device to fetch from.");
    process.exit(1);
  }

  if (!deviceId) {
    console.error("❌ Please set TB_DEVICE_ID environment variable");
    process.exit(1);
  }

  const useHttpsEnv = process.env.TB_USE_HTTPS;
  const useHttps =
    useHttpsEnv === "true" ||
    (useHttpsEnv !== "false" &&
      !host.includes("localhost") &&
      !host.includes("127.0.0.1") &&
      !host.includes("ec2-"));

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
    console.log(`\n📡 Connecting to: ${host}`);
    console.log(`📱 Device ID: ${deviceId}`);
    console.log(`🔒 Protocol: ${useHttps ? "HTTPS" : "HTTP"}\n`);

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