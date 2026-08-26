---
title: 文档 Tag 自动更新
description: 推送 docs-v* Tag 后由 AI 生成、验证、合并并发布 Wiki。
docType: automation
---

## 日常入口

一批代码合并到 `master` 后，为当前远端 `master` HEAD 创建并推送文档 Tag：

```bash
git switch master
git pull --ff-only
git tag docs-v1.0.0
git push origin docs-v1.0.0
```

Tag 必须匹配 `docs-vMAJOR.MINOR.PATCH`，也允许 `docs-v2.0.0-rc.1` 形式的预发布后缀。Tag 必须指向当前远端 `master` HEAD；不得移动或复用已经发布的 Tag。

## 自动流程

`Documentation tag generation` 依次执行：

1. 找到目标 Tag 与前一个已经把版本化 evidence 提交到 `master` 的可达 `docs-v*` Tag；失败 Tag 不会成为比较基线，首个成功 Tag 建立全量基线。
2. 从目标 Tag 构建正向 allowlist 语料：`src/`、Current Guides 与受选根项目配置；自动化、历史记录、evidence 和 research 不进入模型输入。
2. 在目标 Tag checkout 上运行固定、无秘密的 Gradle 验证。
3. 把受限仓库快照、Tag 区间 Git diff 和 Current Guide evidence 影响传给 AI。
4. 生成一篇版本演进记录，并更新事实发生变化的 allowlisted Current Guide 区段。
5. 创建固定分支 `docs/tag-<tag>` 上的 PR。
6. 在该 PR 的精确 head SHA 上运行完整文档 CI。
7. CI 通过后，确认机器人作者、分支、SHA 和变更路径，再 squash 合并。
8. 合并 job 显式在 `master` 启动文档 workflow，重新验证并发布 Pages；不依赖 Bot push 递归触发。

每个 Tag 都会产生版本演进记录。Current Guide 的 `verifiedAgainst`、`verifiedAt` 和 evidence sidecar 由可信脚本写入，模型不能决定或伪造验证基线。

## 失败与重跑

同名 Tag 重复 push 不会产生新的 Git 事件。在 PR 尚未合并且流程失败时，可在 Actions 页面手动运行 `Documentation tag generation`，输入已有 Tag 名重跑。生成分支和 PR 名称是确定的；开放 PR 会被更新，关闭但未合并的 PR 会重新打开，已经合并的同 Tag PR 是终态，不应再次重跑。

以下情况会关闭失败，不会发布：

- Tag 名不符合约定或不指向当前 `master` HEAD；
- 前一个文档 Tag 不在目标 Tag 的 `master` first-parent 历史上；
- 固定 Gradle 验证失败；
- 仓库语料、diff 或模型输出触发大小、秘密或 schema 守卫；
- AI 引用目标 Tag 中不存在的文件，或试图修改 allowlist 以外的指南区段；
- 完整文档 CI、浏览器、axe、Lighthouse、链接、搜索或依赖检查失败；
- PR 作者、head SHA、分支或变更路径与可信请求不一致。

## 历史兼容

旧 Learning Checkpoint trailer 流程只保留手动 dispatch，用于处理已有检查点。普通 Wiki 更新不再要求在提交消息里填写 `Learning-*` trailers。
