export interface Overview {
  total_return_pct: number;
  max_drawdown: number;
  sharpe_ratio: number;
  total_value: number;
  position_value: number;
  holding_count: number;
  trade_stats: {
    total: number;
    win_rate: number;
  };
}

export interface NavPoint {
  date: string;
  total_value: number;
  drawdown: number;
  return_pct: number;
}

export interface Position {
  id: number;
  stock_code: string;
  buy_date: string;
  buy_price: number;
  shares: number;
  cost: number;
  slot_idx: number;
  da_pred: number | null;
  zhong_iqr: number | null;
}

export interface Slot {
  slot_idx: number;
  capital: number;
  position_count: number;
}

export interface HoldingsData {
  positions: Position[];
  slots: Slot[];
}

export interface Trade {
  id: number;
  stock_code: string;
  buy_date: string;
  buy_price: number;
  sell_date: string;
  sell_price: number;
  profit: number;
  profit_pct: number;
  slot_idx: number;
  sell_reason: string;
}

export interface TradesData {
  trades: Trade[];
  total: number;
}

export interface Signal {
  stock_code: string;
  da_next_price_change: number | null;
  zhong_iqr: number | null;
  passed_filter: boolean;
}

export interface SignalsData {
  signals: Signal[];
}
