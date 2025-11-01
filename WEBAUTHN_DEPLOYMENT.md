# WebAuthn 认证功能完整指南

本文档包含 WebAuthn 功能的部署、使用和故障排除的完整说明。

## 功能概述

为密码管理器添加了 WebAuthn（Web 认证）功能，支持使用平台认证器（Windows Hello、Touch ID、Face ID）或外部安全密钥进行快速登录。

**核心特性：**
- ✅ 设备绑定 - 通过邀请码绑定可信设备
- ✅ 快速登录 - 已绑定设备可跳过二重认证
- ✅ 向后兼容 - 保留原有登录方式
- ✅ 设备管理 - 在 Dashboard 中管理已绑定设备

---

## 快速部署步骤

### 1. 数据库迁移

连接到你的 PostgreSQL 数据库，执行以下 SQL：

```sql
-- 创建 WebAuthn 凭证表
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  transports TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 创建 WebAuthn 挑战值临时表
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);
```

### 2. 配置环境变量

在 Vercel 项目设置中添加：

```
WEBAUTHN_INVITE_CODE=your_secure_random_code_here
```

**重要提示**：
- 使用强随机字符串（建议至少 32 字符）
- 妥善保管邀请码，只分享给可信用户
- 可以使用在线工具生成：`openssl rand -base64 32`

### 3. 部署代码

提交并推送代码到 Git 仓库，Vercel 会自动部署。

新增的文件：
- `api/webauthn-register.js` - 设备注册 API
- `api/webauthn-authenticate.js` - WebAuthn 认证 API
- `api/webauthn-check.js` - 检查设备绑定状态 API
- `api/webauthn-manage.js` - 管理已绑定设备 API
- `src/components/WebAuthnManager.vue` - 设备管理组件

修改的文件：
- `src/components/LoginPage.vue` - 添加 WebAuthn 登录和绑定功能
- `src/components/DashboardPage.vue` - 集成设备管理组件

### 4. 验证部署

1. 访问登录页面
2. 输入用户名，检查是否显示 WebAuthn 相关按钮
3. 尝试绑定设备（需要邀请码）
4. 测试 WebAuthn 登录功能

## 登录界面说明

### 按钮布局

**登录表单内：**
- **"🔐 使用设备认证登录"** - 输入用户名后，如果检测到已绑定设备会自动显示
- **"登录"** - 传统的账号密码 + 二重认证方式

**底部按钮：**
- **"还没有账号？点击注册"** - 跳转到注册页面
- **"🔐 绑定 WebAuthn 设备"** - 始终显示，点击进入设备绑定流程

### 自动检测机制

- 输入用户名后，系统会自动检测该用户是否有绑定设备（500ms 防抖）
- 如果检测到已绑定设备，会显示 "🔐 使用设备认证登录" 按钮
- 检测过程在后台进行，不影响正常登录

---

## 使用场景

### 场景 1：首次绑定设备

1. 在登录页面输入用户名和密码（不要点击登录）
2. 点击底部的 **"🔐 绑定 WebAuthn 设备"** 按钮
3. 在绑定页面输入邀请码（从管理员处获取）
4. 点击 **"开始绑定"** 按钮
5. 按照浏览器提示完成生物识别（指纹、面部识别等）
6. 绑定成功后显示提示信息

**注意：** 如果没有先输入用户名和密码，绑定页面会显示警告提示

### 场景 2：使用 WebAuthn 登录

1. 在登录页面输入用户名
2. 等待 0.5 秒，系统自动检测是否有绑定设备
3. 如果检测到已绑定设备，会显示 **"🔐 使用设备认证登录"** 按钮
4. 点击该按钮
5. 按照浏览器提示完成生物识别
6. 自动登录成功，跳过二重认证

### 场景 3：传统登录（未绑定设备或不使用 WebAuthn）

1. 输入用户名和密码
2. 点击 **"登录"** 按钮
3. 完成二重认证流程
4. 登录成功

**说明：** 即使已绑定设备，仍可使用传统方式登录

### 场景 4：管理已绑定设备

1. 登录后在 Dashboard 页面
2. 打开右侧边栏（点击"展开"按钮）
3. 滚动到 **"🔐 已绑定的设备"** 区域
4. 查看设备列表（显示设备 ID、绑定时间、最后使用时间）
5. 点击 **"删除"** 按钮可以移除不需要的设备

## 安全建议

1. **邀请码管理**
   - 定期更换邀请码
   - 不要在公开场合分享
   - 可以为不同用户组设置不同的邀请码

2. **设备管理**
   - 定期检查绑定的设备列表
   - 删除不再使用的设备
   - 设备丢失时立即删除相关凭证

3. **HTTPS 要求**
   - WebAuthn 必须在 HTTPS 环境下使用
   - 本地开发可使用 localhost
   - 生产环境必须配置 SSL 证书

4. **备用登录方式**
   - 始终保留传统登录方式
   - 确保用户在 WebAuthn 不可用时仍能登录

## 常见问题与故障排除

