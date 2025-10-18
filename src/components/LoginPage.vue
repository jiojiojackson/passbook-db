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
              @keyup.enter="$event.target.form.querySelector('#password').focus()"
            >
          </div>
          <div class="form-group">
            <label for="password">密码</label>
            <input 
              id="password" 
              v-model="password" 
              type="password"
              placeholder="输入密码"
              class="form-input"
              autocomplete="current-password"
              required
              @keyup.enter="loginBtnRef.click()"
            >
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
    const password = ref('')
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
            password: password.value,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          localStorage.setItem('token', data.token)
          router.push('/dashboard')
        } else {
          const error = await response.json()
          alert(error.error || '登录失败，请检查用户名和密码')
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
      password,
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

/* Responsive design */
@media (max-width: 576px) {
  .login-container {
    padding: 10px;
  }
  
  .login-title {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
  
  .form-card {
    padding: 1.5rem;
  }
  
  .form-input {
    padding: 10px 14px;
  }
  
  .btn-primary, .btn-secondary {
    padding: 10px;
    font-size: 0.95rem;
  }
}

/* Extra small devices */
@media (max-width: 360px) {
  .login-title {
    font-size: 1.75rem;
  }
  
  .form-card {
    padding: 1.25rem;
  }
  
  .form-group label {
    font-size: 0.85rem;
  }
  

}

/* Landscape mode for phones */
@media (max-height: 500px) and (orientation: landscape) {
  .login-page {
    padding: 1rem 0;
  }
  
  .login-title {
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
  }
  
  .form-group {
    margin-bottom: 0.75rem;
  }
}

/* Medium devices (tablets) */
@media (min-width: 577px) and (max-width: 992px) {
  .login-container {
    max-width: 380px;
  }
}

/* High DPI mobile devices */
@media (-webkit-min-device-pixel-ratio: 2) and (max-width: 576px), 
       (min-resolution: 192dpi) and (max-width: 576px) {
  .form-card {
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  }
}
</style>