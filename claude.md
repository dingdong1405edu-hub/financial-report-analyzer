# CLAUDE.md — Dự Án Phân Tích Báo Cáo Tài Chính

## Tổng Quan Dự Án

Web app cho phép user upload file báo cáo tài chính (PDF/Excel/CSV), hệ thống chạy 10 agent phân tích song song/tuần tự, mỗi agent hoàn thành sẽ cập nhật JSON tổng hợp và render PDF output ngay lập tức. PDF ngày càng đầy đủ hơn theo số agent đã hoàn thành.

---

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **AI:** Anthropic SDK (`@anthropic-ai/sdk`) — model `claude-sonnet-4-20250514`
- **PDF Generation:** `@react-pdf/renderer` (render PDF phía client & server)
- **File Parsing:** `pdf-parse` (PDF), `xlsx` (Excel), `papaparse` (CSV)
- **State Management:** Zustand
- **Streaming:** Server-Sent Events (SSE) để cập nhật progress realtime

---

## Cấu Trúc Thư Mục

```
/
├── CLAUDE.md
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Trang chính: upload + progress + PDF preview
│   │   ├── layout.tsx
│   │   └── api/
│   │       ├── analyze/
│   │       │   └── route.ts            # POST: nhận file, bắt đầu pipeline
│   │       ├── stream/
│   │       │   └── route.ts            # GET: SSE stream progress từng agent
│   │       └── export-pdf/
│   │           └── route.ts            # GET: xuất PDF cuối
│   ├── agents/
│   │   ├── index.ts                    # Pipeline orchestrator
│   │   ├── types.ts                    # Types cho AgentResult, ReportJSON
│   │   ├── 01_document_parser.ts       # Agent 1: Parse & chuẩn hóa dữ liệu
│   │   ├── 02_revenue_analyzer.ts      # Agent 2: Phân tích doanh thu
│   │   ├── 03_cost_analyzer.ts         # Agent 3: Phân tích chi phí
│   │   ├── 04_profit_analyzer.ts       # Agent 4: Phân tích lợi nhuận
│   │   ├── 05_cashflow_analyzer.ts     # Agent 5: Phân tích dòng tiền
│   │   ├── 06_balance_analyzer.ts      # Agent 6: Phân tích bảng cân đối kế toán
│   │   ├── 07_ratio_calculator.ts      # Agent 7: Tính các chỉ số tài chính
│   │   ├── 08_trend_analyzer.ts        # Agent 8: Phân tích xu hướng & dự báo
│   │   ├── 09_risk_assessor.ts         # Agent 9: Đánh giá rủi ro
│   │   └── 10_synthesizer.ts           # Agent 10: Tổng hợp & khuyến nghị
│   ├── components/
│   │   ├── UploadZone.tsx              # Drag & drop file upload
│   │   ├── AgentProgress.tsx           # Hiển thị 10 agent với trạng thái realtime
│   │   ├── PDFPreview.tsx              # Preview PDF ngay trên web
│   │   └── pdf/
│   │       ├── ReportDocument.tsx      # React-PDF document component
│   │       ├── CoverPage.tsx           # Trang bìa
│   │       ├── SummarySection.tsx      # Phần tóm tắt
│   │       ├── RevenueSection.tsx      # Phần doanh thu
│   │       ├── CostSection.tsx         # Phần chi phí
│   │       ├── ProfitSection.tsx       # Phần lợi nhuận
│   │       ├── CashflowSection.tsx     # Phần dòng tiền
│   │       ├── BalanceSection.tsx      # Phần cân đối kế toán
│   │       ├── RatioSection.tsx        # Phần chỉ số tài chính
│   │       ├── TrendSection.tsx        # Phần xu hướng
│   │       ├── RiskSection.tsx         # Phần rủi ro
│   │       └── RecommendationSection.tsx # Phần khuyến nghị
│   ├── lib/
│   │   ├── file-parser.ts              # Đọc PDF/Excel/CSV thành text
│   │   ├── session-store.ts            # In-memory store cho analysis sessions
│   │   └── pdf-generator.ts            # Tạo PDF từ ReportJSON
│   └── types/
│       └── report.ts                   # ReportJSON interface
```

---

## Kiến Trúc Pipeline — Quan Trọng

### Nguyên tắc cốt lõi: PDF sau mỗi agent

