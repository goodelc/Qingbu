import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 配置信息
const GITHUB_OWNER = 'goodelc';
const GITHUB_REPO = 'Qingbu';
// 请替换为你部署的 Cloudflare Worker 地址
const PROXY_BASE_URL = 'https://raspy-queen-b166.custelc.workers.dev'; 

export interface UpdateInfo {
  version: string;
  description: string;
  downloadUrl: string;
  pubDate: string;
}

class UpdateService {
  /**
   * 检查是否有新版本
   */
  async checkUpdate(): Promise<UpdateInfo | null> {
    try {
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      console.log('[UpdateService] 开始检查更新，当前版本:', currentVersion);
      // 直接请求 GitHub API 获取版本信息
      const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
      console.log('[UpdateService] 请求URL:', apiUrl);
      
      // 直接请求 GitHub API
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Qingbu-Updater', // GitHub API 要求必须有 User-Agent 头
        }
      });

      console.log('[UpdateService] 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        let errorText = '';
        let errorData: any = null;
        
        try {
          errorText = await response.text();
          // 尝试解析为JSON
          try {
            errorData = JSON.parse(errorText);
            console.error('[UpdateService] 错误响应数据:', errorData);
          } catch {
            // 如果不是JSON，直接使用文本
            console.error('[UpdateService] 错误响应文本:', errorText);
          }
        } catch {
          errorText = '无法读取错误信息';
        }

        // 检测速率限制错误
        if (response.status === 403 || 
            (errorData?.message && errorData.message.includes('rate limit'))) {
          const rateLimitError = new Error('API速率限制已超出，请稍后再试');
          (rateLimitError as any).isRateLimit = true;
          (rateLimitError as any).originalMessage = errorData?.message || errorText;
          console.error('[UpdateService] GitHub API速率限制:', errorData?.message || errorText);
          throw rateLimitError;
        }

        console.error('[UpdateService] 请求失败:', response.status, errorText);
        throw new Error(`检查更新失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[UpdateService] 获取到最新版本信息:', {
        tag_name: data.tag_name,
        published_at: data.published_at,
        assets_count: data.assets?.length || 0
      });

      const latestVersion = data.tag_name.replace('v', '');
      console.log('[UpdateService] 版本比对 - 最新版本:', latestVersion, '当前版本:', currentVersion);

      // 版本比对
      const comparison = this.compareVersions(latestVersion, currentVersion);
      console.log('[UpdateService] 版本比对结果:', comparison > 0 ? '有新版本' : '已是最新版本');

      if (comparison > 0) {
        // 查找 APK 资产
        const apkAsset = data.assets.find((asset: any) => asset.name.endsWith('.apk'));
        console.log('[UpdateService] 查找APK资产:', apkAsset ? apkAsset.name : '未找到');
        
        if (!apkAsset) {
          console.warn('[UpdateService] 未找到APK资产，返回null');
          return null;
        }

        // 使用 Worker 的 /download 端点作为代理服务器，通过 Cloudflare CDN 加速下载
        // 将 GitHub 的下载 URL 作为查询参数传给 Worker
        const downloadUrl = `${PROXY_BASE_URL}/download?url=${encodeURIComponent(apkAsset.browser_download_url)}`;
        
        console.log('[UpdateService] APK下载链接（通过Worker代理）:', downloadUrl);
        console.log('[UpdateService] GitHub原始下载URL:', apkAsset.browser_download_url);

        const updateInfo = {
          version: data.tag_name,
          description: data.body,
          downloadUrl: downloadUrl,
          pubDate: data.published_at,
        };
        console.log('[UpdateService] 发现新版本:', updateInfo.version, '下载URL:', updateInfo.downloadUrl);
        return updateInfo;
      }

      console.log('[UpdateService] 当前已是最新版本');
      return null;
    } catch (error) {
      console.error('[UpdateService] 检查更新失败:', error);
      if (error instanceof Error) {
        console.error('[UpdateService] 错误详情:', error.message, error.stack);
        // 如果是速率限制错误，保留错误信息以便上层处理
        if ((error as any).isRateLimit) {
          // 重新抛出以便SettingsScreen可以显示特定错误
          throw error;
        }
      }
      return null;
    }
  }

  /**
   * 下载并安装 APK (仅限 Android)
   */
  async downloadAndInstall(
    downloadUrl: string, 
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (Platform.OS !== 'android') {
      console.log('[UpdateService] 非Android平台，跳过下载安装');
      return;
    }

    try {
      console.log('[UpdateService] 开始下载APK:', downloadUrl);
      const filename = 'qingbu_update.apk';
      const documentDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory;
      if (!documentDir) {
        console.error('[UpdateService] 文件系统目录不可用');
        throw new Error('File system directory not available');
      }
      const fileUri = `${documentDir}${filename}`;
      console.log('[UpdateService] 保存路径:', fileUri);

      // 1. 开始下载
      console.log('[UpdateService] 创建下载任务...');
      const downloadResumable = FileSystem.createDownloadResumable(
        downloadUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          console.log('[UpdateService] 下载进度:', Math.round(progress * 100) + '%', 
            `(${downloadProgress.totalBytesWritten}/${downloadProgress.totalBytesExpectedToWrite} bytes)`);
          onProgress?.(progress);
        }
      );

      console.log('[UpdateService] 开始下载...');
      const result = await downloadResumable.downloadAsync();
      if (!result) {
        console.error('[UpdateService] 下载失败: result为空');
        throw new Error('Download failed');
      }
      console.log('[UpdateService] 下载完成:', result.uri);

      // 2. 调起安装
      console.log('[UpdateService] 获取Content URI...');
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      console.log('[UpdateService] Content URI:', contentUri);
      
      console.log('[UpdateService] 启动安装程序...');
      await IntentLauncher.startActivityAsync('android.intent.action.INSTALL_PACKAGE', {
        data: contentUri,
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      });
      console.log('[UpdateService] 安装程序已启动');
    } catch (error) {
      console.error('[UpdateService] 下载或安装失败:', error);
      if (error instanceof Error) {
        console.error('[UpdateService] 错误详情:', error.message, error.stack);
      }
      throw error;
    }
  }

  /**
   * 版本比对逻辑
   * 返回 > 0 表示 v1 > v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }
}

export const updateService = new UpdateService();
