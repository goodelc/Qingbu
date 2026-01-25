import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// 新的颜色系统 - Modern Financial Palette (Optimized by AI)
const lightColors = {
  primary: '#4DB6AC',
  onPrimary: '#FFFFFF',
  primaryContainer: '#E0F2F1',
  onPrimaryContainer: '#004D40',
  error: '#EF5350',
  onError: '#FFFFFF',
  background: '#FBFBFC', // 更加柔和的背景
  surface: '#FFFFFF',
  surfaceVariant: '#F1F3F4', // 增加浅灰色的辅助表面
  onSurface: '#1D1D1F', // 更深的文字色
  onSurfaceVariant: '#86868B', // 柔和的辅助文字色
  outline: '#E0E0E0', // 更细微的边框色
};

const darkColors = {
  primary: '#4DB6AC',
  onPrimary: '#00332C',
  primaryContainer: '#004D40',
  onPrimaryContainer: '#6FF9E8',
  error: '#EF5350',
  onError: '#690005',
  background: '#121212',
  surface: '#1E1E1E',
  surfaceVariant: '#2C2C2E',
  onSurface: '#E6E1E5',
  onSurfaceVariant: '#CAC4D0',
  outline: '#3A3A3C',
};

// 创建浅色主题
export const CustomLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};

// 创建深色主题
export const CustomDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
};
