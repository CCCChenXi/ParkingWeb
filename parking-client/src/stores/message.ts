import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { readMessage, readAllMessages } from '../api/message'
import { useUserStore } from './user'

export interface MessageInfo {
  id: number
  title: string
  content: string
  type: number
  isRead: number
  createTime: string
}

const CACHE_KEY_PREFIX = 'parking_msg_'
const MAX_RECONNECT_DELAY = 30000

export const useMessageStore = defineStore('message', () => {
  const messages = ref<MessageInfo[]>([])
  const ws = ref<WebSocket | null>(null)
  const wsConnected = ref(false)
  const initialSyncDone = ref(false)
  const syncError = ref(false)
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0

  const unreadCount = computed(() => messages.value.filter(m => m.isRead === 0).length)

  function getCacheKey() {
    const userStore = useUserStore()
    return `${CACHE_KEY_PREFIX}${userStore.userInfo?.id || ''}`
  }

  function loadCache() {
    const raw = localStorage.getItem(getCacheKey())
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        messages.value = parsed.messages || []
        return parsed
      } catch { /* ignore */ }
    }
    return null
  }

  function saveCache(lastTimestamp: number, lastId: number) {
    const cache = { messages: messages.value, lastTimestamp, lastId }
    localStorage.setItem(getCacheKey(), JSON.stringify(cache))
  }

  function connect() {
    if (ws.value && (ws.value.readyState === WebSocket.OPEN || ws.value.readyState === WebSocket.CONNECTING)) return

    const userStore = useUserStore()
    const userId = userStore.userInfo?.id
    if (!userId) return

    const cache = loadCache()
    const lastTimestamp = cache?.lastTimestamp || 0
    const lastId = cache?.lastId || 0

    const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const url = `${protocol}://${location.host}/ws/${userId}/messages?token=${encodeURIComponent(userStore.token)}&lastTimestamp=${lastTimestamp}&lastId=${lastId}`

    syncError.value = false
    ws.value = new WebSocket(url)

    ws.value.onopen = () => {
      wsConnected.value = true
      reconnectAttempts = 0
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'sync') {
          if (data.messages && data.messages.length > 0) {
            if (lastTimestamp === 0 && lastId === 0) {
              messages.value = data.messages
            } else {
              messages.value = [...data.messages, ...messages.value]
            }
          }
          initialSyncDone.value = true
          saveCache(data.lastTimestamp || lastTimestamp, data.lastId || lastId)
        } else if (data.type === 'push') {
          messages.value.unshift(data.message)
          saveCache(data.timestamp || 0, data.id || 0)
        }
      } catch {
        // ignore malformed messages
      }
    }

    ws.value.onclose = () => {
      wsConnected.value = false
      scheduleReconnect()
    }

    ws.value.onerror = () => {
      syncError.value = true
      ws.value?.close()
    }
  }

  function scheduleReconnect() {
    if (reconnectTimer) return
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY)
    reconnectAttempts++
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      const userStore = useUserStore()
      if (userStore.isLoggedIn) connect()
    }, delay)
  }

  function disconnect() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    ws.value?.close()
    ws.value = null
    messages.value = []
    wsConnected.value = false
    initialSyncDone.value = false
    syncError.value = false
  }

  function clearCache() {
    localStorage.removeItem(getCacheKey())
  }

  async function markRead(id: number) {
    const msg = messages.value.find(m => m.id === id)
    if (!msg || msg.isRead === 1) return
    await readMessage(id)
    msg.isRead = 1
    const last = messages.value[0]
    saveCache(last ? new Date(last.createTime).getTime() : 0, last ? last.id : 0)
  }

  async function markAllRead() {
    if (unreadCount.value === 0) return
    await readAllMessages()
    messages.value.forEach(m => { m.isRead = 1 })
    const last = messages.value[0]
    saveCache(last ? new Date(last.createTime).getTime() : 0, last ? last.id : 0)
  }

  return {
    messages, wsConnected, initialSyncDone, syncError, unreadCount,
    connect, disconnect, clearCache, loadCache, markRead, markAllRead
  }
})
