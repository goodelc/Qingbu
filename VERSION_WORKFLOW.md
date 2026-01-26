# 版本管理流程说明

## 🎯 工作流程

### 手动决定版本号 + 自动生成 Release 说明

**流程：**
1. 在 CHANGELOG.md 的 `[Unreleased]` 部分记录变更
2. 手动决定版本类型（patch/minor/major）
3. 运行版本脚本更新版本号
4. 提交并推送
5. GitHub Actions 自动从 CHANGELOG.md 提取 Release 说明

## 📝 使用步骤

### 1. 开发并更新 CHANGELOG.md

在 `CHANGELOG.md` 的 `[Unreleased]` 部分记录变更：

```markdown
## [Unreleased]

### Added
- 新增统计图表功能
- 新增数据导出功能

### Fixed
- 修复日期选择器显示问题
- 修复金额输入错误
```

### 2. 手动决定版本类型

根据变更内容决定版本类型：
- **PATCH** (1.0.0 → 1.0.1): 修复 bug
- **MINOR** (1.0.0 → 1.1.0): 新增功能
- **MAJOR** (1.0.0 → 2.0.0): 破坏性变更

### 3. 运行版本脚本

```bash
# 修复 bug
npm run version:patch

# 新增功能
npm run version:minor

# 破坏性变更
npm run version:major
```

脚本会自动：
- ✅ 更新 `package.json` 的 version
- ✅ 更新 `app.json` 的 expo.version
- ✅ 递增 `app.json` 的 android.versionCode
- ✅ 更新 `CHANGELOG.md`，将 `[Unreleased]` 改为具体版本号

### 4. 提交并推送

```bash
git add CHANGELOG.md package.json app.json
git commit -m "chore: bump version to x.y.z"
git push origin main
```

### 5. 自动构建和发布

GitHub Actions 会自动：
1. 构建 Android APK
2. **从 CHANGELOG.md 自动提取变更说明**（对应版本的变更内容）
3. 创建 GitHub Release，包含：
   - 版本号（从 CHANGELOG.md 读取）
   - **变更说明**（从 CHANGELOG.md 提取）
   - APK 文件

## 🔍 Release 说明提取规则

### 从 CHANGELOG.md 提取

Release 说明直接从 CHANGELOG.md 中对应版本的部分提取，保持与文档完全一致。

### CHANGELOG.md 格式示例

在 `CHANGELOG.md` 中记录变更：

```markdown
## [Unreleased]

### Added
- 新增统计图表功能
- 新增数据导出功能

### Fixed
- 修复日期选择器显示问题
- 修复金额输入错误

### Changed
- 重构分类选择器
```

运行 `npm run version:minor` 后，会变成：

```markdown
## [Unreleased]

## [1.1.0] - 2025-01-26

### Added
- 新增统计图表功能
- 新增数据导出功能

### Fixed
- 修复日期选择器显示问题
- 修复金额输入错误

### Changed
- 重构分类选择器
```

GitHub Actions 会自动提取 `## [1.1.0]` 部分的内容作为 Release 说明。

## 📋 完整示例

### 场景：发布新功能

```bash
# 1. 开发功能
# ... 编写代码 ...

# 2. 更新 CHANGELOG.md，在 [Unreleased] 部分添加变更
# 编辑 CHANGELOG.md:
# ## [Unreleased]
# ### Added
# - 新增统计图表功能
# - 新增数据导出功能
# ### Fixed
# - 修复图表数据加载问题

# 3. 提交代码和 CHANGELOG
git add .
git commit -m "feat: 新增统计图表功能"
git commit -m "feat: 新增数据导出功能"
git commit -m "fix: 修复图表数据加载问题"
git add CHANGELOG.md
git commit -m "docs: 更新 CHANGELOG"
git push origin main

# 4. 决定发布 MINOR 版本（因为有新功能）
npm run version:minor

# 5. 提交版本更新
git add CHANGELOG.md package.json app.json
git commit -m "chore: bump version to 1.1.0"
git push origin main

# 6. GitHub Actions 自动：
#    - 构建 APK
#    - 从 CHANGELOG.md 提取版本 1.1.0 的变更说明
#    - 创建 Release，包含从 CHANGELOG.md 提取的说明
```

## 💡 最佳实践

1. **及时更新 CHANGELOG.md**：在开发过程中随时更新 `[Unreleased]` 部分
   - ✅ 在 `[Unreleased]` 下记录变更
   - ✅ 使用清晰的分类（Added/Changed/Fixed 等）
   - ❌ 忘记更新 CHANGELOG.md

2. **清晰的描述**：CHANGELOG.md 中的描述要清晰，因为会直接出现在 Release 说明中

3. **保持格式一致**：遵循 Keep a Changelog 格式标准

4. **检查 Release**：发布后检查从 CHANGELOG.md 提取的 Release 说明是否准确

## 🔧 相关命令

```bash
# 查看当前版本
node -p "require('./app.json').expo.version"

# 查看自上次 tag 以来的 commits
git log $(git describe --tags --abbrev=0)..HEAD --oneline

# 手动运行版本脚本
npm run version:patch   # 修复版本
npm run version:minor   # 功能版本
npm run version:major   # 主版本
```

## 📚 相关文档

- [VERSION_GUIDE.md](./VERSION_GUIDE.md) - 版本管理详细指南
- [USAGE_GUIDE.md](./USAGE_GUIDE.md) - 手动版本管理使用指南
- [CHANGELOG.md](./CHANGELOG.md) - 变更日志
