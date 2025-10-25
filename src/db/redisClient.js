import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisUrl = process.env.REDIS_URL;

// General client (for caching, normal commands)
export const client = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Publisher client
export const pubClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Subscriber client (only for subscribing)
export const subClient = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Subscribe safely
subClient.on("connect", () => console.log("✅ Redis Sub connected"));
subClient.on("error", (err) => console.error("Redis Sub Error:", err));
subClient.on("close", () => console.warn("Redis Sub connection closed"));

subClient.subscribe("chat_message", (err, count) => {
  if (err) return console.error("Subscribe error:", err);
  console.log(`✅ Subscribed to chat_message (${count} channels)`);
});

subClient.subscribe("video_control", (err, count) => {
  if (err) return console.error("Subscribe error:", err);
  console.log(`✅ Subscribed to video_control (${count} channels)`);
});

subClient.on("message", (channel, message) => {
  if (!message) return;
  try {
    const parsed = JSON.parse(message);
    // You will handle this in socket middleware
    console.log(`Received message on ${channel}:`, parsed);
  } catch (err) {
    console.error(`Invalid JSON from channel ${channel}:`, message);
  }
});
