# Passbook - 密码管理器

基于 Vue 3、Vite、Vercel Functions 和 PostgreSQL 的密码管理应用。

生产地址：https://passbook-db.vercel.app/login

支持密码条目增删改查、逻辑搜索、分页、数字匹配二重认证，以及 WebAuthn 设备注册和登录。

## 开发与验证

需要 Node.js 24 LTS（版本声明见 `.nvmrc` 和 `package.json`）。

```bash
npm ci
npm run dev       # 前端开发服务器 http://localhost:8080
npm run check     # ESLint、回归测试、生产构建
npm audit         # 检查全部依赖，包括开发依赖
```

`npm run dev` 仅提供前端。需要本地 API 时，使用已连接到原项目的 Vercel CLI 运行 `vercel dev`，并保持生产环境变量只存在于 Vercel。

## 环境变量

参考 `.env.example`，在原有 Vercel 项目的 Production 环境配置：

| 变量 | 说明 |
| --- | --- |
| `POSTGRES_URL` | 现有 PostgreSQL 数据库连接字符串；连接会验证服务端 TLS 证书 |
| `JWT_SECRET` | 强随机 JWT 签名密钥；仅供服务端使用 |
| `ENCRYPTION_KEY` | **保留现有值**：64 个十六进制字符，代表 32 字节 AES 密钥 |
| `TOKEN_TIME` | 会话和无操作超时时间，默认 `1h` |
| `WEBAUTHN_INVITE_CODE` | 绑定设备时使用的邀请码 |
| `APP_ORIGIN` | WebAuthn 的可信来源，默认 `https://passbook-db.vercel.app`；自定义域名时必须同步配置 |
| `POSTGRES_CA` | 可选；数据库使用私有 CA 时提供 PEM 格式证书 |

不要给服务端密钥添加 `VITE_` 前缀，也不要把真实环境变量提交到 Git。更换加密密钥会导致旧密码无法读取。

本地测试 WebAuthn 时，设置 `APP_ORIGIN=http://localhost:8080`（端口需与实际开发服务器一致）。预览域名和生产域名是不同的 WebAuthn 来源，生产凭证应在原生产域名上使用。

## 认证与数据保护

- 账号密码使用 bcrypt 哈希；新注册密码至少 8 位、最多 72 个 UTF-8 字节。
- 密码登录首先验证账号密码，再创建外部数字匹配认证会话。短期签名证明将账号、认证会话及一次性挑战绑定，验证完成后才签发访问令牌。
- 数字匹配认证依赖现有服务 `https://web-auth-five.vercel.app`，在其管理页面完成审批。
- WebAuthn 注册需要账号密码和邀请码，并验证浏览器的完整注册响应。登录校验设备签名、挑战、来源、RP ID、用户验证标记和计数器。
- WebAuthn 和二重认证挑战在 PostgreSQL 中保存，5 分钟内有效，并通过原子删除防止重放；临时证明不能作为密码库访问令牌。
- 所有受保护接口统一校验访问令牌的算法、签发者、用途、过期时间和最后活动时间；令牌保存在 `sessionStorage`。
- 新增或更新的密码条目使用 AES-256-GCM，认证数据绑定所属账号。旧 AES-256-CBC 条目仍可读取，编辑后按新格式写入。
- 加密在服务端完成，**并非端到端加密**；服务端需要持有加密密钥。
- 浏览器生成密码时使用 Web Crypto；敏感 API 响应禁止缓存；Vercel 配置包含 CSP 等安全响应头。

## 部署到原 Vercel 项目

仓库的 `master` 分支已关联 Vercel。推送经过验证的提交会触发原项目部署。`vercel.json` 明确指定 Vite、`npm ci`、`npm run build`、`dist` 输出目录以及前端路由。

保留原项目的数据库、环境变量和域名。现有安装无需数据库表结构迁移，无需重置用户或密码。此次认证令牌格式升级后，用户需要重新登录一次。已有 DER/SPKI 格式设备公钥会在内存中转换后验证，保留旧设备的签名登录兼容性。

如需手动部署，先将 Vercel CLI 连接到原 `passbook-db` 项目，再执行：

```bash
npm ci
npm run check
vercel --prod
```

部署后确认登录页面、前端静态资源、API 未授权响应，以及数据库连接正常；在原域名上完成一次真实设备登录和数字匹配认证。

## 数据库初始化（仅全新安装）

已部署的数据库不需要执行初始化或删除任何表。

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

## 接口

| 接口 | 方法 | 说明 |
| --- | --- | --- |
| `/api/signup` | POST | 注册 |
| `/api/login` | POST | 密码验证、二重认证开始/完成 |
| `/api/validate-token` | POST | 会话验证 |
| `/api/refresh-token` | POST | 会话刷新 |
| `/api/passwords` | GET / POST / PUT / DELETE | 当前用户的密码条目 |
| `/api/webauthn-check` | POST | 查询是否有绑定设备 |
| `/api/webauthn-register` | POST | 注册设备：`start` / `finish` |
| `/api/webauthn-authenticate` | POST | 设备登录：`start` / `finish` |
| `/api/webauthn-manage` | GET / DELETE | 当前用户的设备 |

密码条目、会话验证/刷新和设备管理接口通过 `Authorization: Bearer <token>` 认证。设备注册和登录的完成步骤使用开始步骤返回的 `ceremonyToken` 与完整的浏览器凭证响应。二重认证完成步骤使用开始步骤返回的 `loginProof` 与原 `sessionId`。

## 后续维护

GitHub Actions 在 `master` 推送和 Pull Request 时执行静态检查、回归测试、生产构建和全部依赖的漏洞扫描；CI 不需要生产密钥或数据库。Dependabot 每周检查 npm 和 Actions 更新。

2026-11 维护：迁移旧 Vue CLI 构建链至 Vite、移除未使用依赖、升级运行时与依赖、统一认证校验、完善 WebAuthn 和二重认证验证，并为旧数据兼容和认证失败路径添加回归测试。
