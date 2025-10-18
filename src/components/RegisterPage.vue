<template>
  <div class="register-page">
    <div class="register-container">
      <h1 class="register-title">密码管理器</h1>
      <div class="form-card">
        <div class="register-form-container">
          <h2>创建新账户</h2>
          <p class="subtitle">请输入用户名和密码完成注册</p>
          <form @submit.prevent="register" class="register-form">
            <div class="form-group">
              <label for="username">用户名</label>
              <input 
                type="text" 
                id="username" 
                v-model="username" 
                class="form-input"
                placeholder="请输入用户名" 
                required
              >
            </div>
            <div class="form-group">
              <label for="password">密码</label>
              <input 
                type="password" 
                id="password" 
                v-model="password" 
                class="form-input"
                placeholder="请输入密码" 
                required
                minlength="6"
              >
            </div>
            <div class="form-group">
              <label for="confirmPassword">确认密码</label>
              <input 
                type="password" 
                id="confirmPassword" 
                v-model="confirmPassword" 
                class="form-input"
                placeholder="请再次输入密码" 
                required
                minlength="6"
              >
            </div>
            <button type="submit" class="btn-primary">注册</button>
          </form>
          <div class="back-to-login">
            <button @click="$router.push('/login')" class="btn-secondary">返回登录</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
export default {
  data() {
    return {
      username: '',
      password: '',
      confirmPassword: ''
    };
  },
  methods: {
    async register() {
      if (this.password !== this.confirmPassword) {
        alert('两次输入的密码不一致');
        return;
      }

      if (this.password.length < 6) {
        alert('密码长度至少为6位');
        return;
      }

      try {
        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: this.username,
            password: this.password
          })
        });
        
        const data = await response.json();

        if (response.ok) {
          alert('注册成功！请登录');
          this.$router.push('/login');
        } else {
          alert(data.error || '注册失败');
        }
      } catch (error) {
        console.error('Registration error:', error);
        alert('注册过程中发生错误，请重试');
      }
    }
  }
};
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--bg-color);
}

.register-container {
  width: 100%;
  max-width: 420px;
  padding: 20px;
  text-align: center;
}

.register-title {
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
  transition: all 0.3s ease;
}

.subtitle {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.register-form {
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
  padding: 10px;
  background-color: transparent;
  color: var(--primary-color);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: rgba(67, 97, 238, 0.1);
}

.back-to-login {
  margin-top: 1.5rem;
}

/* Responsive design */
@media (max-width: 576px) {
  .register-container {
    padding: 10px;
  }
  
  .register-title {
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
  .register-title {
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
  .register-page {
    padding: 1rem 0;
  }
  
  .register-title {
    font-size: 1.75rem;
    margin-bottom: 0.75rem;
  }
  
  .form-group {
    margin-bottom: 0.75rem;
  }
  

}

/* Medium devices (tablets) */
@media (min-width: 577px) and (max-width: 992px) {
  .register-container {
    max-width: 380px;
  }
}
</style>
