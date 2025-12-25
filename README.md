# 轻簿 (Qingbu) - 简洁的本地记账应用

一个基于 React Native + Expo 开发的简洁、可扩展、纯本地存储的 Android 记账应用。

## 📱 功能特性

### 核心功能
- ✅ **记账记录管理**：支持收入和支出两种类型的记账
- ✅ **分类管理**：支持父子级分类系统，便于精细化管理
  - 支出分类：餐饮、交通、购物、娱乐、医疗、教育、住房、通讯、水电、服饰、日用品等
  - 收入分类：工资、奖金、投资、兼职、理财、礼金、退款等
  - 每个父分类支持多个子分类（如：交通 → 邮费、停车费、洗车费等）
- ✅ **月度汇总**：自动计算当月收入、支出和结余
- ✅ **数据持久化**：使用 SQLite 本地数据库，数据安全可靠
- ✅ **深色/浅色主题**：支持自动切换主题模式

### 界面特性
- 🎨 **现代简洁设计**：采用 Material Design 风格，接近原生 Android 体验
- 📱 **响应式布局**：适配各种 Android 屏幕尺寸
- 🔄 **自动刷新**：从编辑页面返回时自动刷新数据
- 🎯 **直观操作**：图标化分类选择，操作简单直观

## 🛠 技术栈

- **框架**：React Native 0.81.5
- **开发工具**：Expo SDK 54
- **语言**：TypeScript 5.9.2
- **UI 组件库**：react-native-paper 5.11.0
- **导航**：React Navigation v6
  - @react-navigation/native
  - @react-navigation/bottom-tabs
  - @react-navigation/native-stack
- **数据库**：expo-sqlite 16.0.10
- **状态管理**：Zustand 4.4.0
- **日期处理**：date-fns 2.30.0
- **图标**：@expo/vector-icons 15.0.3

## 📦 安装步骤

### 前置要求
- Node.js 18+ 
- npm 或 yarn
- Expo Go 应用（用于在手机上测试）

### 安装依赖

```bash
# 克隆项目（如果是从仓库克隆）
# git clone <repository-url>
# cd Qingbu

# 安装依赖
npm install

# 或者使用 yarn
yarn install
```

### 运行项目

```bash
# 启动开发服务器
npm start

# 或者使用 Expo CLI
npx expo start

# 在 Android 设备上运行
npm run android

# 在 iOS 设备上运行（需要 macOS）
npm run ios

# 在 Web 浏览器中运行
npm run web
```

### 使用 Expo Go 测试

1. 在手机上安装 [Expo Go](https://expo.dev/client) 应用
2. 运行 `npm start` 启动开发服务器
3. 使用 Expo Go 扫描终端中显示的二维码
4. 应用将在手机上加载

## 📂 项目结构

```
Qingbu/
├── src/
│   ├── assets/              # 静态资源（图标等）
│   ├── components/          # 通用 UI 组件
│   │   ├── AmountBadge.tsx  # 金额徽章组件
│   │   ├── MonthlySummaryCard.tsx  # 月度汇总卡片
│   │   └── RecordItem.tsx    # 记录项组件
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useDatabase.ts   # 数据库初始化 Hook
│   │   └── useRecords.ts    # 记录管理 Hook
│   ├── navigation/          # 导航配置
│   │   └── AppNavigator.tsx # 主导航器
│   ├── screens/             # 页面组件
│   │   ├── HomeScreen.tsx   # 首页（记录列表）
│   │   ├── AddRecordScreen.tsx  # 新增/编辑记录页
│   │   ├── StatsScreen.tsx # 统计页面（占位）
│   │   └── SettingsScreen.tsx   # 设置页面
│   ├── services/            # 数据层
│   │   └── DatabaseService.ts   # SQLite 数据库服务
│   ├── store/               # 状态管理
│   │   └── useAppStore.ts   # Zustand 全局状态
│   ├── types/               # TypeScript 类型定义
│   │   └── index.ts
│   └── utils/               # 工具函数
│       ├── constants.ts     # 常量定义（分类等）
│       └── formatters.ts    # 格式化函数
├── App.tsx                  # 应用入口
├── app.json                 # Expo 配置
├── package.json             # 项目依赖
└── tsconfig.json            # TypeScript 配置
```

## 🎯 使用指南

### 添加记账记录

1. 在首页点击右下角的 **+** 按钮
2. 输入金额
3. 选择类型（收入/支出）
4. 选择分类：
   - 如果分类有子分类，点击后会显示子分类列表
   - 选择子分类后完成分类选择
   - 如果分类没有子分类，直接选择即可
5. 选择日期（默认为今天）
6. 可选：添加备注
7. 点击 **保存** 按钮

### 编辑记录

1. 在首页点击要编辑的记录
2. 修改相关信息
3. 点击 **更新** 按钮保存修改

### 删除记录

1. 在首页点击记录右侧的删除图标
2. 确认删除操作

### 查看月度汇总

在首页顶部可以看到当月的：
- 收入总额
- 支出总额
- 结余（收入 - 支出）

## 🗄 数据库结构

### records 表

```sql
CREATE TABLE records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
  category TEXT NOT NULL,  -- 格式：'父分类' 或 '父分类/子分类'
  date INTEGER NOT NULL,  -- Unix 时间戳（毫秒）
  note TEXT
);
```

## 🔧 开发说明

### 分类系统

分类定义在 `src/utils/constants.ts` 中：

- `EXPENSE_CATEGORIES_WITH_SUBCATEGORIES`：支出分类及其子分类
- `INCOME_CATEGORIES_WITH_SUBCATEGORIES`：收入分类及其子分类

### 添加新分类

在 `src/utils/constants.ts` 中修改相应的分类对象：

```typescript
export const EXPENSE_CATEGORIES_WITH_SUBCATEGORIES = {
  // ... 现有分类
  新分类: ['子分类1', '子分类2', '其他'],
} as const;
```

### 数据导出

`DatabaseService` 中预留了 `exportToCSV()` 方法，可以扩展实现数据导出功能。

## 📝 待开发功能

- [ ] 统计图表页面
- [ ] 数据导出功能（CSV）
- [ ] 数据备份与恢复
- [ ] 多币种支持
- [ ] 预算管理
- [ ] 分类图标自定义

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目为私有项目。

## 📞 联系方式

如有问题或建议，请通过 Issue 反馈。

---

**注意**：本项目使用纯本地存储，所有数据存储在设备本地 SQLite 数据库中，不会上传到任何服务器。

