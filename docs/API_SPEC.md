# API 规范

## 基础信息

- **基础 URL**: `http://localhost:8000`
- **API 版本**: `v1`
- **认证**: 暂无（演示版本）
- **超时**: 30 秒

## 请求/响应格式

所有请求和响应使用 JSON 格式。

### 通用响应格式

#### 成功响应

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    // 具体数据
  }
}
```

#### 错误响应

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "detail": "详细错误信息"
}
```

## 端点列表

### 1. 系统健康检查

#### GET `/health`

检查服务器状态。

**响应**:

```json
{
  "status": "ok",
  "service": "Mean AI Backend",
  "version": "0.1.0"
}
```

**状态码**: 200

---

### 2. 分析对话

#### POST `/api/chat/analyze`

提交用户输入并获取 AI 分析回应。

**请求体**:

```json
{
  "userInput": "我支持某某政治立场",
  "userId": "user_123" // 可选
}
```

**响应**:

```json
{
  "response": "嘩，又係呢句嘢？真係百般無聊啊。你呢句野講到好似自己深明大義咁，但其實屬於典型嘅「鍵盤勇士」類型。",
  "tags": ["愚昧指數: 87%", "盲從度: 92%", "兩極化傾向: 99%"],
  "intensity": 78.5,
  "confidence": 0.92,
  "speechUrl": "http://localhost:8000/api/chat/speech/abc123.mp3"
}
```

**状态码**: 200

**错误**:

- 400: 输入无效
- 500: 服务器错误

**备注**:

- `intensity`: 对话激烈度（0-100）
- `confidence`: AI 置信度（0-1）
- `speechUrl`: 粤语音频 URL（可选）

---

### 3. 获取对话历史

#### GET `/api/chat/history`

获取当前会话的对话历史。

**参数**:

```
limit=10  // 最多返回条目数（默认 10）
offset=0  // 偏移量（分页）
```

**响应**:

```json
{
  "turns": [
    {
      "id": "turn_001",
      "userInput": "我支持某某政治立场",
      "aiResponse": "嘩，又係呢句嘢？...",
      "tags": ["愚昧指數: 87%"],
      "intensity": 78.5,
      "timestamp": "2024-03-25T10:30:00Z"
    }
  ],
  "totalTurns": 5,
  "avgIntensity": 72.3
}
```

**状态码**: 200

---

### 4. 生成语音

#### POST `/api/chat/speak`

将文本转换为粤语语音。

**请求体**:

```json
{
  "text": "要转换的粤语文本"
}
```

**响应**:

```
[Binary Audio Data - MP3 format]
Content-Type: audio/mpeg
```

**状态码**: 200

**错误**:

- 400: 文本无效或过长
- 500: TTS 服务错误

**备注**:

- 返回的是二进制 MP3 音频
- 支持的方言: 粤语（香港）

---

### 5. 语音列表

#### GET `/api/chat/voices`

获取可用的语音列表。

**响应**:

```json
{
  "voices": [
    {
      "id": "zh-HK-YurisNeural",
      "name": "Yuris (Female)",
      "locale": "zh-HK",
      "gender": "Female"
    },
    {
      "id": "zh-HK-ZunNingNeural",
      "name": "ZunNing (Male)",
      "locale": "zh-HK",
      "gender": "Male"
    }
  ]
}
```

**状态码**: 200

---

## 错误代码

| 代码 | 含义         | 解决方案                   |
| ---- | ------------ | -------------------------- |
| 400  | 请求无效     | 检查请求参数格式           |
| 404  | 资源不存在   | 检查 URL 路径              |
| 429  | 请求过于频繁 | 降低请求频率               |
| 500  | 服务器错误   | 检查后端日志               |
| 503  | 服务不可用   | 确认 Ollama/LM Studio 运行 |

## 使用示例

### JavaScript/TypeScript (Axios)

```javascript
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8000",
});

// 分析对话
async function analyzeInput(userInput) {
  try {
    const response = await apiClient.post("/api/chat/analyze", {
      userInput,
    });
    console.log(response.data);
  } catch (error) {
    console.error("Error:", error.response?.data);
  }
}

// 获取历史
async function getHistory() {
  const response = await apiClient.get("/api/chat/history", {
    params: { limit: 10 },
  });
  return response.data;
}

// 生成语音
async function speakText(text) {
  const response = await apiClient.post(
    "/api/chat/speak",
    { text },
    { responseType: "blob" },
  );

  // 播放音频
  const audio = new Audio(URL.createObjectURL(response.data));
  audio.play();
}
```

### Python (Requests)

```python
import requests

BASE_URL = "http://localhost:8000"

def analyze_input(user_input):
    response = requests.post(
        f"{BASE_URL}/api/chat/analyze",
        json={"userInput": user_input}
    )
    return response.json()

def get_history(limit=10):
    response = requests.get(
        f"{BASE_URL}/api/chat/history",
        params={"limit": limit}
    )
    return response.json()
```

### cURL

```bash
# 分析对话
curl -X POST http://localhost:8000/api/chat/analyze \
  -H "Content-Type: application/json" \
  -d '{"userInput": "我支持某某政治立场"}'

# 获取历史
curl http://localhost:8000/api/chat/history?limit=10

# 生成语音
curl -X POST http://localhost:8000/api/chat/speak \
  -H "Content-Type: application/json" \
  -d '{"text": "粤语文本"}' \
  --output speech.mp3
```

## 速率限制

- **当前**: 无限制（演示版本）
- **生产版**: 建议每 IP 每分钟 60 个请求

## 未来扩展

- WebSocket 支持（实时流式回应）
- 用户认证与会话管理
- 数据库持久化
- 多语言支持
- AI 训练数据收集
- 分析报告生成

---

**API 文档 v1.0** | Mean AI Project
