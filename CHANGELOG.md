# Changelog

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [1.1.0] - 2026-01-26

### Added
- 版本管理系统：基于 CHANGELOG.md 的版本管理流程
- 自动化版本脚本：支持 patch/minor/major 版本更新
- GitHub Actions 自动从 CHANGELOG.md 提取 Release 说明

### Changed
- 版本号来源统一为 CHANGELOG.md（单一真实来源）
- GitHub Actions 工作流：从 CHANGELOG.md 读取版本号和变更说明
- Release 说明直接从 CHANGELOG.md 中提取，保持与文档一致

## [1.0.0] - 2025-01-25

### Added
- 初始版本发布
- 记账记录管理：支持收入和支出两种类型的记账
- 分类管理：支持父子级分类系统
- 月度汇总：自动计算当月收入、支出和结余
- 数据持久化：使用 SQLite 本地数据库
- 深色/浅色主题：支持自动切换主题模式
- 现代简洁设计：采用 Material Design 风格

[Unreleased]: https://github.com/findmoons-organization/qingbu/compare/v1.1.0...HEAD
[1.0.0]: https://github.com/findmoons-organization/qingbu/releases/tag/v1.0.0

[1.1.0]: https://github.com/findmoons-organization/qingbu/releases/tag/v1.1.0