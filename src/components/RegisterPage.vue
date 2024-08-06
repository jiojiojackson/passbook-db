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
          
          const data = await response.json();

          if (response.ok) {
            alert(data.message);
            this.$router.push('/login');
            } else {
            alert(data.error);
            if (response.status === 409) {
                this.$router.push('/login');
            }
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred. Please try again.');
        }
      }
    }
  };
  </script>
  