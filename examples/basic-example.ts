import { ThingsBoardClient } from "../src/client";

async function main() {
  const host = process.env.TB_HOST || "demo.thingsboard.io";
  const accessToken = process.env.TB_ACCESS_TOKEN || "YOUR_ACCESS_TOKEN";

  if (accessToken === "YOUR_ACCESS_TOKEN") {
    console.error("Please set TB_ACCESS_TOKEN environment variable");
    process.exit(1);
  }

  const client = new ThingsBoardClient({
    host,
    accessToken,
    useHttps: true,
  });

  try {
    console.log("Publishing telemetry data...");
    await client.publishTelemetry({
      temperature: 25.5,
      humidity: 60,
      pressure: 1013.25,
    });
    console.log("✓ Telemetry published successfully");

    console.log("\nPublishing attributes...");
    await client.publishAttributes({
      firmwareVersion: "1.0.0",
      deviceModel: "Sensor-2024",
      location: "Building A, Floor 3",
    });
    console.log("✓ Attributes published successfully");

    console.log("\nRequesting attributes...");
    const attributes = await client.requestAttributes(
      ["firmwareVersion", "deviceModel"],
      ["location"]
    );
    console.log("✓ Attributes received:", JSON.stringify(attributes, null, 2));

    console.log("\nExample: Publishing telemetry with timestamp...");
    const timestamp = Date.now();
    await client.publishTelemetry({
      ts: timestamp,
      values: {
        temperature: 26.0,
        humidity: 58,
      },
    });
    console.log("✓ Timestamped telemetry published successfully");

    console.log("\nExample: Publishing array of telemetry data...");
    await client.publishTelemetry([
      { sensor1: 42 },
      { sensor2: true },
    ]);
    console.log("✓ Array telemetry published successfully");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();