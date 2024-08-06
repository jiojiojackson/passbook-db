<template>
  <div>
    <div v-for="(password, index) in passwords" :key="password.id" class="password-item">
      <div class="password-info">
        <div class="password-url">{{ password.url }}</div>
        <div class="password-url">remarks: {{ password.remarks }}</div>
        <div class="password-username">username: {{ password.username }}</div>
        <div v-if="password.visible" class="password-password">{{ password.password }}</div>
      </div>
      <div class="password-actions">
        <button @click="() => $emit('toggle-visibility', password.id)">{{ password.visible ? '隐藏' : '显示' }}</button>
        <button @click="() => $emit('edit-password', password)">编辑</button>
        <button @click="requestDelete(password)">删除</button>
      </div>
    </div>

    <!-- Modal for delete confirmation -->
    <div v-if="showDeleteModal" class="modal">
      <div class="modal-content">
        <h3>确认删除</h3>
        <p>您确定要删除此密码吗？</p>
        <button @click="confirmDelete">确认删除</button>
        <button @click="cancelDelete">放弃删除</button>
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
  data() {
    return {
      showDeleteModal: false,
      passwordToDelete: null,
    };
  },
  methods: {
    requestDelete(password) {
      this.passwordToDelete = password;
      this.showDeleteModal = true;
    },
    confirmDelete() {
      if (this.passwordToDelete) {
        // Emit the delete event with the password id
        this.$emit('delete-password', this.passwordToDelete.id);
        this.passwordToDelete = null;
      }
      this.showDeleteModal = false;
    },
    cancelDelete() {
      this.passwordToDelete = null;
      this.showDeleteModal = false;
    },
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

/* Styles for the modal */
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
  border-radius: 5px;
  text-align: center;
}
</style>
