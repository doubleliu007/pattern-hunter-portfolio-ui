import { useEffect, useState } from "react";
import { Table, Card, Spin, Alert, Tag } from "antd";
import { api } from "../utils/api";
import type { TradesData } from "../types";

export default function Trades() {
  const [data, setData] = useState<TradesData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    { title: "股票代码", dataIndex: "stock_code", key: "stock_code", width: 100 },
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

  return (
    <Card title={`交易记录 (共 ${data?.total || 0} 笔)`}>
      <Table
        dataSource={data?.trades || []}
        columns={columns}
        rowKey="id"
        size="small"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total: data?.total || 0,
          showSizeChanger: false,
          onChange: (p) => { setPage(p); fetchPage(p); },
        }}
      />
    </Card>
  );
}
