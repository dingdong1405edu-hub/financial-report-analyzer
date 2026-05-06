# Financial Report Analyzer

Web app phân tích báo cáo tài chính với 10 AI agents, xuất PDF chuyên nghiệp.

## Tính năng

- Upload báo cáo tài chính (PDF, Excel, CSV)
- 10 AI agents phân tích tuần tự: doanh thu, chi phí, lợi nhuận, dòng tiền, cân đối kế toán, chỉ số tài chính, xu hướng, rủi ro, tổng hợp SWOT
- PDF được cập nhật sau mỗi agent hoàn thành
- Giao diện realtime theo dõi tiến trình

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **AI:** Anthropic SDK (`claude-sonnet-4-20250514`)
- **PDF:** `@react-pdf/renderer`
- **Streaming:** Server-Sent Events (SSE)

## Cài đặt local

```bash
# Clone repo
git clone https://github.com/dingdong1405edu/financial-report-analyzer
cd financial-report-analyzer

# Cài dependencies
npm install

# Tạo file .env.local
cp .env.example .env.local
# Điền ANTHROPIC_API_KEY vào .env.local

# Chạy dev server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

## Deploy Railway

### Cách 1: Dùng Railway CLI

```bash
# Cài Railway CLI
npm install -g @railway/cli

# Login
railway login

# Tạo project mới
railway init

# Set environment variable
railway variables set ANTHROPIC_API_KEY=sk-ant-xxx

# Deploy
railway up
```

### Cách 2: Kết nối GitHub

1. Vào [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
2. Chọn repo `financial-report-analyzer`
3. Vào **Variables** → Thêm:
   - `ANTHROPIC_API_KEY` = `sk-ant-xxx`
4. Railway tự động build và deploy

### Cách 3: Deploy button

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/financial-report-analyzer)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | — | API key từ console.anthropic.com |
| `MAX_FILE_SIZE_MB` | ❌ | `10` | Giới hạn kích thước file upload (MB) |
| `AGENT_TIMEOUT_MS` | ❌ | `60000` | Timeout mỗi agent (milliseconds) |

## Cấu trúc project

```
src/
├── agents/          # 10 AI agents phân tích
├── app/api/         # Next.js API routes
├── components/pdf/  # React-PDF components
├── lib/             # File parser, session store
└── types/           # TypeScript types
```

## Lưu ý

- Session store là **in-memory** — không persist khi restart server
- File tối đa 10MB
- Các agents chạy **tuần tự** để tránh rate limit Anthropic
