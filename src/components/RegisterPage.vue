<template>
  <div class="register-page">
    <div class="register-container">
      <h1 class="register-title">密码管理器</h1>
      <div class="form-card" :class="{'expanded': showQR}">
        <div v-if="!showQR" class="register-form-container">
          <h2>创建新账户</h2>
          <p class="subtitle">注册后需要使用2FA验证器进行身份验证</p>
          <form @submit.prevent="register" class="register-form">
            <div class="form-group">
              <label for="username">用户名</label>
              <input 
                type="text" 
                id="username" 
                v-model="username" 
                class="form-input"
                placeholder="请输入用户名" 
                required
              >
            </div>
            <button type="submit" class="btn-primary">注册</button>
          </form>
          <div class="back-to-login">
            <button @click="$router.push('/login')" class="btn-secondary">返回登录</button>
          </div>
        </div>
        
        <div v-else class="qr-container">
          <h2>设置双重验证</h2>
          <p class="qr-instructions">请使用Google Authenticator或其他2FA应用扫描以下二维码</p>
          
          <div class="qr-code-wrapper">
            <img :src="qrCode" alt="TOTP QR Code" class="qr-code">
          </div>
          
          <div class="secret-key">
            <p>或手动输入密钥:</p>
            <div class="secret-value">
              {{ formatSecret(secret) }}
            </div>
          </div>
          
          <div class="qr-actions">
            <button @click="$router.push('/login')" class="btn-primary">进入登录</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
export default {
  data() {
    return {
      username: '',
      showQR: false,
      qrCode: '',
      secret: ''
    };
  },
  methods: {
    async register() {
      try {
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username
          })
        });
        
        const data = await response.json();

        if (response.ok) {
          this.qrCode = data.qrCode;
          this.secret = data.secret;
          this.showQR = true;
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('An error occurred. Please try again.');
      }
    },
    formatSecret(secret) {
      // Format the secret key with spaces every 4 characters for readability
      return secret.replace(/(.{4})/g, '$1 ').trim();
    }
  }
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color);
}

.register-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  text-align: center;
}

.register-title {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  font-weight: 700;
}

.form-card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  transition: all 0.3s ease;
}

.form-card.expanded {
  max-width: 100%;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.register-form {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
  text-align: left;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background-color: var(--primary-color);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--secondary-color);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  padding: 10px;
  background-color: transparent;
  color: var(--primary-color);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: rgba(67, 97, 238, 0.1);
}

.back-to-login {
  margin-top: 1.5rem;
}

.qr-container {
  animation: fadeIn 0.5s ease;
}

.qr-instructions {
  margin-bottom: 1.5rem;
  color: #666;
}

.qr-code-wrapper {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

.qr-code {
  max-width: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.qr-code:hover {
  transform: scale(1.05);
}

.secret-key {
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.secret-value {
  font-family: monospace;
  font-size: 1.1rem;
  letter-spacing: 1px;
  color: var(--primary-color);
  margin-top: 0.5rem;
  font-weight: 600;
  word-break: break-all;
}

.qr-actions {
  margin-top: 2rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
