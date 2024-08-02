<template>
    <form @submit.prevent="addPassword" class="password-form">
      <div>
        <label for="url">应用地址:</label>
        <input id="url" v-model="url" required>
      </div>
      <div>
        <label for="username">用户名:</label>
        <input id="username" v-model="username" required>
      </div>
      <div class="password-input">
        <label for="password">密码:</label>
        <input id="password" v-model="password" required>
        <button type="button" @click="generatePassword">生成</button>
      </div>
      <div>
        <label for="passremark">备注:</label>
        <input id="passremark" v-model="passremark" required>
      </div>
      <button type="submit">添加</button>
    </form>
  </template>
  
  <script>
  import { ref } from 'vue'
  
  export default {
    name: 'PasswordForm',
    emits: ['add-password'],
    setup(props, { emit }) {
      const url = ref('')
      const username = ref('')
      const password = ref('')
      const passremark = ref('')
  
      const addPassword = () => {
        emit('add-password', {
          url: url.value,
          username: username.value,
          password: password.value,
          passremark: passremark.value
        })
        url.value = ''
        username.value = ''
        password.value = ''
        passremark.value = ''
      }
  
      const generatePassword = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
        let generatedPassword = ''
        for (let i = 0; i < 12; i++) {
          generatedPassword += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        password.value = generatedPassword
      }
  
      return {
        url,
        username,
        password,
        passremark,
        addPassword,
        generatePassword
      }
    }
  }
  </script>
  
  <style scoped>
  .password-form div {
    margin-bottom: 10px;
  }
  
  .password-form label {
    display: block;
    margin-bottom: 5px;
  }
  
  .password-form input {
    width: 100%;
    padding: 5px;
  }
  
  .password-input {
    display: flex;
  }
  
  .password-input input {
    flex: 1;
    margin-right: 10px;
  }
  
  .password-form button {
    padding: 5px 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }
  
  .password-form button:hover {
    background-color: #45a049;
  }
  </style>