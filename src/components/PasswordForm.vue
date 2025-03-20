<template>
  <form @submit.prevent="addPassword" class="password-form">
    <div class="form-group">
      <label for="url">应用地址</label>
      <input 
        id="url" 
        v-model="url" 
        class="form-input"
        placeholder="例如: github.com"
        required
      >
    </div>
    
    <div class="form-group">
      <label for="username">用户名</label>
      <input 
        id="username" 
        v-model="username" 
        class="form-input"
        placeholder="用户名或邮箱地址"
        required
      >
    </div>
    
    <div class="form-group">
      <label for="password">密码</label>
      <div class="password-input-wrapper">
        <input 
          id="password" 
          v-model="password" 
          class="form-input password-input"
          placeholder="输入或生成密码" 
          required
        >
        <button 
          type="button" 
          class="generate-button" 
          @click="generatePassword"
          title="生成强密码"
        >
          <span>⚡</span>
        </button>
      </div>
      <div v-if="password" class="password-strength-meter">
        <div 
          class="strength-bar" 
          :style="{ width: passwordStrength + '%' }"
          :class="strengthClass"
        ></div>
        <span class="strength-text">{{ strengthText }}</span>
      </div>
    </div>
    
    <div class="form-group">
      <label for="remarks">备注</label>
      <textarea 
        id="remarks" 
        v-model="remarks" 
        class="form-input remarks-input"
        placeholder="添加关于此密码的备注"
        rows="2"
      ></textarea>
    </div>
    
    <button type="submit" class="btn-primary submit-button">
      <span class="icon">+</span>
      <span>添加密码</span>
    </button>
  </form>
</template>
  
<script>
import { ref, computed } from 'vue'

export default {
  name: 'PasswordForm',
  emits: ['add-password'],
  setup(props, { emit }) {
    const url = ref('')
    const username = ref('')
    const password = ref('')
    const remarks = ref('')

    const addPassword = () => {
      emit('add-password', {
        url: url.value,
        username: username.value,
        password: password.value,
        remarks: remarks.value
      })
      url.value = ''
      username.value = ''
      password.value = ''
      remarks.value = ''
    }

    const generatePassword = () => {
      const lowerChars = 'abcdefghijklmnopqrstuvwxyz'
      const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const numbers = '0123456789'
      const symbols = '!@#$%^&*()_-+=<>?'
      
      const allChars = lowerChars + upperChars + numbers + symbols
      let generatedPassword = ''
      
      // Ensure at least one of each type
      generatedPassword += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length))
      generatedPassword += upperChars.charAt(Math.floor(Math.random() * upperChars.length))
      generatedPassword += numbers.charAt(Math.floor(Math.random() * numbers.length))
      generatedPassword += symbols.charAt(Math.floor(Math.random() * symbols.length))
      
      // Add more random characters to reach desired length (16)
      for (let i = 0; i < 12; i++) {
        generatedPassword += allChars.charAt(Math.floor(Math.random() * allChars.length))
      }
      
      // Shuffle the password
      password.value = generatedPassword
        .split('')
        .sort(() => 0.5 - Math.random())
        .join('')
    }

    // Password strength calculation
    const passwordStrength = computed(() => {
      if (!password.value) return 0
      
      const lengthScore = Math.min(password.value.length * 5, 35)
      const hasLower = /[a-z]/.test(password.value) ? 15 : 0
      const hasUpper = /[A-Z]/.test(password.value) ? 15 : 0
      const hasNumber = /[0-9]/.test(password.value) ? 15 : 0
      const hasSymbol = /[^A-Za-z0-9]/.test(password.value) ? 20 : 0
      
      return Math.min(lengthScore + hasLower + hasUpper + hasNumber + hasSymbol, 100)
    })
    
    const strengthClass = computed(() => {
      const strength = passwordStrength.value
      if (strength < 30) return 'very-weak'
      if (strength < 50) return 'weak'
      if (strength < 75) return 'medium'
      if (strength < 90) return 'strong'
      return 'very-strong'
    })
    
    const strengthText = computed(() => {
      const strength = passwordStrength.value
      if (strength < 30) return '非常弱'
      if (strength < 50) return '弱'
      if (strength < 75) return '中等'
      if (strength < 90) return '强'
      return '非常强'
    })

    return {
      url,
      username,
      password,
      remarks,
      addPassword,
      generatePassword,
      passwordStrength,
      strengthClass,
      strengthText
    }
  }
}
</script>
  
<style scoped>
.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #555;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.15);
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: 3rem;
  font-family: monospace;
  letter-spacing: 1px;
}

.generate-button {
  position: absolute;
  right: 0.5rem;
  background-color: var(--primary-color);
  color: white;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.generate-button:hover {
  background-color: var(--secondary-color);
  transform: rotate(15deg);
}

.remarks-input {
  resize: vertical;
  min-height: 60px;
  font-family: inherit;
}

.password-strength-meter {
  margin-top: 0.5rem;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-bar.very-weak {
  background-color: #ff4d4f;
}

.strength-bar.weak {
  background-color: #ff7a45;
}

.strength-bar.medium {
  background-color: #ffc53d;
}

.strength-bar.strong {
  background-color: #52c41a;
}

.strength-bar.very-strong {
  background-color: #13c2c2;
}

.strength-text {
  font-size: 0.75rem;
  position: absolute;
  right: 0;
  top: -1.5rem;
  color: #666;
}

.submit-button {
  margin-top: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-button:hover {
  background-color: var(--secondary-color);
  transform: translateY(-2px);
}

.submit-button:active {
  transform: translateY(0);
}

.icon {
  font-size: 1.1rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Mobile Responsive Styles */
@media (max-width: 576px) {
  .form-input {
    padding: 0.6rem 0.8rem;
    font-size: 0.9rem;
  }
  
  .generate-button {
    width: 2rem;
    height: 2rem;
  }
  
  .submit-button {
    padding: 0.6rem;
  }
}

/* Extra small devices */
@media (max-width: 360px) {
  .form-group label {
    font-size: 0.85rem;
  }
  
  .form-input {
    padding: 0.5rem 0.7rem;
  }
  
  .password-input {
    font-size: 0.9rem;
    letter-spacing: 0.5px;
  }
  
  .strength-text {
    font-size: 0.7rem;
  }
}

/* Better tablet layout */
@media (min-width: 577px) and (max-width: 992px) {
  .password-form {
    gap: 0.8rem;
  }
}
</style>