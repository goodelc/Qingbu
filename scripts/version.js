#!/usr/bin/env node

/**
 * 版本管理脚本
 * 
 * 功能：
 * 1. 从 CHANGELOG.md 读取最新版本号
 * 2. 根据参数（patch/minor/major）计算新版本号
 * 3. 更新 package.json 的 version 字段
 * 4. 更新 app.json 的 expo.version 字段
 * 5. 自动递增 app.json 的 android.versionCode
 * 6. 更新 CHANGELOG.md，将 [Unreleased] 改为具体版本号
 */

const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');
const APP_JSON_PATH = path.join(__dirname, '..', 'app.json');

// 解析版本号
function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0],
    minor: parts[1],
    patch: parts[2],
    toString: function() {
      return `${this.major}.${this.minor}.${this.patch}`;
    }
  };
}

// 计算新版本号
function bumpVersion(currentVersion, type) {
  const version = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      version.major += 1;
      version.minor = 0;
      version.patch = 0;
      break;
    case 'minor':
      version.minor += 1;
      version.patch = 0;
      break;
    case 'patch':
      version.patch += 1;
      break;
    default:
      throw new Error(`未知的版本类型: ${type}。请使用 patch、minor 或 major`);
  }
  
  return version.toString();
}

// 从 CHANGELOG.md 读取最新版本号
function getLatestVersionFromChangelog() {
  const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
  
  // 查找已发布的版本号（格式：## [x.y.z]）
  const versionMatch = changelog.match(/^## \[(\d+\.\d+\.\d+)\]/m);
  if (versionMatch) {
    return versionMatch[1];
  }
  
  // 如果没有找到已发布版本，从 package.json 读取
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
  return packageJson.version;
}

// 更新 CHANGELOG.md
function updateChangelog(newVersion) {
  const changelog = fs.readFileSync(CHANGELOG_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 将 [Unreleased] 替换为具体版本号和日期
  const updatedChangelog = changelog.replace(
    /^## \[Unreleased\]/m,
    `## [Unreleased]\n\n## [${newVersion}] - ${today}`
  );
  
  // 更新底部的链接
  const linkPattern = new RegExp(
    `\\[Unreleased\\]: https://github\\.com/[^/]+/[^/]+/compare/v[^\\s]+...HEAD`,
    'g'
  );
  const latestVersionLink = `[Unreleased]: https://github.com/findmoons-organization/qingbu/compare/v${newVersion}...HEAD`;
  const newVersionLink = `[${newVersion}]: https://github.com/findmoons-organization/qingbu/releases/tag/v${newVersion}`;
  
  let finalChangelog = updatedChangelog;
  
  // 如果已经有 [Unreleased] 链接，更新它
  if (linkPattern.test(finalChangelog)) {
    finalChangelog = finalChangelog.replace(linkPattern, latestVersionLink);
  } else {
    // 否则在文件末尾添加
    finalChangelog = finalChangelog.trim() + '\n\n' + latestVersionLink;
  }
  
  // 添加新版本的链接
  if (!finalChangelog.includes(`[${newVersion}]:`)) {
    finalChangelog = finalChangelog + '\n' + newVersionLink;
  }
  
  fs.writeFileSync(CHANGELOG_PATH, finalChangelog, 'utf-8');
  console.log(`✅ 已更新 CHANGELOG.md: [Unreleased] -> [${newVersion}]`);
}

// 更新 package.json
function updatePackageJson(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
  const oldVersion = packageJson.version;
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
  console.log(`✅ 已更新 package.json: ${oldVersion} -> ${newVersion}`);
}

// 更新 app.json
function updateAppJson(newVersion) {
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf-8'));
  const oldVersion = appJson.expo.version;
  const oldVersionCode = appJson.expo.android.versionCode;
  
  appJson.expo.version = newVersion;
  appJson.expo.android.versionCode = oldVersionCode + 1;
  
  fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 2) + '\n', 'utf-8');
  console.log(`✅ 已更新 app.json:`);
  console.log(`   version: ${oldVersion} -> ${newVersion}`);
  console.log(`   android.versionCode: ${oldVersionCode} -> ${appJson.expo.android.versionCode}`);
}

// 主函数
function main() {
  const versionType = process.argv[2];
  
  if (!versionType || !['patch', 'minor', 'major'].includes(versionType)) {
    console.error('❌ 错误: 请指定版本类型 (patch/minor/major)');
    console.error('用法: node scripts/version.js <patch|minor|major>');
    process.exit(1);
  }
  
  try {
    // 获取当前版本
    const currentVersion = getLatestVersionFromChangelog();
    console.log(`📦 当前版本: ${currentVersion}`);
    
    // 计算新版本
    const newVersion = bumpVersion(currentVersion, versionType);
    console.log(`🚀 新版本: ${newVersion} (${versionType})`);
    console.log('');
    
    // 更新所有文件
    updateChangelog(newVersion);
    updatePackageJson(newVersion);
    updateAppJson(newVersion);
    
    console.log('');
    console.log('✨ 版本号更新完成！');
    console.log('');
    console.log('下一步:');
    console.log('  1. 检查 CHANGELOG.md 中的变更说明是否完整');
    console.log('  2. 提交更改: git add CHANGELOG.md package.json app.json');
    console.log(`  3. 创建提交: git commit -m "chore: bump version to ${newVersion}"`);
    console.log('  4. 推送到仓库: git push');
    
  } catch (error) {
    console.error('❌ 错误:', error.message);
    process.exit(1);
  }
}

main();
