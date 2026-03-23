# Pattern Hunter Dashboard — 前端开发文档

Pattern Hunter 的组合跟踪仪表盘前端，用于展示量化策略的净值、持仓、交易记录、交割单、挂单和每日扫描信号。支持桌面端与移动端响应式布局。

## 技术栈

| 分类 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| 路由 | react-router-dom 7 (HashRouter) |
| UI | Ant Design 5 (深色主题) |
| 图表 | ECharts 5 + echarts-for-react |
| 构建 | Vite 6 |
| 部署 | GitHub Pages (`gh-pages`) / Vercel |

## 目录结构

```
├── .env.example                # 环境变量示例
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx                # 入口，HashRouter 挂载
    ├── App.tsx                 # 布局骨架 + 路由 + 认证守卫 + 响应式适配
    ├── global.css              # 全局样式（移动端底部导航等）
    ├── types.ts                # 全部 API 响应类型定义
    ├── components/
    │   └── ErrorBoundary.tsx   # 运行时错误兜底组件
    ├── hooks/
    │   └── useIsMobile.ts      # 基于 Ant Design breakpoint 的移动端判断
    ├── utils/
    │   ├── api.ts              # 统一请求封装 + 所有 API 端点
    │   └── auth.ts             # Token 存取 (localStorage)
    └── pages/
        ├── Dashboard.tsx       # 组合概览 + 指数对比
        ├── Holdings.tsx        # 当前持仓 + 槽位
        ├── Executions.tsx      # 交割单明细
        ├── PendingOrders.tsx   # 挂单管理
        ├── Signals.tsx         # 每日扫描信号
        └── Trades.tsx          # 已完成交易对
```

## 认证机制

应用使用 Bearer Token 认证，没有登录页面。

1. 用户通过 URL 参数 `?token=xxx` 首次访问
2. `extractTokenFromUrl()` 提取 token 存入 `localStorage`（key: `ph_api_token`），随后从 URL 中移除该参数
3. 后续访问直接从 `localStorage` 读取 token
4. 所有 API 请求自动带 `Authorization: Bearer <token>` 头
5. 后端返回 401 时自动清除 token 并抛出 `UNAUTHORIZED`
6. 侧边栏底部（桌面端）或顶栏（移动端）提供「清除 Token」按钮，点击后清除并刷新页面

无 token 时页面显示 403 提示，不会渲染任何业务内容。

## 响应式布局

通过 `useIsMobile` Hook（基于 Ant Design `Grid.useBreakpoint()`，`< md` 视为移动端）实现桌面/移动端双布局：

- **桌面端**：左侧导航栏 + 顶栏标题 + 内容区
- **移动端**：顶部 Header + 内容区 + 底部 Tab 导航；部分页面（交割单、挂单）使用卡片列表代替表格

## 页面功能

### Dashboard (`/`)

组合整体表现的概览页，调用 `GET /api/overview`、`GET /api/nav`、`GET /api/holdings` 和 `GET /api/index_daily`。

- **数据更新标记**：右上角显示持仓市值的最新更新日期
- **统计卡片（第一行 4 个）**：总收益率、最大回撤、夏普比率、已了结胜率（含盈亏笔数和平均收益率）
- **统计卡片（第二行）**：持仓胜率（浮盈/浮亏数量）
- **净值走势图**：ECharts 双 Y 轴折线图，左轴为净值绝对值，右轴为收益率百分比
- **回撤曲线图**：红色面积图展示历史回撤
- **指数对比**：可选沪深300/中证500/中证800/中证1000，展示归一化净值对比图、收益率对比图（含超额收益曲线），以及组合收益率、指数收益率、超额收益三个统计卡片
- **资产卡片（3 个）**：总资产（¥）、持仓市值（¥）、当前持仓数

### Holdings (`/holdings`)

当前持仓和槽位的详情页，调用 `GET /api/holdings`。

- **持仓表**：股票代码、买入日期、买入价、持股数、成本、当前市值、市值更新日期、所属槽位、大分型预测值、中分型 IQR 值
- **槽位表**：槽位编号、剩余资金、持仓数量、持有股票、槽位统计

### Executions (`/executions`)

交割单明细页，调用 `GET /api/executions`（支持分页和筛选）和 `GET /api/executions/summary`。

- **汇总卡片**：总成交笔数、买入/卖出笔数、累计滑点、累计佣金、累计印花税、累计总成本
- **筛选条件**：交易方向（买入/卖出）、股票代码、日期范围
- **交割表**：成交日期、股票代码、方向、市场价、成交价、股数、名义金额、滑点、佣金、印花税、总成本、净金额、槽位、来源（实盘/回填）、DA 预测、中期 IQR
- **分页**：每页 20 条，服务端分页
- **移动端**：使用卡片布局替代表格 + 简易翻页

### PendingOrders (`/pending-orders`)

挂单管理页，调用 `GET /api/pending-orders`。

- **状态筛选**：待执行 / 已成交 / 无开盘价 / 资金不足
- **挂单表**：挂单 ID、创建日期、股票代码、槽位、方向、DA 预测、中期 IQR、状态
- **移动端**：使用卡片布局替代表格

