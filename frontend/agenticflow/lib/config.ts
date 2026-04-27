// API configuration - uses environment variable in production, falls back to localhost for dev
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");
