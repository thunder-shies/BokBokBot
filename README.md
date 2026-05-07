# BokBok Bot
[![en](https://img.shields.io/badge/lang-en-blue.svg)](https://github.com/thunder-shies/BokBokBot/blob/main/README.md)
<!-- [![zh-yue](https://img.shields.io/badge/lang-zh--yue-red.svg)](https://github.com/thunder-shies/BokBokBot/blob/main/README.zh-yue.md) -->

> A satirical AI chat app that analyzes user input, generates sharp replies, labels extreme tendencies, and can read responses aloud in Cantonese.

## Overview

This app combines a stylized React interface with a FastAPI service that:

- analyzes user prompts and returns an AI reply with three metrics
- keeps the browser chat experience responsive even when a provider fails
- supports microphone input and spoken output in the browser
- detects whether a person appears in uploaded webcam frames

## Tech Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS, motion, lucide-react, react-webcam
- Backend: FastAPI, Uvicorn, httpx, huggingface_hub, aiohttp, OpenCV, python-multipart

## Project Layout

```text
bokbok-bot/
├── src/                  # Frontend app
├── backend/
│   ├── app/
│   │   ├── routes/       # chat + vision APIs
│   │   ├── services/     # LLM and vision logic
│   │   └── models/       # Pydantic schemas
│   ├── config.py         # Environment configuration
│   ├── main.py           # Backend launcher
│   └── requirements.txt
├── vite.config.ts        # Frontend dev server proxy
└── package.json
```

## Requirements

- Node.js 18+
- Python 3.10+
- Windows PowerShell, macOS, or Linux

## Getting Started

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Create a Python virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 3. Install backend dependencies

```powershell
pip install -r .\backend\requirements.txt
```

### 4. Configure the backend

Create `backend/.env` with the provider you want to use:

```dotenv
LLM_PROVIDER=huggingface

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Hugging Face
HF_TOKEN=
HF_MODEL=meta-llama/Llama-3.1-8B-Instruct
HF_PROVIDER=featherless-ai

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1

# App
APP_PORT=8001
CORS_ORIGINS=http://localhost:3000
VISION_CONFIDENCE_THRESHOLD=0.45
```

## Development

Run the backend and frontend in separate terminals.

### Backend

```powershell
Set-Location .\backend
python main.py
```

Backend URL: `http://localhost:8001`

### Frontend

```powershell
npm run dev
```

Frontend URL: `http://localhost:3000`

The Vite dev server proxies `/api/*` requests to `http://localhost:8001`.

## API

### Health

- `GET /health`
- Returns `{"status":"ok","provider":"..."}`

### Chat analysis

- `POST /api/chat/analyze`
- Request body:

```json
{
  "userInput": "你好"
}
```

- Response shape:

```json
{
  "response": "...",
  "metrics": {
    "stupidity": 0.21,
    "conformity": 0.44,
    "polarization": 0.39
  },
  "labels": ["...", "...", "..."]
}
```

### Vision detection

- `POST /api/vision/detect-person`
- Multipart field name: `file`
- Response shape:

```json
{
  "detected": true,
  "count": 1,
  "confidence": 0.73
}
```

## Provider Notes

### Gemini

- Requires a valid `GEMINI_API_KEY`
- Uses the configured Gemini model first

### Hugging Face

- Requires a valid `HF_TOKEN`
- Uses the Hugging Face Inference Client

### Ollama

- Requires a local Ollama server
- Make sure `OLLAMA_MODEL` is installed locally

Start the server before launching the app:

```powershell
ollama serve
```

If you want to verify that it is running, open `http://localhost:11434` or check the model list:

```powershell
ollama list
```

## Runtime Behavior

- Frontend chat requests are sent from `src/services/chatApi.ts`
- Webcam detection is driven by `src/components/WebcamPreview.tsx`
- Access logs for `/api/vision/detect-person` are intentionally suppressed in backend logging
- If a provider request fails, the app falls back to an offline response instead of crashing

## Useful Commands

```powershell
# Frontend type check
npm run lint

# Frontend production build
npm run build

# Backend syntax check
python -m compileall .\backend\app
```

## Troubleshooting

### Chat always falls back to offline mode

1. Confirm the backend is running on port `8001`
2. Confirm the frontend dev server is running on port `3000`
3. Check `backend/.env` provider settings and tokens
4. Verify the selected provider is reachable from your network

### Webcam panel says vision offline

1. Confirm browser camera permission is granted
2. Confirm the backend is running
3. Confirm backend dependencies from `backend/requirements.txt` are installed

### Speech input does not work

1. Use Chrome or Edge
2. Grant microphone permission
3. Make sure the app is served from the local dev URL

### CORS or API routing problems

1. Confirm `CORS_ORIGINS` includes the frontend URL
2. Confirm the Vite proxy target in `vite.config.ts` is `http://localhost:8001`

## Security Note

Do not commit real API keys or tokens. Rotate any exposed secret immediately.

## License

Private/internal project unless stated otherwise.