```
Upload File
    │
    ▼
Agent 1 hoàn thành → cập nhật reportJSON.parsed → render PDF (có section 1)
    │
    ▼
Agent 2 hoàn thành → cập nhật reportJSON.revenue → render PDF (có section 1+2)
    │
    ▼
... (mỗi agent cộng thêm 1 section vào PDF)
    │
    ▼
Agent 10 hoàn thành → reportJSON đầy đủ → PDF hoàn chỉnh
```

### Session Store Pattern

Mỗi lần upload tạo một `sessionId`. Store lưu:

```typescript
interface AnalysisSession {
  sessionId: string
  status: 'running' | 'completed' | 'error'
  reportJSON: Partial<ReportJSON>  // tích lũy dần
  agentStatuses: AgentStatus[]     // trạng thái từng agent
  rawText: string                  // text đã parse từ file
  createdAt: Date
}
```

---

## ReportJSON — Cấu Trúc Dữ Liệu Chính

```typescript
// src/types/report.ts

export interface ReportJSON {
  metadata: {
    companyName: string
    reportPeriod: string
    currency: string
    generatedAt: string
    fileName: string
  }
  
  // Điền dần theo agent hoàn thành:
  parsed?: {                        // Agent 1
    rawData: string
    detectedFormat: string
    keyFields: string[]
    warnings: string[]
  }
  
  revenue?: {                       // Agent 2
    totalRevenue: number
    revenueBreakdown: LineItem[]
    revenueGrowth: number | null
    topRevenueSource: string
    analysis: string
  }
  
  costs?: {                         // Agent 3
    totalCosts: number
    costBreakdown: LineItem[]
    costRatio: number
    majorCostDriver: string
    analysis: string
  }
  
  profit?: {                        // Agent 4
    grossProfit: number
    operatingProfit: number
    netProfit: number
    grossMargin: number
    netMargin: number
    analysis: string
  }
  
  cashflow?: {                      // Agent 5
    operatingCashflow: number
    investingCashflow: number
    financingCashflow: number
    netCashflow: number
    analysis: string
  }
  
  balance?: {                       // Agent 6
    totalAssets: number
    totalLiabilities: number
    equity: number
    debtToEquity: number
    analysis: string
  }
  
  ratios?: {                        // Agent 7
    currentRatio: number | null
    quickRatio: number | null
    roe: number | null
    roa: number | null
    debtRatio: number | null
    peRatio: number | null
    analysis: string
  }
  
  trends?: {                        // Agent 8
    revenueGrowthTrend: string
    profitTrend: string
    forecast: string
    chartData: ChartDataPoint[]
    analysis: string
  }
  
  risks?: {                         // Agent 9
    riskLevel: 'Low' | 'Medium' | 'High' | 'Critical'
    identifiedRisks: Risk[]
    mitigations: string[]
    analysis: string
  }
  
  synthesis?: {                     // Agent 10
    executiveSummary: string
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
    overallRating: number           // 1-10
    recommendations: Recommendation[]
    conclusion: string
  }
}

export interface LineItem {
  name: string
  amount: number
  percentage: number
}

export interface Risk {
  category: string
  description: string
  severity: 'Low' | 'Medium' | 'High'
}

export interface Recommendation {
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  action: string
  rationale: string
  timeframe: string
}

export interface ChartDataPoint {
  period: string
  value: number
  label: string
}
```

---

## 10 Agents — System Prompts & Nhiệm Vụ

### Agent 1 — Document Parser
**File:** `src/agents/01_document_parser.ts`

```
Bạn là chuyên gia phân tích tài liệu tài chính. Nhiệm vụ của bạn là:
1. Đọc và hiểu cấu trúc của văn bản tài chính được cung cấp
2. Xác định: tên công ty, kỳ báo cáo, đơn vị tiền tệ
3. Liệt kê các trường dữ liệu chính tìm thấy
4. Chuẩn hóa số liệu (loại bỏ ký tự thừa, đổi về số)
5. Ghi nhận các cảnh báo nếu dữ liệu thiếu hoặc không rõ ràng

Trả về JSON theo đúng schema `parsed` trong ReportJSON.
Chỉ trả về JSON, không giải thích thêm.
```

### Agent 2 — Revenue Analyzer
**File:** `src/agents/02_revenue_analyzer.ts`

