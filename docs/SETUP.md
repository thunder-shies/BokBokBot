# 安装与运行指南

## 系统要求

- **操作系统**: Windows 10+, macOS 10.14+, Linux
- **Python**: 3.9+
- **Node.js**: 16+ (LTS 推荐)
- **内存**: 最少 8GB（LLM 模型需要）
- **硬盘**: 最少 10GB（Llama 3 模型约 4.7GB）

## 前置安装

### 1. 安装 Python

#### Windows

```bash
# 下载并安装 Python 3.11
# https://www.python.org/downloads/

# 验证安装
python --version
```

#### macOS

```bash
brew install python@3.11
python3 --version
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip
python3 --version
```

### 2. 安装 Node.js

#### 方式 A: 官网下载

访问 https://nodejs.org 下载 LTS 版本并安装。

#### 方式 B: 包管理器

**macOS**:

```bash
brew install node
```

**Windows**:

```bash
choco install nodejs
```

**Linux**:

```bash
curl -sL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs
```

验证安装:

```bash
node --version
npm --version
```

### 3. 安装 Ollama（本地 LLM）

#### Windows & macOS

访问 https://ollama.ai 下载安装程序。

#### Linux

```bash
curl https://ollama.ai/install.sh | sh
```

拉取 Llama 3 模型：

```bash
ollama pull llama3
```

**首次下载大约需要 10-15 分钟**，取决于网络速度。

验证 Ollama 运行：

```bash
# 启动 Ollama 服务（默认 http://localhost:11434）
ollama serve
```

## 项目安装

### Step 1: 克隆/下载项目

```bash
# 进入项目根目录
cd 駁駁Bot
```

### Step 2: 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
.\venv\Scripts\Activate.ps1
# macOS/Linux:
source venv/bin/activate

# 验证虚拟环境激活（前缀应显示 (venv)）

# 安装依赖
pip install -r requirements.txt

# 创建 .env 文件（复制 .env.example）
# Windows:
copy .env.example .env
# macOS/Linux:
cp .env.example .env

# 编辑 .env 文件（可选，默认值通常可用）
# 配置项说明：
# - LLM_MODEL: 模型名称（默认: llama3）
# - LLM_BASE_URL: Ollama 服务地址（默认: http://localhost:11434）
# - TTS_VOICE: 粤语语音（默认: zh-HK-YurisNeural）
```

### Step 3: 前端设置

```bash
cd ../frontend

# 安装依赖（~2-5 分钟）
npm install
# 或
yarn install

# 创建 .env.local 文件
# Windows:
copy .env.example .env.local
# macOS/Linux:
cp .env.example .env.local
```

## 运行应用

### 终端 1: 启动 Ollama

```bash
ollama serve
```

**预期输出**:

```
2024/03/25 10:00:00 Loaded model "llama3" in 0.5s
2024/03/25 10:00:00 Listening on [::]:11434

API 可在 http://localhost:11434 访问
```

### 终端 2: 启动后端

```bash
cd backend

# 确保虚拟环境激活
.\venv\Scripts\Activate.ps1  # Windows PowerShell
# source venv/bin/activate  # macOS/Linux

# 启动 FastAPI 服务器
python -m uvicorn app.main:app --reload --port 8000
```

**预期输出**:

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started server process [12345]
INFO:     Application startup complete
```

### 终端 3: 启动前端

```bash
cd frontend

npm run dev
# 或
yarn dev
```

**预期输出**:

```
Local:   http://localhost:5173
Press [q + Enter] to quit
```

（或 `http://localhost:3000` 取决于你的配置）

## 验证安装

### 检查后端 API

在浏览器或命令行中访问：

```bash
# 健康检查
curl http://localhost:8000/health

# 查看 API 文档
curl http://localhost:8000/docs  # 在浏览器中打开
```

**预期响应**:

```json
{
  "status": "ok",
  "service": "Mean AI Backend",
  "version": "0.1.0"
}
```

### 首次使用应用

1. 打开浏览器访问 `http://localhost:5173`（或 `http://localhost:3000`）
2. 在聊天框中输入文本
3. 点击「发送 ⚡」按钮
4. 等待 AI 回应（首次调用可能需要 2-5 秒）

## 常见问题与排查

### Q: Ollama 无法连接

```
Error: Failed to connect to http://localhost:11434

A: 确保 Ollama 服务正在运行
   在另一个终端执行: ollama serve
```

### Q: LLM 模型加载缓慢

```
A: 首次运行时模型会被加载到内存，需要数秒到数十秒
   如果多于 60 秒，可能是内存不足
   查看后端日志和 Ollama 日志
```

### Q: 前端无法连接后端

```
Error: Network Error connecting to http://localhost:8000

A: 检查：
   1. 后端是否运行（终端 2）
   2. 防火墙是否阻止端口 8000
   3. .env.local 中的 REACT_APP_API_URL 是否正确
```

### Q: TTS 语音不工作

```
Error: TTS Service Error

A: 检查：
   1. 网络连接（Edge TTS 需要）
   2. 更换语音: zh-HK-WanRuiNeural
   3. 查看后端日志获取更多信息
```

### Q: Node/npm 版本过低

```
npm WARN npm@X.X.X does not support node@X

A: 更新 Node.js
   到 https://nodejs.org 下载最新 LTS 版本
   重新安装时会一并更新 npm
```

## 开发工具推荐

### VS Code 扩展

- Pylance (Python)
- Python (Microsoft)
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Thunder Client 或 REST Client (API 测试)

### 其他工具

- **Postman**: API 测试
- **DevTools**: 浏览器调试（F12）
- **PyCharm/VSCode**: 代码编辑

## 生产部署

### 构建前端

```bash
cd frontend
npm run build
# 输出在 dist/ 目录
```

### 构建后端（Docker）

```bash
# 在后端目录创建 Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

用以下命令构建：

```bash
docker build -t mean-ai-backend ./backend
docker run -p 8000:8000 mean-ai-backend
```

## 停止应用

按 `CTRL+C` 在每个终端中停止运行的进程。

## 后续步骤

- 📚 阅读 [API_SPEC.md](API_SPEC.md) 了解 API 端点
- 🎨 查看 [DESIGN_GUIDE.md](DESIGN_GUIDE.md) 学习 UI 设计
- 🔧 修改代码并实现自己的功能
- 📤 部署到云平台（Vercel, Heroku, AWS 等）

---

**安装指南 v1.0** | Mean AI Project
