<template>
    <div>
      <form @submit.prevent="register">
        <input type="text" v-model="newUsername" placeholder="New Username" required>
        <input type="password" v-model="newPassword" placeholder="New Password" required>
        <button type="submit">注册</button>
      </form>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        newUsername: '',
        newPassword: ''
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
              username: this.newUsername,
              password: this.newPassword
            })
          });
  
          if (!response.ok) {
            throw new Error('Registration failed');
          }
          alert('Registration successful, please login.');
          this.$router.push('/login');
        } catch (error) {
          console.error('Registration error:', error);
          alert('Error: ' + error.message);
        }
      }
    }
  };
  </script>
  