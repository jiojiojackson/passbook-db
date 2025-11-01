<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-title">密码管理器</h1>
      
      <!-- 账号密码登录表单 -->
      <div v-if="!showAuthStep" class="form-card">
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
            ref="loginBtnRef"
            :disabled="isLoading">
            <span>{{ isLoading ? '验证中...' : '登录' }}</span>
          </button>
        </form>
        <div class="buttons-row">
          <button @click="goToRegister" class="btn-secondary">还没有账号？点击注册</button>
        </div>
      </div>

      <!-- 二重认证界面 -->
      <div v-else class="form-card auth-card">
        <h2>🔐 二重认证</h2>
        <p class="auth-description">请在服务端认证页面选择以下数字：</p>
        <div class="client-number">{{ clientNumber }}</div>
        <p class="auth-instruction">
          请在服务端应用中选择与上方相同的数字以完成认证
        </p>
        <div class="auth-status">
          <div class="spinner"></div>
          <span>等待认证中...</span>
        </div>
        <p class="auth-timer">剩余时间: {{ remainingTime }}秒</p>
        <button @click="cancelAuth" class="btn-secondary">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

export default {
  setup() {
    const username = ref('')
    const password = ref('')
    const router = useRouter()
    const loginBtnRef = ref(null)
    const isLoading = ref(false)
    
    // 二重认证相关状态
    const showAuthStep = ref(false)
    const sessionId = ref('')
    const clientNumber = ref(0)
    const remainingTime = ref(300) // 5分钟
    const pollInterval = ref(null)
    const timerInterval = ref(null)

    const login = async () => {
      isLoading.value = true
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
          
          // 如果需要二重认证
          if (data.requireAuth) {
            sessionId.value = data.sessionId
            clientNumber.value = data.clientNumber
            showAuthStep.value = true
            
            // 计算剩余时间
            const expiresAt = new Date(data.expiresAt)
            remainingTime.value = Math.floor((expiresAt - new Date()) / 1000)
            
            // 开始轮询认证状态
            startPolling()
            // 开始倒计时
            startTimer()
          } else {
            // 直接登录成功（不应该发生，但保留兼容性）
            localStorage.setItem('token', data.token)
            router.push('/dashboard')
          }
        } else {
          const error = await response.json()
          alert(error.error || '登录失败，请检查用户名和密码')
        }
      } catch (error) {
        console.error('登录错误:', error)
        alert('登录过程中发生错误')
      } finally {
        isLoading.value = false
      }
    }

    const startPolling = () => {
      pollInterval.value = setInterval(async () => {
        try {
          // 验证二重认证
          const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: username.value,
              password: password.value,
              sessionId: sessionId.value,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.token) {
              // 认证成功
              stopPolling()
              localStorage.setItem('token', data.token)
              router.push('/dashboard')
            }
          }
        } catch (error) {
          console.error('轮询错误:', error)
        }
      }, 2000) // 每2秒检查一次
    }

    const startTimer = () => {
      timerInterval.value = setInterval(() => {
        remainingTime.value--
        if (remainingTime.value <= 0) {
          stopPolling()
          alert('认证超时，请重新登录')
          cancelAuth()
        }
      }, 1000)
    }

    const stopPolling = () => {
      if (pollInterval.value) {
        clearInterval(pollInterval.value)
        pollInterval.value = null
      }
      if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
      }
    }

    const cancelAuth = () => {
      stopPolling()
      showAuthStep.value = false
      sessionId.value = ''
      clientNumber.value = 0
      remainingTime.value = 300
    }

    const goToRegister = () => {
      router.push('/signup')
    }

    // 组件卸载时清理定时器
    onUnmounted(() => {
      stopPolling()
    })

    return {
      username,
      password,
      login,
      goToRegister,
      loginBtnRef,
      isLoading,
      showAuthStep,
      sessionId,
      clientNumber,
      remainingTime,
      cancelAuth
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

/* 二重认证样式 */
.auth-card {
  text-align: center;
}

.auth-description {
  color: #666;
  margin: 1rem 0;
  font-size: 0.95rem;
}

.client-number {
  font-size: 4rem;
  font-weight: 700;
  color: var(--primary-color);
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(67, 97, 238, 0.1), rgba(72, 149, 239, 0.1));
  border-radius: 12px;
  border: 2px solid var(--primary-color);
  letter-spacing: 0.1em;
}

.auth-instruction {
  color: #555;
  margin: 1rem 0 2rem;
  font-size: 0.9rem;
  line-height: 1.5;
}

.auth-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin: 1.5rem 0;
  color: #666;
  font-size: 0.9rem;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(67, 97, 238, 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.auth-timer {
  color: #999;
  font-size: 0.85rem;
  margin: 0.5rem 0 1rem;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

.btn-primary:disabled:hover {
  background-color: #ccc;
  transform: none;
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