# Passbook - Password Manager

Passbook is a secure password management application built with Vue.js and Node.js. It allows users to securely store, retrieve, and manage their credentials with end-to-end encryption.
## Demo
https://passbook-db.vercel.app/login
## Features

- **Secure Password Storage**: All passwords are encrypted using AES-256-CBC before being stored in the database
- **User Authentication**: Complete login/signup system with JWT authentication
- **Two-Factor Authentication**: Enhanced security with 2FA support
- **Password Management**: Create, read, update, and delete password entries
- **Responsive UI**: Built with Vue.js for a smooth user experience

## Tech Stack

### Frontend
- Vue.js 3
- Vue Router
- Modern JavaScript (ES6+)

### Backend
- Node.js with Express
- PostgreSQL database
- JWT for authentication
- bcrypt for password hashing
- Nodemailer for email notifications

### Security Features
- AES-256 encryption for stored passwords
- JWT token authentication with refresh tokens
- Two-factor authentication with QR codes (using speakeasy)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd passbook-db
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   POSTGRES_URL=<your-postgres-connection-string>
   JWT_SECRET=<your-jwt-secret>
   ENCRYPTION_KEY=<your-32-byte-hex-encryption-key>
   TOKEN_TIME=<token-expiration-time>
   ```

4. Start the development server:
   ```
   npm run serve
   ```

## API Endpoints

- `/api/signup` - Register a new user
- `/api/login` - Authenticate a user and get JWT
- `/api/refresh-token` - Get a new access token
- `/api/validate-token` - Verify token validity
- `/api/passwords` - CRUD operations for password management

## Vercel 部署配置

在 Vercel 中部署此应用时，需要配置以下环境变量：

| 环境变量 | 说明 | 示例值 |
|---------|------|--------|
| `POSTGRES_URL` | PostgreSQL 数据库连接字符串 | `postgresql://user:password@host:5432/database` |
| `JWT_SECRET` | JWT 令牌签名密钥（建议使用强随机字符串） | `your-super-secret-jwt-key-here` |
| `ENCRYPTION_KEY` | AES-256 加密密钥（必须是 64 位十六进制字符串） | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `TOKEN_TIME` | JWT 令牌过期时间 | `1h`（1小时）或 `7d`（7天） |

### 生成加密密钥

可以使用以下命令生成 64 位十六进制加密密钥：

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

### Vercel 环境变量配置步骤

1. 登录 Vercel 控制台
2. 选择你的项目
3. 进入 Settings → Environment Variables
4. 添加上述所有环境变量
5. 选择适用的环境（Production / Preview / Development）
6. 保存并重新部署

## Development

```
npm run serve     # Starts development server
npm run build     # Builds for production
npm run lint      # Lints and fixes files
```

## Security Considerations

- The application uses environment variables for sensitive information
- Passwords are encrypted before storage
- JWT authentication with proper token validation
- Database credentials are never exposed to the frontend

## License

[MIT License](LICENSE) 