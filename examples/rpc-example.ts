import { ThingsBoardClient } from "../src/client";

async function rpcExample() {
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
    console.log("Subscribing to RPC commands...");
    console.log("(This will wait for RPC commands from the server)");
    console.log("(Press Ctrl+C to exit)\n");

    while (true) {
      const rpcRequest = await client.subscribeToRpc(20000);

      if (rpcRequest) {
        console.log("Received RPC request:", JSON.stringify(rpcRequest, null, 2));

        if (rpcRequest.method === "setGpio") {
          const params = rpcRequest.params as { pin: string; value: number };
          console.log(`Setting GPIO pin ${params.pin} to ${params.value}`);

          await client.respondToRpc(rpcRequest.id, {
            result: "ok",
          });
          console.log("✓ RPC response sent");
        } else {
          await client.respondToRpc(rpcRequest.id, {
            result: "unknown method",
          });
        }
      } else {
        console.log("No RPC requests received (timeout)");
      }
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

rpcExample();