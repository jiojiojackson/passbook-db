<template>
    <div class="login-container">
      <h2>登录</h2>
      <form @submit.prevent="login">
        <div>
          <label for="username">用户名：</label>
          <input id="username" v-model="username" required>
        </div>
        <div>
          <label for="password">密码：</label>
          <input id="password" v-model="password" type="password" required>
        </div>
        <button type="submit">登录</button>
      </form>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  export default {
    setup() {
      const username = ref('')
      const password = ref('')
      const router = useRouter()
  
      const login = async () => {
        try {
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username.value,
              password: password.value,
            }),
          })
  
          if (response.ok) {
            router.push('/dashboard')
          } else {
            alert('登录失败，请检查用户名和密码')
          }
        } catch (error) {
          console.error('登录错误:', error)
          alert('登录过程中发生错误')
        }
      }
  
      return {
        username,
        password,
        login,
      }
    }
  }
  </script>
  
  <style scoped>
  .login-container {
    max-width: 300px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  form div {
    margin-bottom: 10px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
  }
  
  input {
    width: 100%;
    padding: 5px;
  }
  
  button {
    width: 100%;
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }
  
  button:hover {
    background-color: #45a049;
  }
  </style>