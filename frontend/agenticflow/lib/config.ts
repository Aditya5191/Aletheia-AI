// Dataset bias pipeline (port 8005)
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");

// Model audit pipeline (port 8006)
export const MODEL_API_BASE_URL =
  process.env.NEXT_PUBLIC_MODEL_API_URL || "http://localhost:8006";

export const MODEL_WS_BASE_URL =
  process.env.NEXT_PUBLIC_MODEL_WS_URL ||
  MODEL_API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");

// LLM BiasProbe (port 8007)
export const BIASPROBE_API_BASE_URL =
  process.env.NEXT_PUBLIC_BIASPROBE_API_URL || "http://localhost:8007";

export const BIASPROBE_WS_BASE_URL =
  process.env.NEXT_PUBLIC_BIASPROBE_WS_URL ||
  BIASPROBE_API_BASE_URL.replace("https://", "wss://").replace("http://", "ws://");
