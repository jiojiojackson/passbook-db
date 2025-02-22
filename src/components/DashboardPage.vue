<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>密码管理器</h1>

    </header>
    <div class="content-wrapper">
      <div class="main-content">
        <password-list :passwords="filteredPasswords" @toggle-visibility="togglePasswordVisibility"
          @edit-password="openEditModal" @delete-password="deletePassword" />
      </div>
      <div v-if="isSidebarOpen" class="sidebar">
        <button class="logout-button" @click="logout">登出</button>
        <password-form @add-password="addPassword" />
        <div class="search-box">
          <input v-model="searchQuery" type="text" placeholder="搜索..." />
        </div>
      </div>
    </div>
    <button class="toggle-sidebar" @click="toggleSidebar">
      {{ isSidebarOpen ? '收起侧边栏' : '展开侧边栏' }}
    </button>

    <!-- Edit Password Modal -->
    <div v-if="isModalOpen" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeModal">&times;</span>
        <h2>编辑密码</h2>
        <form @submit.prevent="updatePassword">
          <div class="form-group">
            <label for="url">URL:</label>
            <input v-model="currentPassword.url" id="url" type="text" required />
          </div>
          <div class="form-group">
            <label for="username">用户名:</label>
            <input v-model="currentPassword.username" id="username" type="text" required />
          </div>
          <div class="form-group">
            <label for="password">密码:</label>
            <input v-model="currentPassword.password" id="password" type="text" required />
          </div>
          <div class="form-group">
            <label for="remarks">备注:</label>
            <input v-model="currentPassword.remarks" id="remarks" type="text" />
          </div>
          <button type="submit">保存</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import PasswordList from './PasswordList.vue';
import PasswordForm from './PasswordForm.vue';
import jwtDecode from 'jwt-decode';

export default {
  name: 'DashboardPage',
  components: {
    PasswordList,
    PasswordForm,
  },
  setup() {
    const passwords = ref([]);
    const searchQuery = ref('');
    const isModalOpen = ref(false);
    const currentPassword = ref(null);
    const isSidebarOpen = ref(true);
    const router = useRouter();

    const fetchPasswords = async () => {
      try {
        const response = await fetch('/api/passwords', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          passwords.value = data.map((pwd) => ({ ...pwd, visible: false }));
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching passwords:', error);
      }
    };

    const addPassword = async (newPassword) => {
      try {
        const response = await fetch('/api/passwords', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
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
    };

    const updatePassword = async () => {
      try {
        const updatedPasswordData = {
          ...currentPassword.value,
          current_id: currentPassword.value.id,
        };

        const response = await fetch(`/api/passwords`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(updatedPasswordData),
        });
        if (response.ok) {
          const updatedPassword = await response.json();
          const index = passwords.value.findIndex((pwd) => pwd.id === updatedPassword.id);
          passwords.value[index] = updatedPassword;
          closeModal();
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error updating password:', error);
      }
    };

    const deletePassword = async (passwordId) => {
      try {
        const response = await fetch(`/api/passwords?id=${passwordId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.ok) {
          passwords.value = passwords.value.filter((pwd) => pwd.id !== passwordId);
        } else if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error deleting password:', error);
      }
    };

    const togglePasswordVisibility = (id) => {
      console.log('id'+id);
      const index = passwords.value.findIndex((pwd) => pwd.id === id);
      passwords.value[index].visible = !passwords.value[index].visible;
    };

    const logout = () => {
      localStorage.removeItem('token');
      router.push('/login');
    };


    const filteredPasswords = computed(() => {
      const lowerCaseQuery = searchQuery.value.toLowerCase();
      return passwords.value.filter(
        (pwd) =>
          pwd.url.toLowerCase().includes(lowerCaseQuery) ||
          pwd.username.toLowerCase().includes(lowerCaseQuery) ||
          pwd.remarks.toLowerCase().includes(lowerCaseQuery)
      );
    });

    const openEditModal = (password) => {
      currentPassword.value = { ...password };
      isModalOpen.value = true;
    };

    const closeModal = () => {
      isModalOpen.value = false;
      currentPassword.value = null;
    };

    const toggleSidebar = () => {
      isSidebarOpen.value = !isSidebarOpen.value;
    };

    // Add token checking functions
    const isTokenExpired = () => {
      const token = localStorage.getItem('token');
      if (!token) return true;

      try {
        const decodedToken = jwtDecode(token);
        // Convert expiration time to milliseconds and create UTC Date
        const tokenExpDate = new Date(decodedToken.exp * 1000).getTime();
        // Get current UTC time in milliseconds
        const currentUTCTime = new Date().getTime();
        
        return tokenExpDate <= currentUTCTime;
      } catch {
        return true;
      }
    };

    const checkTokenExpiration = () => {
      if (isTokenExpired()) {
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    // Add window unload handler
    const handleUnload = () => {
      localStorage.removeItem('token');
    };

    let tokenCheckInterval;

    onMounted(() => {
      fetchPasswords();
      window.addEventListener('beforeunload', handleUnload);
      // Check token expiration every 30 seconds
      tokenCheckInterval = setInterval(checkTokenExpiration, 30000);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(tokenCheckInterval);
    });

    return {
      passwords,
      searchQuery,
      addPassword,
      updatePassword,
      deletePassword,
      togglePasswordVisibility,
      logout,
      filteredPasswords,
      isModalOpen,
      currentPassword,
      openEditModal,
      closeModal,
      isSidebarOpen,
      toggleSidebar,
    };
  },
};
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
  top: 50px;
  /* adjust based on the height of your header */
  right: 20px;
  /* adjust based on your layout */
  height: calc(100vh - 120px);
  /* adjust based on the height of your header and padding */
  background-color: #fff;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
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

.toggle-sidebar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #1890ff;
  color: white;
  border: none;
  padding: 10px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toggle-sidebar:hover {
  background-color: #40a9ff;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 4px;
  width: 400px;
  position: relative;
}

.close {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 20px;
  cursor: pointer;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.form-group input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

button[type="submit"] {
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

button[type="submit"]:hover {
  background-color: #40a9ff;
}
</style>
