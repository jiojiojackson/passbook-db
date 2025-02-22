<template>
  <div class="login-container">
    <h2>登录</h2>
    <form @submit.prevent="login">
      <div>
        <label for="username">用户名：</label>
        <input id="username" v-model="username" required>
      </div>
      <div>
        <label for="totp">2FA验证码：</label>
        <input 
          id="totp" 
          v-model="totpToken" 
          type="text" 
          maxlength="6" 
          pattern="[0-9]*" 
          inputmode="numeric"
          placeholder="输入6位验证码"
          required
        >
      </div>
      <button type="submit" class="login-button">登录</button>
    </form>
    <div class="buttons-row">
      <button @click="goToRegister" class="half-button">注册</button>
      <button @click="goToChangePassword" class="half-button">修改密码</button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const username = ref('')
    const totpToken = ref('')
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
            token: totpToken.value,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('token', data.token)
          router.push('/dashboard')
        } else {
          const error = await response.json()
          alert(error.error || '登录失败，请检查用户名和验证码')
        }
      } catch (error) {
        console.error('登录错误:', error)
        alert('登录过程中发生错误')
      }
    }

    const goToRegister = () => {
      router.push('/signup')
    }

    const goToChangePassword = () => {
      router.push('/email')
    }

    return {
      username,
      totpToken,
      login,
      goToRegister,
      goToChangePassword
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
  padding: 10px;
  border: none;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}

.login-button {
  width: 100%;
  background-color: #4CAF50;
  color: white;
}

.buttons-row {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.half-button {
  width: 48%;
  background-color: grey;
  color: white;
}
</style>