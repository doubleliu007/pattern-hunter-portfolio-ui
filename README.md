# Pattern Hunter Dashboard — 前端开发文档

Pattern Hunter 的组合跟踪仪表盘前端，用于展示量化策略的净值、持仓、交易记录和每日扫描信号。

## 技术栈

| 分类 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| 路由 | react-router-dom 7 (HashRouter) |
| UI | Ant Design 5 (深色主题) |
| 图表 | ECharts 5 + echarts-for-react |
| 构建 | Vite 6 |
| 部署 | Vercel |

## 目录结构

```
├── .env.example                # 环境变量示例
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx                # 入口，HashRouter 挂载
    ├── App.tsx                 # 布局骨架 + 路由 + 认证守卫
    ├── utils/
    │   ├── api.ts              # 统一请求封装 + 所有 API 端点
    │   └── auth.ts             # Token 存取 (localStorage)
    └── pages/
        ├── Dashboard.tsx       # 组合概览
        ├── Holdings.tsx        # 当前持仓 + 槽位
        ├── Trades.tsx          # 历史交易记录
        └── Signals.tsx         # 每日扫描信号
```

## 认证机制

应用使用 Bearer Token 认证，没有登录页面。

1. 用户通过 URL 参数 `?token=xxx` 首次访问
2. `extractTokenFromUrl()` 提取 token 存入 `localStorage`（key: `ph_api_token`），随后从 URL 中移除该参数
3. 后续访问直接从 `localStorage` 读取 token
4. 所有 API 请求自动带 `Authorization: Bearer <token>` 头
5. 后端返回 401 时自动清除 token 并抛出 `UNAUTHORIZED`
6. 侧边栏底部提供「清除 Token」按钮，点击后清除并刷新页面

无 token 时页面显示 403 提示，不会渲染任何业务内容。

## 页面功能

### Dashboard (`/`)

组合整体表现的概览页，调用 `GET /api/overview` 和 `GET /api/nav` 两个接口。

- **统计卡片 (4 个)**：总收益率、最大回撤、夏普比率、胜率（含总交易笔数）
- **净值走势图**：ECharts 双 Y 轴折线图，左轴为净值绝对值，右轴为收益率百分比
- **回撤曲线图**：红色面积图展示历史回撤
- **资产卡片 (3 个)**：总资产（¥）、持仓市值（¥）、当前持仓数

### Holdings (`/holdings`)

当前持仓和槽位的详情页，调用 `GET /api/holdings`。

- **持仓表**：股票代码、买入日期、买入价、持股数、成本、所属槽位、大分型预测值、中分型 IQR 值
- **槽位表**：20 个槽位的编号、剩余资金、持仓数量

### Trades (`/trades`)

历史交易记录页，调用 `GET /api/trades`，支持分页。

- **交易表**：股票代码、买入/卖出日期与价格、收益金额（涨绿跌红）、收益率（Tag 色标）、槽位编号、卖出原因
- **分页**：每页 20 条，服务端分页（传 `page` 和 `size` 参数）

### Signals (`/signals`)

每日策略扫描的选股信号页，调用 `GET /api/signals/dates` 获取日期列表，再调用 `GET /api/signals?date=xxx` 获取具体信号。

- **日期选择器**：下拉选择有信号数据的日期，默认选最近一天
- **信号表**：股票代码、大分型 next_price_change、中分型 IQR、是否通过筛选
- **交互**：支持按数值列排序、按「通过筛选」列过滤
- **统计**：标题区显示总信号数和通过筛选数

## API 接口

所有请求通过 `src/utils/api.ts` 中的 `request()` 函数统一发出。基础地址由环境变量 `VITE_API_BASE` 控制，默认 `http://localhost:8080`。

| 端点 | 方法 | 参数 | 返回 | 使用页面 |
|------|------|------|------|----------|
| `/api/overview` | GET | — | 总收益率、回撤、夏普、胜率、资产等 | Dashboard |
| `/api/nav` | GET | — | 每日净值序列 (date, total_value, drawdown, return_pct) | Dashboard |
| `/api/holdings` | GET | — | `{ positions: [...], slots: [...] }` | Holdings |
| `/api/trades` | GET | `page`, `size` | `{ trades: [...], total: number }` | Trades |
| `/api/signals` | GET | `date` (可选) | `{ signals: [...] }` | Signals |
| `/api/signals/dates` | GET | — | `string[]` 日期列表 | Signals |
| `/api/slots` | GET | — | 槽位详情数组 | (已定义，页面未直接使用) |

## 状态管理

项目不使用全局状态管理库。各页面在组件内通过 `useState` + `useEffect` 独立管理数据获取与状态，没有跨页面的数据共享或缓存。Token 是唯一的全局状态，通过 `localStorage` 持久化。

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

### 部署到 Vercel

1. 在 Vercel 导入 Git 仓库
2. 在 **Settings → Environment Variables** 中添加 `VITE_API_BASE`（生产环境后端地址）
3. Build Command 和 Output Directory 保持默认（`npm run build` / `dist`）

使用 `HashRouter` 而非 `BrowserRouter`，避免 SPA 刷新 404 问题。

## 注意事项

- 所有数据展示使用人民币（¥）为货币单位
- Ant Design 使用 `theme.darkAlgorithm` 全局深色主题
- 侧边栏设置了 `breakpoint="lg"`，小屏自动折叠
- `api.ts` 中的类型均为 `any`，如需加强类型安全可为各接口定义 TypeScript interface
