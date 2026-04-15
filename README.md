# 駁駁Bot ⚔️

> 一個諷刺社交媒體兩極化現象嘅極端 AI

## 🎯 核心概念

模擬一個**極端網民**，對用戶嘅言論進行尖酸刻薄嘅**回應**，並強行貼上極端標籤（如「愚昧指數」、「盲從度」等）。

通過呢個項目，諷刺同反思社交媒體中嘅兩極化現象同個人偏見。

## 🛠️ Technology Stack

### Frontend

- **框架**： React 18 + TypeScript
- **樣式**： Tailwind CSS
- **動畫**： Framer Motion
- **圖標**： Lucide React
- **API 通訊**： Fetch API

### Backend

- **框架**: FastAPI (Python 3.9+)
- **LLM**: 可選 Ollama 或 Hugging Face Inference Providers
- **TTS**: Microsoft Edge TTS (粵語)
- **數據驗證**： Pydantic
- **ASGI 服務器**： Uvicorn

---

## 📋 系統要求

### 最低要求

- **Python**: 3.9 或以上
- **Node.js**: 16 或以上
- **npm/yarn**: 對應 Node.js 版本
- **RAM**: 8GB 以上（推薦 16GB，用於 Llama 3）
- **硬盤**: 20GB 以上（用於 Ollama 模型）

### 系統支持

- ✅ Windows 10/11
- ✅ macOS
- ✅ Linux

---

## 🚀 開始

### 1️⃣ 克隆項目

```bash
git clone <repository-url>
cd 駁駁Bot
```

### 2️⃣ 準備 LLM 提供者（2 選 1）

#### 選項 A：Ollama（本地）

