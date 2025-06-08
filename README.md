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