import { ThingsBoardClient } from "../src/client";

async function attributesSubscribeExample() {
  const host = process.env.TB_HOST || "demo.thingsboard.io";
  const accessToken = process.env.TB_ACCESS_TOKEN || "YOUR_ACCESS_TOKEN";

  if (accessToken === "YOUR_ACCESS_TOKEN") {
    console.error("Please set TB_ACCESS_TOKEN environment variable");
    process.exit(1);
  }

  const useHttpsEnv = process.env.TB_USE_HTTPS;
  const useHttps =
    useHttpsEnv === "true" ||
    (useHttpsEnv !== "false" &&
      !host.includes("localhost") &&
      !host.includes("127.0.0.1") &&
      !host.includes("ec2-"));

  const client = new ThingsBoardClient({
    host,
    accessToken,
    useHttps,
  });

  try {
    console.log("Subscribing to attribute updates...");
    console.log("(This will wait for shared attribute changes from the server)");
    console.log("(Press Ctrl+C to exit)\n");

    while (true) {
      const updates = await client.subscribeToAttributeUpdates(20000);

      if (updates && (updates.client || updates.shared)) {
        console.log("Received attribute updates:", JSON.stringify(updates, null, 2));
      } else {
        console.log("No attribute updates received (timeout)");
      }
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

attributesSubscribeExample();