<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>密码管理器</h1>
      <button class="logout-button" @click="logout">登出</button>
    </header>
    <div class="content-wrapper">
      <div class="main-content">
        <password-list :passwords="filteredPasswords" 
                       @toggle-visibility="togglePasswordVisibility"
                       @edit-password="openEditModal"
                       @delete-password="deletePassword" />
      </div>
      <div class="sidebar">
        <password-form @add-password="addPassword" />
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="搜索..." />
          <button @click="searchPasswords">搜索</button>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h3>编辑密码</h3>
        <form @submit.prevent="updatePassword">
          <div>
            <label for="url">URL:</label>
            <input id="url" v-model="currentPassword.url" required>
          </div>
          <div>
            <label for="username">用户名:</label>
            <input id="username" v-model="currentPassword.username" required>
          </div>
          <div>
            <label for="password">密码:</label>
            <input id="password" v-model="currentPassword.password" required>
          </div>
          <div>
            <label for="remarks">备注:</label>
            <input id="remarks" v-model="currentPassword.remarks">
          </div>
          <button type="submit">更新</button>
          <button type="button" @click="closeModal">取消</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
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
    const searchQuery = ref('')
    const showModal = ref(false)
    const currentPassword = ref(null)
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

    const searchPasswords = () => {
      filteredPasswords.value = passwords.value.filter(pwd => 
        pwd.url.includes(searchQuery.value) ||
        pwd.username.includes(searchQuery.value) ||
        pwd.remarks.includes(searchQuery.value)
      )
    }

    const filteredPasswords = computed(() => {
      return passwords.value.filter(pwd => 
        pwd.url.includes(searchQuery.value) ||
        pwd.username.includes(searchQuery.value) ||
        pwd.remarks.includes(searchQuery.value)
      )
    })

    const openEditModal = (password) => {
      currentPassword.value = { ...password }
      showModal.value = true
    }

    const closeModal = () => {
      showModal.value = false
    }

    const updatePassword = async () => {
      try {
        const response = await fetch(`/api/passwords/${currentPassword.value.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(currentPassword.value),
        });
        if (response.ok) {
          const updatedPassword = await response.json();
          const index = passwords.value.findIndex(pwd => pwd.id === updatedPassword.id);
          passwords.value[index] = updatedPassword;
          closeModal();
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error updating password:', error);
      }
    }

    const deletePassword = async (passwordId) => {
      try {
        const response = await fetch(`/api/passwords/${passwordId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          passwords.value = passwords.value.filter(pwd => pwd.id !== passwordId);
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error deleting password:', error);
      }
    }

    onMounted(fetchPasswords);

    return {
      passwords,
      searchQuery,
      addPassword,
      togglePasswordVisibility,
      logout,
      searchPasswords,
      filteredPasswords,
      showModal,
      currentPassword,
      openEditModal,
      closeModal,
      updatePassword,
      deletePassword
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  padding: 20px;
  font-family: 'Arial, sans-serif';
  background-color: #f0f2f5;
  color: #333;
  min-height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dashboard-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.logout-button {
  background-color: #ff4d4f;
  color: #fff;
  border: none;
  padding: 8px 16px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 14px;
  transition: background-color 0.3s;
}

.logout-button:hover {
  background-color: #ff7875;
}

.content-wrapper {
  display: flex;
  gap: 20px;
}

.main-content {
  flex: 1;
}

.sidebar {
  width: 300px;
  position: fixed;
  top: 100px;
  right: 60px;
}

.search-box {
  margin-top: 20px;
}

.search-box input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  margin-bottom: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.search-box button {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-box button:hover {
  background-color: #40a9ff;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  width: 300px;
}
</style>
