# Design Token 扩展规范

## 命名规则

```
--chapter-<语义>        章节级基础输入（每章一个块声明）
--sl-color-accent*      Starlight 官方消费点（由公式派生，组件零改动跟随章节）
```

| Token | 类型 | 说明 |
|---|---|---|
| `--chapter-hue` | `<number>` 0-360（@property 注册） | 章节色相，派生公式的唯一输入；注册后可参与 transition 插值 |
| `--chapter-sat` | `<number>` 0-100 | 暗色模式饱和度基数（数字，供 calc 乘百分比） |
| `--chapter-light-accent` | `<color>`（@property 注册） | 亮色模式主色（手工对比度校准 ≥ 4.5:1；注册后可插值） |
| `--chapter-light-accent-high` | `<color>`（@property 注册） | 亮色模式深色变体（用于 accent-high） |
| `--chapter-light-accent-low` | `<color>`（@property 注册） | 亮色模式浅色变体（用于 accent-low） |
| `--chapter-grad-a/-b` | `<color>` | 签名动效渐变两端（b = a + 40°） |
| `--chapter-glow` | `<color>` | 辉光（半透明主色） |
| `--chapter-line` | `<color>` | 装饰线/边框色（半透明） |
| `--chapter-code-tint` | `<color>` | 代码块背景混入色 |
| `--chapter-code-brd` | `<color>` | 代码块边框色 |

## 覆盖机制

分层顺序（本文件 unlayered，天然压过 Starlight 的 `@layer starlight.*`）：

```
chapter-theme.css :root                          暗色公式（默认）
chapter-theme.css :root[data-theme='light']      亮色映射
html[data-chapter='<id>'] { --chapter-* }        章节输入（仅覆盖输入，不直接碰 --sl-*）
```

关键设计：**组件与内容永远不直接感知章节**——只消费 `--sl-color-*`。切换章节时 ChapterHead 注入的 `data-chapter` 改变输入变量，全部消费点自动重算，零 JS 运行时开销。

## 暗色模式映射表（公式派生）

| 消费点 | 公式 | Starlight 原值（hue 224 时的还原） |
|---|---|---|
| `--sl-color-accent-low` | `hsl(H calc(S×0.54%) 20%)` | `hsl(224, 54%, 20%)` ✓ 完全一致 |
| `--sl-color-accent` | `hsl(H S% 60%)` | `hsl(224, 100%, 60%)` ✓ |
| `--sl-color-accent-high` | `hsl(H S% 85%)` | `hsl(224, 100%, 85%)` ✓ |
| `--sl-color-text-accent` | = accent-high | 继承 |
| `--sl-color-bg-accent` | = accent-high | 继承 |
| `--sl-color-text-invert` | = accent-low | 继承 |

## 亮色模式映射表（手工校准）

亮色模式不走公式（黄/绿等色相在白底 60% 明度下对比度必然不达标），而是每章声明校准值：

| 章节 | accent | accent-high | accent-low | 白底对比度 |
|---|---|---|---|---|
| home | `hsl(224 90% 55%)` | `hsl(224 90% 38%)` | `hsl(224 90% 90%)` | ≈ 5.8:1 |
| current | `hsl(160 92% 26%)` | `hsl(160 92% 19%)` | `hsl(160 70% 88%)` | ≈ 4.8:1 |
| evolution | `hsl(265 78% 52%)` | `hsl(265 78% 38%)` | `hsl(265 75% 90%)` | ≈ 5.5:1 |
| reference | `hsl(215 72% 40%)` | `hsl(215 72% 30%)` | `hsl(215 65% 90%)` | ≈ 5.0:1 |
| automation | `hsl(35 92% 32%)` | `hsl(35 92% 24%)` | `hsl(35 90% 88%)` | ≈ 5.4:1 |

## 代码块（Expressive Code）染色边界

`--ec-*` 变量定义在 `.expressive-code[data-theme]` 上且语法配色是构建期 Shiki 编译，无法按章节切换。本系统只染色"帧"：

```css
.expressive-code pre {
  border-color: var(--chapter-code-brd);
  background-color: color-mix(in srgb, var(--chapter-code-tint) 18%, var(--ec-codeBg));
}
```

语法高亮 token 保持 EC 主题原样，保证任意章节下代码可读性一致。
