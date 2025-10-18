# 数据库迁移说明

## 从 TOTP 认证迁移到密码认证

由于认证方式已从 TOTP（双因素认证）改为传统的用户名+密码方式，需要更新数据库表结构。

### 需要执行的 SQL 语句

```sql
-- 1. 删除旧的 totp_secret 列（如果存在）
ALTER TABLE users DROP COLUMN IF EXISTS totp_secret;

-- 2. 添加新的 password_hash 列（如果不存在）
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- 3. 如果需要重新创建 users 表，使用以下语句：
/*
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/
```

### 注意事项

1. 执行迁移前请备份数据库
2. 现有用户需要重新注册，因为密码哈希无法从 TOTP secret 转换
3. 如果有重要数据，建议先导出 passwords 表的数据

### 已删除的依赖

以下 npm 包不再需要，可以卸载：
- `speakeasy` - TOTP 生成和验证
- `qrcode` - 二维码生成

保留的依赖：
- `bcryptjs` - 密码哈希（已在 package.json 中）
- `jsonwebtoken` - JWT token 生成
- `pg` - PostgreSQL 数据库连接
