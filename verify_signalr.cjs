const signalR = require("@microsoft/signalr");

const connection = new signalR.HubConnectionBuilder()
  .withUrl("http://localhost:5009/hubs/notifications")
  .build();

connection.on("ProviderStatusChanged", (data) => {
  console.log("RECEIVED PROVIDER STATUS SIGNALR EVENT:");
  console.log(JSON.stringify(data, null, 2));
  console.log("--- SUCCESS ---");
  process.exit(0);
});

async function start() {
  try {
    await connection.start();
    console.log("SignalR Connected. Waiting for provider status (should happen within 15s)...");
    
    // Timeout after 30s
    setTimeout(() => {
      console.log("No signalR event received within 30s.");
      process.exit(1);
    }, 30000);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start();
