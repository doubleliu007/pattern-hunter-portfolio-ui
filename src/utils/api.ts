import { getToken, clearToken } from "./auth";
import type {
  Overview,
  NavPoint,
  HoldingsData,
  TradesData,
  SignalsData,
  Slot,
} from "../types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

async function request<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("NO_TOKEN");

  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearToken();
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  overview: () => request<Overview>("/api/overview"),
  nav: () => request<NavPoint[]>("/api/nav"),
  holdings: () => request<HoldingsData>("/api/holdings"),
  trades: (page = 1, size = 20) =>
    request<TradesData>("/api/trades", { page: String(page), size: String(size) }),
  signals: (date?: string) =>
    request<SignalsData>("/api/signals", date ? { date } : {}),
  signalDates: () => request<string[]>("/api/signals/dates"),
  slots: () => request<Slot[]>("/api/slots"),
};
