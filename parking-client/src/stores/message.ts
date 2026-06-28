import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMessages, readMessage, readAllMessages } from '../api/message'

export interface MessageInfo {
  id: number
  title: string
  content: string
  type: number
  isRead: number
  createTime: string
}

export const useMessageStore = defineStore('message', () => {
  const messages = ref<MessageInfo[]>([])
  const loading = ref(false)

  const unreadCount = computed(() => messages.value.filter(m => m.isRead === 0).length)

  async function fetchMessages() {
    loading.value = true
    try {
      const res: any = await getMessages()
      messages.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  async function markRead(id: number) {
    await readMessage(id)
    const msg = messages.value.find(m => m.id === id)
    if (msg) msg.isRead = 1
  }

  async function markAllRead() {
    await readAllMessages()
    messages.value.forEach(m => { m.isRead = 1 })
  }

  return {
    messages,
    loading,
    unreadCount,
    fetchMessages,
    markRead,
    markAllRead
  }
})