```
Bạn là chuyên gia phân tích doanh thu. Dựa trên dữ liệu đã parse, hãy:
1. Tính tổng doanh thu
2. Phân tích cơ cấu doanh thu theo từng nguồn
3. Tính tăng trưởng doanh thu (nếu có dữ liệu nhiều kỳ)
4. Xác định nguồn doanh thu chủ lực
5. Nhận xét ngắn gọn bằng tiếng Việt (analysis, 2-3 câu)

Trả về JSON theo schema `revenue`. Chỉ trả về JSON.
```

### Agent 3 — Cost Analyzer
**File:** `src/agents/03_cost_analyzer.ts`

```
Bạn là chuyên gia phân tích chi phí. Hãy:
1. Tổng hợp tất cả các loại chi phí
2. Phân tích cơ cấu chi phí
3. Tính tỷ lệ chi phí/doanh thu
4. Xác định driver chi phí lớn nhất
5. Nhận xét ngắn gọn bằng tiếng Việt

Trả về JSON theo schema `costs`. Chỉ trả về JSON.
```

### Agent 4 — Profit Analyzer
**File:** `src/agents/04_profit_analyzer.ts`

```
Bạn là chuyên gia phân tích lợi nhuận. Hãy tính và phân tích:
1. Lợi nhuận gộp, lợi nhuận hoạt động, lợi nhuận ròng
2. Biên lợi nhuận gộp và ròng (%)
3. So sánh với kỳ trước nếu có
4. Nhận xét ngắn gọn bằng tiếng Việt

Trả về JSON theo schema `profit`. Chỉ trả về JSON.
```

### Agent 5 — Cashflow Analyzer
**File:** `src/agents/05_cashflow_analyzer.ts`

```
Bạn là chuyên gia phân tích dòng tiền. Hãy:
1. Phân tích dòng tiền từ hoạt động kinh doanh
2. Phân tích dòng tiền từ đầu tư
3. Phân tích dòng tiền từ tài chính
4. Tính dòng tiền thuần
5. Đánh giá khả năng thanh khoản. Nhận xét tiếng Việt.

Nếu không có báo cáo dòng tiền riêng, hãy ước tính từ dữ liệu có sẵn và ghi chú.
Trả về JSON theo schema `cashflow`. Chỉ trả về JSON.
```

### Agent 6 — Balance Sheet Analyzer
**File:** `src/agents/06_balance_analyzer.ts`

```
Bạn là chuyên gia phân tích bảng cân đối kế toán. Hãy:
1. Tổng hợp tài sản (ngắn hạn + dài hạn)
2. Tổng hợp nợ phải trả
3. Vốn chủ sở hữu
4. Tính hệ số nợ/vốn
5. Nhận xét cơ cấu tài chính bằng tiếng Việt

Trả về JSON theo schema `balance`. Chỉ trả về JSON.
```

### Agent 7 — Financial Ratio Calculator
**File:** `src/agents/07_ratio_calculator.ts`

```
Bạn là chuyên gia tính toán chỉ số tài chính. Dựa trên tất cả dữ liệu đã phân tích, hãy tính:
1. Current Ratio = Tài sản ngắn hạn / Nợ ngắn hạn
2. Quick Ratio = (Tiền + Các khoản tương đương) / Nợ ngắn hạn  
3. ROE = Lợi nhuận ròng / Vốn chủ sở hữu
4. ROA = Lợi nhuận ròng / Tổng tài sản
5. Debt Ratio = Tổng nợ / Tổng tài sản

Nếu không đủ dữ liệu để tính 1 chỉ số, đặt null.
Viết analysis giải thích ý nghĩa các chỉ số bằng tiếng Việt.
Trả về JSON theo schema `ratios`. Chỉ trả về JSON.
```

### Agent 8 — Trend Analyzer
**File:** `src/agents/08_trend_analyzer.ts`

```
Bạn là chuyên gia phân tích xu hướng. Hãy:
1. Xác định xu hướng doanh thu (tăng/giảm/ổn định)
2. Xác định xu hướng lợi nhuận
3. Đưa ra dự báo ngắn hạn (1-2 kỳ tới)
4. Tạo chartData: mảng điểm dữ liệu cho biểu đồ
5. Phân tích xu hướng bằng tiếng Việt

Trả về JSON theo schema `trends`. Chỉ trả về JSON.
```

