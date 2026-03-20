import { useEffect, useState } from "react";
import { Table, Card, Spin, Alert, Tag } from "antd";
import { api } from "../utils/api";
import type { HoldingsData } from "../types";

export default function Holdings() {
  const [data, setData] = useState<HoldingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.holdings()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;
  if (error) return <Alert type="error" message={error} />;

  const positionColumns = [
    { title: "股票代码", dataIndex: "stock_code", key: "stock_code" },
    { title: "买入日期", dataIndex: "buy_date", key: "buy_date" },
    { title: "买入价", dataIndex: "buy_price", key: "buy_price" },
    { title: "持股数", dataIndex: "shares", key: "shares", render: (v: number) => v.toFixed(0) },
    { title: "成本", dataIndex: "cost", key: "cost", render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: "槽位",
      dataIndex: "slot_idx",
      key: "slot_idx",
      render: (v: number) => <Tag color="blue">#{v}</Tag>,
    },
    { title: "大分型预测", dataIndex: "da_pred", key: "da_pred", render: (v: number) => v?.toFixed(6) ?? "-" },
    { title: "中分型IQR", dataIndex: "zhong_iqr", key: "zhong_iqr", render: (v: number) => v?.toFixed(6) ?? "-" },
  ];

  const slotColumns = [
    { title: "槽位", dataIndex: "slot_idx", key: "slot_idx", render: (v: number) => `#${v}` },
    { title: "剩余资金", dataIndex: "capital", key: "capital", render: (v: number) => `¥${v.toLocaleString()}` },
    { title: "持仓数", dataIndex: "position_count", key: "position_count" },
  ];

  return (
    <div>
      <Card title={`当前持仓 (${data?.positions?.length || 0} 只)`}>
        <Table
          dataSource={data?.positions || []}
          columns={positionColumns}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 50 }}
        />
      </Card>

      <Card title="槽位状态" style={{ marginTop: 16 }}>
        <Table
          dataSource={data?.slots || []}
          columns={slotColumns}
          rowKey="slot_idx"
          size="small"
          pagination={false}
        />
      </Card>
    </div>
  );
}