**所有平台**：
下載並安裝 [Ollama](https://ollama.ai)

安裝後，拉取 Llama 3 模型：

```bash
ollama pull llama3
```

驗證安裝（應該在 11434 端口運行）：

```bash
curl http://localhost:11434/api/tags
```

#### 選項 B：Hugging Face Inference Providers（雲端）

1. 到 Hugging Face 建立 Access Token（需要 Inference 權限）
2. 在 `backend/.env` 設定：

```env
LLM_PROVIDER=huggingface
HF_TOKEN=your_hf_token
HF_PROVIDER=auto
LLM_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

### 3️⃣ 後端設置

#### Windows (PowerShell)

```bash
# 進入後端目錄
cd backend

# 創建虛擬環境
python -m venv venv
& venv\Scripts\Activate.ps1

# 安裝依賴
pip install -r requirements.txt

# 創建 .env 文件（或複製 .env.example）
cp .env.example .env  # 如果存在 .env.example

# 啟動後端服務器（如用 Ollama，請先啟動 Ollama）
python -m uvicorn app.main:app --reload --port 8000
```

#### macOS/Linux (Bash)

```bash
cd backend

python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env  # 如果存在

python -m uvicorn app.main:app --reload --port 8000
```

後端應該在 `http://localhost:8000` 運行。訪問 `http://localhost:8000/docs` 查看 API 文檔。

### 4️⃣ 前端設置

#### 新開一個終端窗口：

```bash
cd frontend

npm install

npm run dev
```

前端應該在 `http://localhost:3000` 或 `http://localhost:5173` 運行（取決於 React 腳本配置）。

---

## ⚙️ 環境變量配置

### 後端 (backend/.env)

創建 `backend/.env` 文件：

```env
# LLM 配置
LLM_PROVIDER=ollama
LLM_MODEL=llama3
LLM_BASE_URL=http://localhost:11434
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=512

# Hugging Face Inference Providers（當 LLM_PROVIDER=huggingface 時使用）
HF_TOKEN=
HF_PROVIDER=auto

# TTS 配置
TTS_PROVIDER=edge-tts
TTS_VOICE=zh-HK-YurisNeural

# 對話配置
MAX_CONVERSATION_LENGTH=10
RESPONSE_TIMEOUT=30

# CORS 配置
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8000

# 數據庫（未來使用）
DATABASE_URL=sqlite:///./mean_ai.db
```

**說明**:

- `LLM_PROVIDER`: `ollama` 或 `huggingface`
- `LLM_BASE_URL`: 只在 `LLM_PROVIDER=ollama` 時使用
- `HF_TOKEN`: 只在 `LLM_PROVIDER=huggingface` 時使用
- `HF_PROVIDER`: Hugging Face Inference Providers 的路由提供者（可用 `auto`）
- `TTS_VOICE`: 粵語語音（支持：`zh-HK-YurisNeural`, `zh-HK-WanRubyNeural` 等）
- `CORS_ORIGINS`: 允許的前端域名（多個用逗號分隔）

### 前端 (frontend/.env.local)

創建 `frontend/.env.local` 文件（可選）：

```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENV=development
```

---

## 🔍 驗證安裝

### 檢查後端健康狀態

```bash
curl http://localhost:8000/health
```

預期響應：

```json
{
  "status": "ok",
  "service": "Mean AI Backend",
  "version": "0.1.0"
}
```

### 測試 LLM 集成

```bash
curl -X POST http://localhost:8000/api/chat/analyze \
  -H "Content-Type: application/json" \
  -d '{"user_input":"測試"}'
```

### 檢查前端

打開瀏覽器訪問 `http://localhost:3000` 或 `http://localhost:5173`，應該看到聊天界面。

### 🎙️ 語音功能使用說明

- 聊天輸入框右側有咪高峰按鈕，按一下開始語音輸入，再按一下停止。
- 語音辨識使用瀏覽器 Web Speech API（建議使用 Chrome / Edge）。
- 首次使用需要允許麥克風權限；若被拒絕，語音輸入按鈕會不可用。
- 每次 AI 回覆後會自動調用 `/api/chat/speak` 播放語音；如瀏覽器阻擋自動播放，文字回覆仍會正常顯示。

---

## 📁 項目結構

```
駁駁Bot/
├── frontend/                          # React 前端
│   ├── src/
│   │   ├── components/
│   │   │   ├── App.tsx               # 主應用組件
│   │   │   ├── ChatInterface.tsx     # 終端風格聊天界面
│   │   │   ├── WebcamPreview.tsx     # 網絡攝像頭預覽
│   │   │   ├── StatusLabels.tsx      # 評判指標展示
│   │   │   ├── VisualBackground.tsx # 動態背景
│   │   │   └── AIResponse.tsx        # AI 回應組件
│   │   ├── utils/
│   │   │   ├── api.ts                # API 調用工具
│   │   │   └── constants.ts          # 常量定義
│   │   ├── styles/
│   │   │   └── globals.css           # 全局樣式
│   │   └── index.tsx
│   ├── package.json                  # 依賴配置
│   ├── tsconfig.json
│   └── tailwind.config.js
│
├── backend/                           # FastAPI 後端
│   ├── app/
│   │   ├── main.py                   # FastAPI 應用
│   │   ├── models/
│   │   │   └── schemas.py            # 數據模型
│   │   ├── routes/
│   │   │   └── chat.py               # 聊天路由
│   │   └── services/
│   │       ├── llm_service.py        # Llama 3 集成
│   │       ├── tts_service.py        # Edge TTS 集成
│   │       └── analysis_service.py   # 分析引擎
│   ├── config.py                     # 配置
│   ├── requirements.txt              # Python 依賴
│   └── .env                          # 環境變量
│
├── docs/                              # 文檔
│   ├── API_SPEC.md
│   ├── DESIGN_GUIDE.md
│   └── SETUP.md
│
├── start-all.ps1                      # Windows 啟動腳本
├── stop-all.ps1                       # Windows 停止腳本
└── README.md
```

---

## 🐛 故障排除

### 後端無法連接到 Ollama

**症狀**: `❌ LLM 錯誤: Cannot connect to http://localhost:11434`

**解決**:

1. 確認 Ollama 正在運行：`ollama serve`
2. 確認模型已下載：`ollama pull llama3`
3. 檢查 `backend/.env` 中的 `LLM_BASE_URL` 是否正確
4. 嘗試手動訪問：`curl http://localhost:11434/api/tags`

### 前端無法連接到後端

**症狀**: 網絡請求失敗、CORS 錯誤

**解決**:

1. 確認後端運行在 `http://localhost:8000`
2. 檢查 `backend/.env` 中的 `CORS_ORIGINS` 包含前端地址
3. 檢查前端 API 端點（[utils/api.ts](frontend/src/utils/api.ts)）
4. 打開瀏覽器開發工具檢查網絡標籤

### 前端編譯錯誤

**症狀**: TypeScript 或模塊錯誤

**解決**:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### LLM 響應緩慢或超時

**症狀**: 請求在 30 秒後超時

**解決**:

1. 這是正常的（Llama 3 第一次運行較慢）
2. 增加 `backend/.env` 中的 `RESPONSE_TIMEOUT`
3. 確保有足夠的 RAM（推薦 16GB）
4. 檢查 CPU 使用率

---

## 📦 依賴管理

### 更新前端依賴

```bash
cd frontend
npm update
npm audit fix
```

### 更新後端依賴

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\Activate.ps1
pip list --outdated
pip install --upgrade -r requirements.txt
```

---

## 🚀 生產部署提示

### 後端部署

```bash
# 不使用 --reload（性能優化）
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 前端部署

```bash
cd frontend
npm run build
# 生成的文件在 build/ 目錄
```

---

## 🚀 快速開始

### 前置條件

- Python 3.9+
- Node.js 16+
- Git

### 安裝 Ollama（本地 LLM）

下載並安裝 [Ollama](https://ollama.ai)，然後拉取 Llama 3 模型：

```bash
ollama pull llama3
ollama serve  # 喺另一個終端啟動
```

### Backend 安裝

```bash
cd backend

# 創建虛擬環境
python -m venv venv
# 激活虛擬環境
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# 安裝依賴
pip install -r requirements.txt

# 啟動 FastAPI 服務器
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend 安裝同運行

```bash
cd frontend

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

應用程式將會喺 `http://localhost:3000` 啟動。

### 一鍵啟動（Windows）

喺項目根目錄運行：

```powershell
.\start-all.ps1
```

如果你都想一齊啟動 Ollama：

```powershell
.\start-all.ps1 -StartOllama
```

停止前後端開發進程：

```powershell
.\stop-all.ps1
```

如果遇到 PowerShell `ExecutionPolicy` 限制，可以先喺當前終端臨時放行：

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## 💬 使用方式

1. **打開應用程式**：訪問前端 URL
2. **輸入言論**：喺聊天框入面輸入你嘅想法
3. **獲取評價**： AI 會生成尖酸刻薄嘅粵語回應同標籤
4. **查看動畫**： UI 會根據對話激烈度動態變化
