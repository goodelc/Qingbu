# 工作流更新日志

## 2024 - GitHub Actions 本地构建方案

### 变更说明

项目已从 **EAS Build + Webhook** 方案迁移到 **GitHub Actions 本地构建**方案，不再依赖 Expo 云构建服务，节省免费构建次数。

### 新的工作流架构

**build-and-release.yml**
- 触发时机：推送到 `main` 分支或手动触发
- 功能：在 GitHub Actions runner 上直接构建 Android APK
- 优势：
  - 不消耗 EAS Build 免费次数
  - 完全控制构建过程
  - 构建日志更详细
  - 可以自定义构建参数

### 构建流程

1. **环境设置**：Node.js 20、Java 17、Android SDK
2. **项目准备**：安装依赖、运行 `expo prebuild`
3. **构建 APK**：使用 Gradle 构建 Release APK
4. **签名**：使用 GitHub Secrets 中的密钥签名（可选）
5. **发布**：创建 GitHub Release 并上传 APK

### 配置要求

1. **GitHub Secrets**（可选，用于签名）：
   - `ANDROID_KEYSTORE_BASE64` - Base64 编码的 keystore 文件
   - `ANDROID_KEYSTORE_PASSWORD` - Keystore 密码
   - `ANDROID_KEY_ALIAS` - 密钥别名
   - `ANDROID_KEY_PASSWORD` - 密钥密码

2. **无需配置**：
   - 不再需要 `EXPO_TOKEN`
   - 不再需要 `GITHUB_PAT`
   - 不再需要配置 EAS Build webhook

### 迁移指南

如果你之前使用 EAS Build 方案：

1. ✅ 新的工作流已自动配置
2. ✅ 旧的 EAS Build 工作流已禁用/删除
3. ⚠️ 首次使用需要配置 Android 签名密钥（见 README.md）
4. ✅ 推送到 `main` 分支会自动触发构建

### 已删除的文件

- `build-trigger.yml` - EAS Build 触发工作流
- `build-complete.yml` - EAS Build 完成处理工作流
- `webhook-receiver.yml` - Webhook 接收器工作流
- `WEBHOOK_SETUP.md` - Webhook 配置文档

### 优势

- ✅ 不消耗 EAS Build 免费次数
- ✅ 构建过程完全透明
- ✅ 可以自定义构建步骤
- ✅ 构建日志更详细
- ✅ GitHub Actions 免费账户通常足够使用

### 注意事项

1. **构建时间**：可能需要 15-25 分钟（比 EAS Build 稍慢）
2. **签名配置**：首次使用需要配置签名密钥
3. **跳过构建**：在提交信息中添加 `[skip build]` 可跳过构建

---

## 历史版本

### 2024 - EAS Build + Webhook 方案（已废弃）

原有的单一工作流 `build-and-release.yml` 已被拆分为两个独立的工作流，使用 webhook 机制实现更可靠的构建和发布流程。

**注意**：此方案已废弃，不再使用。
