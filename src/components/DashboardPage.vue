<template>
  <div class="dashboard-container">
    <div class="dashboard-layout" :class="{ 'sidebar-open': isSidebarOpen }">
      <header class="dashboard-header">
        <div class="header-content">
          <h1 class="app-title">
            <span class="icon">🔐</span>
            密码管理器
          </h1>
          <div class="header-actions">
            <div class="search-container">
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="搜索密码..." 
                class="search-input"
              />
              <span class="search-icon">🔍</span>
            </div>
            <button class="toggle-sidebar-btn" @click="toggleSidebar">
              <span v-if="isSidebarOpen">收起</span>
              <span v-else>展开</span>
            </button>
          </div>
        </div>
      </header>

      <div class="content-wrapper">
        <main class="main-content">
          <div class="passwords-header">
            <h2>您的密码 ({{ filteredPasswords.length }})</h2>
            <p v-if="filteredPasswords.length === 0 && searchQuery" class="no-results">
              没有找到匹配 "{{ searchQuery }}" 的结果
            </p>
          </div>
          <password-list 
            :passwords="paginatedPasswords" 
            @toggle-visibility="togglePasswordVisibility"
            @edit-password="openEditModal" 
            @delete-password="deletePassword" 
          />
          
          <!-- Pagination Controls -->
          <div v-if="filteredPasswords.length > pageSize" class="pagination-controls">
            <button 
              class="pagination-btn" 
              :disabled="currentPage === 1" 
              @click="prevPage"
            >
              上一页
            </button>
            <div class="pagination-info">
              第 {{ currentPage }} 页，共 {{ totalPages }} 页
            </div>
            <button 
              class="pagination-btn" 
              :disabled="currentPage === totalPages" 
              @click="nextPage"
            >
              下一页
            </button>
          </div>
        </main>

        <aside class="sidebar" :class="{ 'open': isSidebarOpen }">
          <div class="sidebar-header">
            <h2>添加新密码</h2>
          </div>
          <password-form @add-password="addPassword" />
          <div class="sidebar-footer">
            <button class="logout-button" @click="logout">
              <span class="icon">🚪</span>
              <span>登出</span>
            </button>
          </div>
        </aside>
      </div>
    </div>

    <!-- Edit Password Modal -->
    <transition name="modal">
      <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>编辑密码</h2>
            <button class="close-button" @click="closeModal">&times;</button>
          </div>
          <form @submit.prevent="updatePassword" class="edit-password-form">
            <div class="form-group">
              <label for="url">URL</label>
              <input v-model="currentPassword.url" id="url" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label for="username">用户名</label>
              <input v-model="currentPassword.username" id="username" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label for="password">密码</label>
              <input v-model="currentPassword.password" id="password" type="text" class="form-input" required />
            </div>
            <div class="form-group">
              <label for="remarks">备注</label>
              <input v-model="currentPassword.remarks" id="remarks" type="text" class="form-input" />
            </div>
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="closeModal">取消</button>
              <button type="submit" class="btn-primary">保存</button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { ref, onMounted, computed, watchEffect, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import PasswordList from './PasswordList.vue';
import PasswordForm from './PasswordForm.vue';

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
    const lastRefreshTime = ref(null);
    
    // Pagination state
    const currentPage = ref(1);
    const pageSize = ref(5);

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

    const refreshToken = () => {
      // If last refresh was less than 1 minute ago, skip the refresh
      const now = Date.now();
      if (lastRefreshTime.value && now - lastRefreshTime.value < 60000) {
        return;
      }
      
      // Update the last refresh time
      lastRefreshTime.value = now;
      
      // Don't await - run in background
      fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else if (response.status === 401) {
            router.push('/login');
            throw new Error('Unauthorized');
          }
        })
        .then(data => {
          if (data) {
            localStorage.setItem('token', data.token);
          }
        })
        .catch(error => {
          console.error('Error refreshing token:', error);
        });
    };

    const addPassword = async (newPassword) => {
      refreshToken();
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
      refreshToken();
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
      refreshToken();
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

    const togglePasswordVisibility = async (id) => {
      refreshToken();
      const index = passwords.value.findIndex((pwd) => pwd.id === id);
      passwords.value[index].visible = !passwords.value[index].visible;
    };

    const logout = () => {
      localStorage.removeItem('token');
      router.push('/login');
    };

    const openEditModal = async (password) => {
      refreshToken();
      currentPassword.value = { ...password };
      isModalOpen.value = true;
    };

    const closeModal = async () => {
      refreshToken();
      isModalOpen.value = false;
      currentPassword.value = null;
    };

    const toggleSidebar = async () => {
      refreshToken();
      isSidebarOpen.value = !isSidebarOpen.value;
      
      // On mobile, clicking outside the sidebar should close it
      if (isSidebarOpen.value && window.innerWidth <= 768) {
        document.body.addEventListener('click', handleClickOutside);
      } else {
        document.body.removeEventListener('click', handleClickOutside);
      }
    };

    const handleClickOutside = (event) => {
      // Check if click is outside sidebar
      const sidebar = document.querySelector('.sidebar');
      const clickedSidebar = sidebar.contains(event.target);
      const clickedToggleButton = event.target.closest('.toggle-sidebar-btn');
      
      if (!clickedSidebar && !clickedToggleButton) {
        isSidebarOpen.value = false;
        document.body.removeEventListener('click', handleClickOutside);
      }
    };

    // Handle mobile viewport changes
    const checkViewport = () => {
      // Auto-close sidebar on mobile when viewport changes to small size
      if (window.innerWidth <= 768 && isSidebarOpen.value) {
        isSidebarOpen.value = false;
      }
    };

    const checkTokenValidity = async () => {
      try {
        const response = await fetch('/api/validate-token', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (response.status === 401) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error validating token:', error);
        router.push('/login');
      }
    };

    const startTokenValidationInterval = () => {
      setInterval(checkTokenValidity, 30000); // Check every 30 seconds
    };

    onMounted(async () => {
      await checkTokenValidity();
      await refreshToken();
      fetchPasswords();
      startTokenValidationInterval();
      
      // Add resize event listener for responsive behavior
      window.addEventListener('resize', checkViewport);
    });

    const filteredPasswords = computed(() => {
      const lowerCaseQuery = searchQuery.value.toLowerCase();
      return passwords.value.filter(
        (pwd) =>
          pwd.url.toLowerCase().includes(lowerCaseQuery) ||
          pwd.username.toLowerCase().includes(lowerCaseQuery) ||
          pwd.remarks.toLowerCase().includes(lowerCaseQuery)
      );
    });
    
    // Computed for total pages
    const totalPages = computed(() => {
      return Math.ceil(filteredPasswords.value.length / pageSize.value);
    });
    
    // Computed for paginated passwords
    const paginatedPasswords = computed(() => {
      const startIndex = (currentPage.value - 1) * pageSize.value;
      const endIndex = startIndex + pageSize.value;
      return filteredPasswords.value.slice(startIndex, endIndex);
    });
    
    // Reset to first page when filtering changes
    const resetPagination = () => {
      currentPage.value = 1;
    };
    
    // Watch for changes in searchQuery
    watchEffect(() => {
      searchQuery.value; // Access the ref to track changes
      resetPagination();
    });
    
    // Pagination navigation
    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };
    
    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    onUnmounted(() => {
      // Clean up event listeners
      window.removeEventListener('resize', checkViewport);
      document.body.removeEventListener('click', handleClickOutside);
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
      refreshToken,
      checkTokenValidity,
      startTokenValidationInterval,
      lastRefreshTime,
      // Pagination
      currentPage,
      pageSize,
      totalPages,
      paginatedPasswords,
      nextPage,
      prevPage,
    };
  },
};
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
}

