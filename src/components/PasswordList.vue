<template>
    <div class="password-list">
      <div v-for="(password, index) in passwords" :key="index" class="password-item">
        <div><strong>应用地址:</strong> {{ password.url }}</div>
        <div><strong>用户名:</strong> {{ password.username }}</div>
        <div><strong>备注:</strong> {{ password.remarks }}</div>
        <div>
          <strong>密码:</strong>
          <span @click="$emit('toggle-visibility', index)">
            {{ password.visible ? password.password : '••••••••' }}
          </span>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PasswordList',
    props: {
      passwords: Array
    },
    emits: ['toggle-visibility']
  }
  </script>
  
  <style scoped>
  .password-list {
    margin-top: 20px;
  }
  
  .password-item {
    border: 1px solid #ddd;
    padding: 10px;
    margin-bottom: 10px;
  }
  </style>