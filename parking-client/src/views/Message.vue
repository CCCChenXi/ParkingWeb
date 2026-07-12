<script setup lang="ts">
import { useMessageStore } from '../stores/message'
import MessageItem from '../components/MessageItem.vue'

const messageStore = useMessageStore()

function onMarkRead(id: number) {
  messageStore.markRead(id)
}

function markAllRead() {
  messageStore.markAllRead()
}
</script>

<template>
  <div class="page">
    <div v-if="!messageStore.initialSyncDone && !messageStore.syncError" class="sync-bar">同步中...</div>
    <div v-if="messageStore.syncError" class="sync-bar error">连接失败，将自动重试</div>

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

    <div v-if="messageStore.initialSyncDone && messageStore.messages.length === 0" class="empty-state">
      <el-empty description="暂无消息" />
    </div>
  </div>
</template>

<style scoped>
.sync-bar {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 6px 0;
}
.sync-bar.error {
  color: #F56C6C;
}
.message-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty-state {
  margin-top: 60px;
}
</style>
