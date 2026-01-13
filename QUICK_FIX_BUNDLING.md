# 解决 "Bundling 100%" 卡住问题

## 问题：Expo Go 卡在 Bundling 100%

这表示 Metro bundler 已经完成打包，但 Expo Go 无法下载 bundle 文件。

## 快速解决方案

### 方案 1：使用 Tunnel 模式（最可靠，推荐）

1. **停止当前进程**（Ctrl+C）

2. **启动 Tunnel 模式**：
   ```bash
   npm run start:tunnel
   ```

3. **等待 Tunnel URL 生成**（可能需要 10-30 秒）

4. **在 Expo Go 中扫描新的二维码**

Tunnel 模式通过 Expo 服务器中转，可以绕过 VPN 和防火墙限制。

### 方案 2：检查并修复 LAN 连接

如果使用 LAN 模式：

1. **确认手机和电脑在同一 Wi-Fi**
   - 检查 Wi-Fi 名称是否一致
   - 某些路由器会隔离设备

2. **在手机浏览器中测试连接**
   - 打开手机浏览器
   - 访问：`http://你的电脑IP:8081`（例如：`http://192.168.1.7:8081`）
   - 如果无法访问，说明网络不通

3. **检查防火墙**
   - Windows: 允许 Node.js 通过防火墙
   - 临时关闭防火墙测试

### 方案 3：清除缓存重新打包

```bash
# 停止当前进程，然后运行：
npx expo start --lan --clear
```

### 方案 4：手动输入 URL

1. 在 Expo Go 中点击 "Enter URL manually"
2. 输入终端显示的完整 URL（例如：`exp://192.168.1.7:8081`）

### 方案 5：检查 VPN 设置

如果使用 VPN：

1. **暂时关闭 VPN** 测试连接
2. **或配置 VPN 本地网络例外**
3. **或使用 Tunnel 模式**（推荐，不受 VPN 影响）

## 推荐操作流程

1. **立即尝试**：`npm run start:tunnel`（最可靠）
2. **如果 Tunnel 也失败**：检查网络和防火墙
3. **清除缓存**：使用 `--clear` 重新打包

## 为什么 Tunnel 模式更可靠？

- ✅ 绕过 VPN 限制
- ✅ 绕过防火墙
- ✅ 不需要同一网络
- ✅ 通过 Expo 服务器中转，连接更稳定

## 注意事项

- Tunnel 模式首次连接可能需要等待 10-30 秒
- 如果 Tunnel 连接失败，检查是否能访问 expo.dev
- 某些企业网络可能阻止 Tunnel 连接
