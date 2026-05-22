import { getToken, clearToken } from "./auth";
import type {
  Overview,
  NavPoint,
  HoldingsData,
  TradesData,
  SignalsData,
  Slot,
  ExecutionsData,
  ExecutionsSummary,
  PendingOrdersData,
  IndexDailyResponse,
  HoldingsDailyResponse,
  CombosResponse,
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

function withCombo(params: Record<string, string> | undefined, combo?: string): Record<string, string> {
  const result: Record<string, string> = params ? { ...params } : {};
  if (combo) result.combo = combo;
  return result;
}

export const api = {
  combos: () => request<CombosResponse>("/api/combos"),

  overview: (combo?: string) =>
    request<Overview>("/api/overview", withCombo(undefined, combo)),

  nav: (combo?: string) =>
    request<NavPoint[]>("/api/nav", withCombo(undefined, combo)),

  holdings: (combo?: string) =>
    request<HoldingsData>("/api/holdings", withCombo(undefined, combo)),

  holdingsDaily: (date: string, combo?: string) =>
    request<HoldingsDailyResponse>("/api/holdings/daily", withCombo({ date }, combo)),

  trades: (page = 1, size = 20, combo?: string) =>
    request<TradesData>("/api/trades", withCombo({ page: String(page), size: String(size) }, combo)),

  signals: (date?: string, combo?: string) =>
    request<SignalsData>("/api/signals", withCombo(date ? { date } : {}, combo)),

  signalDates: (combo?: string) =>
    request<string[]>("/api/signals/dates", withCombo(undefined, combo)),

  slots: (combo?: string) =>
    request<Slot[]>("/api/slots", withCombo(undefined, combo)),

  executions: (params: {
    page?: number;
    size?: number;
    action?: string;
    stock_code?: string;
    start_date?: string;
    end_date?: string;
  } = {}, combo?: string) => {
    const q: Record<string, string> = {};
    if (params.page) q.page = String(params.page);
    if (params.size) q.size = String(params.size);
    if (params.action) q.action = params.action;
    if (params.stock_code) q.stock_code = params.stock_code;
    if (params.start_date) q.start_date = params.start_date;
    if (params.end_date) q.end_date = params.end_date;
    return request<ExecutionsData>("/api/executions", withCombo(q, combo));
  },

  executionsSummary: (combo?: string) =>
    request<ExecutionsSummary>("/api/executions/summary", withCombo(undefined, combo)),

  pendingOrders: (status?: string, combo?: string) =>
    request<PendingOrdersData>("/api/pending-orders", withCombo(status ? { status } : {}, combo)),

  realtimeNav: (combo?: string) =>
    request<any>("/api/realtime_nav", withCombo(undefined, combo)),

  indexDaily: (ts_code: string, start_date?: string, end_date?: string) => {
    const q: Record<string, string> = { ts_code };
    if (start_date) q.start_date = start_date;
    if (end_date) q.end_date = end_date;
    return request<IndexDailyResponse>("/api/index_daily", q);
  },
};
