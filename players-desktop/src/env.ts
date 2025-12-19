const rawBase = (import.meta.env.VITE_API_BASE as string | undefined) || "http://localhost:8080";
export const API_BASE = rawBase.replace(/\/$/, "");