### Agent 9 — Risk Assessor
**File:** `src/agents/09_risk_assessor.ts`

```
Bạn là chuyên gia đánh giá rủi ro tài chính. Dựa trên toàn bộ phân tích, hãy:
1. Xác định mức độ rủi ro tổng thể: Low/Medium/High/Critical
2. Liệt kê tối đa 5 rủi ro cụ thể (tài chính, thị trường, thanh khoản, vận hành)
3. Đề xuất biện pháp giảm thiểu cho từng rủi ro
4. Phân tích rủi ro bằng tiếng Việt

Trả về JSON theo schema `risks`. Chỉ trả về JSON.
```

### Agent 10 — Synthesizer
**File:** `src/agents/10_synthesizer.ts`

```
Bạn là CFO cấp cao đang viết báo cáo tổng hợp. Dựa trên tất cả phân tích của 9 agent trước, hãy:
1. Viết executive summary súc tích 150-200 chữ tiếng Việt
2. Phân tích SWOT (điểm mạnh, yếu, cơ hội, thách thức)
3. Đánh giá tổng thể từ 1-10
4. Đưa ra 3-5 khuyến nghị hành động cụ thể, có độ ưu tiên
5. Viết kết luận 100-150 chữ

Đây là phần quan trọng nhất của báo cáo. Hãy viết chuyên nghiệp, cụ thể.
Trả về JSON theo schema `synthesis`. Chỉ trả về JSON.
```

---

## API Routes

### POST `/api/analyze`
- Nhận file (multipart/form-data)
- Parse file sang text
- Tạo sessionId
- Gọi `runAgentPipeline(sessionId, rawText)` (async, không await)
- Trả về `{ sessionId }`

### GET `/api/stream?sessionId=xxx`
- Server-Sent Events
- Mỗi khi agent hoàn thành, emit event:
```json
{
  "type": "agent_complete",
  "agentId": 3,
  "agentName": "Cost Analyzer",
  "reportJSON": { ...partial ReportJSON... },
  "pdfBase64": "..." 
}
```
- Khi tất cả xong: emit `{ "type": "complete" }`

### GET `/api/export-pdf?sessionId=xxx`
- Lấy reportJSON từ store
- Generate PDF
- Trả về file PDF

---

## PDF Layout — Thứ Tự Sections

PDF render theo sections đã có data, skip section chưa có:

```
1. Cover Page           ← luôn có (metadata từ Agent 1)
2. Executive Summary    ← Agent 10
3. Thông Tin Tổng Quan  ← Agent 1
4. Phân Tích Doanh Thu  ← Agent 2
5. Phân Tích Chi Phí    ← Agent 3
6. Phân Tích Lợi Nhuận  ← Agent 4
7. Dòng Tiền            ← Agent 5
8. Cân Đối Kế Toán      ← Agent 6
9. Chỉ Số Tài Chính     ← Agent 7
10. Xu Hướng & Dự Báo   ← Agent 8
11. Đánh Giá Rủi Ro     ← Agent 9
12. Khuyến Nghị         ← Agent 10
```

---

## Thứ Tự Triển Khai (Ưu Tiên Test Sớm)

### Phase 1 — Core Infrastructure (Test được PDF ngay)
```
[ ] 1. Setup Next.js project với dependencies
[ ] 2. src/types/report.ts — ReportJSON interface
[ ] 3. src/lib/file-parser.ts — parse PDF/Excel/CSV → text
[ ] 4. src/lib/session-store.ts — in-memory store
[ ] 5. src/agents/types.ts — AgentStatus, pipeline types
[ ] 6. src/agents/01_document_parser.ts — Agent 1
[ ] 7. src/components/pdf/ReportDocument.tsx — PDF skeleton
[ ] 8. src/components/pdf/CoverPage.tsx
[ ] 9. src/app/api/analyze/route.ts — chỉ chạy Agent 1
[ ] 10. src/app/api/stream/route.ts — SSE cơ bản
[ ] 11. src/app/api/export-pdf/route.ts
[ ] 12. src/app/page.tsx — UI upload + download PDF
```
→ **TEST: Upload file → chạy Agent 1 → download PDF có Cover + Thông Tin Tổng Quan**

