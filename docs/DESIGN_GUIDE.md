# UI/UX 设计指南

## 视觉身份

### 品牌色彩

- **主色 - 青色**: `#00d9ff` (RGB: 0, 217, 255) - 科技感、冷漠
- **强调色 - 洋红**: `#ff00ff` (RGB: 255, 0, 255) - 对比、警告
- **补助色 - 石灰**: `#00ff00` (RGB: 0, 255, 0) - 活力、反讽
- **背景 - 纯黑**: `#0a0a0a` (RGB: 10, 10, 10) - 深度、专业
- **文本 - 白色**: `#ffffff` - 高对比度

### 字体

- **sans-serif**: Inter (现代、易读)
- **mono**: Courier Prime (代码感、冷漠)

## 设计元素

### 1. 文本效果

#### 发光文本（Glow）

```css
.text-cyan-glow {
  color: #00d9ff;
  text-shadow: 0 0 20px rgba(0, 217, 255, 0.8);
}
```

#### 字形效果（Glitch）

- 随机位移 2-4px
- 多层重影（青色、洋红色）
- 动画时长 0.15s

### 2. 边框效果

#### 普通发光边框

```
border: 1px solid rgba(0, 217, 255, 0.3)
border-radius: 0px (直角设计强调科技感)
```

#### CRT 监控器边框

```
border: 2px solid
background: 包含扫描线
animation: 脉冲发光 2s
```

### 3. 背景层

#### 层级结构

1. **基础层**: 纯黑背景
2. **渐变层**: 45° 线性渐变（青-洋红-青）+ 低透明度
3. **扫描线层**: 1px 水平线，间隔 2px（可选）
4. **内容层**: Z-index: 10+

#### 动态背景

- 根据对话激烈度（0-100%）调整渐变层透明度
- 激烈度 = 0 时: 透明度 0%
- 激烈度 = 100 时: 透明度 50%

### 4. 交互元素

#### 按钮样式（btn-neon）

```
border: 2px solid #00d9ff
color: #00d9ff
background: transparent
padding: 12px 24px
font-weight: 600
hover: 背景变青色，文字变黑
transition: 300ms
```

#### 输入框（input-neon）

```
border: 2px solid #00d9ff
background: #000000
text-color: #ffffff
focus: 边框变洋红色
focus: 发光效果 0 0 10px rgba(255, 0, 255, 0.5)
```

### 5. 卡片设计

#### 回应卡片（response-card）

```
border: 1px solid #00d9ff
background: 从 #000000 到 #1a1a1a 的渐变
border-radius: 8px
backdrop-filter: blur(10px)
padding: 16px
animation: 脉冲发光 2s infinite
```

## 动画库

### 1. 打字机效果

```
- 每个字符显示间隔: 30ms
- 显示光标: 闪烁 1s
```

### 2. 扫描线

```
- 高度: 1px
- 间隔: 2px
- 动画: 从上到下 8s linear infinite
- 不透明度: 2%
```

### 3. 脉冲发光

```
- 0%: border-shadow 0 0 20px
- 50%: border-shadow 0 0 40px
- 100%: border-shadow 0 0 20px
- 持续时间: 2s
```

### 4. 毛刺

```
- 多层随机为移 -2px 到 2px
- 应用 clip-path 实现黑线条
- 快速闪烁: 0.15s
```

### 5. 淡入淡出

```
- duration: 300-500ms
- easing: cubic-bezier(0.4, 0, 0.6, 1)
- 用于列表项、模态框
```

## 响应式设计

### 断点

- 移动 (xs): < 640px
- 平板 (md): 640px - 1024px
- 桌面 (lg): > 1024px

### 布局原则

- 优先考虑桌面优先
- 垂直滚动在移动设备上
- 触摸友好的按钮大小: 最少 44px × 44px

## 无障碍性

### 对比度

- 文本与背景: WCAG AA 标准（4.5:1）
- 青色文本在黑色背景: ✓ 合格
- 洋红文本在黑色背景: ✓ 合格

### 键盘导航

- 所有交互元素支持 Tab 导航
- Focus 状态明显（边框变化或发光）
- Escape 键关闭模态框

### 屏幕阅读器

- 语义 HTML（button, input, label）
- aria-label 用于无文本元素
- aria-live 用于动态内容

## 组件库指南

### App.tsx

- 整体布局（Header, Tab, MainContent, Sidebar）
- 状态管理（对话历史、激烈度）
- 响应式网格

### ChatInterface.tsx

- 文本输入框，自动高度调整
- 字数显示与提示
- 发送按钮状态管理

### AIResponse.tsx

- 打字机动画
- 冷漠指数显示
- 消息气泡样式

### TagDisplay.tsx

- 延遟出现效果
- 渐变色标签
- 百分比进度条

### WebcamPreview.tsx

- 摄像头集成
- CRT 框架效果
- 实时状态指示

## 调试技巧

### 检查层级

```
F12 → Elements → 检查 z-index
```

### 检查动画

```
F12 → Animations → 播放/暂停/调速
```

### 响应式测试

```
F12 → Device Toolbar (Ctrl+Shift+M)
```

## 最佳实践

1. **保持简洁**: 不过度装饰，专注于信息传达
2. **一致性**: 统一的颜色、字体、间距
3. **性能**: 使用 CSS 硬件加速（transform, opacity）
4. **反馈**: 所有交互都有视觉反馈
5. **色盲友好**: 不仅依赖颜色区分信息

---

**设计者**: Creative Technologist | Mean AI Project © 2024
