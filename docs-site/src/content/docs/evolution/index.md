---
title: 演进记录
description: 由文档 Tag 或历史学习检查点生成并经验证的不可变记录。
docType: evolution-index
---

演进记录对应明确的文档版本节点，不覆盖每个普通提交。默认入口是 `docs-v*` Tag：每个 Tag 根据前一个可达文档 Tag 到当前 Tag 的代码区间，生成一篇版本记录并同步 Current Guide。历史 Learning Checkpoint 只保留手动兼容入口。

文件名为 `<yyyy-mm-dd>-<短SHA>-<slug>.md`，每篇记录绑定完整目标 SHA、仓库引用和版本化 CI evidence。Tag 记录的动机是自动沉淀该版本区间的事实变化；模型不能补造作者意图或验证结果。

现有记录不得改写解释。事实错误只能追加带作者和日期的“事实修订说明”；代码事实再次变化时，应创建新的 `docs-v*` Tag 和演进记录。

已知旧提交仍列在[历史清单](../reference/historical-checkpoints/)，该清单不推断动机或结果。
