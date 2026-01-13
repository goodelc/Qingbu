# Expo Go 实体机连接故障排除指南

## 问题：远程下载失败

当在实体机上使用 Expo Go 时，如果出现"远程下载失败"或"无法在远程下载更新"的错误，请按照以下步骤排查：

## 解决方案

### 方案 1：使用 LAN 模式（推荐，同一网络）

如果您的手机和电脑在同一 Wi-Fi 网络下：

```bash
npm run start:lan
```

或者：

```bash
npx expo start --lan
```

**优点：**
- 速度快
- 不需要互联网连接
- 稳定可靠

**要求：**
- 手机和电脑必须在同一 Wi-Fi 网络
- 防火墙允许局域网连接

### 方案 2：使用 Tunnel 模式（不同网络或 LAN 失败时）

如果手机和电脑不在同一网络，或 LAN 模式失败：

```bash
npm run start:tunnel
```

或者：

```bash
npx expo start --tunnel
```

**优点：**
- 不需要同一网络
- 可以跨网络连接

**缺点：**
- 需要互联网连接
- 速度可能较慢
- 首次连接可能需要等待

### 方案 3：检查网络连接

1. **确保手机和电脑在同一网络**
   - 检查 Wi-Fi 名称是否一致
   - 某些路由器可能隔离了设备（访客网络等）

2. **检查防火墙设置**
   - Windows: 允许 Node.js 和 Expo 通过防火墙
   - Mac: 系统偏好设置 > 安全性与隐私 > 防火墙

3. **检查 IP 地址**
   - 运行 `npm run start:lan` 后，查看终端显示的 IP 地址
   - 确保手机可以访问该 IP（可以在手机浏览器中测试）

### 方案 4：手动输入 URL

如果二维码扫描失败：

1. 在 Expo Go 中点击"Enter URL manually"
2. 输入终端显示的 URL（例如：`exp://192.168.1.100:8081`）

### 方案 5：清除缓存

如果问题持续存在：

```bash
# 清除 Expo 缓存
npx expo start --clear

# 或使用 LAN 模式清除缓存
npx expo start --lan --clear
```

## 常见错误及解决方法

### 错误 1: "Unable to connect to Metro bundler"

**解决方法：**
- 确保开发服务器正在运行
- 检查终端是否有错误信息
- 尝试重启开发服务器

### 错误 2: "Network request failed"

**解决方法：**
- 检查网络连接
- 尝试使用 `--tunnel` 模式
- 检查防火墙设置

### 错误 3: "Download failed"

**解决方法：**
- 检查手机存储空间
- 确保手机有足够的网络流量
- 尝试清除 Expo Go 应用缓存（手机设置 > 应用 > Expo Go > 清除缓存）

## 快速检查清单

- [ ] 手机和电脑在同一 Wi-Fi 网络（LAN 模式）
- [ ] 防火墙允许连接
- [ ] 开发服务器正在运行
- [ ] 使用正确的启动命令（`start:lan` 或 `start:tunnel`）
- [ ] 手机有足够的存储空间
- [ ] 网络连接正常

## 推荐工作流程

1. **首次尝试：** 使用 `npm run start:lan`（最快）
2. **如果失败：** 尝试 `npm run start:tunnel`
3. **仍然失败：** 检查网络和防火墙设置
4. **清除缓存：** 使用 `--clear` 标志重启

## 错误："Networking has been disabled" / "offline-mode"

### 问题说明

如果看到以下消息：
```
Networking has been disabled
Dependency validation is unreliable in offline-mode
```

这表示 Expo CLI 检测到网络问题，进入了离线模式。常见原因：
- VPN 影响了网络检测
- 防火墙阻止了 Expo 的网络检查
- 代理设置问题

### 解决方案

#### 方案 1：清除环境变量（推荐）

在 PowerShell 中：

```powershell
$env:EXPO_OFFLINE=""
$env:CI=""
npm run start:lan
```

在 CMD 中：

```cmd
set EXPO_OFFLINE=
set CI=
npm run start:lan
```

这会清除可能导致离线模式的环境变量。

#### 方案 2：使用 Tunnel 模式（绕过网络检测）

```bash
npm run start:tunnel
```

Tunnel 模式会强制使用网络连接，通常可以解决这个问题。

#### 方案 3：检查环境变量

确保没有设置导致离线模式的变量：

```bash
# Windows PowerShell
$env:EXPO_OFFLINE=""
$env:CI=""

# Windows CMD
set EXPO_OFFLINE=
set CI=
```

#### 方案 4：清除缓存并重启

```bash
npx expo start --lan --clear
```

#### 方案 5：使用 Tunnel 模式（最可靠）

如果上述方法都不行，使用 Tunnel 模式：

```bash
npm run start:tunnel
```

Tunnel 模式会强制使用网络连接，不受 VPN 或网络检测影响。

## VPN 环境下的特殊处理

### 问题：电脑上运行了 VPN

VPN 可能导致以下问题：
- 改变网络路由，导致手机无法访问开发服务器
- 防火墙规则阻止本地连接
- IP 地址变化，导致连接失败

### 解决方案

#### 方案 A：暂时关闭 VPN（最简单）

1. 暂时关闭 VPN
2. 运行 `npm run start:lan`
3. 连接成功后可以重新开启 VPN（某些 VPN 支持本地网络例外）

#### 方案 B：配置 VPN 本地网络例外（推荐）

大多数 VPN 软件支持配置本地网络例外：

**Windows VPN 客户端：**
- 查找"本地网络"、"LAN"、"Split Tunneling" 或"路由"设置
- 添加本地 IP 段到例外列表（如：192.168.x.x, 10.x.x.x, 172.16.x.x）

**常见 VPN 设置位置：**
- ExpressVPN: 设置 > 网络保护 > 允许访问本地网络
- NordVPN: 设置 > 高级 > 允许本地网络访问
- 其他 VPN: 查找"Split Tunneling"或"本地网络"选项

#### 方案 C：使用 Tunnel 模式（绕过 VPN）

如果 VPN 无法配置例外，使用 Tunnel 模式：

```bash
npm run start:tunnel
```

Tunnel 模式通过 Expo 的服务器中转，可以绕过 VPN 限制。

#### 方案 D：使用 USB 连接（Android）

对于 Android 设备，可以使用 USB 连接：

1. 启用 USB 调试
2. 连接 USB 线
3. 运行：
   ```bash
   npx expo start --android
   ```

#### 方案 E：检查 VPN 的本地网络设置

1. **查看实际 IP 地址**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. **确认 VPN 是否改变了 IP**
   - 如果 VPN 开启后 IP 变成了 10.x.x.x 或其他段
   - 需要在 Expo Go 中使用这个新的 IP 地址

3. **手动指定 IP**
   ```bash
   npx expo start --lan --host <你的实际IP>
   ```

### VPN 环境下的推荐工作流程

1. **首选：** 配置 VPN 本地网络例外 + `npm run start:lan`
2. **备选：** 使用 `npm run start:tunnel`（较慢但可靠）
3. **临时：** 暂时关闭 VPN 进行开发

## 其他提示

- 如果经常遇到连接问题，考虑使用 EAS Build 构建独立应用
- 开发时建议使用 LAN 模式以获得最佳性能
- 如果使用 VPN，优先配置本地网络例外，避免频繁开关 VPN
