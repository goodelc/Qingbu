const fs = require('fs');
const path = require('path');

// 生成 SVG 图标
function generateIconSVG(size) {
  const bgColor = '#4CAF50'; // 绿色主题
  const textColor = '#FFFFFF';
  const fontSize = size * 0.35;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#66BB6A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.22}"/>
  <circle cx="${size * 0.5}" cy="${size * 0.35}" r="${size * 0.15}" fill="${textColor}" opacity="0.2"/>
  <text 
    x="50%" 
    y="58%" 
    font-family="Arial, 'Microsoft YaHei', sans-serif" 
    font-size="${fontSize}" 
    font-weight="bold" 
    fill="${textColor}" 
    text-anchor="middle" 
    dominant-baseline="middle"
    letter-spacing="2"
  >轻簿</text>
</svg>`;
}

// 使用 Sharp 将 SVG 转换为 PNG
async function generateIconPNG(size, outputPath) {
  try {
    const sharp = require('sharp');
    const svg = generateIconSVG(size);
    
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ 已生成图标: ${outputPath}`);
    return true;
  } catch (error) {
    console.warn('Sharp 库不可用，将生成 SVG 文件:', error.message);
    return false;
  }
}

// 生成启动画面 SVG
function generateSplashSVG(width, height) {
  const bgColor = '#4CAF50'; // 绿色主题
  const textColor = '#FFFFFF';
  const iconSize = Math.min(width, height) * 0.3;
  const centerX = width / 2;
  const centerY = height / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="splashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#66BB6A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#splashGrad)"/>
  
  <!-- 中心图标区域 -->
  <g transform="translate(${centerX}, ${centerY - iconSize * 0.3})">
    <!-- 图标背景圆 -->
    <circle cx="0" cy="0" r="${iconSize * 0.5}" fill="${textColor}" opacity="0.15"/>
    <circle cx="0" cy="0" r="${iconSize * 0.4}" fill="${textColor}" opacity="0.1"/>
    
    <!-- 应用名称 -->
    <text 
      x="0" 
      y="${iconSize * 0.6}" 
      font-family="Arial, 'Microsoft YaHei', sans-serif" 
      font-size="${iconSize * 0.5}" 
      font-weight="bold" 
      fill="${textColor}" 
      text-anchor="middle" 
      dominant-baseline="middle"
      letter-spacing="4"
    >轻簿</text>
    
    <!-- 副标题 -->
    <text 
      x="0" 
      y="${iconSize * 1.1}" 
      font-family="Arial, 'Microsoft YaHei', sans-serif" 
      font-size="${iconSize * 0.25}" 
      fill="${textColor}" 
      text-anchor="middle" 
      dominant-baseline="middle"
      opacity="0.9"
    >简洁的记账应用</text>
  </g>
</svg>`;
}

// 生成启动画面 PNG
async function generateSplashPNG(width, height, outputPath) {
  try {
    const sharp = require('sharp');
    const svg = generateSplashSVG(width, height);
    
    await sharp(Buffer.from(svg))
      .resize(width, height)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ 已生成启动画面: ${outputPath}`);
    return true;
  } catch (error) {
    console.warn('Sharp 库不可用，将生成 SVG 文件:', error.message);
    return false;
  }
}

// 主函数
async function main() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  
  // 确保 assets 目录存在
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  
  const iconSize = 1024;
  const iconPath = path.join(assetsDir, 'icon.png');
  const adaptiveIconPath = path.join(assetsDir, 'adaptive-icon.png');
  const splashPath = path.join(assetsDir, 'splash.png');
  
  console.log('开始生成图标和启动画面...\n');
  
  // 生成图标
  const pngSuccess = await generateIconPNG(iconSize, iconPath);
  
  if (!pngSuccess) {
    // 如果 PNG 生成失败，生成 SVG 作为备选
    console.log('生成 SVG 格式图标...');
    const svg = generateIconSVG(iconSize);
    fs.writeFileSync(iconPath.replace('.png', '.svg'), svg);
    fs.writeFileSync(adaptiveIconPath.replace('.png', '.svg'), svg);
    console.log('⚠️  已生成 SVG 图标，请手动转换为 PNG 格式');
    console.log('   可以使用在线工具: https://cloudconvert.com/svg-to-png');
    console.log('   或者安装 sharp: npm install --save-dev sharp');
  } else {
    // 生成自适应图标（与主图标相同）
    await generateIconPNG(iconSize, adaptiveIconPath);
  }
  
  // 生成启动画面 (1284x2778 是 iPhone 14 Pro Max 的尺寸，也适用于大多数设备)
  const splashWidth = 1284;
  const splashHeight = 2778;
  const splashSuccess = await generateSplashPNG(splashWidth, splashHeight, splashPath);
  
  if (!splashSuccess) {
    console.log('\n生成 SVG 格式启动画面...');
    const splashSvg = generateSplashSVG(splashWidth, splashHeight);
    fs.writeFileSync(splashPath.replace('.png', '.svg'), splashSvg);
    console.log('⚠️  已生成 SVG 启动画面，请手动转换为 PNG 格式');
  }
  
  console.log('\n✅ 所有文件生成完成！');
  console.log(`位置: ${assetsDir}`);
}

main().catch(console.error);
