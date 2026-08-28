# 降级策略与实测数据

## 降级矩阵

| 条件 | 行为 | 实现层 |
|---|---|---|
| `prefers-reduced-motion: reduce`（系统设置） | 全站动画熄灭：animation-name 强制 none、过渡时长归零、色彩插值关闭、Canvas 不挂载、View Transition 由 UA 原生跳过 | CSS 万能 kill 规则 + JS 引擎双保险 |
| 动效等级 L0（用户选择「经典模式」） | 所有 L1-L3 动效关闭（含色彩插值）；根节点设 `view-transition-name: none` 尽力跳过章节过渡 | CSS `[data-motion]` 门控 + 内联脚本 |
| 跨章节导航的色彩过渡 | 主路径为 @property 变量插值（`--chapter-hue` 0.5s + 亮色主色 0.5s），首帧按上一章节着色后切到当前章节；不依赖跨文档 VT | CSS @property + transition + 内联脚本 |
| 跨文档 View Transitions 不可用/不触发 | 无影响——色彩插值为主路径（实测部分 Chromium 构建 `pagereveal` 不携带 viewTransition，VT 仅作渐进增强保留） | 设计使然 |
| 不支持 scroll-driven animations | 阅读进度条整体不渲染（@supports 门控，无布局占位） | CSS |
| 不支持 @property（<Chrome 85 / <Safari 16.4 / <Firefox 128） | 章节色瞬时落位（无插值），其余功能完整 | CSS 渐进增强 |
| 不支持相对色语法（<Chrome 119） | 亮色渐变副色/辉光回退为继承值，主色系仍正常 | CSS 渐进增强 |
| JS 禁用 | `data-motion` 永远不设置 → 所有动效门控不命中；页面为纯静态可读文档（章节色 via CSS 选择器仍生效） | 设计使然 |
| Canvas 运行时异常 | try/catch 静默退出并移除画布，文档不受影响 | engine/effects |
| 低性能设备 | Canvas 粒子按面积自适应（60-200），DPR≤2，30fps 上限，离屏/隐藏页停帧 | engine |

## 与原始设想的裁剪记录

| 原设想 | 落地替代 | 原因 |
|---|---|---|
| Web Worker 计算粒子 | 主线程 rAF + 自适应粒子数 | ≤200 粒子的绘制成本远低于 16ms/帧预算；Worker 通信与拷贝开销反而更大 |
| 面包屑微型动效图标 | 侧边栏活跃项指示灯 + 标题描边 | Starlight 面包屑定制需整链覆盖，收益/成本不成立 |
| 逐章重制代码语法高亮 | 帧染色（边框/背景混色） | EC 主题是构建期 Shiki 编译产物，运行时不可切换；帧染色可保留可读性 |
| Framer Motion | 纯 CSS + 原生 Canvas | 站点无 React 运行时；引入框架与 512KB 预算冲突 |
| Canvas 效果覆盖所有章节 | 仅 evolution/reference 两个章节首页 | current/automation 的情绪（轻盈/警示）用 CSS 描边与脉冲表达更贴切且零成本 |

## 实测数据（2026-08-28，改造后）

Lighthouse CI（`current/conversation-memory/`，3 次运行取首份）：

| 指标 | 阈值 | 桌面 | 移动 |
|---|---|---|---|
| Performance | ≥ 0.90 | **1.00** | **1.00** |
| Accessibility | ≥ 0.95 | **1.00** | **1.00** |
| LCP | ≤ 2500ms | 296ms | 1520ms |
| CLS | ≤ 0.1 | 0 | 0 |
| Total Byte Weight | ≤ 512000 | 60,506 | 60,506 |

页面权重增量：CSS + 约 6KB，Head 协调器脚本 + 约 1.5KB；Canvas 效果模块独立分包（evolution/reference 各约 2KB），仅在 L3 + 章节首页时请求。Lighthouse 阈值未做任何调整。

## 验证入口

- 动效分级回归：`docs-site/tests/chapter-theme.spec.ts`（章节标识 / 分级门控 / Canvas 挂载 / reduced-motion）
- 无障碍：`npm run test:axe` + Lighthouse accessibility
- 性能：`npm run lighthouse`
