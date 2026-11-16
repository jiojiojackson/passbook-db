<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="login-title">密码管理器</h1>
      
      <!-- 账号密码登录表单 -->
      <div v-if="!showAuthStep && !showBindDevice" class="form-card">
        <h2>登录</h2>
        
        <!-- 自动认证提示 -->
        <div v-if="isLoading && autoAuthAttempted && !username" class="auto-auth-hint">
          <div class="spinner"></div>
          <span>正在尝试自动认证...</span>
        </div>
        
        <form @submit.prevent="login" class="login-form">
          <div class="form-group">
            <label for="username">用户名</label>
            <input 
              id="username" 
              v-model="username" 
              type="text"
              class="form-input"
              autocomplete="username webauthn"
              required
              @keydown.enter.prevent="$event.target.form.querySelector('#password').focus()"
              @blur="checkWebAuthn"
              @input="checkWebAuthn"
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
            >
          </div>
          
          <!-- WebAuthn 快速登录按钮 -->
          <button 
            v-if="hasWebAuthn"
            type="button"
            @click="loginWithWebAuthn()"
            class="btn-webauthn"
            :disabled="isLoading">
            <span>🔐 使用设备认证登录</span>
          </button>
          
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
          <button @click="showBindDevice = true" class="btn-secondary">🔐 绑定 WebAuthn 设备</button>
        </div>
      </div>

      <!-- 绑定设备界面 -->
      <div v-else-if="showBindDevice" class="form-card">
        <h2>🔐 绑定 WebAuthn 设备</h2>
        <p class="bind-description">绑定后，可在此设备上使用指纹、面部识别等快速登录</p>
        
        <div v-if="!username || !password" class="warning-box">
          ⚠️ 请先返回登录页面输入用户名和密码
        </div>
        
        <div class="form-group">
          <label for="bind-username-display">用户名</label>
          <input 
            id="bind-username-display" 
            :value="username" 
            type="text"
            class="form-input"
            disabled
            placeholder="请先在登录页面输入"
          >
        </div>
        
        <div class="form-group">
          <label for="inviteCode">邀请码</label>
          <input 
            id="inviteCode" 
            v-model="inviteCode" 
            type="text"
            class="form-input"
            placeholder="输入邀请码"
            required
          >
        </div>
        
        <button @click="bindDevice" class="btn-primary" :disabled="isLoading || !username || !password">
          {{ isLoading ? '绑定中...' : '开始绑定' }}
        </button>
        <button @click="showBindDevice = false" class="btn-secondary">返回登录</button>
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
import { ref, onUnmounted, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { startAuthentication, startRegistration } from '@simplewebauthn/browser'

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
    const loginProof = ref('')
    const clientNumber = ref(0)
    const remainingTime = ref(300) // 5分钟
    const pollInterval = ref(null)
    const timerInterval = ref(null)

    // WebAuthn 相关状态
    const hasWebAuthn = ref(false)
    const showBindDevice = ref(false)
    const inviteCode = ref('')
    let checkWebAuthnTimeout = null
    const autoAuthAttempted = ref(false) // 防止重复自动认证

    // 检查用户是否有 WebAuthn 设备（带防抖）
    const checkWebAuthn = async () => {
      if (!username.value || username.value.length < 2) {
        hasWebAuthn.value = false
        return
      }
      
      // 清除之前的定时器
      if (checkWebAuthnTimeout) {
        clearTimeout(checkWebAuthnTimeout)
      }
      
      // 设置新的定时器，500ms 后执行
      checkWebAuthnTimeout = setTimeout(async () => {
        try {
          const response = await fetch('/api/webauthn-check', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username.value }),
          })
          
          if (response.ok) {
            const data = await response.json()
            hasWebAuthn.value = data.hasWebAuthn
          }
        } catch (error) {
          console.error('检查 WebAuthn 错误:', error)
          hasWebAuthn.value = false
        }
      }, 500)
    }

    // WebAuthn 登录
    const loginWithWebAuthn = async (silent = false) => {
      if (!username.value) {
        if (!silent) alert('请输入用户名')
        return
      }

      isLoading.value = true
      try {
        // 开始认证流程
        const startResponse = await fetch('/api/webauthn-authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'start',
            username: username.value
          }),
        })

        if (!startResponse.ok) {
          const error = await startResponse.json()
          if (!silent) alert(error.error || 'WebAuthn 认证失败')
          isLoading.value = false
          return
        }

        const options = await startResponse.json()

        const credential = await startAuthentication({ optionsJSON: options.options })

        if (!credential) {
          if (!silent) alert('认证被取消')
          isLoading.value = false
          return
        }

        // 完成认证
        const finishResponse = await fetch('/api/webauthn-authenticate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'finish',
            username: username.value,
            ceremonyToken: options.ceremonyToken,
            credential
          }),
        })

        if (finishResponse.ok) {
          const data = await finishResponse.json()
          sessionStorage.setItem('token', data.token)
          // 保存用户名到 localStorage，用于下次自动登录
          localStorage.setItem('lastUsername', username.value)
          router.push('/dashboard')
        } else {
          const error = await finishResponse.json()
          if (!silent) alert(error.error || 'WebAuthn 认证失败')
        }
      } catch (error) {
        console.error('WebAuthn 登录错误:', error)
        if (!silent) alert('WebAuthn 认证过程中发生错误: ' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    // 自动 WebAuthn 认证
    const tryAutoWebAuthnLogin = async () => {
      if (autoAuthAttempted.value) return
      autoAuthAttempted.value = true

      // 获取上次登录的用户名
      const lastUsername = localStorage.getItem('lastUsername')
      if (!lastUsername) return

      username.value = lastUsername

      // 检查是否有 WebAuthn 设备
      try {
        const response = await fetch('/api/webauthn-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: lastUsername }),
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.hasWebAuthn) {
            hasWebAuthn.value = true
            // 自动触发 WebAuthn 认证
            await loginWithWebAuthn(true)
          }
        }
      } catch (error) {
        console.error('自动认证检查失败:', error)
      }
    }

    // 绑定设备
    const bindDevice = async () => {
      if (!username.value || !password.value) {
        alert('请先输入用户名和密码')
        return
      }

      if (!inviteCode.value) {
        alert('请输入邀请码')
        return
      }

      isLoading.value = true
      try {
        // 开始注册流程
        const startResponse = await fetch('/api/webauthn-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'start',
            username: username.value,
            inviteCode: inviteCode.value,
            password: password.value
          }),
        })

        if (!startResponse.ok) {
          const error = await startResponse.json()
          alert(error.error || '绑定失败')
          isLoading.value = false
          return
        }

        const options = await startResponse.json()

        const credential = await startRegistration({ optionsJSON: options.options })

        if (!credential) {
          alert('绑定被取消')
          isLoading.value = false
          return
        }

        // 完成注册
        const finishResponse = await fetch('/api/webauthn-register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'finish',
            username: username.value,
            ceremonyToken: options.ceremonyToken,
            credential
          }),
        })

        if (finishResponse.ok) {
          alert('设备绑定成功！')
          showBindDevice.value = false
          inviteCode.value = ''
          hasWebAuthn.value = true
        } else {
          const error = await finishResponse.json()
          alert(error.error || '绑定失败')
        }
      } catch (error) {
        console.error('绑定设备错误:', error)
        alert('绑定过程中发生错误: ' + error.message)
      } finally {
        isLoading.value = false
      }
    }

    const login = async () => {
      isLoading.value = true
      try {
        // 获取客户端时区信息
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: username.value,
            password: password.value,
            timezone: timezone,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          
          // 如果需要二重认证
          if (data.requireAuth) {
            sessionId.value = data.sessionId
            loginProof.value = data.loginProof
            password.value = ''
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
            sessionStorage.setItem('token', data.token)
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
              loginProof: loginProof.value,
              sessionId: sessionId.value,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.token) {
              // 认证成功
              stopPolling()
              sessionStorage.setItem('token', data.token)
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
      loginProof.value = ''
      clientNumber.value = 0
      remainingTime.value = 300
    }

    const goToRegister = () => {
      router.push('/signup')
    }

    // 组件挂载时尝试自动登录
    onMounted(() => {
      tryAutoWebAuthnLogin()
    })

    // 组件卸载时清理定时器
    onUnmounted(() => {
      stopPolling()
      if (checkWebAuthnTimeout) clearTimeout(checkWebAuthnTimeout)
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
      cancelAuth,
      hasWebAuthn,
      showBindDevice,
      inviteCode,
      checkWebAuthn,
      loginWithWebAuthn,
      bindDevice
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



.btn-webauthn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.btn-webauthn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-webauthn:active {
  transform: translateY(0);
}

.btn-webauthn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
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

.bind-description {
  color: #666;
  margin: 1rem 0 1.5rem;
  font-size: 0.95rem;
}

.warning-box {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
}

.auto-auth-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 12px;
  background-color: rgba(67, 97, 238, 0.1);
  border-radius: 8px;
  margin-bottom: 1rem;
  color: var(--primary-color);
  font-size: 0.9rem;
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