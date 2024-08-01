<template>
  <div class="dashboard-container">
    <header class="header">
      <h1 class="title">密码管理器</h1>
      <button @click="logout" class="logout-btn">
        <i class="fas fa-sign-out-alt"></i> 登出
      </button>
    </header>
    <div class="content-wrapper">
      <div class="main-content">
        <h2 class="section-title">我的密码</h2>
        <password-list :passwords="passwords" @toggle-visibility="togglePasswordVisibility" />
      </div>
      <div class="sidebar">
        <h2 class="section-title">添加新密码</h2>
        <password-form @add-password="addPassword" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PasswordList from './PasswordList.vue'
import PasswordForm from './PasswordForm.vue'

export default {
  name: 'DashboardPage',
  components: {
    PasswordList,
    PasswordForm
  },
  setup() {
    const passwords = ref([])
    const router = useRouter()

    const fetchPasswords = async () => {
      try {
        const response = await fetch('/api/passwords', {
          headers: {
            'Authorization': Bearer ${ localStorage.getItem('token') },
          },
    });
    if (response.ok) {
      const data = await response.json();
      passwords.value = data.map(pwd => ({ ...pwd, visible: false }));
    } else if (response.status === 401) {
      router.push('/login');
    }
  } catch(error) {
    console.error('Error fetching passwords:', error);
  }
}

const addPassword = async (newPassword) => {
  try {
    const response = await fetch('/api/passwords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': Bearer ${ localStorage.getItem('token') },
          },
  body: JSON.stringify(newPassword),
        });
if (response.ok) {
  const data = await response.json();
  passwords.value.push({ ...data, visible: false });
} else if (response.status === 401) {
  router.push('/login');
}
      } catch (error) {
  console.error('Error adding password:', error);
}
    }

const togglePasswordVisibility = (index) => {
  passwords.value[index].visible = !passwords.value[index].visible;
}

const logout = () => {
  localStorage.removeItem('token');
  router.push('/login');
}

onMounted(fetchPasswords);

return {
  passwords,
  addPassword,
  togglePasswordVisibility,
  logout
}
  }
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Arial', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.logout-btn {
  background-color: #ff4757;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;
}

.logout-btn:hover {
  background-color: #ff6b6b;
}

.content-wrapper {
  display: flex;
  flex: 1;
  padding: 40px;
  gap: 40px;
}

.main-content {
  flex: 1;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.sidebar {
  width: 350px;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 20px;
  color: #2c3e50;
  margin-bottom: 20px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 10px;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    margin-top: 20px;
  }
}
</style>