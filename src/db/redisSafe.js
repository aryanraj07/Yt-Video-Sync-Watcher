import { client as redisClient } from "./redisClient.js";
export const redisSafe = {
  enabled: () => !!redisClient && redisClient.status === "ready",
  async get(key) {
    if (!this.enabled()) return;
    try {
      return await redisClient.get(key);
    } catch (err) {
      return null;
    }
  },
  async set(key, value, options = {}) {
    if (!this.enabled()) return;
    try {
      return await redisClient.set(key, value, options);
    } catch (err) {}
  },
  async expire(key, seconds) {
    if (!this.enabled()) return;
    try {
      return await redisClient.expire(key, seconds);
    } catch (err) {}
  },
  async lPush(key, value) {
    if (!this.enabled()) return;
    try {
      return await redisClient.lPush(key, value);
    } catch (eerr) {}
  },
  async lTrim(key, start, stop) {
    if (!this.enabled()) return;
    try {
      return await redisClient.lTrim(key, start, stop);
    } catch (err) {}
  },
};
