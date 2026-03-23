import { useEffect, useState } from "react";
import { Table, Card, Spin, Alert, Tag } from "antd";
import { api } from "../utils/api";
import useIsMobile from "../hooks/useIsMobile";
import type { TradesData, Trade } from "../types";

function MobileTradeCard({ t }: { t: Trade }) {
  const color = t.profit >= 0 ? "#3f8600" : "#cf1322";
  const sign = t.profit >= 0 ? "+" : "";

  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{t.stock_code}</span>
        <Tag color={t.profit_pct >= 0 ? "green" : "red"}>{t.profit_pct.toFixed(2)}%</Tag>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 13 }}>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>买入</span>
        <span>{t.buy_date} @ {t.buy_price}</span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>卖出</span>
        <span>{t.sell_date} @ {t.sell_price}</span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>收益</span>
        <span style={{ color }}>
          {sign}¥{t.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>槽位 / 原因</span>
        <span>#{t.slot_idx} / {t.sell_reason}</span>
      </div>
    </Card>
  );
}

export default function Trades() {
  const [data, setData] = useState<TradesData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  const pageSize = 20;

  const fetchPage = (p: number) => {
    setLoading(true);
    api.trades(p, pageSize)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPage(1); }, []);

  if (error) return <Alert type="error" message={error} />;

  const columns = [
    { title: "股票代码", dataIndex: "stock_code", key: "stock_code", width: 100, fixed: "left" as const },
    { title: "买入日期", dataIndex: "buy_date", key: "buy_date", width: 110 },
    { title: "买入价", dataIndex: "buy_price", key: "buy_price", width: 80 },
    { title: "卖出日期", dataIndex: "sell_date", key: "sell_date", width: 110 },
    { title: "卖出价", dataIndex: "sell_price", key: "sell_price", width: 80 },
    {
      title: "收益",
      dataIndex: "profit",
      key: "profit",
      width: 110,
      render: (v: number) => (
        <span style={{ color: v >= 0 ? "#3f8600" : "#cf1322" }}>
          ¥{v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      title: "收益率",
      dataIndex: "profit_pct",
      key: "profit_pct",
      width: 90,
      render: (v: number) => (
        <Tag color={v >= 0 ? "green" : "red"}>{v.toFixed(2)}%</Tag>
      ),
    },
    { title: "槽位", dataIndex: "slot_idx", key: "slot_idx", width: 60, render: (v: number) => `#${v}` },
    { title: "卖出原因", dataIndex: "sell_reason", key: "sell_reason", width: 100 },
  ];

  const paginationConfig = {
    current: page,
    pageSize,
    total: data?.total || 0,
    showSizeChanger: false,
    onChange: (p: number) => { setPage(p); fetchPage(p); },
  };

  if (isMobile) {
    const trades = data?.trades || [];
    return (
      <Card title={`交易记录 (共 ${data?.total || 0} 笔)`} size="small">
        {loading ? (
          <Spin style={{ display: "block", margin: "40px auto" }} />
        ) : trades.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.45)" }}>暂无记录</div>
        ) : (
          <>
            {trades.map((t) => <MobileTradeCard key={t.id} t={t} />)}
            <div style={{ textAlign: "center", marginTop: 12, display: "flex", gap: 12, justifyContent: "center" }}>
              <Tag
                color={page > 1 ? "blue" : "default"}
                style={{ cursor: page > 1 ? "pointer" : "default", padding: "4px 16px" }}
                onClick={() => { if (page > 1) { setPage(page - 1); fetchPage(page - 1); } }}
              >
                上一页
              </Tag>
              <span style={{ lineHeight: "28px", color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                {page} / {Math.ceil((data?.total || 0) / pageSize)}
              </span>
              <Tag
                color={page < Math.ceil((data?.total || 0) / pageSize) ? "blue" : "default"}
                style={{ cursor: page < Math.ceil((data?.total || 0) / pageSize) ? "pointer" : "default", padding: "4px 16px" }}
                onClick={() => {
                  const maxPage = Math.ceil((data?.total || 0) / pageSize);
                  if (page < maxPage) { setPage(page + 1); fetchPage(page + 1); }
                }}
              >
                下一页
              </Tag>
            </div>
          </>
        )}
      </Card>
    );
  }

  return (
    <Card title={`交易记录 (共 ${data?.total || 0} 笔)`}>
      <Table
        dataSource={data?.trades || []}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        scroll={{ x: 840 }}
        pagination={paginationConfig}
      />
    </Card>
  );
}
