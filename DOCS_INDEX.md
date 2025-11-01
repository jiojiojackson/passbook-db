# 文档索引

本项目的完整文档列表和说明。

## 主要文档

### 📖 [README.md](README.md)
项目主文档，包含：
- 功能概述
- 技术栈说明
- 安装和部署指南
- API 接口文档
- 常见问题

### 🔐 [WEBAUTHN_DEPLOYMENT.md](WEBAUTHN_DEPLOYMENT.md)
WebAuthn 认证功能完整指南，包含：
- 部署步骤（数据库迁移、环境变量配置）
- 使用场景和流程
- 常见问题与故障排除
- 技术细节和 API 说明
- 浏览器兼容性

### 🔑 [TWO_FACTOR_AUTH.md](TWO_FACTOR_AUTH.md)
二重认证功能说明，包含：
- 工作原理
- 使用流程
- 技术实现

## 数据库相关

### 📊 [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md)
数据库迁移指南（从 TOTP 到数字匹配认证）

### 📊 [DATABASE_WEBAUTHN_MIGRATION.md](DATABASE_WEBAUTHN_MIGRATION.md)
WebAuthn 数据库表创建脚本

## 其他文档

### 📝 [CHANGELOG.md](CHANGELOG.md)
版本更新历史

### 🚀 [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
部署检查清单

### 🔒 [SECURITY.md](SECURITY.md)
安全相关说明

### 📋 [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)
重要变更摘要

### 🚀 [QUICK_START.md](QUICK_START.md)
快速开始指南

### 📈 [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md)
升级指南

## 测试工具

### 🧪 [test-webauthn.html](test-webauthn.html)
WebAuthn 功能测试页面，可以：
- 检测浏览器支持情况
- 测试设备绑定流程
- 测试 WebAuthn 认证

## 快速导航

### 我想...

**部署项目**
→ 阅读 [README.md](README.md) 的"安装和运行"章节

**使用 WebAuthn 功能**
→ 阅读 [WEBAUTHN_DEPLOYMENT.md](WEBAUTHN_DEPLOYMENT.md) 的"使用场景"章节

**解决 WebAuthn 问题**
→ 阅读 [WEBAUTHN_DEPLOYMENT.md](WEBAUTHN_DEPLOYMENT.md) 的"常见问题与故障排除"章节

**配置环境变量**
→ 阅读 [README.md](README.md) 的"Vercel 部署配置"章节

**了解 API 接口**
→ 阅读 [README.md](README.md) 的"API 接口"章节

**迁移数据库**
→ 阅读 [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) 或 [DATABASE_WEBAUTHN_MIGRATION.md](DATABASE_WEBAUTHN_MIGRATION.md)

**测试 WebAuthn**
→ 在浏览器中打开 [test-webauthn.html](test-webauthn.html)

## 文档维护

- 主要文档：`README.md`、`WEBAUTHN_DEPLOYMENT.md`
- 保持更新：版本更新时同步更新 `CHANGELOG.md`
- 简洁原则：避免重复内容，使用引用链接
