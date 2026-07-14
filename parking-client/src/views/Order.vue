<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useInfiniteScroll } from '@vueuse/core'
import { useOrderStore } from '../stores/order'
import OrderCard from '../components/OrderCard.vue'

const orderStore = useOrderStore()
const listRef = ref<HTMLDivElement>()

const tabs = [
  { key: 'reserved', label: '已预约', status: 0 },
  { key: 'active', label: '进行中', status: 1 },
  { key: 'settled', label: '已结算', status: 2 },
  { key: 'cancelled', label: '已取消', status: 3 }
]
const activeKey = ref('reserved')

onMounted(() => orderStore.switchTab(0))

function onTabClick(key: string) {
  activeKey.value = key
  const t = tabs.find(x => x.key === key)
  if (t) orderStore.switchTab(t.status)
}

useInfiniteScroll(listRef, () => orderStore.loadMore(), { distance: 10 })
</script>

<template>
  <div v-loading="orderStore.initialLoading" class="page">
    <div class="page-title">我的订单</div>

    <div class="order-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeKey === tab.key }"
        @click="onTabClick(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div ref="listRef" class="order-list">
      <OrderCard
        v-for="order in orderStore.currentOrders"
        :key="order.id"
        :order="order"
      />
      <div v-if="orderStore.tabMap[orderStore.activeStatus]?.loading && orderStore.tabMap[orderStore.activeStatus]?.loaded" class="load-more">加载中...</div>
      <div v-else-if="orderStore.tabMap[orderStore.activeStatus]?.hasMore === false && orderStore.currentOrders.length > 0" class="no-more">没有更多了</div>
    </div>

    <div v-if="!orderStore.currentOrders.length && !orderStore.initialLoading" class="empty-state">
      <el-empty :description="`暂无${tabs.find(t=>t.key===activeKey)?.label}订单`" />
    </div>
  </div>
</template>

<style scoped>
.order-tabs {
  display: flex;
  background: #f5f5f5;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 13px;
  color: #666;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.tab-item.active {
  background: #ffffff;
  color: #409EFF;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  margin-top: 60px;
}

.load-more,
.no-more {
  text-align: center;
  font-size: 12px;
  color: #ccc;
  padding: 12px 0;
}
</style>
