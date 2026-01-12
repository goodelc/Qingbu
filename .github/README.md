# GitHub Actions 自动构建配置

本项目使用 **GitHub Actions 本地构建**方案实现自动构建和发布：

- **构建工作流** (`build-and-release.yml`) - 在 GitHub Actions runner 上直接构建 Android APK，不依赖 EAS Build 云服务

## 工作流架构

```
Push to main → build-and-release.yml → 设置 Android 环境
                                          ↓
                                    安装依赖
                                          ↓
                                    expo prebuild
                                          ↓
                                    Gradle 构建
                                          ↓
                                    签名 APK
                                          ↓
                                    创建 Release
```

## 配置步骤

### 1. 配置 Android 签名密钥（首次使用需要）

为了构建签名的 APK，需要配置以下 GitHub Secrets：

1. **生成签名密钥**（在本地执行）：
   ```bash
   keytool -genkeypair -v -storetype PKCS12 \
     -keystore qingbu-release-key.jks \
     -alias qingbu-key-alias \
     -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **将 keystore 转换为 Base64**：
   ```bash
   # macOS/Linux
   base64 -i qingbu-release-key.jks | pbcopy
   
   # Windows (PowerShell)
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("qingbu-release-key.jks")) | clip
   ```

3. **配置 GitHub Secrets**：
   - 进入 GitHub 仓库
   - 点击 **Settings** > **Secrets and variables** > **Actions**
   - 点击 **New repository secret**
   - 添加以下 Secrets：
     - **Name**: `ANDROID_KEYSTORE_BASE64`
       - **Value**: 粘贴 Base64 编码的 keystore
     - **Name**: `ANDROID_KEYSTORE_PASSWORD`
       - **Value**: Keystore 密码
     - **Name**: `ANDROID_KEY_ALIAS`
       - **Value**: `qingbu-key-alias`
     - **Name**: `ANDROID_KEY_PASSWORD`
       - **Value**: 密钥密码

⚠️ **注意**：
- 如果没有配置签名密钥，会构建未签名的 APK（仍可使用，但无法更新已安装的签名版本）
- 密钥文件不要提交到 Git！

### 2. 验证配置

1. 推送到 `main` 分支：
   ```bash
   git push origin main
   ```

2. 查看构建状态：
   - 进入 GitHub 仓库
   - 点击 **Actions** 标签页
   - 查看 `Build and Release APK` 工作流运行状态

3. 等待构建完成（15-25 分钟）：
   - 构建完成后会自动创建 GitHub Release
   - 在 **Releases** 页面查看新创建的 Release
   - 下载 APK 文件

## 工作流说明

### 触发条件

- 推送到 `main` 分支（自动触发）
- 手动触发（workflow_dispatch）
- 跳过构建：在提交信息中包含 `[skip build]`

### 构建流程

1. **环境设置**：
   - 设置 Node.js 20
   - 设置 Java 17
   - 设置 Android SDK

2. **项目准备**：
   - 安装项目依赖
   - 运行 `expo prebuild` 生成原生项目

3. **构建 APK**：
   - 配置签名（如果已配置）
   - 使用 Gradle 构建 Release APK

4. **发布**：
   - 创建 GitHub Release
   - 上传 APK 到 Release

### Release 标签格式

Release 标签格式为：`v{version}-{commit-sha}`

例如：`v1.0.0-a1b2c3d4e5f6`

## 优势

- ✅ 不消耗 EAS Build 免费次数
- ✅ 完全控制构建过程
- ✅ 构建日志更详细
- ✅ 可以自定义构建参数
- ✅ GitHub Actions 免费账户通常足够使用

## 注意事项

- 确保 `app.json` 中的版本号正确
- 构建需要时间，请耐心等待（通常 15-25 分钟）
- 首次运行需要配置签名密钥
- 如果构建失败，检查 GitHub Actions 日志获取详细信息

## 故障排除

### 构建失败

1. 检查 Android SDK 是否正确安装
2. 查看 GitHub Actions 日志获取详细错误信息
3. 确认所有依赖都已正确安装

### APK 签名问题

1. 检查 GitHub Secrets 是否正确配置
2. 确认 keystore 文件格式正确（PKCS12）
3. 验证密钥别名和密码是否正确

### Release 创建失败

如果遇到 403 错误，请检查：

1. **仓库 Actions 权限设置**：
   - 进入 GitHub 仓库
   - 点击 **Settings** > **Actions** > **General**
   - 在 **Workflow permissions** 部分
   - 选择 **Read and write permissions**（读写权限）
   - 勾选 **Allow GitHub Actions to create and approve pull requests**（如果需要）

2. **确认工作流权限配置**：
   - 工作流已配置 `permissions: contents: write`
   - 这允许工作流创建 Release

3. **检查 tag 是否已存在**：
   - 如果 tag 已存在，需要先删除或使用不同的 tag 名称
   - 工作流使用格式：`v{version}-{commit-sha}`，通常不会重复

4. **确认 GITHUB_TOKEN 可用**：
   - `GITHUB_TOKEN` 由 GitHub 自动提供
   - 如果仓库禁用了 Actions，需要启用
