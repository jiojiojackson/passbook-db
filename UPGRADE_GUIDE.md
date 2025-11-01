# 升级指南 - 新安全机制

## 概述

本次更新实现了两个重要的安全特性：
1. ✅ 关闭网页后登录 token 自动失效
2. ✅ 无操作超过 TOKEN_TIME 后登录 token 自动失效

## 升级步骤

### 1. 安装新依赖

```bash
npm install
```

新增依赖：
- `ms@^2.1.3` - 用于解析时间字符串（如 "1h" → 毫秒）

### 2. 更新环境变量（可选）

检查 `.env` 文件中的 `TOKEN_TIME` 配置：

```bash
TOKEN_TIME=1h  # 推荐值：15m 到 2h
```

### 3. 重启应用

```bash
npm run serve
```

## 主要变更

### 后端变更

#### 1. JWT Token 结构变化

**之前：**
```javascript
{ userId: 123 }
```

**现在：**
```javascript
{ 
  userId: 123,
  lastActivityTime: 1730476800000  // 时间戳
}
```

#### 2. 新增活动时间验证

所有需要认证的 API 端点现在都会验证：
- Token 是否过期（JWT 自带的 expiresIn）
- 最后活动时间是否超过 TOKEN_TIME

#### 3. Token 刷新机制改进

`/api/refresh-token` 现在会：
- 验证最后活动时间
- 更新 lastActivityTime 为当前时间
- 返回新的 token

### 前端变更

#### 1. 存储方式变更

**之前：** `localStorage`（持久化存储）
```javascript
localStorage.setItem('token', token);
localStorage.getItem('token');
```

**现在：** `sessionStorage`（会话存储）
```javascript
sessionStorage.setItem('token', token);
sessionStorage.getItem('token');
```

#### 2. Token 刷新防抖优化

**之前：** 1 分钟防抖
```javascript
if (now - lastRefreshTime < 60000) return;
```

**现在：** 5 秒防抖
```javascript
if (now - lastRefreshTime < 5000) return;
```

#### 3. 错误处理增强

所有 401 错误现在都会：
- 清除 sessionStorage 中的 token
- 重定向到登录页面

## 用户体验变化

### 对用户的影响

1. **关闭浏览器后需要重新登录**
   - 之前：关闭浏览器后再打开仍然保持登录状态
   - 现在：关闭浏览器后需要重新登录

2. **长时间无操作会自动登出**
   - 之前：只要偶尔操作，可以一直保持登录
   - 现在：完全无操作超过 TOKEN_TIME 后会自动登出

3. **多标签页独立会话**
   - 每个标签页需要单独登录
   - 关闭一个标签页不影响其他标签页

### 对开发者的影响

1. **调试时的注意事项**
   - 关闭浏览器后需要重新登录
   - 可以临时使用 localStorage 进行开发调试

2. **测试无操作超时**
   ```bash
   # 在 .env 中设置较短的超时时间
   TOKEN_TIME=1m
   ```

## 兼容性说明

### 向后兼容

- ✅ 旧的 token（不含 lastActivityTime）会被视为立即过期
- ✅ 所有用户需要重新登录一次
- ✅ 数据库结构无需变更

### 浏览器支持

sessionStorage 支持所有现代浏览器：
- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge (所有版本)
- IE 8+

## 回滚方案

如果需要回滚到旧版本：

### 1. 恢复 localStorage

在所有前端文件中将 `sessionStorage` 改回 `localStorage`：

```bash
# 使用查找替换工具
sessionStorage → localStorage
```

### 2. 移除活动时间验证

在后端 API 文件中移除以下代码：

```javascript
// 移除这段代码
const lastActivityTime = decoded.lastActivityTime || 0;
const currentTime = Date.now();
const tokenTimeout = ms(process.env.TOKEN_TIME || '1h');

if (currentTime - lastActivityTime > tokenTimeout) {
  return res.status(401).json({ error: 'Token expired due to inactivity' });
}
```

### 3. 恢复简单的 token 结构

在 `api/login.js` 和 `api/refresh-token.js` 中：

```javascript
// 改回简单结构
const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: TOKEN_TIME });
```

## 安全建议

### 生产环境配置

```bash
# .env
TOKEN_TIME=1h              # 1小时无操作超时
JWT_SECRET=<强随机字符串>  # 至少 32 字符
ENCRYPTION_KEY=<64位十六进制> # AES-256 密钥
```

### 监控和日志

建议添加以下监控：
- 记录因无操作超时而登出的次数
- 监控 token 刷新频率
- 记录异常的 401 错误

### 用户通知

建议在登录页面添加提示：
```
⚠️ 为了您的账户安全：
- 关闭浏览器后需要重新登录
- 超过 1 小时无操作会自动登出
```

## 常见问题

### Q: 为什么选择 sessionStorage 而不是 localStorage？

A: sessionStorage 在关闭标签页后自动清除，符合零信任安全原则。对于密码管理器这类敏感应用，这是更安全的选择。

### Q: 用户会频繁被登出吗？

A: 不会。只要用户在操作（查看、编辑、搜索密码等），系统会自动更新活动时间。只有完全无操作超过 TOKEN_TIME 才会登出。

### Q: 如何平衡安全性和用户体验？

A: 通过调整 TOKEN_TIME 来平衡：
- 高安全性：15-30 分钟
- 平衡（推荐）：1-2 小时
- 便利性优先：4-8 小时

### Q: 多标签页使用不方便怎么办？

A: 这是 sessionStorage 的特性，也是安全性的体现。如果确实需要多标签页共享会话，可以考虑使用 localStorage + 更短的 TOKEN_TIME。

## 技术支持

如有问题，请查看：
- `SECURITY.md` - 详细的安全机制说明
- `README.md` - 项目文档
- GitHub Issues - 提交问题和建议