.dashboard-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: all 0.3s ease;
}

.dashboard-header {
  background-color: var(--card-bg);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  margin: 0;
}

.app-title .icon {
  font-size: 1.3em;
  margin-right: 0.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-container {
  position: relative;
  width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.6rem 1rem 0.6rem 2.5rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.search-icon {
  position: absolute;
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
  font-size: 0.9rem;
  color: #999;
}

.toggle-sidebar-btn {
  background-color: transparent;
  color: var(--primary-color);
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: 1px solid var(--primary-color);
  transition: all 0.2s ease;
}

.toggle-sidebar-btn:hover {
  background-color: var(--primary-color);
  color: white;
}

.content-wrapper {
  display: flex;
  flex: 1;
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.main-content {
  flex: 1;
  padding: 2rem;
  transition: all 0.3s ease;
}

.passwords-header {
  margin-bottom: 1.5rem;
}

.passwords-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.no-results {
  color: #666;
  font-style: italic;
}

.sidebar {
  width: 350px;
  background-color: var(--card-bg);
  border-left: 1px solid var(--border-color);
  padding: 2rem;
  height: calc(100vh - 70px);
  position: fixed;
  top: 70px;
  right: 0;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  overflow-y: auto;
  z-index: 5;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.05);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-header {
  margin-bottom: 1.5rem;
}

.sidebar-header h2 {
  font-size: 1.3rem;
  font-weight: 600;
}

.sidebar-footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.logout-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.75rem;
  background-color: var(--danger-color);
  color: white;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.logout-button:hover {
  background-color: #e5136c;
  transform: translateY(-2px);
}

.logout-button .icon {
  margin-right: 0.5rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 20;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h2 {
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
}

.close-button {
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
  color: #666;
  cursor: pointer;
  border: none;
}

.edit-password-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-primary {
  padding: 0.7rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--secondary-color);
}

.btn-secondary {
  padding: 0.7rem 1.5rem;
  background-color: #f1f1f1;
  color: #666;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #e5e5e5;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* Pagination Styles */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 2rem;
  gap: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--secondary-color);
}

.pagination-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.9rem;
  color: #666;
}

/* Media Queries */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: space-between;
  }

  .search-container {
    width: 100%;
  }

  .sidebar {
    width: 100%;
  }

  .main-content {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn-secondary, .btn-primary {
    width: 100%;
  }
  
  .pagination-controls {
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
  
  .pagination-btn {
    width: 100%;
    margin: 0;
  }
}

/* Additional styles for smaller phones */
@media (max-width: 480px) {
  .dashboard-header {
    padding: 0.75rem 1rem;
  }
  
  .app-title {
    font-size: 1.2rem;
  }
  
  .search-input {
    padding: 0.5rem 1rem 0.5rem 2.2rem;
  }
  
  .toggle-sidebar-btn {
    padding: 0.4rem 0.7rem;
    font-size: 0.8rem;
  }
  
  .passwords-header h2 {
    font-size: 1.3rem;
  }
  
  .modal-content {
    width: 95%;
    margin: 0 10px;
  }
  
  .modal-header h2 {
    font-size: 1.1rem;
  }
  
  .form-input {
    padding: 10px 12px;
  }
}

/* Tablet optimizations */
@media (min-width: 769px) and (max-width: 1024px) {
  .main-content {
    padding: 1.5rem;
  }
  
  .sidebar {
    width: 300px;
  }
}

/* Landscape phone orientation */
@media (max-height: 500px) and (orientation: landscape) {
  .sidebar {
    height: calc(100vh - 60px);
    top: 60px;
    padding: 1rem;
  }
  
  .modal-content {
    max-height: 90vh;
    overflow-y: auto;
  }
  
  .form-group {
    margin-bottom: 0.75rem;
  }
}
</style>
