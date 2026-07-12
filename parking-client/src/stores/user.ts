import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, register as apiRegister, sendCode as apiSendCode, getUserProfile, updateUserProfile, getVehicles, addVehicle, updateVehicle as apiUpdateVehicle, deleteVehicle, logout as apiLogout } from '../api/user'
import { useMessageStore } from './message'

export interface Vehicle {
  id: number
  plateNumber: string
  brand: string
  color: string
}

export interface UserInfo {
  id: number
  username: string
  phone: string
  avatar: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  let savedUser: UserInfo | null = null
  try {
    const raw = localStorage.getItem('user')
    if (raw) savedUser = JSON.parse(raw)
  } catch {
    localStorage.removeItem('user')
  }
  const userInfo = ref<UserInfo | null>(savedUser)
  const vehicles = ref<Vehicle[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const defaultVehicle = computed(() => vehicles.value[0] || null)

  async function login(username: string, password: string) {
    const res: any = await apiLogin({ username, password })
    const msgStore = useMessageStore()
    msgStore.disconnect()
    token.value = res.data.token
    userInfo.value = res.data.userVO
    localStorage.setItem('token', res.data.token)
    if (res.data.userVO) localStorage.setItem('user', JSON.stringify(res.data.userVO))
    msgStore.clearCache()
    msgStore.connect()
    return res
  }

  async function sendCode(phone: string) {
    return apiSendCode(phone)
  }

  async function register(username: string, password: string, phone: string, code: string) {
    const res: any = await apiRegister({ username, password, phone, code })
    const msgStore = useMessageStore()
    msgStore.disconnect()
    token.value = res.data.token
    userInfo.value = res.data.userVO
    localStorage.setItem('token', res.data.token)
    if (res.data.userVO) localStorage.setItem('user', JSON.stringify(res.data.userVO))
    msgStore.clearCache()
    msgStore.connect()
    return res
  }

  async function logout() {
    try { await apiLogout() } catch {}
    const msgStore = useMessageStore()
    msgStore.disconnect()
    msgStore.clearCache()
    token.value = ''
    userInfo.value = null
    vehicles.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchProfile() {
    try {
      const res: any = await getUserProfile()
      userInfo.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      if (!userInfo.value) {
        userInfo.value = { id: 0, username: '未登录', phone: '', avatar: '' }
      }
    }
  }

  async function updateProfile(data: any) {
    const res: any = await updateUserProfile(data)
    userInfo.value = res.data
    localStorage.setItem('user', JSON.stringify(res.data))
  }

  async function fetchVehicles() {
    const res: any = await getVehicles()
    vehicles.value = res.data || []
  }

  async function addNewVehicle(data: { plateNumber: string; brand: string; color: string }) {
    await addVehicle(data)
    await fetchVehicles()
  }

  async function editVehicle(id: number, data: { plateNumber: string; brand: string; color: string }) {
    await apiUpdateVehicle(id, data)
    await fetchVehicles()
  }

  async function removeVehicle(id: number) {
    await deleteVehicle(id)
    vehicles.value = vehicles.value.filter(v => v.id !== id)
  }

  return {
    token,
    userInfo,
    vehicles,
    isLoggedIn,
    defaultVehicle,
    login,
    register,
    sendCode,
    logout,
    fetchProfile,
    updateProfile,
    fetchVehicles,
    addNewVehicle,
    editVehicle,
    removeVehicle
  }
})
