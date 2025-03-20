<template>
  <div class="password-list">
    <div v-if="passwords.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <p>您还没有保存任何密码</p>
    </div>
    
    <transition-group name="password-item" tag="div">
      <div v-for="password in passwords" :key="password.id" class="password-card">
        <div class="password-header">
          <div class="password-url">{{ password.url }}</div>
          <div class="password-actions">
            <button 
              class="action-button view-button" 
              @click="() => $emit('toggle-visibility', password.id)"
              :title="password.visible ? '隐藏密码' : '显示密码'"
            >
              <span class="icon">{{ password.visible ? '👁️' : '👁️‍🗨️' }}</span>
            </button>
            <button 
              class="action-button edit-button" 
              @click="() => $emit('edit-password', password)"
              title="编辑"
            >
              <span class="icon">✏️</span>
            </button>
            <button 
              class="action-button delete-button" 
              @click="requestDelete(password)"
              title="删除"
            >
              <span class="icon">🗑️</span>
            </button>
          </div>
        </div>
        
        <div class="password-details">
          <div class="detail-row">
            <span class="detail-label">用户名</span>
            <span class="detail-value" @click="copyToClipboard(password.username, 'username-' + password.id)">
              {{ password.username }} 
              <span class="copy-hint" :class="{ 'copy-hint-visible': copyStatus['username-' + password.id] }" v-if="copyStatus['username-' + password.id]">已复制</span>
              <span class="copy-hint" v-else>点击复制</span>
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">密码</span>
            <span 
              class="detail-value password-value" 
              @click="password.visible && copyToClipboard(password.password, 'password-' + password.id)"
            >
              <span v-if="password.visible">{{ password.password }} 
                <span class="copy-hint" :class="{ 'copy-hint-visible': copyStatus['password-' + password.id] }" v-if="copyStatus['password-' + password.id]">已复制</span>
                <span class="copy-hint" v-else>点击复制</span>
              </span>
              <span v-else>••••••••</span>
            </span>
          </div>
          
          <div v-if="password.remarks" class="detail-row">
            <span class="detail-label">备注</span>
            <span class="detail-value remarks">{{ password.remarks }}</span>
          </div>
        </div>
      </div>
    </transition-group>

    <!-- Delete Confirmation Modal -->
    <transition name="modal">
      <div v-if="showDeleteModal" class="modal-overlay" @click.self="cancelDelete">
        <div class="delete-modal">
          <div class="modal-header">
            <h3>确认删除</h3>
            <button class="close-button" @click="cancelDelete">&times;</button>
          </div>
          <div class="modal-body">
            <p>您确定要删除 <strong>{{ passwordToDelete?.url }}</strong> 的密码吗？</p>
            <p class="warning">此操作无法撤销！</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="cancelDelete">取消</button>
            <button class="btn-danger" @click="confirmDelete">删除</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { reactive } from 'vue';

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
      copyStatus: reactive({})
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
    copyToClipboard(text, id) {
      navigator.clipboard.writeText(text).then(() => {
        // Direct assignment in Vue 3 is reactive
        this.copyStatus[id] = true;
        
        // Reset after 1.5 seconds
        setTimeout(() => {
          this.copyStatus[id] = false;
        }, 1500);
      }).catch(err => {
        console.error('Could not copy text: ', err);
        alert('复制失败，请重试');
      });
    }
  }
}
</script>

<style scoped>
.password-list {
  position: relative;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  background-color: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #aaa;
}

.empty-state p {
  color: #666;
  font-size: 1.1rem;
}

.password-card {
  background-color: var(--card-bg);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
}

.password-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  background-color: var(--primary-color);
  color: white;
}

.password-url {
  font-weight: 600;
  font-size: 1.1rem;
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.password-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-button:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
}

.view-button {
  background: rgba(255, 255, 255, 0.2);
}

.edit-button {
  background: rgba(255, 255, 255, 0.2);
}

.delete-button {
  background: rgba(255, 255, 255, 0.2);
}

.icon {
  font-size: 1rem;
}

.password-details {
  padding: 1.25rem;
}

.detail-row {
  display: flex;
  margin-bottom: 0.75rem;
  align-items: center;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  width: 70px;
  font-weight: 500;
  color: #666;
  font-size: 0.9rem;
}

.detail-value {
  flex: 1;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
  padding: 0.5rem 0.75rem;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.detail-value:hover {
  background-color: #e8e8e8;
}

.copy-hint {
  font-size: 0.7rem;
  color: var(--primary-color);
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
}

.copy-hint-visible {
  opacity: 1 !important;
  z-index: 1;
}

.detail-value:hover .copy-hint {
  opacity: 1;
}

/* Touch device optimizations for copy functionality */
@media (hover: none) {
  .copy-hint {
    opacity: 0.7;
    font-size: 0.75rem;
    padding: 3px 8px;
  }
  
  .detail-value {
    position: relative;
    padding-right: 60px; /* Make room for the copy hint */
  }
  
  .copy-hint-visible {
    opacity: 1;
    background-color: rgba(var(--primary-color-rgb, 67, 97, 238), 0.2);
    color: var(--primary-color);
    font-weight: bold;
  }
}

.password-value {
  font-family: monospace;
  letter-spacing: 1px;
}

.remarks {
  font-style: italic;
  white-space: normal;
  line-height: 1.4;
}

/* Animation for items */
.password-item-enter-active,
.password-item-leave-active {
  transition: all 0.5s ease;
}

.password-item-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.password-item-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

/* Delete confirmation modal */
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
  z-index: 100;
}

.delete-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-color);
}

.close-button {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 1.5rem;
}

.warning {
  color: var(--danger-color);
  font-weight: 500;
  margin-top: 0.5rem;
}

.modal-footer {
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid var(--border-color);
}

.btn-secondary {
  padding: 0.6rem 1.2rem;
  background-color: #f1f1f1;
  color: #666;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-danger {
  padding: 0.6rem 1.2rem;
  background-color: var(--danger-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background-color: #e5e5e5;
}

.btn-danger:hover {
  background-color: #e5136c;
}

/* Modal transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 576px) {
  .password-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .password-url {
    max-width: 100%;
    margin-bottom: 0.75rem;
  }
  
  .password-actions {
    align-self: flex-end;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .detail-label {
    width: 100%;
    margin-bottom: 0.25rem;
  }
  
  .detail-value {
    width: 100%;
  }
}

@media (min-width: 577px) and (max-width: 768px) {
  .detail-label {
    width: 80px;
  }
}

@media (max-width: 992px) {
  .delete-modal {
    width: 95%;
  }
}

/* Adjust font sizes for mobile */
@media (max-width: 576px) {
  .password-url {
    font-size: 1rem;
  }
  
  .detail-label {
    font-size: 0.85rem;
  }
  
  .detail-value {
    font-size: 0.95rem;
  }
}

/* For very small screens */
@media (max-width: 320px) {
  .password-actions {
    gap: 0.3rem;
  }
  
  .action-button {
    width: 28px;
    height: 28px;
  }
}
</style>
