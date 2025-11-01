# WebAuthn 功能部署指南

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

## 使用场景

### 场景 1：首次绑定设备

1. 用户在登录页面输入用户名
2. 点击"绑定新设备"
3. 输入邀请码
4. 按照浏览器提示完成生物识别（指纹/面部识别）
5. 绑定成功

### 场景 2：使用 WebAuthn 登录

1. 用户在登录页面输入用户名
2. 系统检测到已绑定设备，显示"🔐 使用设备认证登录"按钮
3. 点击按钮
4. 完成生物识别
5. 直接登录成功，跳过二重认证

### 场景 3：传统登录（未绑定设备）

1. 用户输入用户名和密码
2. 点击"登录"按钮
3. 完成二重认证流程
4. 登录成功

### 场景 4：管理已绑定设备

1. 登录后在 Dashboard 侧边栏查看"已绑定的设备"
2. 可以查看设备列表（绑定时间、最后使用时间）
3. 可以删除不再使用的设备

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

## 故障排除

### 问题：WebAuthn 按钮不显示

**可能原因**：
- 浏览器不支持 WebAuthn
- 未使用 HTTPS
- 用户未绑定设备

**解决方案**：
- 检查浏览器版本
- 确认使用 HTTPS
- 尝试绑定设备

### 问题：绑定失败

**可能原因**：
- 邀请码错误
- 数据库表未创建
- 浏览器不支持

**解决方案**：
- 验证邀请码
- 检查数据库迁移
- 更换浏览器尝试

### 问题：认证失败

**可能原因**：
- 使用了不同的设备
- 凭证已被删除
- 挑战值过期

**解决方案**：
- 使用绑定时的设备
- 重新绑定设备
- 使用传统登录方式

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