### Phase 2 — Agents 2-4 (PDF có P&L)
```
[ ] 13. src/agents/02_revenue_analyzer.ts
[ ] 14. src/agents/03_cost_analyzer.ts  
[ ] 15. src/agents/04_profit_analyzer.ts
[ ] 16. src/components/pdf/RevenueSection.tsx
[ ] 17. src/components/pdf/CostSection.tsx
[ ] 18. src/components/pdf/ProfitSection.tsx
[ ] 19. Cập nhật pipeline để chạy Agent 1→2→3→4
```
→ **TEST: PDF có đầy đủ P&L analysis**

### Phase 3 — Agents 5-7 (PDF có Balance + Ratios)
```
[ ] 20. src/agents/05_cashflow_analyzer.ts
[ ] 21. src/agents/06_balance_analyzer.ts
[ ] 22. src/agents/07_ratio_calculator.ts
[ ] 23. Các PDF sections tương ứng
[ ] 24. src/components/AgentProgress.tsx — hiển thị 10 agent realtime
```
→ **TEST: PDF có đầy đủ financial statements**

### Phase 4 — Agents 8-10 + Full UI (PDF hoàn chỉnh)
```
[ ] 25. src/agents/08_trend_analyzer.ts
[ ] 26. src/agents/09_risk_assessor.ts
[ ] 27. src/agents/10_synthesizer.ts
[ ] 28. Các PDF sections còn lại
[ ] 29. src/components/PDFPreview.tsx — preview ngay trên web
[ ] 30. Polish UI/UX
```
→ **TEST: PDF hoàn chỉnh với SWOT, rủi ro, khuyến nghị**

---

## Dependencies — package.json

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "@anthropic-ai/sdk": "^0.27.0",
    "@react-pdf/renderer": "^3.4.0",
    "pdf-parse": "^1.1.1",
    "xlsx": "^0.18.5",
    "papaparse": "^5.4.1",
    "zustand": "^4.5.0",
    "uuid": "^10.0.0",
    "tailwindcss": "^3.4.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/pdf-parse": "^1.1.4",
    "@types/papaparse": "^5.3.0",
    "@types/uuid": "^10.0.0"
  }
}
```

---

## Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...

# Tùy chọn
MAX_FILE_SIZE_MB=10
AGENT_TIMEOUT_MS=60000
```

---

## Conventions

### Agent Pattern
Mỗi agent file export một function:
```typescript
export async function runAgent(
  input: AgentInput,
  onProgress?: (msg: string) => void
): Promise<Partial<ReportJSON>>
```

### Error Handling
- Mỗi agent có try/catch riêng
- Nếu agent thất bại: ghi lỗi vào session, tiếp tục agents tiếp theo
- PDF vẫn render với data từ agents đã thành công

### Prompt Engineering
- Luôn kết thúc prompt bằng: "Chỉ trả về JSON, không có markdown code block, không giải thích"
- Validate JSON response trước khi lưu vào store
- Nếu parse JSON lỗi: retry 1 lần với prompt: "JSON trước không hợp lệ. Chỉ trả về JSON thuần túy:"

### PDF Styling
- Font chính: Helvetica (built-in react-pdf)
- Màu chủ đạo: #1e3a5f (navy blue)
- Màu accent: #2e86de (blue)
- Màu cảnh báo: #e74c3c (red)
- Section header: background #1e3a5f, text white
- Số âm: màu đỏ, số dương: màu xanh

---

## Câu Lệnh Dev

```bash
# Cài đặt
npm install

# Dev server
npm run dev

# Build
npm run build

# Type check
npx tsc --noEmit
```

---

## Lưu Ý Quan Trọng

1. **Session store là in-memory** — không persist giữa các lần restart server. Đủ cho MVP.
2. **File size limit:** 10MB. Với file lớn hơn, cần chunk text trước khi gửi cho agent.
3. **Rate limiting:** Các agents chạy tuần tự (không song song) để tránh hit rate limit Anthropic.
4. **rawText truncation:** Nếu text > 100,000 chars, chỉ gửi 100,000 chars đầu cho agents (thêm note vào prompt).
5. **PDF preview** dùng `<iframe>` với blob URL, không cần server render lại.
6. **Model:** Luôn dùng `claude-sonnet-4-20250514` cho tất cả agents.