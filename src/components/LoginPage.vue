<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-title">密码管理器</h1>
      <div class="form-card">
        <h2>登录</h2>
        <form @submit.prevent="login" class="login-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input 
              id="username" 
              v-model="username" 
              type="text"
              class="form-input"
              autocomplete="username"
              required
              @keyup.enter="$event.target.form.querySelector('#totp').focus()"
            >
          </div>
          <div class="form-group">
            <label for="totp">2FA验证码</label>
            <div class="totp-input-wrapper">
              <input 
                id="totp" 
                v-model="totpToken" 
                type="text" 
                maxlength="6" 
                pattern="[0-9]*" 
                inputmode="numeric"
                placeholder="输入6位验证码"
                class="form-input totp-input"
                autocomplete="one-time-code"
                required
                @keyup.enter="loginBtnRef.click()"
              >
              <div class="totp-dots">
                <span v-for="(digit, index) in 6" :key="index" 
                      class="totp-dot" 
                      :class="{ 'filled': totpToken.length > index }"></span>
              </div>
            </div>
          </div>
          <button 
            type="submit" 
            class="btn-primary login-button"
            ref="loginBtnRef">
            <span>登录</span>
          </button>
        </form>
        <div class="buttons-row">
          <button @click="goToRegister" class="btn-secondary">还没有账号？点击注册</button>
        </div>
      </div>
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
    const loginBtnRef = ref(null)

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

    return {
      username,
      totpToken,
      login,
      goToRegister,
      loginBtnRef
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color);
}

.login-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  text-align: center;
}

.login-title {
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.form-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.15);
}

.login-form {
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

.totp-input-wrapper {
  position: relative;
}

.totp-input {
  letter-spacing: 1.5rem;
  padding-left: 1.5rem;
  font-weight: 600;
}

.totp-dots {
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
  margin-top: 0.5rem;
}

.totp-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--border-color);
  transition: all 0.2s ease;
}

.totp-dot.filled {
  background-color: var(--primary-color);
  transform: scale(1.2);
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background-color: var(--primary-color);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 0.5rem;
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
  width: 100%;
  padding: 12px;
  background-color: transparent;
  color: var(--primary-color);
  font-size: 0.9rem;
  margin-top: 1rem;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: rgba(67, 97, 238, 0.1);
}

.buttons-row {
  margin-top: 1.5rem;
}
</style>