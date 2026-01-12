# GitHub Actions 自动构建配置

本项目已配置 GitHub Actions 工作流，在推送到 `main` 分支时自动构建 APK 并创建 GitHub Release。

## 配置步骤

### 1. 获取 Expo Access Token

1. 访问 [Expo 账号设置](https://expo.dev/accounts/[your-account]/settings/access-tokens)
2. 点击 "Create Token"
3. 输入 Token 名称（如：`github-actions`）
4. 选择权限范围（至少需要 `build` 权限）
5. 复制生成的 Token

### 2. 配置 GitHub Secrets

1. 进入 GitHub 仓库
2. 点击 **Settings** > **Secrets and variables** > **Actions**
3. 点击 **New repository secret**
4. 添加以下 Secret：
   - **Name**: `EXPO_TOKEN`
   - **Value**: 粘贴刚才复制的 Expo Access Token
5. 点击 **Add secret**

### 3. 验证配置

1. 推送到 `main` 分支：
   ```bash
   git push origin main
   ```

2. 查看构建状态：
   - 进入 GitHub 仓库
   - 点击 **Actions** 标签页
   - 查看工作流运行状态

3. 构建完成后：
   - 在 **Releases** 页面查看新创建的 Release
   - 下载 APK 文件

## 工作流说明

### 触发条件

- 仅在推送到 `main` 分支时触发
- 每次推送都会创建新的构建和 Release

### 构建流程

1. 检查代码
2. 安装依赖
3. 使用 EAS Build 构建 Android APK（production profile）
4. 等待构建完成（通常 10-20 分钟）
5. 下载 APK
6. 创建 GitHub Release
7. 上传 APK 到 Release

### Release 标签格式

Release 标签格式为：`v{version}-{commit-sha}`

例如：`v1.0.0-a1b2c3d4e5f6`

## 注意事项

- 确保 `app.json` 中的版本号正确
- EAS Build 构建需要时间，请耐心等待
- 首次运行可能需要生成 Android Keystore（EAS 会自动处理）
- 如果构建失败，检查 GitHub Actions 日志获取详细信息

## 故障排除

### 构建失败

1. 检查 `EXPO_TOKEN` 是否正确配置
2. 确认 Expo 项目已正确链接到 GitHub
3. 查看 GitHub Actions 日志获取详细错误信息

### 无法获取构建 ID

- 等待时间可能需要调整（当前为 10 秒）
- 检查 EAS Build 服务状态

### Release 创建失败

- 确认仓库有创建 Release 的权限
- 检查 `GITHUB_TOKEN` 是否可用（通常自动提供）
