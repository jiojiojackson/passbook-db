<template>
  <div class="dashboard-container">
    <h1>密码管理器</h1>
    <button @click="logout">登出</button>
    <div class="main-content">
      <password-list :passwords="passwords" @toggle-visibility="togglePasswordVisibility" />
    </div>
    <div class="sidebar">
      <password-form @add-password="addPassword" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PasswordList from './components/PasswordList.vue'
import PasswordForm from './components/PasswordForm.vue'

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
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          passwords.value = data.map(pwd => ({ ...pwd, visible: false }));
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching passwords:', error);
      }
    }

    const addPassword = async (newPassword) => {
      try {
        const response = await fetch('/api/passwords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
}

.main-content {
  flex: 1;
  margin-right: 20px;
}

.sidebar {
  width: 300px;
}

button {
  margin-bottom: 10px;
}
</style>