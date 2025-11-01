# Passbook - 密码管理器

Passbook 是一个基于 Vue.js 和 Node.js 构建的安全密码管理应用。它允许用户通过端到端加密安全地存储、检索和管理凭据信息。

## 在线演示
https://passbook-db.vercel.app/login

## 核心功能

- **安全密码存储**：所有密码在存储到数据库前使用 AES-256-CBC 加密
- **用户认证系统**：完整的注册/登录系统，支持 JWT 身份验证
- **二重认证**：集成基于数字匹配的二重认证，增强账户安全性
- **密码管理**：支持密码条目的创建、读取、更新和删除（CRUD）操作
- **高级搜索**：支持多关键词搜索，可使用 `&`（与）和 `|`（或）逻辑运算符
- **分页显示**：密码列表支持分页浏览，提升大量数据的管理体验
- **响应式设计**：基于 Vue.js 构建的现代化用户界面，支持桌面和移动设备
- **自动令牌刷新**：智能的 JWT 令牌刷新机制，保持用户会话活跃

## 技术栈

### 前端
- **Vue.js 3**：渐进式 JavaScript 框架
- **Vue Router 4**：官方路由管理器
- **现代 JavaScript (ES6+)**：使用最新的 JavaScript 特性

### 后端
- **Node.js + Express**：轻量级 Web 服务器框架
- **PostgreSQL**：关系型数据库，存储用户和密码数据
- **JWT (jsonwebtoken)**：无状态身份验证
- **bcryptjs**：密码哈希加密
- **crypto**：AES-256 加密算法实现

### 安全特性
- **AES-256-CBC 加密**：所有存储的密码都经过强加密
- **JWT 令牌认证**：支持自动刷新机制
- **bcrypt 密码哈希**：使用 10 轮盐值加密用户密码
- **二重认证**：基于数字匹配的额外安全层
- **环境变量隔离**：敏感信息通过环境变量管理

## 安装和运行

### 1. 克隆仓库
```bash
git clone <repository-url>
cd passbook-db
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
在项目根目录创建 `.env` 文件，配置以下环境变量：

```env
POSTGRES_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-here
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
TOKEN_TIME=1h
```

**环境变量说明：**
- `POSTGRES_URL`：PostgreSQL 数据库连接字符串
- `JWT_SECRET`：JWT 令牌签名密钥（建议使用强随机字符串）
- `ENCRYPTION_KEY`：AES-256 加密密钥（必须是 64 位十六进制字符串）
- `TOKEN_TIME`：JWT 令牌过期时间（如 `1h`、`7d`）

### 4. 初始化数据库
执行以下 SQL 语句创建必要的数据表：

```sql
-- 创建用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建密码表
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
```

### 5. 启动开发服务器
```bash
npm run serve
```

应用将在 `http://localhost:8080` 启动。

## API 接口

### 认证相关
- `POST /api/signup` - 注册新用户
  - 请求体：`{ username, password }`
  - 返回：注册成功消息

- `POST /api/login` - 用户登录（支持二重认证）
  - 第一阶段：`{ username, password }` → 返回二重认证信息
  - 第二阶段：`{ username, password, sessionId }` → 返回 JWT token

- `POST /api/refresh-token` - 刷新访问令牌
  - 请求头：`Authorization: Bearer <token>`
  - 返回：新的 JWT token

- `POST /api/validate-token` - 验证令牌有效性
  - 请求头：`Authorization: Bearer <token>`
  - 返回：令牌验证结果

### 密码管理
- `GET /api/passwords` - 获取用户所有密码
- `POST /api/passwords` - 添加新密码
- `PUT /api/passwords` - 更新密码
- `DELETE /api/passwords?id=<id>` - 删除密码

所有密码管理接口都需要在请求头中携带有效的 JWT token。

## 二重认证功能

本应用集成了基于数字匹配的二重认证系统，提供额外的安全保护层。

### 工作流程
1. 用户输入用户名和密码
2. 系统验证账号密码正确性
3. 创建认证会话，生成 3 位随机数字
4. 用户在服务端应用（https://web-auth-five.vercel.app/admin）中选择匹配的数字
5. 客户端自动轮询验证状态
6. 认证成功后自动登录

### 特性
- **时效性**：认证会话 5 分钟后自动过期
- **自动轮询**：每 2 秒自动检查认证状态
- **实时倒计时**：显示剩余认证时间
- **可取消操作**：支持取消认证并重新登录

