<template>
  <div class="webauthn-manager">
    <h3>🔐 已绑定的设备</h3>
    
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else-if="credentials.length === 0" class="no-devices">
      <p>暂无绑定设备</p>
      <p class="hint">在登录页面可以绑定新设备</p>
    </div>
    
    <div v-else class="credentials-list">
      <div v-for="cred in credentials" :key="cred.id" class="credential-item">
        <div class="credential-info">
          <div class="credential-id">设备 ID: {{ cred.credentialId }}</div>
          <div class="credential-dates">
            <span>绑定时间: {{ formatDate(cred.createdAt) }}</span>
            <span v-if="cred.lastUsedAt">最后使用: {{ formatDate(cred.lastUsedAt) }}</span>
          </div>
        </div>
        <button @click="deleteCredential(cred.id)" class="btn-delete">删除</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  setup() {
    const credentials = ref([])
    const loading = ref(true)

    const loadCredentials = async () => {
      loading.value = true
      try {
        const token = sessionStorage.getItem('token')
        const response = await fetch('/api/webauthn-manage', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          credentials.value = data.credentials
        }
      } catch (error) {
        console.error('加载凭证错误:', error)
      } finally {
        loading.value = false
      }
    }

    const deleteCredential = async (id) => {
      if (!confirm('确定要删除这个设备吗？删除后需要重新绑定才能使用 WebAuthn 登录。')) {
        return
      }

      try {
        const token = sessionStorage.getItem('token')
        const response = await fetch('/api/webauthn-manage', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ credentialId: id })
        })

        if (response.ok) {
          alert('设备已删除')
          loadCredentials()
        } else {
          const error = await response.json()
          alert(error.error || '删除失败')
        }
      } catch (error) {
        console.error('删除凭证错误:', error)
        alert('删除过程中发生错误')
      }
    }

    const formatDate = (dateString) => {
      if (!dateString) return '从未使用'
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    }

    onMounted(() => {
      loadCredentials()
    })

    return {
      credentials,
      loading,
      deleteCredential,
      formatDate
    }
  }
}
</script>

<style scoped>
.webauthn-manager {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 1.5rem;
}

h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.25rem;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.no-devices {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.hint {
  font-size: 0.9rem;
  color: #999;
  margin-top: 0.5rem;
}

.credentials-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.credential-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.credential-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(67, 97, 238, 0.1);
}

.credential-info {
  flex: 1;
}

.credential-id {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
  font-family: monospace;
  font-size: 0.9rem;
}

.credential-dates {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #666;
}

.btn-delete {
  padding: 0.5rem 1rem;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  background-color: #cc0000;
  transform: translateY(-2px);
}

.btn-delete:active {
  transform: translateY(0);
}

@media (max-width: 576px) {
  .credential-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .btn-delete {
    width: 100%;
  }
}
</style>
