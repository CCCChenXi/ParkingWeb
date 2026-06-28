import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

function isAuthEndpoint(url?: string) {
  return url?.includes('/user/register') || url?.includes('/user/send-code')
}

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 200) {
      if (!isAuthEndpoint(response.config?.url)) {
        ElMessage.error(res.message || '请求失败')
      }
      const err = new Error(res.message || '请求失败')
      ;(err as any).response = { status: res.code }
      ;(err as any).config = response.config
      return Promise.reject(err)
    }
    return res
  },
  (error) => {
    const data = error.response?.data
    const backendMsg = data?.message
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    } else if (error.response?.status === 403) {
      ElMessage.error(backendMsg || '无权限访问，请联系管理员')
    } else if (!isAuthEndpoint(error.config?.url)) {
      ElMessage.error(backendMsg || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
