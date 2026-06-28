<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await userStore.fetchProfile()
  } finally {
    loading.value = false
  }
})

const menuItems = [
  { title: '车辆信息', icon: 'Van', path: '/vehicles', color: '#409EFF' },
  { title: '优惠券', icon: 'Ticket', path: '/coupons', color: '#E6A23C' },
  { title: '钱包', icon: 'Wallet', path: '/wallet', color: '#67C23A' },
  { title: '设置', icon: 'Tools', path: '', color: '#909399' }
]

function go(path: string) {
  if (path) router.push(path)
}

function handleLogout() {
  ElMessageBox.confirm('确认退出登录？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    .then(() => {
      userStore.logout()
      router.push('/login')
    })
    .catch(() => {})
}

const showEdit = ref(false)
const editForm = reactive({ phone: '', avatar: '' })

function openEdit() {
  editForm.phone = userStore.userInfo?.phone || ''
  editForm.avatar = userStore.userInfo?.avatar || ''
  showEdit.value = true
}

async function handleUpdate() {
  try {
    await userStore.updateProfile({ phone: editForm.phone, avatar: editForm.avatar })
    ElMessage.success('保存成功')
    showEdit.value = false
  } catch {}
}
</script>

<template>
  <div v-loading="loading" class="page">
    <div class="profile-header">
      <div class="avatar">
        <el-icon :size="48" color="#fff"><UserFilled /></el-icon>
      </div>
      <div class="profile-info">
        <div class="profile-name">{{ userStore.userInfo?.username || '未登录' }}</div>
        <div class="profile-phone">{{ userStore.userInfo?.phone || '' }}</div>
      </div>
      <el-button size="small" class="edit-btn" @click="openEdit">编辑</el-button>
    </div>

    <div class="menu-grid">
      <div
        v-for="item in menuItems"
        :key="item.title"
        class="menu-item"
        @click="go(item.path)"
      >
        <div class="menu-icon" :style="{ background: item.color + '15', color: item.color }">
          <el-icon :size="24"><component :is="item.icon" /></el-icon>
        </div>
        <span class="menu-title">{{ item.title }}</span>
        <el-icon color="#ccc"><ArrowRight /></el-icon>
      </div>
    </div>

    <el-dialog v-model="showEdit" title="编辑资料" width="90%">
      <el-form>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="头像地址">
          <el-input v-model="editForm.avatar" placeholder="输入图片URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEdit = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate">保存</el-button>
      </template>
    </el-dialog>

    <div class="logout-area">
      <el-button size="large" class="logout-btn" @click="handleLogout">
        退出登录
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 0;
  margin-bottom: 24px;
  border-bottom: 1px solid #f5f5f5;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409EFF, #337ecc);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.edit-btn {
  margin-left: auto;
  align-self: flex-start;
  margin-top: 8px;
}

.profile-name {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.profile-phone {
  font-size: 13px;
  color: #999;
}

.menu-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  cursor: pointer;
  transition: background 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.menu-item:active {
  background: #fafafa;
}

.menu-item + .menu-item {
  border-top: 1px solid #f5f5f5;
}

.menu-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-title {
  flex: 1;
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.logout-area {
  margin-top: 40px;
  text-align: center;
}

.logout-btn {
  width: 100%;
  border-radius: 24px;
  color: #F56C6C;
  border-color: #fbc4c4;
}

.logout-btn:hover {
  background: #fef0f0;
}
</style>
