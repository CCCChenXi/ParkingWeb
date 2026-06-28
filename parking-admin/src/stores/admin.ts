import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAdminStore = defineStore('admin', () => {
  const adminInfo = ref<any>(JSON.parse(localStorage.getItem('adminUser') || 'null'))

  function setAdmin(info: any) {
    adminInfo.value = info
    localStorage.setItem('adminUser', JSON.stringify(info))
  }

  function logout() {
    adminInfo.value = null
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
  }

  return { adminInfo, setAdmin, logout }
})
