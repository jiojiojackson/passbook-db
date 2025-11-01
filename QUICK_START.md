# 快速开始 - 新安全机制

## 🚀 5分钟快速部署

### 步骤 1: 安装依赖

```bash
npm install
```

这会自动安装新增的 `ms` 包。

---

### 步骤 2: 配置环境变量

确保 `.env` 文件包含以下配置：

```bash
# 数据库配置
POSTGRES_URL=your_postgres_connection_string

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-here
TOKEN_TIME=1h  # ⚠️ 重要：无操作超时时间

# 加密配置
ENCRYPTION_KEY=your_64_character_hex_encryption_key
```

**TOKEN_TIME 推荐值：**
- 开发测试：`1m` 或 `5m`
- 生产环境：`1h` 或 `2h`

---

### 步骤 3: 启动应用

```bash
npm run serve
```

应用将在 `http://localhost:8080` 启动。

---

### 步骤 4: 测试新功能

#### 测试 1: 关闭网页后失效 ✅

```
1. 访问 http://localhost:8080
2. 登录账户
3. 关闭浏览器标签页
4. 重新打开 http://localhost:8080
5. ✅ 预期：需要重新登录
```

#### 测试 2: 无操作超时 ✅

```
1. 在 .env 中临时设置 TOKEN_TIME=1m
2. 重启应用
3. 登录账户
4. 等待 1 分钟不进行任何操作
5. 尝试查看或编辑密码
6. ✅ 预期：自动跳转到登录页
```

#### 测试 3: 活动时保持登录 ✅

```
1. 登录账户
2. 每隔 30 秒进行一次操作（查看、搜索、编辑等）
3. 持续 5 分钟
4. ✅ 预期：始终保持登录状态
```

---

## 🔧 常见问题快速解决

### Q1: 安装依赖时出错

```bash
# 清除缓存后重新安装
rm -rf node_modules package-lock.json
npm install
```

### Q2: 登录后立即被登出

**原因：** 旧的 token 不包含 `lastActivityTime`

**解决：**
1. 清除浏览器缓存
2. 重新登录

### Q3: TOKEN_TIME 设置不生效

**检查：**
1. `.env` 文件是否在项目根目录
2. 是否重启了应用
3. 格式是否正确（如 `1h`, `30m`, `2h`）

### Q4: 多标签页需要分别登录

**说明：** 这是 sessionStorage 的特性，也是安全性的体现。

**如果需要共享：**
- 可以改回 localStorage（不推荐）
- 或使用"记住我"功能（需要额外开发）

---

## 📊 功能对比

### 之前 vs 现在

| 功能 | 之前 | 现在 |
|------|------|------|
| 关闭浏览器后 | ❌ 仍然登录 | ✅ 自动登出 |
| 无操作超时 | ❌ 永不超时 | ✅ TOKEN_TIME 后登出 |
| 多标签页 | 共享登录状态 | 独立登录状态 |
| Token 存储 | localStorage | sessionStorage |
| 安全等级 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 推荐配置

### 开发环境

```bash
# .env
TOKEN_TIME=5m  # 5分钟，方便测试
```

### 生产环境

```bash
# .env
TOKEN_TIME=1h  # 1小时，平衡安全性和用户体验
```

### 高安全性场景

```bash
# .env
TOKEN_TIME=15m  # 15分钟，适合企业级应用
```

---

## 📚 更多文档

- **详细说明：** 查看 `SECURITY.md`
- **升级指南：** 查看 `UPGRADE_GUIDE.md`
- **完整变更：** 查看 `CHANGES_SUMMARY.md`
- **项目文档：** 查看 `README.md`

---

## ✅ 验证清单

部署前请确认：

- [ ] 已安装所有依赖 (`npm install`)
- [ ] `.env` 文件配置正确
- [ ] TOKEN_TIME 设置合理（推荐 1h）
- [ ] 已测试关闭网页后失效功能
- [ ] 已测试无操作超时功能
- [ ] 已通知用户新的安全机制

---

## 🆘 需要帮助？

1. **查看文档：** 先查看 `SECURITY.md` 和 `UPGRADE_GUIDE.md`
2. **检查日志：** 查看浏览器控制台和服务器日志
3. **提交 Issue：** 在 GitHub 上提交问题

---

## 🎉 完成！

恭喜！您已成功部署新的安全机制。

现在您的密码管理器具有：
- ✅ 关闭网页后自动登出
- ✅ 无操作超时保护
- ✅ 更高的安全等级

享受更安全的密码管理体验！
