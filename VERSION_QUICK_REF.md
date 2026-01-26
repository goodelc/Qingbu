# 版本管理快速参考

## 🎯 工作流程

**手动决定版本号 + 从 CHANGELOG.md 提取 Release 说明**

1. 在 CHANGELOG.md 的 `[Unreleased]` 部分记录变更
2. 手动运行版本脚本（选择其一）：
   - `npm run version:patch` - 修复 bug
   - `npm run version:minor` - 新增功能
   - `npm run version:major` - 破坏性变更
3. 提交并推送
4. GitHub Actions 自动从 CHANGELOG.md 提取 Release 说明

---

## 📝 Commit Message 格式

### 基本格式

```bash
type: description
type(scope): description
```

### 常用类型

```bash
# 新功能 → MINOR 版本
git commit -m "feat: 新增统计图表"

# 修复 bug → PATCH 版本
git commit -m "fix: 修复日期选择器问题"

# 破坏性变更 → MAJOR 版本
git commit -m "refactor!: 重构数据库结构"
```

---

## 🚀 快速开始

### 标准流程

```bash
# 1. 开发并更新 CHANGELOG.md
# 编辑 CHANGELOG.md，在 [Unreleased] 部分添加变更

# 2. 提交代码
git add .
git commit -m "feat: 新增统计图表功能"
git add CHANGELOG.md
git commit -m "docs: 更新 CHANGELOG"

# 3. 手动决定版本类型并运行脚本
npm run version:patch   # 修复 bug
npm run version:minor   # 新增功能
npm run version:major   # 破坏性变更

# 4. 提交并推送
git add CHANGELOG.md package.json app.json
git commit -m "chore: bump version to x.y.z"
git push origin main

# 5. GitHub Actions 自动：
#    - 构建 APK
#    - 从 CHANGELOG.md 提取 Release 说明
#    - 创建 Release
```

---

## 📊 版本类型选择

| 变更类型 | 版本类型 | 命令 |
|---------|---------|------|
| 修复 bug | PATCH | `npm run version:patch` |
| 新增功能 | MINOR | `npm run version:minor` |
| 破坏性变更 | MAJOR | `npm run version:major` |

## 📝 CHANGELOG.md 格式

在 `CHANGELOG.md` 的 `[Unreleased]` 部分记录变更：

```markdown
## [Unreleased]

### Added
- 新增统计图表功能
- 新增数据导出功能

### Fixed
- 修复日期选择器问题
- 修复金额输入错误

### Changed
- 重构数据库服务
```

运行版本脚本后，`[Unreleased]` 会变成具体版本号，GitHub Actions 会自动提取这部分内容作为 Release 说明。

---

## 📚 详细文档

- [VERSION_WORKFLOW.md](./VERSION_WORKFLOW.md) - 版本管理流程说明（推荐）
- [VERSION_GUIDE.md](./VERSION_GUIDE.md) - 版本管理原理和最佳实践
- [USAGE_GUIDE.md](./USAGE_GUIDE.md) - 详细使用指南
