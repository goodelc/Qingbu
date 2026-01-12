# 轻簿 (Qingbu) - APK 打包指南

## 📦 打包 APK 的方法

### 方法一：GitHub Actions 自动构建（推荐，不消耗 EAS 免费次数）

项目已配置 GitHub Actions 自动构建，推送到 `main` 分支时会自动构建 APK 并创建 Release。

#### 自动构建流程

1. **推送到 main 分支**：
   ```bash
   git push origin main
   ```

2. **查看构建状态**：
   - 进入 GitHub 仓库
   - 点击 **Actions** 标签页
   - 查看 `Build and Release APK` 工作流运行状态

3. **下载 APK**：
   - 构建完成后，在 **Releases** 页面下载 APK
   - 或者从工作流 Artifacts 下载

#### 跳过构建

如果不想触发构建，在提交信息中包含 `[skip build]`：
```bash
git commit -m "docs: 更新文档 [skip build]"
```

#### 手动触发构建

1. 进入 GitHub 仓库
2. 点击 **Actions** > **Build and Release APK**
3. 点击 **Run workflow**

#### 配置签名密钥（首次使用需要）

为了构建签名的 APK，需要配置以下 GitHub Secrets。

**重要**：如果你之前在 EAS Build 上已经构建过应用，**必须使用相同的密钥**，否则新构建的 APK 无法更新已安装的旧版本。

##### 方案 A：从 EAS Build 导出密钥（推荐，如果之前用过 EAS Build）

1. **导出 EAS Build 密钥**：
   ```bash
   # 安装 EAS CLI（如果还没有）
   npm install -g eas-cli
   
   # 登录 Expo 账号
   eas login
   
   # 导出 Android 密钥
   eas credentials
   ```
   
   然后选择：
   - Platform: **Android**
   - Workflow: **production** (或你使用的 profile)
   - 选择 **Download credentials**
   - 选择 **Keystore** 下载

2. **获取密钥信息**：
   - 下载的 keystore 文件（通常是 `.jks` 格式）
   - 密钥别名（alias）：通常在 EAS 控制台或下载的文件名中可以看到
   - 密码：EAS 会自动生成，需要从 EAS 控制台获取

