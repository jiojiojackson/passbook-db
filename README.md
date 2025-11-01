# Passbook - 密码管理器

基于 Vue.js 和 Node.js 构建的安全密码管理应用，支持端到端加密存储和生物识别登录。

**在线演示：** https://passbook-db.vercel.app/login

## 目录

- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [WebAuthn 生物识别](#webauthn-生物识别)
- [二重认证](#二重认证)
- [API 接口](#api-接口)
- [安全机制](#安全机制)
- [部署指南](#部署指南)
- [常见问题](#常见问题)

---

## 核心功能

- **🔐 安全密码存储** - AES-256-CBC 加密，bcrypt 密码哈希
- **👤 用户认证系统** - JWT 身份验证 + 二重认证
- **🔑 WebAuthn 认证** - 指纹、面部识别等生物识别快速登录
- **📝 密码管理** - 完整的 CRUD 操作
- **🔍 高级搜索** - 支持 `&`（与）和 `|`（或）逻辑运算符
- **📄 分页显示** - 每页 5 条记录
- **📱 响应式设计** - 支持桌面和移动设备
- **⏱️ 智能会话管理** - 无操作自动登出，关闭浏览器自动清除

---

## 技术栈

**前端：** Vue.js 3 + Vue Router 4  
**后端：** Node.js + Express  
**数据库：** PostgreSQL  
**安全：** JWT + bcryptjs + AES-256-CBC + WebAuthn

**主要依赖：**
```json
{
  "vue": "^3.2.13",
  "express": "^4.19.2",
  "pg": "^8.13.3",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "ms": "^2.1.3"
}
```

---

## 快速开始

### 1. 安装

```bash
git clone <repository-url>
cd passbook-db
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
POSTGRES_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
TOKEN_TIME=1h
WEBAUTHN_INVITE_CODE=your-secure-invite-code
```

**生成加密密钥：**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. 初始化数据库

```sql
-- 用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 密码表
CREATE TABLE passwords (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url VARCHAR(500),
  username VARCHAR(255),
  password TEXT NOT NULL,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WebAuthn 凭证表
CREATE TABLE webauthn_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  transports TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- WebAuthn 挑战值表
CREATE TABLE webauthn_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);
```

### 4. 启动应用

```bash
npm run serve
```

访问 `http://localhost:8080`

---

## WebAuthn 生物识别

支持使用 Windows Hello、Touch ID、Face ID 等平台认证器快速登录。

### 使用流程

**绑定设备：**
1. 登录页面输入用户名和密码
2. 点击 "🔐 绑定 WebAuthn 设备"
3. 输入邀请码
4. 完成生物识别验证

**快速登录：**
1. 输入用户名（等待 0.5 秒自动检测）
2. 点击 "🔐 使用设备认证登录"
3. 完成生物识别即可登录（跳过二重认证）

**管理设备：**
- 登录后在 Dashboard 侧边栏查看已绑定设备
- 可删除不需要的设备

### 浏览器支持

Chrome 67+ | Firefox 60+ | Safari 13+ | Edge 18+

---

## 二重认证

基于数字匹配的二重认证系统，提供额外安全保护。

### 工作流程

1. 输入用户名和密码
2. 系统验证后生成 3 位随机数字
3. 在服务端应用（https://web-auth-five.vercel.app/admin）选择匹配数字
4. 客户端自动轮询验证（每 2 秒）
5. 认证成功后自动登录

**特性：** 5 分钟有效期 | 实时倒计时 | 可取消操作

---

## API 接口

### 认证相关

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/signup` | POST | 注册新用户 |
| `/api/login` | POST | 用户登录（支持二重认证） |
| `/api/refresh-token` | POST | 更新令牌活动时间 |
| `/api/validate-token` | POST | 验证令牌有效性 |

### 密码管理

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/passwords` | GET | 获取所有密码 |
| `/api/passwords` | POST | 添加新密码 |
| `/api/passwords` | PUT | 更新密码 |
| `/api/passwords?id=<id>` | DELETE | 删除密码 |

### WebAuthn

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/webauthn-check` | POST | 检查设备绑定状态 |
| `/api/webauthn-register` | POST | 注册/绑定设备 |
| `/api/webauthn-authenticate` | POST | WebAuthn 认证登录 |
| `/api/webauthn-manage` | GET | 获取已绑定设备 |
| `/api/webauthn-manage` | DELETE | 删除设备 |

**所有密码管理和 WebAuthn 接口需要在请求头携带 JWT token：**
```
Authorization: Bearer <token>
```

---

## 安全机制

### 会话管理

**关闭浏览器自动登出**
- 使用 `sessionStorage` 存储令牌
- 关闭标签页后自动清除
- 每个标签页独立会话

**无操作超时保护**
- JWT 令牌包含 `lastActivityTime` 字段
- 超过 `TOKEN_TIME` 无操作后自动登出
- 用户操作时自动更新活动时间（5 秒防抖）

**定期验证**
- 前端每 30 秒自动验证令牌有效性
- 令牌失效时自动跳转登录页

### TOKEN_TIME 配置

| 场景 | 推荐值 | 说明 |
|------|--------|------|
| 高安全性（企业） | `15m` - `30m` | 适合处理敏感信息 |
| 平衡（推荐） | `1h` - `2h` | 平衡安全性和体验 |
| 便利性优先 | `4h` - `8h` | 适合个人使用 |

### 数据加密

- **用户密码：** bcrypt 哈希（10 轮盐值）
- **密码条目：** AES-256-CBC 加密
- **数据库连接：** 强制 SSL
- **SQL 注入防护：** 参数化查询

---

## 部署指南

### Vercel 部署

1. **配置环境变量**

| 变量 | 说明 |
|------|------|
| `POSTGRES_URL` | PostgreSQL 连接字符串 |
| `JWT_SECRET` | JWT 签名密钥（至少 32 字符） |
| `ENCRYPTION_KEY` | AES-256 密钥（64 位十六进制） |
| `TOKEN_TIME` | 令牌过期时间（如 `1h`） |
| `WEBAUTHN_INVITE_CODE` | WebAuthn 邀请码 |

2. **部署步骤**
   - 登录 Vercel 控制台
   - 导入 GitHub 仓库
   - 添加环境变量
   - 点击 Deploy

### 本地开发

```bash
npm run serve     # 启动开发服务器（端口 8080）
npm run build     # 构建生产版本
npm run lint      # 代码检查
```

---

## 常见问题

### 基本功能

**Q: 如何重置密码？**  
A: 目前不支持密码重置，需联系管理员修改数据库。

**Q: 加密密钥丢失怎么办？**  
A: 加密密钥丢失将导致所有密码无法解密，请务必妥善保管。

**Q: 支持哪些浏览器？**  
A: 支持所有现代浏览器（Chrome、Firefox、Safari、Edge），不支持 IE 11。

### WebAuthn 相关

**Q: 为什么看不到 "使用设备认证登录" 按钮？**  
A: 需要先输入用户名并等待 0.5 秒，系统会自动检测是否有绑定设备。

**Q: WebAuthn 登录失败？**  
A: 可能原因：使用了不同设备、凭证已删除、浏览器不支持。解决方法：使用绑定时的同一设备，或使用传统登录方式。

**Q: 如何在多个设备上使用 WebAuthn？**  
A: 每个设备都需要单独绑定。

### 安全相关

**Q: 用户会频繁被登出吗？**  
A: 不会。只要用户在操作，系统会自动更新活动时间。只有完全无操作超过 TOKEN_TIME 才会登出。

**Q: 为什么关闭浏览器后需要重新登录？**  
A: 这是安全特性。使用 sessionStorage 存储令牌，关闭浏览器后自动清除，防止他人访问。

**Q: 多标签页使用不方便怎么办？**  
A: 这是 sessionStorage 的特性，也是安全性的体现。每个标签页需要单独登录，提供更好的安全隔离。

---

## 项目结构

```
passbook-db/
├── api/                          # 后端 API
│   ├── login.js                 # 登录（含二重认证）
│   ├── signup.js                # 注册
│   ├── passwords.js             # 密码 CRUD
│   ├── refresh-token.js         # 令牌刷新
│   ├── validate-token.js        # 令牌验证
│   ├── webauthn-register.js     # WebAuthn 注册
│   ├── webauthn-authenticate.js # WebAuthn 认证
│   ├── webauthn-check.js        # 检查设备状态
│   └── webauthn-manage.js       # 设备管理
├── src/
│   ├── components/              # Vue 组件
│   │   ├── LoginPage.vue        # 登录页面
│   │   ├── RegisterPage.vue     # 注册页面
│   │   ├── DashboardPage.vue    # 仪表板
│   │   ├── PasswordList.vue     # 密码列表
│   │   ├── PasswordForm.vue     # 密码表单
│   │   └── WebAuthnManager.vue  # 设备管理
│   ├── router/                  # 路由配置
│   ├── App.vue                  # 根组件
│   └── main.js                  # 入口文件
├── public/                      # 静态资源
├── package.json                 # 项目依赖
└── vue.config.js                # Vue 配置
```

---

## 数据库迁移

### 从 TOTP 认证迁移

如果从旧版本（TOTP 双因素认证）迁移：

```sql
-- 删除旧列
ALTER TABLE users DROP COLUMN IF EXISTS totp_secret;

-- 添加新列
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
```

**注意：** 现有用户需要重新注册，密码哈希无法从 TOTP secret 转换。

---

## 更新日志

### v2.0.0 (2024-11)

**新增：**
- ✅ WebAuthn 生物识别登录
- ✅ 设备绑定和管理
- ✅ 快速登录（跳过二重认证）

**安全增强：**
- ✅ 关闭浏览器后自动登出
- ✅ 无操作超时保护
- ✅ 活动时间精确追踪

**技术改进：**
- 使用 sessionStorage 替代 localStorage
- JWT 令牌包含 lastActivityTime
- 优化令牌刷新机制（5 秒防抖）

### v1.0.0 (2024)

- 用户注册和登录
- 密码加密存储
- 二重认证
- 密码 CRUD 操作
- 高级搜索和分页
- 从 TOTP 改为传统密码认证

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT License](LICENSE)
