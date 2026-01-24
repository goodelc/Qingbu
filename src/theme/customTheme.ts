import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// 新的颜色系统 - Modern Financial Palette
const lightColors = {
  primary: '#4DB6AC', // 柔和青绿
  onPrimary: '#FFFFFF',
  primaryContainer: '#E0F2F1', // 浅青灰，用于汇总卡背景
  onPrimaryContainer: '#004D40',
  error: '#EF5350', // 柔和珊瑚红
  onError: '#FFFFFF',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  onSurface: '#1D1B20',
  onSurfaceVariant: '#49454F',
  outline: '#79747E',
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
  onSurface: '#E6E1E5',
  onSurfaceVariant: '#CAC4D0',
  outline: '#938F99',
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
