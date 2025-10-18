# 更新日志

## 2024 - 认证方式更新

### 主要变更

将应用的登录认证方式从 **TOTP 双因素认证** 改为 **传统的用户名+密码** 认证方式。

### 修改的文件

#### 后端 API
- `api/login.js` - 使用 bcrypt 验证密码替代 TOTP token 验证
- `api/signup.js` - 注册时保存密码哈希替代生成 TOTP secret

#### 前端组件
- `src/components/LoginPage.vue` - 移除 TOTP 输入框，添加密码输入框
- `src/components/RegisterPage.vue` - 移除二维码显示，添加密码和确认密码输入框

#### 依赖更新
- `package.json` - 移除 `speakeasy` 和 `qrcode` 依赖

### 安装和运行

1. 安装更新后的依赖：
```bash
npm install
```

2. 更新数据库结构（参考 DATABASE_MIGRATION.md）

3. 运行应用：
```bash
npm run serve
```

### 功能说明

- **注册**：用户输入用户名、密码和确认密码
- **登录**：用户输入用户名和密码
- **密码要求**：最少 6 位字符
- **安全性**：使用 bcrypt 进行密码哈希存储