### Q1: 为什么看不到 "使用设备认证登录" 按钮？

**可能原因：**
- 还没有输入用户名
- 用户名输入后等待时间不够（需要 0.5 秒）
- 该用户还没有绑定设备
- 网络请求失败

**解决方法：**
- 输入用户名后等待 1 秒
- 检查浏览器控制台是否有错误
- 确认该用户已经绑定过设备

### Q2: 绑定设备时提示 "请先输入用户名和密码"？

**原因：** 需要先在登录页面输入用户名和密码，然后再点击"绑定 WebAuthn 设备"按钮。

**解决方法：**
1. 返回登录页面
2. 输入用户名和密码（不要点击登录）
3. 再次点击"绑定 WebAuthn 设备"

### Q3: 绑定失败，提示 "邀请码无效"？

**原因：** 邀请码不正确或未配置。

**解决方法：**
- 联系管理员获取正确的邀请码
- 检查服务器环境变量 `WEBAUTHN_INVITE_CODE` 是否已配置

### Q4: WebAuthn 登录失败？

**可能原因：**
- 使用了不同的设备（WebAuthn 凭证绑定到特定设备）
- 凭证已被删除
- 浏览器不支持 WebAuthn
- 挑战值过期

**解决方法：**
- 使用绑定时的同一设备
- 重新绑定设备
- 使用传统登录方式
- 检查浏览器控制台错误信息

### Q5: 如何在多个设备上使用 WebAuthn？

**答案：** 每个设备都需要单独绑定。

**步骤：**
1. 在设备 A 上完成一次绑定
2. 在设备 B 上再完成一次绑定
3. 每个设备都可以独立使用 WebAuthn 登录
4. 在 Dashboard 中可以看到所有已绑定的设备

### Q6: WebAuthn 不可用怎么办？

**检查清单：**
- ✅ 浏览器版本是否支持（Chrome 67+, Firefox 60+, Safari 13+, Edge 18+）
- ✅ 网站是否使用 HTTPS（或 localhost）
- ✅ 设备是否有可用的认证器（指纹识别、面部识别等）

**备用方案：**
- 始终可以使用传统的账号密码 + 二重认证方式登录

## 浏览器兼容性

| 浏览器 | 最低版本 | 平台认证器 | 外部密钥 |
|--------|----------|------------|----------|
| Chrome | 67+ | ✅ | ✅ |
| Firefox | 60+ | ✅ | ✅ |
| Safari | 13+ | ✅ | ✅ |
| Edge | 18+ | ✅ | ✅ |

## 清理过期挑战值

建议定期执行以下 SQL 清理过期的挑战值：

```sql
DELETE FROM webauthn_challenges WHERE expires_at < NOW();
```

可以设置 Cron Job 每小时执行一次。

## 技术细节

### API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/webauthn-check` | POST | 检查用户是否有绑定设备 |
| `/api/webauthn-register` | POST | 注册/绑定设备（需要邀请码） |
| `/api/webauthn-authenticate` | POST | WebAuthn 认证登录 |
| `/api/webauthn-manage` | GET | 获取用户的所有绑定设备 |
| `/api/webauthn-manage` | DELETE | 删除指定的绑定设备 |

### 数据库表结构

**webauthn_credentials 表：**
```sql
- id: 主键
- user_id: 用户 ID（外键）
- credential_id: 凭证 ID（唯一）
- public_key: 公钥
- counter: 签名计数器
- transports: 传输方式（JSON）
- created_at: 创建时间
- last_used_at: 最后使用时间
```

**webauthn_challenges 表：**
```sql
- id: 主键
- user_id: 用户 ID（外键）
- challenge: 挑战值
- expires_at: 过期时间（5分钟）
- created_at: 创建时间
```

### 新增和修改的文件

**后端 API：**
- `api/webauthn-register.js` - 设备注册端点
- `api/webauthn-authenticate.js` - WebAuthn 认证端点
- `api/webauthn-check.js` - 检查设备绑定状态
- `api/webauthn-manage.js` - 设备管理端点

**前端组件：**
- `src/components/WebAuthnManager.vue` - 设备管理组件（新增）
- `src/components/LoginPage.vue` - 添加 WebAuthn 登录和绑定功能（修改）
- `src/components/DashboardPage.vue` - 集成设备管理组件（修改）

## 测试工具

使用 `test-webauthn.html` 文件测试 WebAuthn 功能：
1. 在浏览器中打开该文件
2. 测试浏览器支持情况
3. 测试设备绑定和认证流程

## 监控和日志

建议监控以下指标：
- WebAuthn 登录成功率
- 设备绑定数量
- 认证失败次数
- 挑战值过期情况

查看服务器日志以排查问题：
- 检查 `/api/webauthn-*` 端点的错误日志
- 监控数据库连接状态
- 验证环境变量配置

---

## 相关资源

- [WebAuthn 规范](https://www.w3.org/TR/webauthn/)
- [MDN WebAuthn 文档](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [Can I Use WebAuthn](https://caniuse.com/webauthn)
