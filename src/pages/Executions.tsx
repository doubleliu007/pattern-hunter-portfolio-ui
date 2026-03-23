import { useEffect, useState, useCallback } from "react";
import {
  Table,
  Card,
  Alert,
  Tag,
  Row,
  Col,
  Statistic,
  Select,
  Input,
  DatePicker,
  Button,
  Space,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { api } from "../utils/api";
import useIsMobile from "../hooks/useIsMobile";
import type { ExecutionsData, ExecutionsSummary, Execution } from "../types";

const { RangePicker } = DatePicker;

interface Filters {
  action?: string;
  stock_code?: string;
  start_date?: string;
  end_date?: string;
}

function MobileExecutionCard({ e }: { e: Execution }) {
  const fmtMoney = (v: number) =>
    `¥${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{e.stock_code}</span>
        <div>
          <Tag color={e.action === "buy" ? "blue" : "volcano"}>
            {e.action === "buy" ? "买入" : "卖出"}
          </Tag>
          <Tag color={e.source === "live" ? "green" : "default"}>
            {e.source === "live" ? "实盘" : "回填"}
          </Tag>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px", fontSize: 13 }}>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>成交日期</span>
        <span>{e.exec_date}</span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>成交价</span>
        <span>{e.exec_price.toFixed(4)}</span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>股数</span>
        <span>{e.shares.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>名义金额</span>
        <span>{fmtMoney(e.amount)}</span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>总成本</span>
        <span style={{ color: "#cf1322" }}>{fmtMoney(e.total_cost)}</span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>净金额</span>
        <span>{fmtMoney(e.net_amount)}</span>
        <span style={{ color: "rgba(255,255,255,0.45)" }}>槽位</span>
        <span>#{e.slot_idx}</span>
      </div>
    </Card>
  );
}

export default function Executions() {
  const [data, setData] = useState<ExecutionsData | null>(null);
  const [summary, setSummary] = useState<ExecutionsSummary | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  const [filters, setFilters] = useState<Filters>({});
  const [filterAction, setFilterAction] = useState<string | undefined>();
  const [filterCode, setFilterCode] = useState("");
  const [filterDates, setFilterDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  const fetchPage = useCallback(
    (p: number, f: Filters = filters) => {
      setLoading(true);
      api
        .executions({ page: p, size: pageSize, ...f })
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    },
    [pageSize, filters],
  );

  useEffect(() => {
    fetchPage(1);
    api.executionsSummary().then(setSummary).catch(() => {});
  }, []);

  const handleSearch = () => {
    const f: Filters = {};
    if (filterAction) f.action = filterAction;
    if (filterCode.trim()) f.stock_code = filterCode.trim();
    if (filterDates?.[0]) f.start_date = filterDates[0].format("YYYY-MM-DD");
    if (filterDates?.[1]) f.end_date = filterDates[1].format("YYYY-MM-DD");
    setFilters(f);
    setPage(1);
    fetchPage(1, f);
  };

  const handleReset = () => {
    setFilterAction(undefined);
    setFilterCode("");
    setFilterDates(null);
    setFilters({});
    setPage(1);
    fetchPage(1, {});
  };

  if (error) return <Alert type="error" message={error} />;

  const fmtMoney = (v: number) =>
    `¥${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const columns = [
    { title: "成交日期", dataIndex: "exec_date", key: "exec_date", width: 110 },
    { title: "股票代码", dataIndex: "stock_code", key: "stock_code", width: 100, fixed: "left" as const },
    {
      title: "方向",
      dataIndex: "action",
      key: "action",
      width: 70,
      render: (v: string) => (
        <Tag color={v === "buy" ? "blue" : "volcano"}>
          {v === "buy" ? "买入" : "卖出"}
        </Tag>
      ),
    },
    { title: "市场价", dataIndex: "market_price", key: "market_price", width: 100, render: (v: number) => v.toFixed(4) },
    { title: "成交价", dataIndex: "exec_price", key: "exec_price", width: 100, render: (v: number) => v.toFixed(4) },
    {
      title: "股数",
      dataIndex: "shares",
      key: "shares",
      width: 100,
      render: (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 }),
    },
    { title: "名义金额", dataIndex: "amount", key: "amount", width: 120, render: (v: number) => fmtMoney(v) },
    { title: "滑点", dataIndex: "slippage", key: "slippage", width: 80, render: (v: number) => fmtMoney(v) },
    { title: "佣金", dataIndex: "commission", key: "commission", width: 80, render: (v: number) => fmtMoney(v) },
    { title: "印花税", dataIndex: "stamp_duty", key: "stamp_duty", width: 80, render: (v: number) => fmtMoney(v) },
    {
      title: "总成本",
      dataIndex: "total_cost",
      key: "total_cost",
      width: 100,
      render: (v: number) => <span style={{ color: "#cf1322" }}>{fmtMoney(v)}</span>,
    },
    { title: "净金额", dataIndex: "net_amount", key: "net_amount", width: 120, render: (v: number) => fmtMoney(v) },
    { title: "槽位", dataIndex: "slot_idx", key: "slot_idx", width: 60, render: (v: number) => `#${v}` },
    {
      title: "来源",
      dataIndex: "source",
      key: "source",
      width: 70,
      render: (v: string) => (
        <Tag color={v === "live" ? "green" : "default"}>
          {v === "live" ? "实盘" : "回填"}
        </Tag>
      ),
    },
    { title: "DA预测", dataIndex: "da_pred", key: "da_pred", width: 80, render: (v: number | null) => (v != null ? v.toFixed(4) : "-") },
    { title: "中期IQR", dataIndex: "zhong_iqr", key: "zhong_iqr", width: 80, render: (v: number | null) => (v != null ? v.toFixed(2) : "-") },
  ];

  const summarySection = summary && (
    <Card style={{ marginBottom: isMobile ? 8 : 16 }} size="small">
      <Row gutter={[12, 8]}>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="总成交笔数" value={summary.total} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="买入" value={summary.buys} valueStyle={{ color: "#1677ff" }} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="卖出" value={summary.sells} valueStyle={{ color: "#fa541c" }} />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="累计滑点" value={summary.total_slippage} precision={2} prefix="¥" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="累计佣金" value={summary.total_commission} precision={2} prefix="¥" />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Statistic title="累计印花税" value={summary.total_stamp_duty} precision={2} prefix="¥" />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Statistic
            title="累计总成本"
            value={summary.total_cost}
            precision={2}
            prefix="¥"
            valueStyle={{ color: "#cf1322" }}
          />
        </Col>
      </Row>
    </Card>
  );

  const filterSection = (
    <div style={{ marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
      <Select
        placeholder="交易方向"
        allowClear
        style={{ width: isMobile ? "100%" : 120 }}
        value={filterAction}
        onChange={setFilterAction}
        options={[
          { label: "买入", value: "buy" },
          { label: "卖出", value: "sell" },
        ]}
        size={isMobile ? "middle" : "middle"}
      />
      <Input
        placeholder="股票代码"
        allowClear
        style={{ width: isMobile ? "calc(50% - 4px)" : 140 }}
        value={filterCode}
        onChange={(e) => setFilterCode(e.target.value)}
      />
      <RangePicker
        value={filterDates as [Dayjs, Dayjs] | null}
        onChange={(v) => setFilterDates(v as [Dayjs | null, Dayjs | null] | null)}
        format="YYYY-MM-DD"
        style={{ width: isMobile ? "100%" : undefined }}
      />
      <div style={{ display: "flex", gap: 8 }}>
        <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
          查询
        </Button>
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
      </div>
    </div>
  );

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  if (isMobile) {
    const executions = data?.executions || [];
    return (
      <div>
        {summarySection}
        <Card title={`交割单明细 (共 ${data?.total || 0} 笔)`} size="small">
          {filterSection}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Tag>加载中...</Tag>
            </div>
          ) : executions.length === 0 ? (
            <div style={{ textAlign: "center", padding: 20, color: "rgba(255,255,255,0.45)" }}>暂无记录</div>
          ) : (
            <>
              {executions.map((e) => <MobileExecutionCard key={e.id} e={e} />)}
              <div style={{ textAlign: "center", marginTop: 12, display: "flex", gap: 12, justifyContent: "center" }}>
                <Tag
                  color={page > 1 ? "blue" : "default"}
                  style={{ cursor: page > 1 ? "pointer" : "default", padding: "4px 16px" }}
                  onClick={() => { if (page > 1) { setPage(page - 1); fetchPage(page - 1); } }}
                >
                  上一页
                </Tag>
                <span style={{ lineHeight: "28px", color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                  {page} / {totalPages}
                </span>
                <Tag
                  color={page < totalPages ? "blue" : "default"}
                  style={{ cursor: page < totalPages ? "pointer" : "default", padding: "4px 16px" }}
                  onClick={() => { if (page < totalPages) { setPage(page + 1); fetchPage(page + 1); } }}
                >
                  下一页
                </Tag>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      {summarySection}
      <Card title={`交割单明细 (共 ${data?.total || 0} 笔)`}>
        {filterSection}
        <Table
          dataSource={data?.executions || []}
          columns={columns}
          rowKey="id"
          size="small"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: false,
            showTotal: (total, range) => `${range[0]}-${range[1]} / 共 ${total} 条`,
            onChange: (p) => {
              setPage(p);
              fetchPage(p);
            },
          }}
        />
      </Card>
    </div>
  );
}
