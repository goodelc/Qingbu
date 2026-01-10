# 轻簿 (Qingbu) - APK 打包指南

## 📦 打包 APK 的两种方法

### 方法一：使用 EAS Build（推荐，简单快速）

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

### 方法二：本地构建（需要 Android Studio）

#### 前置要求

1. 安装 [Android Studio](https://developer.android.com/studio)
2. 配置 Android SDK
3. 设置环境变量：
   - `ANDROID_HOME` 指向 Android SDK 路径
   - 将 `platform-tools` 和 `tools` 添加到 PATH

#### 构建步骤

1. 生成原生项目：

```bash
npx expo prebuild
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

3. **通过二维码**（EAS Build）：
   - EAS Build 完成后会生成二维码
   - 用手机扫描即可下载安装

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

如果要发布到 Google Play，需要签名 APK：

1. 生成签名密钥：

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore qingbu-release-key.jks -alias qingbu-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. 配置签名（在 `app.json` 中）：

```json
{
  "expo": {
    "android": {
      "package": "com.qingbu.app",
      "signingConfig": {
        "release": {
          "keystore": "./qingbu-release-key.jks",
          "storePassword": "your-password",
          "keyAlias": "qingbu-key-alias",
          "keyPassword": "your-password"
        }
      }
    }
  }
}
```

⚠️ **注意**：不要将密钥文件提交到 Git！

---

## 🚀 快速开始

最简单的打包方式：

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
