<script setup lang="ts">
import { onMounted } from 'vue'
import { useMessageStore } from '../stores/message'
import MessageItem from '../components/MessageItem.vue'

const messageStore = useMessageStore()

onMounted(() => {
  messageStore.fetchMessages()
})

function onMarkRead(id: number) {
  messageStore.markRead(id)
}

function markAllRead() {
  messageStore.markAllRead()
}
</script>

<template>
  <div v-loading="messageStore.loading" class="page">
    <div class="flex-between" style="margin-bottom: 16px;">
      <div class="page-title" style="margin-bottom: 0;">消息</div>
      <el-button text type="primary" size="small" @click="markAllRead">
        全部已读
      </el-button>
    </div>

    <div class="message-list">
      <MessageItem
        v-for="msg in messageStore.messages"
        :key="msg.id"
        :message="msg"
        @mark-read="onMarkRead"
      />
    </div>

    <div v-if="messageStore.messages.length === 0" class="empty-state">
      <el-empty description="暂无消息" />
    </div>
  </div>
</template>

<style scoped>
.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  margin-top: 60px;
}
</style>
