<template>
    <div>
      <div v-if="!showQR">
        <form @submit.prevent="register">
          <input type="text" v-model="username" placeholder="Username" required>
          <button type="submit">注册</button>
        </form>
      </div>
      <div v-else>
        <h2>请扫描二维码设置2FA认证</h2>
        <img :src="qrCode" alt="TOTP QR Code">
        <p>或手动输入密钥: {{ secret }}</p>
        <p>请使用Google Authenticator或其他2FA应用扫描</p>
        <button @click="$router.push('/login')">进入登录</button>
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
    }
  }
};
</script>