3. **查看密钥信息**：
   - 访问 [Expo Dashboard](https://expo.dev)
   - 进入你的项目
   - 进入 **Credentials** > **Android** > **Production** (或对应的 profile)
   - 查看密钥别名和相关信息

4. **将 keystore 转换为 Base64**：
   ```bash
   # macOS/Linux
   base64 -i <下载的keystore文件>.jks | pbcopy
   
   # Windows (PowerShell)
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("<下载的keystore文件>.jks")) | clip
   ```

5. **配置 GitHub Secrets**：
   - 进入 GitHub 仓库
   - 点击 **Settings** > **Secrets and variables** > **Actions**
   - 添加以下 Secrets：
     - `ANDROID_KEYSTORE_BASE64`: 粘贴 Base64 编码的 keystore
     - `ANDROID_KEYSTORE_PASSWORD`: EAS 生成的密码（从 Expo Dashboard 获取）
     - `ANDROID_KEY_ALIAS`: 密钥别名（从 Expo Dashboard 获取，通常是 `key` 或类似名称）
     - `ANDROID_KEY_PASSWORD`: 通常与 keystore 密码相同

##### 方案 B：生成新的签名密钥（仅首次构建，或确定不需要更新旧版本）

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
   - 添加以下 Secrets：
     - `ANDROID_KEYSTORE_BASE64`: 粘贴 Base64 编码的 keystore
     - `ANDROID_KEYSTORE_PASSWORD`: Keystore 密码
     - `ANDROID_KEY_ALIAS`: `qingbu-key-alias`
     - `ANDROID_KEY_PASSWORD`: 密钥密码

⚠️ **注意**：
- 如果没有配置签名密钥，会构建未签名的 APK（仍可使用，但无法更新已安装的签名版本）
- 密钥文件不要提交到 Git！
- **如果应用已经发布或用户已安装，必须使用相同的密钥**

---

### 方法二：使用 EAS Build（可选，消耗免费次数）

EAS Build 是 Expo 官方推荐的构建服务，无需本地配置 Android 开发环境。

#### 1. 安装 EAS CLI

```bash
npm install -g eas-cli
```

#### 2. 登录 Expo 账号

```bash
eas login
```

如果没有账号，访问 [expo.dev](https://expo.dev) 注册。

#### 3. 配置项目

```bash
eas build:configure
```

#### 4. 构建 APK

```bash
# 构建预览版 APK（用于测试）
eas build --platform android --profile preview

# 或构建生产版 APK
eas build --platform android --profile production
```

#### 5. 下载 APK

构建完成后，EAS 会提供一个下载链接，或者运行：

```bash
eas build:list
```

然后使用构建 ID 下载：

```bash
eas build:download [BUILD_ID]
```

---

### 方法三：本地构建（需要 Android Studio）

如果你想在本地构建 APK：

#### 前置要求

1. 安装 [Android Studio](https://developer.android.com/studio)
2. 配置 Android SDK
3. 设置环境变量：
   - `ANDROID_HOME` 指向 Android SDK 路径
   - 将 `platform-tools` 和 `tools` 添加到 PATH

#### 构建步骤

1. 生成原生项目：

```bash
npx expo prebuild --platform android
```

2. 进入 Android 目录：

```bash
cd android
```

3. 构建 APK：

```bash
# Debug APK
./gradlew assembleDebug

# Release APK（需要签名配置）
./gradlew assembleRelease
```

4. APK 位置：

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🎨 应用图标配置

### 图标要求

需要准备以下图标文件（放在 `assets` 目录）：

1. **icon.png** - 主图标（1024x1024 像素）
2. **adaptive-icon.png** - Android 自适应图标（1024x1024 像素）
3. **splash.png** - 启动画面（1284x2778 像素，可选）
4. **favicon.png** - Web 图标（48x48 像素，可选）

### 快速生成图标

可以使用在线工具生成：

1. [App Icon Generator](https://www.appicon.co/)
2. [Icon Kitchen](https://icon.kitchen/)
3. [Expo Icon Generator](https://www.favicon-generator.org/)

### 图标设计建议

- 使用简洁的设计，避免过多细节
- 使用主题色（绿色 #4CAF50）作为主色调
- 可以包含"轻簿"或"Q"字母
- 确保在小尺寸下也能清晰识别

### 临时图标（开发用）

如果暂时没有图标，可以：

1. 创建一个简单的 1024x1024 的 PNG 图片
2. 使用纯色背景 + 文字
3. 保存为 `assets/icon.png` 和 `assets/adaptive-icon.png`

---

## 📱 安装 APK

### 在 Android 设备上安装

1. **通过 USB 传输**：
   - 将 APK 文件复制到手机
   - 在手机上打开文件管理器
   - 点击 APK 文件安装
   - 允许"安装未知来源应用"

2. **通过 ADB 安装**：
   ```bash
   adb install app-debug.apk
   ```

3. **通过 GitHub Release**：
   - 从 GitHub Releases 页面下载 APK
   - 或从 GitHub Actions 工作流的 Artifacts 下载

### 允许安装未知来源应用

1. 进入 **设置** > **安全**
2. 开启 **未知来源** 或 **安装未知应用**
3. 选择允许的文件管理器或浏览器

---

## 🔧 常见问题

### 1. EAS Build 失败

- 检查 `app.json` 配置是否正确
- 确保图标文件存在
- 查看构建日志：`eas build:view`

### 2. APK 安装失败

- 检查 Android 版本兼容性
- 确保允许安装未知来源应用
- 卸载旧版本后再安装

### 3. 图标不显示

- 确保图标文件路径正确
- 图标尺寸必须符合要求
- 运行 `npx expo prebuild --clean` 重新生成

### 4. 应用名称显示不正确

- 检查 `app.json` 中的 `name` 字段
- Android 中可能需要设置 `android.label`

---

## 📝 签名 APK（发布到应用商店）

### GitHub Actions 自动签名

GitHub Actions 工作流会自动使用配置在 Secrets 中的密钥进行签名。配置方法见上面的"方法一：GitHub Actions 自动构建"部分。

### 本地构建签名

如果要在本地构建签名的 APK：

1. **生成签名密钥**：

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore qingbu-release-key.jks \
  -alias qingbu-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. **配置 Gradle 签名**（在 `android/app/build.gradle` 中）：

```gradle
android {
    signingConfigs {
        release {
            storeFile file('../../qingbu-release-key.jks')
            storePassword 'your-password'
            keyAlias 'qingbu-key-alias'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

⚠️ **注意**：
- 不要将密钥文件提交到 Git！
- 将 `qingbu-release-key.jks` 添加到 `.gitignore`

---

## 🚀 快速开始

### 使用 GitHub Actions 自动构建（推荐）

1. **配置签名密钥**（首次使用，见上面的说明）

2. **推送到 main 分支**：
   ```bash
   git push origin main
   ```

3. **等待构建完成**（15-25 分钟）：
   - 查看 GitHub Actions 工作流状态
   - 构建完成后在 Releases 页面下载 APK

### 使用 EAS Build（可选）

```bash
# 1. 安装 EAS CLI
npm install -g eas-cli

# 2. 登录
eas login

# 3. 配置
eas build:configure

# 4. 构建 APK
eas build --platform android --profile preview

# 5. 等待构建完成，下载 APK
```

构建通常需要 10-20 分钟，完成后会收到邮件通知。