### Signals (`/signals`)

每日策略扫描的选股信号页，调用 `GET /api/signals/dates` 获取日期列表，再调用 `GET /api/signals?date=xxx` 获取具体信号。

- **日期选择器**：下拉选择有信号数据的日期，默认选最近一天
- **信号表**：股票代码、大分型 next_price_change、中分型 IQR、是否通过筛选
- **交互**：支持按数值列排序、按「通过筛选」列过滤
- **统计**：标题区显示总信号数和通过筛选数

### Trades (`/trades`)

已完成交易对记录页，调用 `GET /api/trades`，支持分页。

- **交易表**：股票代码、买入/卖出日期与价格、收益金额（涨绿跌红）、收益率（Tag 色标）、槽位编号、卖出原因
- **分页**：每页 20 条，服务端分页（传 `page` 和 `size` 参数）

## API 接口

所有请求通过 `src/utils/api.ts` 中的 `request()` 函数统一发出。基础地址由环境变量 `VITE_API_BASE` 控制，默认 `http://localhost:8080`。

| 端点 | 方法 | 参数 | 返回 | 使用页面 |
|------|------|------|------|----------|
| `/api/overview` | GET | — | 总收益率、回撤、夏普、胜率、资产等 | Dashboard |
| `/api/nav` | GET | — | 每日净值序列 (date, total_value, drawdown, return_pct) | Dashboard |
| `/api/holdings` | GET | — | `{ positions: [...], slots: [...] }` | Dashboard, Holdings |
| `/api/trades` | GET | `page`, `size` | `{ trades: [...], total }` | Trades |
| `/api/signals` | GET | `date` (可选) | `{ signals: [...] }` | Signals |
| `/api/signals/dates` | GET | — | `string[]` 日期列表 | Signals |
| `/api/slots` | GET | — | `Slot[]` 槽位详情数组 | (已定义) |
| `/api/executions` | GET | `page`, `size`, `action`, `stock_code`, `start_date`, `end_date` | `{ executions: [...], total, page, size, pages }` | Executions |
| `/api/executions/summary` | GET | — | 总笔数、买卖数、累计滑点/佣金/印花税/总成本 | Executions |
| `/api/pending-orders` | GET | `status` (可选) | `{ orders: [...], total }` | PendingOrders |
| `/api/index_daily` | GET | `ts_code`, `start_date`, `end_date` | `{ data: [...], total, ts_code }` | Dashboard |

## 类型定义

所有 API 响应的 TypeScript 类型定义集中在 `src/types.ts`，包括 `Overview`、`NavPoint`、`Position`、`Slot`、`Trade`、`Signal`、`Execution`、`ExecutionsSummary`、`PendingOrder`、`IndexDailyPoint` 等接口。

## 状态管理

项目不使用全局状态管理库。各页面在组件内通过 `useState` + `useEffect` 独立管理数据获取与状态，没有跨页面的数据共享或缓存。Token 是唯一的全局状态，通过 `localStorage` 持久化。

应用外层包裹 `ErrorBoundary` 组件，捕获运行时渲染错误并展示友好提示。

## 开发与部署

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

Vite 开发服务器启动，默认 `http://localhost:5173/`。

访问时需携带 token 参数，如 `http://localhost:5173/?token=your-token`。

如果后端跑在不同地址，修改 `.env` 中的 `VITE_API_BASE`。

### 构建

```bash
npm run build
```

先执行 `tsc -b` 类型检查，再执行 Vite 构建，输出到 `dist/` 目录。

### 本地预览

```bash
npm run preview
```

本地预览生产构建产物。

### 部署到 GitHub Pages

```bash
npm run deploy
```

使用 `gh-pages` 将 `dist/` 目录发布到 GitHub Pages。需在 `.env` 中设置 `VITE_BASE_PATH`（如 `/pattern-hunter-dashboard/`）。

### 部署到 Vercel

1. 在 Vercel 导入 Git 仓库
2. 在 **Settings → Environment Variables** 中添加 `VITE_API_BASE`（生产环境后端地址）
3. Build Command 和 Output Directory 保持默认（`npm run build` / `dist`）

使用 `HashRouter` 而非 `BrowserRouter`，避免 SPA 刷新 404 问题。

## 环境变量

| 变量 | 必填 | 说明 | 默认值 |
|------|------|------|--------|
| `VITE_API_BASE` | 是 | 后端 API 根地址 | `http://localhost:8080` |
| `VITE_BASE_PATH` | 否 | 静态资源与路由基础路径（GitHub Pages 部署时需要） | `/` |

## 注意事项

- 所有数据展示使用人民币（¥）为货币单位
- Ant Design 使用 `theme.darkAlgorithm` 全局深色主题
- 桌面端侧边栏设置了 `breakpoint="lg"`，小屏自动折叠；移动端（`< md`）切换为底部 Tab 导航 + 顶栏布局
- 未匹配的路由会重定向到 `/404` 页面
