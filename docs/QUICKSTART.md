# 🚀 快速開始（5 分鐘）

如果你想立即運行項目，按照這個簡化指南。

## ⏱️ 5 分鐘快速開始

### 前提條件（已安裝）

- ✅ Python 3.9+
- ✅ Node.js 16+
- ✅ Ollama（已運行 `ollama serve`）

### 步驟 1：克隆項目（1 分鐘）

```bash
git clone <repository-url>
cd 駁駁Bot
```

### 步驟 2：後端啟動（2 分鐘）

```bash
cd backend
python -m venv venv
# Windows PowerShell
& venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python -m uvicorn app.main:app --reload --port 8000
```

### 步驟 3：前端啟動（2 分鐘 - 新終端）

```bash
cd frontend
npm install
npm run dev
```

### 完成！ ✨

打開 http://localhost:5173 開始使用。

---

## 📋 完整環境變量

如果上述步驟不工作，檢查 `backend/.env`：

```env
LLM_MODEL=llama3
LLM_BASE_URL=http://localhost:11434
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=512
TTS_PROVIDER=edge-tts
TTS_VOICE=zh-HK-YurisNeural
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

---

## 🐛 快速故障排除

| 問題                  | 解決方案                                             |
| --------------------- | ---------------------------------------------------- |
| `ollama: not found`   | 運行 `ollama serve` 啟動服務                         |
| `ModuleNotFoundError` | 激活虛擬環境並運行 `pip install -r requirements.txt` |
| CORS 錯誤             | 編輯 `backend/.env` 中的 `CORS_ORIGINS`              |
| 連接被拒絕            | 確認後端運行在 `http://localhost:8000`               |
