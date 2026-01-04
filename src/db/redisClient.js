import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

export const client = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    // ❌ NO tls
  },
});

client.on("connect", () => console.log("✅ Redis connecting"));
client.on("ready", () => console.log("🚀 Redis ready"));
client.on("error", (err) =>
  console.error("❌ Redis Client Error", err.message)
);

await client.connect();

export const pubClient = client.duplicate();
export const subClient = client.duplicate();

await pubClient.connect();
await subClient.connect();
