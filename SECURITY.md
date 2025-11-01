# 安全机制说明

## 会话管理和令牌过期策略

Passbook 实现了两层安全机制来保护用户账户：

### 1. 关闭网页后令牌失效

**实现方式：** 使用 `sessionStorage` 替代 `localStorage`

- **sessionStorage 特性**：
  - 数据仅在当前浏览器标签页/窗口中有效
  - 关闭标签页或浏览器后，数据自动清除
  - 每个标签页有独立的 sessionStorage 空间

- **安全优势**：
  - 防止用户离开后他人使用同一设备访问账户
  - 减少令牌被盗用的风险
  - 符合零信任安全原则

### 2. 无操作超时自动登出

**实现方式：** JWT 令牌中包含 `lastActivityTime` 字段

#### 工作流程

1. **登录时**：
   ```javascript
   // 创建包含最后活动时间的令牌
   const token = jwt.sign({ 
     userId: user.id,
     lastActivityTime: Date.now()
   }, JWT_SECRET, { expiresIn: TOKEN_TIME });
   ```

2. **用户操作时**：
   - 前端在每次用户操作（增删改查密码、切换页面等）时调用 `refreshToken()`
   - 后端验证当前时间与 `lastActivityTime` 的差值
   - 如果差值小于 `TOKEN_TIME`，更新 `lastActivityTime` 并返回新令牌
   - 如果差值大于 `TOKEN_TIME`，返回 401 错误，强制用户重新登录

3. **令牌验证**：
   ```javascript
   // 所有 API 请求都会检查活动时间
   const lastActivityTime = decoded.lastActivityTime || 0;
   const currentTime = Date.now();
   const tokenTimeout = ms(process.env.TOKEN_TIME); // 例如：1h = 3600000ms
   
   if (currentTime - lastActivityTime > tokenTimeout) {
     return res.status(401).json({ error: 'Token expired due to inactivity' });
   }
   ```

#### 防抖机制

为了避免频繁刷新令牌造成性能问题，前端实现了 5 秒防抖：

```javascript
// 如果距离上次刷新不到 5 秒，跳过本次刷新
if (lastRefreshTime.value && now - lastRefreshTime.value < 5000) {
  return;
}
```

### 3. 定期令牌验证

前端每 30 秒自动验证一次令牌有效性：

```javascript
setInterval(checkTokenValidity, 30000);
```

如果令牌因无操作超时而失效，用户会被自动重定向到登录页面。

## 配置说明

### TOKEN_TIME 环境变量

在 `.env` 文件中配置令牌超时时间：

```bash
TOKEN_TIME=1h   # 1小时无操作后失效
# 或
TOKEN_TIME=30m  # 30分钟无操作后失效
# 或
TOKEN_TIME=7d   # 7天无操作后失效（不推荐）
```

支持的时间单位：
- `ms` - 毫秒
- `s` - 秒
- `m` - 分钟
- `h` - 小时
- `d` - 天

### 推荐配置

根据不同的安全需求，推荐以下配置：

| 场景 | TOKEN_TIME | 说明 |
|------|-----------|------|
| 高安全性（企业） | `15m` - `30m` | 适合处理敏感信息的场景 |
| 平衡（推荐） | `1h` - `2h` | 平衡安全性和用户体验 |
| 便利性优先 | `4h` - `8h` | 适合个人使用，较少安全风险 |

## 安全最佳实践

1. **不要使用过长的 TOKEN_TIME**：
   - 时间越长，令牌被盗用的风险越大
   - 建议不超过 8 小时

2. **定期更换 JWT_SECRET**：
   - 定期更换密钥可以使旧令牌失效
   - 更换后所有用户需要重新登录

3. **使用 HTTPS**：
   - 生产环境必须使用 HTTPS
   - 防止令牌在传输过程中被截获

4. **监控异常登录**：
   - 记录登录时间、IP 地址等信息
   - 发现异常及时通知用户

## 与传统方案的对比

### 传统方案（localStorage + 简单刷新）

```
❌ 关闭浏览器后令牌仍然有效
❌ 只要用户偶尔操作，令牌永不过期
❌ 无法实现真正的"无操作超时"
```

### 当前方案（sessionStorage + 活动时间追踪）

```
✅ 关闭浏览器后令牌自动失效
✅ 无操作超过 TOKEN_TIME 后强制登出
✅ 用户活跃时自动更新活动时间
✅ 符合零信任安全原则
```

## 技术实现细节

### 依赖包

- `jsonwebtoken`: JWT 令牌生成和验证
- `ms`: 时间字符串解析（如 "1h" → 3600000ms）

### 关键代码位置

- **后端令牌验证**: `api/validate-token.js`, `api/passwords.js`
- **后端令牌刷新**: `api/refresh-token.js`
- **前端存储管理**: `src/components/LoginPage.vue`, `src/components/DashboardPage.vue`
- **路由守卫**: `src/router/index.js`

## 常见问题

### Q: 用户正在编辑密码时会被登出吗？

A: 不会。只要用户在操作（如打开编辑框、切换密码等），前端会自动调用 `refreshToken()` 更新活动时间。只有完全无操作超过 `TOKEN_TIME` 才会登出。

### Q: 多个标签页会互相影响吗？

A: 不会。每个标签页有独立的 sessionStorage，互不影响。但这也意味着在不同标签页需要分别登录。

### Q: 如何测试无操作超时功能？

A: 可以临时将 `TOKEN_TIME` 设置为较短的时间（如 `1m`），然后停止操作 1 分钟以上，系统会自动登出。

### Q: 刷新页面会登出吗？

A: 不会。sessionStorage 在页面刷新时会保留，只有关闭标签页或浏览器才会清除。
