---
title: 学习检查点
description: 提交 trailer、生成触发和恢复流程。
docType: automation
---

## 提交格式

普通提交不得包含任何 `Learning-*` trailer。检查点必须在提交信息末尾的同一个 trailer 块中，各出现一次且非空：

```text
Learning-Checkpoint: 本次学习检查点的简短主题
Learning-Motivation: 为什么此变化值得未来维护者理解
Learning-Outcome: 作者确认的学习结论
Learning-Guide: conversation-memory#lifecycle
```

`Learning-Guide` 可省略；存在时只能出现一次，并且必须命中自动化中的页面与章节 allowlist。前三个 trailer 构成原子契约：主题、动机和结论都由作者提供并原文保留。运维影响由生成器依据仓库与引用证据形成，不作为作者 trailer。未知、部分、重复、空白或格式错误的 `Learning-*` 元数据都会使提交失败。trailer 还要通过秘密检测，不能把密钥或 token 作为学习内容提交。

## 触发与重跑

`master` push 的请求工作流枚举 `before..after` 中每个提交，因此一次 push 中较早的检查点不会被遗漏。人工重跑必须在 Actions 页面选择 `master` ref 并输入完整 SHA；请求工作流没有模型秘密和写权限。

后续处理由独立 `workflow_run` 工作流完成。它只签出 `refs/heads/master` 的自动化代码，重新确认每个 SHA 是当前 `origin/master` 的祖先且仍有完整 trailer。检查点身份始终是完整 40 位 SHA。

每个 SHA 对应固定分支和一个终身 PR。开放 PR 被更新，关闭但未合并的 PR 被重新打开，已合并 PR 是终态；发现多个同 SHA PR 时流程关闭失败。

## 发布边界

无秘密验证、模型生成和写入发布位于分离 job。模型秘密只释放给受保护的 `learning-checkpoint-generation` environment；该 job 只有 `contents: read`，checkout 不保留凭据，也不运行 Gradle 或模型建议命令。发布 job 有写权限但没有模型秘密。

可选指南变更只能替换一个 allowlisted 章节正文，不会自动更新页面级 `verifiedAgainst` 或 `verifiedAt`。这类 PR 合并前仍需审查整页；证据文件变动造成的页面过期必须由人工复核后单独重新盖章。
