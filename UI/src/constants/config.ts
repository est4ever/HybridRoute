// Backend API URL — set VITE_API_BASE_URL for deployed/ngrok; default matches local demo backend.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8002';