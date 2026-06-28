import { defineStore } from 'pinia'
import { ref } from 'vue'
import { logout as apiLogout } from '../api/admin'

export const useAdminStore = defineStore('admin', () => {
  const adminInfo = ref<any>(JSON.parse(localStorage.getItem('adminUser') || 'null'))

  function setAdmin(info: any) {
    adminInfo.value = info
    localStorage.setItem('adminUser', JSON.stringify(info))
  }

  async function logout() {
    try { await apiLogout() } catch {}
    adminInfo.value = null
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
  }

  return { adminInfo, setAdmin, logout }
})