详细说明请参考 [TWO_FACTOR_AUTH.md](TWO_FACTOR_AUTH.md)

## 高级功能

### 搜索功能
支持多关键词搜索，可使用逻辑运算符：
- **与运算**：使用 `&` 分隔关键词（如：`google & work`）
- **或运算**：使用 `|` 分隔关键词（如：`github | gitlab`）
- 搜索范围：URL、用户名、备注

### 分页功能
- 每页显示 5 条密码记录
- 支持上一页/下一页导航
- 搜索结果自动重置到第一页

### 令牌管理
- 自动刷新机制：避免频繁刷新（最小间隔 1 分钟）
- 定期验证：每 30 秒检查令牌有效性
- 失效自动跳转：令牌失效时自动跳转到登录页

## Vercel 部署配置

### 环境变量配置

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `POSTGRES_URL` | PostgreSQL 数据库连接字符串 | `postgresql://user:password@host:5432/database` |
| `JWT_SECRET` | JWT 令牌签名密钥 | `your-super-secret-jwt-key-here` |
| `ENCRYPTION_KEY` | AES-256 加密密钥（64 位十六进制） | `0123...abcdef`（64 字符） |
| `TOKEN_TIME` | JWT 令牌过期时间 | `1h` 或 `7d` |

### 生成加密密钥

```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 使用 OpenSSL
openssl rand -hex 32
```

### 部署步骤

1. 登录 [Vercel 控制台](https://vercel.com)
2. 导入 GitHub 仓库
3. 进入 Settings → Environment Variables
4. 添加上述所有环境变量
5. 选择适用环境（Production / Preview / Development）
6. 点击 Deploy 部署项目

## 开发命令

```bash
npm run serve     # 启动开发服务器（默认端口 8080）
npm run build     # 构建生产版本
npm run lint      # 代码检查和自动修复
```

## 项目结构

```
passbook-db/
├── api/                      # 后端 API 接口
│   ├── login.js             # 登录接口（含二重认证）
│   ├── signup.js            # 注册接口
│   ├── passwords.js         # 密码管理 CRUD
│   ├── refresh-token.js     # 令牌刷新
│   └── validate-token.js    # 令牌验证
├── src/
│   ├── components/          # Vue 组件
│   │   ├── LoginPage.vue    # 登录页面
│   │   ├── RegisterPage.vue # 注册页面
│   │   ├── DashboardPage.vue # 仪表板
│   │   ├── PasswordList.vue # 密码列表
│   │   └── PasswordForm.vue # 密码表单
│   ├── router/              # 路由配置
│   ├── App.vue              # 根组件
│   └── main.js              # 入口文件
├── public/                  # 静态资源
├── package.json             # 项目依赖
└── vue.config.js            # Vue 配置
```

## 安全考虑

### 数据加密
- **密码存储**：用户密码使用 bcrypt 哈希（10 轮盐值）
- **敏感数据**：所有密码条目使用 AES-256-CBC 加密
- **加密密钥**：通过环境变量管理，不提交到代码仓库

### 身份验证
- **JWT 令牌**：无状态身份验证，支持自动刷新
- **二重认证**：额外的数字匹配验证层
- **令牌验证**：定期检查令牌有效性

### 数据库安全
- **SQL 注入防护**：使用参数化查询
- **级联删除**：用户删除时自动清理关联密码
- **SSL 连接**：数据库连接强制使用 SSL

### 前端安全
- **路由守卫**：未认证用户自动跳转到登录页
- **本地存储**：仅存储 JWT token，不存储敏感信息
- **自动登出**：令牌失效时自动清理会话

## 数据库迁移

如果从旧版本（TOTP 认证）迁移，请参考 [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md)

## 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解版本更新历史

## 常见问题

### 1. 如何重置密码？
目前不支持密码重置功能，如需重置请联系管理员直接修改数据库。

### 2. 加密密钥丢失怎么办？
加密密钥丢失将导致所有已存储的密码无法解密，请务必妥善保管。

### 3. 支持哪些浏览器？
支持所有现代浏览器（Chrome、Firefox、Safari、Edge），不支持 IE 11。

### 4. 可以导出密码吗？
目前不支持批量导出功能，可通过 API 接口获取解密后的密码数据。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

[MIT License](LICENSE) 