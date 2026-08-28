# 动效时序图

所有 CSS 动效仅使用 transform/opacity（GPU 合成层，不触发 layout/paint）；Canvas 由引擎统一限帧。

## 页面加载（L1 默认）

```mermaid
sequenceDiagram
    participant N as 导航提交
    participant S as 内联脚本(Head)
    participant C as CSS
    participant R as 渲染
    N->>S: 首帧前执行
    S->>S: 解析路径 → data-chapter
    S->>S: localStorage → data-motion (默认 1)
    S->>R: data-fx=vt ? 标记支持 VT
    R->>C: 章节色即时生效（无闪烁）
    C-->>R: h1::after 描边 scaleX 0→1
    Note over C,R: 0.9s / cubic-bezier(0.22,1,0.36,1) / delay 0.2s / forwards
    C-->>R: 侧边栏指示灯 pulse 2.6s 循环
    C-->>R: 进度条 scaleX 0→1 (scroll-timeline)
```

## 章节间导航（色彩插值为主路径）

```mermaid
sequenceDiagram
    participant U as 用户点击链接
    participant S as 内联脚本(新文档 Head)
    participant V as CSS 变量插值
    participant R as 渲染
    U->>S: 导航提交（首帧前）
    S->>S: 读 localStorage 上一章节（docs-chapter-prev）
    S->>R: 首帧按上一章节配色（data-chapter=prev）
    S->>V: 双 rAF 后切 data-chapter=当前章节
    V->>R: --chapter-hue 与亮色主色 0.5s 插值
    Note over V,R: cubic-bezier(0.2,0,0.2,1)<br/>HSL/色彩平滑渐变，禁止硬切
    R->>R: main 兜底入场 0.34s 轻微上移淡入（非 VT 浏览器）
```

实测关键数据（Chromium 151，插值帧捕获）：hue 265 → 227(80ms) → 167(240ms) → 160(480ms)。

- 跨文档 View Transitions（`@view-transition`）保留为渐进增强，但在部分 Chromium 构建（含 Playwright Chromium 151）实测 `pagereveal` 不携带 viewTransition、不触发，因此色彩插值不依赖它
- L0 经典模式与 `prefers-reduced-motion: reduce` 下：无插值、无入场动画，色彩瞬时落位
- 浏览器原生跳过条件：`prefers-reduced-motion: reduce`

## Canvas 引擎（L3，仅章节首页）

```mermaid
stateDiagram-v2
    [*] --> 待命: data-motion=3 + 章节首页 + 无RM
    待命 --> 动态 import: 协调器 sync()
    动态 import --> 绘制中: mountScene()
    绘制中 --> 绘制中: 30fps 上限<br/>DPR≤2
    绘制中 --> 暂停: 离开视口 / document.hidden
    暂停 --> 绘制中: 回到视口 / 可见
    绘制中 --> 销毁: 等级降级 / RM 开启
    销毁 --> [*]: cancel rAF + 断开观察器 + 移除 canvas
```

| 参数 | 值 | 优化点 |
|---|---|---|
| 帧率上限 | 30fps（帧间隔 <33ms 跳过） | 主线程阻塞 ≪ 16ms/帧 |
| DPR | min(devicePixelRatio, 2) | 4K 屏填充率减半 |
| 粒子数 | 面积自适应，60-200 | 低端核数自动减载 |
| Resize | ResizeObserver 重置场景 | 无逐帧尺寸读取（防强制回流） |
| 失败 | try/catch 静默退出 | 文档可读性优先 |

## 关键 CSS 动效参数表

| 动效 | 属性 | 时长 | 缓动 | 触发 | 等级 |
|---|---|---|---|---|---|
| 章节色彩插值 | --chapter-hue / 亮色主色 | 0.5s | cubic-bezier(0.2, 0, 0.2, 1) | 跨章节导航 | L1 |
| 标题渐变描边 | scaleX | 0.9s + 0.2s delay | cubic-bezier(0.22, 1, 0.36, 1) | 加载 | L1 |
| 侧边栏指示灯 | scale+opacity | 2.6s 循环 | ease-in-out | 加载 | L1 |
| 阅读进度条 | scaleX | scroll(root) | linear | 滚动 | L1 |
| 卡片悬停浮起 | translateY+shadow | 0.22s | cubic-bezier(0, 0, 0.2, 1) | 悬停 | L2 |
| 引用块发光 | box-shadow | 0.22s | ease | 悬停 | L2 |
| Callout 入场 | opacity+translateY | 0.4s | cubic-bezier(0, 0, 0.2, 1) | 加载 | L2 |
| 警示图标脉冲 | scale+opacity | 2.2s 循环 | ease-in-out | 加载 | L2 |
| 首页氛围光 | translate3d+scale | 38s/52s 交替 | ease-in-out | 加载 | L3 |
