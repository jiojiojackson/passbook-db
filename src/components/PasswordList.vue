<template>
  <div>
    <div v-for="(password, index) in passwords" :key="password.id" class="password-item">
      <div class="password-info">
        <div class="password-url">{{ password.url }}</div>
        <div class="password-username">{{ password.username }}</div>
        <div v-if="password.visible" class="password-password">{{ password.password }}</div>
      </div>
      <div class="password-actions">
        <button @click="() => toggleVisibility(index)">显示/隐藏</button>
        <button @click="() => $emit('edit-password', password)">编辑</button>
        <button @click="() => $emit('delete-password', password.id)">删除</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    passwords: {
      type: Array,
      required: true
    }
  },
  methods: {
    toggleVisibility(index) {
      this.$emit('toggle-visibility', index);
    }
  }
}
</script>

<style scoped>
.password-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #d9d9d9;
  margin-bottom: 10px;
  border-radius: 4px;
  background: #fff;
}

.password-info {
  flex: 1;
}

.password-url {
  font-weight: bold;
}

.password-username, .password-password {
  color: #666;
}

.password-actions button {
  margin-left: 10px;
  padding: 5px 10px;
  background-color: #1890ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.password-actions button:hover {
  background-color: #40a9ff;
}

.password-actions button:nth-child(3) {
  background-color: #ff4d4f;
}

.password-actions button:nth-child(3):hover {
  background-color: #ff7875;
}
</style>
