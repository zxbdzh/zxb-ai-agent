# 章节感知型主题系统（Chapter-Aware Theming）

为 docs-site（Astro + Starlight）落地"章节主题色 + 微动效"设计体系：每个内容分区拥有独立的色彩情绪与签名动效，用户在章节间切换时感受到"场景转换"而非"页面跳转"，同时以设计系统约束保证一致性与性能预算。

## 快速总览

| 章节 | 色相 | 情绪 | 签名动效（L1+） | 沉浸效果（L3） |
|---|---|---|---|---|
| 首页 `home` | 224° 品牌蓝 | 可信锚点 | Hero 标题渐变描边 | Hero 氛围光晕（纯 CSS） |
| 当前指南 `current` | 160° 活力青绿 | 启动感 | 标题描边 + 卡片悬停浮起 | — |
| 演进记录 `evolution` | 265° 深邃蓝紫 | 编年深度 | 标题描边 + 状态灯指示 | 粒子聚合消散（Canvas） |
| 参考资料 `reference` | 215° 冷靛银 | 精确机械 | 标题描边 + 数据网格 | 数据流（Canvas） |
| 自动化维护 `automation` | 35° 琥珀橙 | 工程警示 | 标题描边 + 警示脉冲 | — |

动效强度分级（页头下拉切换，持久化于 `localStorage`）：

- **L0 经典**：全部动效关闭（尽力跳过章节过渡）
- **L1 标准**（默认）：标题描边、侧边栏指示灯、章节色阅读进度条
- **L2 丰富**：卡片/引用块/Callout 悬停与入场响应
- **L3 沉浸**：首页氛围光 + 章节首页 Canvas 效果

## 文件清单

| 文件 | 职责 |
|---|---|
| `docs-site/src/styles/chapter-theme.css` | Token 体系、章节染色、动效分级门控、章节过渡（核心） |
| `docs-site/src/components/ChapterHead.astro` | 覆盖 Starlight Head：首帧前注入 `data-chapter` / `data-motion` / `data-fx`，Canvas 协调器 |
| `docs-site/src/components/MotionThemeSelect.astro` | 覆盖 ThemeSelect：页头动效等级切换 |
| `docs-site/src/scripts/effects/engine.ts` | Canvas 引擎（DPR/fps/离屏/可见性护栏） |
| `docs-site/src/scripts/effects/evolution-particles.ts` | 演进记录：粒子聚合消散 |
| `docs-site/src/scripts/effects/reference-stream.ts` | 参考资料：数据流 |
| `theme-matrix.md` | 章节主题矩阵（本设计的唯一事实来源） |
| `design-tokens.md` | Token 命名、覆盖机制、暗/亮映射表 |
| `motion-timing.md` | 动效时序图 |
| `visual-description.md` | 对比章节完整视觉描述 |
| `degradation.md` | 降级策略与实测数据 |
| `chapters.config.json` | 机器可读章节配置（新增章节只需填表） |

## 新增章节流程

1. 在 `chapters.config.json` 填一行（id/hue/sat/情绪/动效）。
2. 复制 `chapter-theme.css` 第 1 节中的任一章节块，改 `data-chapter` 值与色值；亮色模式主色用对比度 ≥ 4.5:1 校准。
3. 在 `ChapterHead.astro` 的 `known` 数组加入新分区名。
4. （可选）编写 Canvas 效果模块并注册进 `EFFECTS` 表。

无需改动 Starlight 配置与内容管线。

## 风险与对策

| 风险 | 对策 | 状态 |
|---|---|---|
| 章节配色混乱 | 限定 5 个基础主题色；衍生色（渐变副色/辉光/代码块染色）全部由 hue 公式派生 | 已内置 |
| 动效拖慢加载 | Canvas 按需分包（L0-L2 用户零请求）；视口外/隐藏标签页自动暂停；30fps 上限 | 已内置 |
| 用户迷失于视觉变化 | 全局导航/布局结构不变，仅内容区响应章节色；L0 一键经典模式 | 已内置 |
| 维护成本 | 配置即文档（JSON + 模板化 CSS 块），新增章节零代码侵入 | 已内置 |
| 性能预算超标 | 见 `degradation.md`：Lighthouse 双端性能/无障碍满分，总字节 60.5KB（预算 512KB） | 实测通过 |

## 验证

```bash
npm run build && npm run check   # 结构校验 + 单测 + astro check
npm run test:browser             # 含 tests/chapter-theme.spec.ts（章节标识/动效分级/Canvas/无障碍）
npm run lighthouse               # 桌面 + 移动双端预算
```
