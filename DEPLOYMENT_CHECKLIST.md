# 部署检查清单

## 📋 部署前检查

### 1. 代码变更确认

- [x] 后端文件已更新
  - [x] `api/login.js` - 添加 lastActivityTime
  - [x] `api/validate-token.js` - 添加活动时间验证
  - [x] `api/refresh-token.js` - 更新活动时间
  - [x] `api/passwords.js` - 添加活动时间验证

- [x] 前端文件已更新
  - [x] `src/components/LoginPage.vue` - localStorage → sessionStorage
  - [x] `src/router/index.js` - localStorage → sessionStorage
  - [x] `src/components/DashboardPage.vue` - localStorage → sessionStorage

- [x] 配置文件已更新
  - [x] `package.json` - 添加 ms 依赖

- [x] 文档已更新
  - [x] `README.md` - 更新功能说明
  - [x] `SECURITY.md` - 新建安全说明
  - [x] `UPGRADE_GUIDE.md` - 新建升级指南
  - [x] `CHANGES_SUMMARY.md` - 新建变更摘要
  - [x] `QUICK_START.md` - 新建快速开始

---

### 2. 依赖安装

```bash
# 检查 package.json 中是否包含 ms
grep "ms" package.json

# 安装依赖
npm install

# 验证 ms 包已安装
npm list ms
```

**预期输出：**
```
passbook@0.1.0
└── ms@2.1.3
```

---

### 3. 环境变量配置

检查 `.env` 文件：

```bash
# 必需的环境变量
✓ POSTGRES_URL
✓ JWT_SECRET
✓ ENCRYPTION_KEY
✓ TOKEN_TIME
```

**TOKEN_TIME 推荐值：**
- 开发：`1m` 或 `5m`
- 测试：`15m` 或 `30m`
- 生产：`1h` 或 `2h`

---

### 4. 代码语法检查

```bash
# 运行 ESLint
npm run lint

# 预期：无错误
```

---

### 5. 本地测试

#### 测试 A: 基本功能

```bash
# 启动应用
npm run serve

# 访问 http://localhost:8080
# 测试登录、查看密码、添加密码等基本功能
```

- [ ] 登录功能正常
- [ ] 查看密码列表正常
- [ ] 添加密码正常
- [ ] 编辑密码正常
- [ ] 删除密码正常
- [ ] 搜索功能正常

#### 测试 B: 关闭网页后失效

```bash
# 1. 登录系统
# 2. 关闭浏览器标签页
# 3. 重新打开应用
# 4. 验证：需要重新登录
```

- [ ] 关闭标签页后需要重新登录 ✅

#### 测试 C: 无操作超时

```bash
# 1. 在 .env 中设置 TOKEN_TIME=1m
# 2. 重启应用
# 3. 登录系统
# 4. 等待 1 分钟不操作
# 5. 尝试操作
# 6. 验证：自动跳转到登录页
```

- [ ] 无操作超时后自动登出 ✅

#### 测试 D: 活动时保持登录

```bash
# 1. 登录系统
# 2. 每 30 秒进行一次操作
# 3. 持续 5 分钟
# 4. 验证：始终保持登录状态
```

- [ ] 活动时保持登录 ✅

---

### 6. 浏览器兼容性测试

测试以下浏览器：

- [ ] Chrome (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (最新版)
- [ ] Edge (最新版)

**验证项：**
- sessionStorage 正常工作
- 关闭标签页后 token 清除
- 无操作超时正常

---

### 7. 数据库检查

```bash
# 连接数据库
psql $POSTGRES_URL

# 检查表结构（无需变更）
\d users
\d passwords

# 验证：表结构无需修改
```

- [ ] 数据库连接正常
- [ ] 表结构无需变更
- [ ] 现有数据完全兼容

---

### 8. 安全检查

- [ ] JWT_SECRET 足够强（至少 32 字符）
- [ ] ENCRYPTION_KEY 正确（64 位十六进制）
- [ ] TOKEN_TIME 设置合理（推荐 1h）
- [ ] 生产环境使用 HTTPS
- [ ] 敏感信息不在代码中硬编码

---

### 9. 性能检查

```bash
# 检查 token 刷新频率
# 打开浏览器开发者工具 → Network
# 观察 /api/refresh-token 请求

# 预期：
# - 用户操作时才发送请求
# - 5 秒内最多 1 次请求
```

- [ ] Token 刷新频率合理
- [ ] 无不必要的网络请求
- [ ] 页面响应速度正常

---

### 10. 日志检查

```bash
# 启动应用并观察日志
npm run serve

# 检查是否有错误或警告
```

- [ ] 无启动错误
- [ ] 无运行时警告
- [ ] Token 验证日志正常

---

## 🚀 部署步骤

### 开发环境

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 3. 启动应用
npm run serve
```

### 生产环境

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
npm install --production

# 3. 构建前端
npm run build

# 4. 配置环境变量
# 确保 .env 文件包含正确的生产配置

# 5. 重启服务
# 根据您的部署方式重启应用
```

---

## 📢 用户通知

部署后建议通知用户：

### 通知模板

```
📢 系统安全升级通知

为了提升账户安全性，我们进行了以下升级：

1. ✅ 关闭浏览器后需要重新登录
   - 保护您的账户不被他人访问

2. ✅ 长时间无操作会自动登出
   - 超过 1 小时无操作会自动退出登录
   - 正常使用时不受影响

3. ✅ 多标签页独立登录
   - 每个标签页需要单独登录
   - 提供更好的安全隔离

感谢您的理解与支持！
```

---

## 🔄 回滚计划

如果出现问题，可以快速回滚：

### 方法 1: Git 回滚

```bash
# 回滚到上一个版本
git revert HEAD
git push origin main
```

### 方法 2: 手动回滚

参考 `UPGRADE_GUIDE.md` 中的"回滚方案"部分。

---

## 📊 监控指标

部署后需要监控：

### 关键指标

1. **登录频率**
   - 预期：可能略有增加（因为关闭浏览器后需要重新登录）

2. **Token 刷新频率**
   - 预期：用户活跃时每 5 秒最多 1 次

3. **401 错误率**
   - 预期：可能略有增加（因为无操作超时）
   - 需要区分正常超时和异常错误

4. **用户反馈**
   - 关注用户对新安全机制的反馈
   - 及时调整 TOKEN_TIME 配置

---

## ✅ 最终确认

部署前最后确认：

- [ ] 所有测试通过
- [ ] 环境变量配置正确
- [ ] 依赖安装完成
- [ ] 文档已更新
- [ ] 用户通知已准备
- [ ] 回滚计划已准备
- [ ] 监控已配置

---

## 🎉 部署完成

恭喜！您已成功部署新的安全机制。

### 后续工作

1. **监控系统运行**
   - 观察日志和错误率
   - 收集用户反馈

2. **优化配置**
   - 根据实际使用情况调整 TOKEN_TIME
   - 优化用户体验

3. **持续改进**
   - 考虑添加"记住我"功能
   - 考虑添加活动时间可视化

---

## 📞 技术支持

如有问题：

1. 查看 `SECURITY.md` - 详细机制说明
2. 查看 `UPGRADE_GUIDE.md` - 升级和回滚指南
3. 查看 `QUICK_START.md` - 快速开始指南
4. 提交 GitHub Issue - 报告问题

---

**部署日期：** _______________

**部署人员：** _______________

**版本号：** v2.0.0 (安全增强版)

**签名：** _______________
