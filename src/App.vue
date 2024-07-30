<template>
  <div class="app-container">
    <div class="main-content">
      <h1>密码管理器</h1>
      <password-list :passwords="passwords" @toggle-visibility="togglePasswordVisibility" />
    </div>
    <div class="sidebar">
      <password-form @add-password="addPassword" />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import PasswordList from './components/PasswordList.vue'
import PasswordForm from './components/PasswordForm.vue'

export default {
  name: 'App',
  components: {
    PasswordList,
    PasswordForm
  },
  setup() {
    const passwords = ref([])

    const fetchPasswords = async () => {
      try {
        const response = await fetch('/api/passwords');
        const data = await response.json();
        passwords.value = data.map(pwd => ({ ...pwd, visible: false }));
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
          },
          body: JSON.stringify(newPassword),
        });
        const data = await response.json();
        passwords.value.push({ ...data, visible: false });
      } catch (error) {
        console.error('Error adding password:', error);
      }
    }

    const togglePasswordVisibility = (index) => {
      passwords.value[index].visible = !passwords.value[index].visible;
    }

    onMounted(fetchPasswords);

    return {
      passwords,
      addPassword,
      togglePasswordVisibility
    }
  }
}
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100vh;
}

.main-content {
  flex: 1;
  padding: 20px;
}

.sidebar {
  width: 300px;
  background-color: #f0f0f0;
  padding: 20px;
}
</style>