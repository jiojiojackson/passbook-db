<template>
    <div class="change-password-page">
      <h2>修改密码</h2>
      <form @submit.prevent="submitChangePassword">
        <div>
          <label for="username">用户名</label>
          <input type="text" v-model="userName" required />
        </div>
        <div>
          <label for="new-password">新密码</label>
          <input type="password" v-model="newPassword" required />
        </div>
        <button type="button" @click="sendVerificationCode">获取验证码</button>
        <div>
          <label for="verification-code">验证码</label>
          <input type="text" v-model="verificationCode" required />
        </div>
        <button type="submit">提交修改</button>
      </form>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        userName: '',
        newPassword: '',
        verificationCode: ''
      };
    },
    methods: {
      async sendVerificationCode() {
        try {
          const response = await fetch(`/api/email?username=${userName}`, {
            method: 'GET'
          });
          if (response.ok) {
            alert('验证码已发送到您的邮箱');
          } else {
            console.error('发送验证码失败', await response.text());
          }
        } catch (error) {
          console.error('发送验证码失败', error);
        }
      },
      async submitChangePassword() {
        try {
          const response = await fetch('/api/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userName: this.userName,
              newPassword: this.newPassword,
              verificationCode: this.verificationCode
            })
          });
          if (response.ok) {
            alert('密码修改成功');
            this.$router.push('/login');
          } else {
            console.error('修改密码失败', await response.text());
          }
        } catch (error) {
          console.error('修改密码失败', error);
        }
      }
    }
  };
  </script>
  