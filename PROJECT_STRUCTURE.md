# Mean AI - 專案架構

```
駁駁Bot/
├── frontend/                    # React/Next.js 前端應用
│   ├── src/
│   │   ├── components/         # React 組件
│   │   │   ├── App.tsx/jsx     # 主應用組件
│   │   │   ├── Header.tsx      # 頂部導航
│   │   │   ├── WebcamPreview.tsx   # 網路攝像頭預覽（待實現）
│   │   │   ├── ChatInterface.tsx   # 對話區域
│   │   │   ├── AIResponse.tsx  # AI 回應展示
│   │   │   └── TagDisplay.tsx  # 標籤展示（愚昧指數等）
│   │   ├── hooks/              # 自訂 React Hooks
│   │   │   ├── useWebCamera.ts # 網路攝像頭控制
│   │   │   └── useAIChat.ts    # AI 對話邏輯
│   │   ├── utils/              # 工具函數
│   │   │   ├── api.ts          # API 調用
│   │   │   ├── constants.ts    # 常數定義
│   │   │   └── animations.ts   # 動畫效果
│   │   ├── styles/             # 全局樣式與 Tailwind 配置
│   │   │   └── globals.css     # 全局樣式與自訂動畫
│   │   └── index.tsx           # 入口文件
│   ├── public/                 # 靜態資源
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json           # TS 配置
│   └── .env.local              # 環境變數
│
├── backend/                     # Python FastAPI 後端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI 應用主文件
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py     # Pydantic 數據模型
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── llm_service.py # Llama 3 集成
│   │   │   ├── tts_service.py # Edge TTS 集成
│   │   │   └── analysis_service.py  # 分析引擎
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── chat.py        # 聊天路由
│   ├── config.py              # 配置文件
│   ├── requirements.txt        # Python 依賴
│   └── .env                    # 環境變數
│
├── docs/                        # 文檔與設計稿
│   ├── API_SPEC.md            # API 規範
│   ├── DESIGN_GUIDE.md         # UI/UX 設計指南
│   └── SETUP.md               # 安裝指南
│
├── .gitignore
├── README.md                   # 項目說明
└── PROJECT_STRUCTURE.md        # 此文件
```

## 核心文件說明

### Frontend

- **App.tsx**: 主應用布局、路由、全局狀態管理
- **ChatInterface.tsx**: 文字輸入、對話歷史
- **AIResponse.tsx**: AI 回應動畫展示
- **TagDisplay.tsx**: 用棱鏡漸變效果展示「標籤」

### Backend

- **llm_service.py**: Llama 3 本地或遠程調用
- **tts_service.py**: Edge TTS 文字轉語音
- **analysis_service.py**: 生成「標籤」與「分析」

## 技術棧

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python 3.9+
- **AI**: Llama 3.1 (via Ollama/LM Studio)
- **TTS**: Microsoft Edge TTS (edge-tts)
- **通信**: HTTP REST API (可升級至 WebSocket)
