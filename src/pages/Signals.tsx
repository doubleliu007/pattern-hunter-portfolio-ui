import { useEffect, useState } from "react";
import { Table, Card, Select, Spin, Alert, Tag } from "antd";
import { api } from "../utils/api";
import type { SignalsData, Signal } from "../types";

export default function Signals() {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [data, setData] = useState<SignalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.signalDates()
      .then((d) => {
        setDates(d);
        if (d.length > 0) {
          setSelectedDate(d[0]);
          return api.signals(d[0]);
        }
        return null;
      })
      .then((res) => { if (res) setData(res); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const onDateChange = (date: string) => {
    setSelectedDate(date);
    setLoading(true);
    api.signals(date)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  if (error) return <Alert type="error" message={error} />;

  const columns = [
    { title: "股票代码", dataIndex: "stock_code", key: "stock_code", width: 120 },
    {
      title: "大分型 next_price_change",
      dataIndex: "da_next_price_change",
      key: "da_next_price_change",
      width: 180,
      sorter: (a: Signal, b: Signal) => (a.da_next_price_change || 0) - (b.da_next_price_change || 0),
      render: (v: number) => v?.toFixed(6) ?? "-",
    },
    {
      title: "中分型 IQR",
      dataIndex: "zhong_iqr",
      key: "zhong_iqr",
      width: 140,
      sorter: (a: Signal, b: Signal) => (a.zhong_iqr || 0) - (b.zhong_iqr || 0),
      render: (v: number) => v?.toFixed(6) ?? "-",
    },
    {
      title: "通过筛选",
      dataIndex: "passed_filter",
      key: "passed_filter",
      width: 100,
      filters: [
        { text: "通过", value: true },
        { text: "未通过", value: false },
      ],
      onFilter: (value: boolean | React.Key, record: Signal) => record.passed_filter === value,
      render: (v: boolean) =>
        v ? <Tag color="green">通过</Tag> : <Tag>未通过</Tag>,
    },
  ];

  const passedCount = data?.signals?.filter((s) => s.passed_filter).length || 0;

  return (
    <Card
      title={
        <span>
          每日扫描信号
          <Select
            value={selectedDate || undefined}
            onChange={onDateChange}
            style={{ width: 160, marginLeft: 16 }}
            placeholder="选择日期"
            options={dates.map((d) => ({ value: d, label: d }))}
          />
          {data && (
            <span style={{ marginLeft: 16, fontSize: 14, fontWeight: "normal" }}>
              共 {data.signals?.length || 0} 只, 通过筛选 {passedCount} 只
            </span>
          )}
        </span>
      }
    >
      <Table
        dataSource={data?.signals || []}
        columns={columns}
        rowKey="stock_code"
        size="small"
        loading={loading}
        pagination={{ pageSize: 50 }}
      />
    </Card>
  );
}
