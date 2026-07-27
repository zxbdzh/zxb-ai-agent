# Git Hook

首次拉取项目后执行：

```powershell
.\gradlew.bat installGitHooks
```

提交时会检查 Java 格式、Alibaba P3C 规约和提交信息。提交信息必须使用
`type(模块): 中文摘要`，例如 `feat(agent): 增加对话接口`。

格式检查失败时，执行以下命令修复，再确认并暂存改动：

```powershell
.\gradlew.bat spotlessApply
```
