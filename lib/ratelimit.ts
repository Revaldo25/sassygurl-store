import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Hubungkan ke 'Gudang Data' Kecepatan Tinggi
export const loginRateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 kali coba per 60 detik
  analytics: true,
  prefix: "@upstash/ratelimit",
});