<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrderStore } from '../stores/order'
import OrderCard from '../components/OrderCard.vue'

const orderStore = useOrderStore()
const activeTab = ref('reserved')

const filteredOrders = computed(() => {
  const tab = tabs.find(t => t.key === activeTab.value)
  if (!tab) return orderStore.orders
  return orderStore.orders.filter(o => o.status === tab.status)
})

const tabs = [
  { key: 'reserved', label: '已预约', status: 0 },
  { key: 'active', label: '进行中', status: 1 },
  { key: 'settled', label: '已结算', status: 2 }
]

onMounted(() => {
  orderStore.fetchOrders()
})

function onTabChange(key: string) {
  activeTab.value = key
}
</script>

<template>
  <div v-loading="orderStore.loading" class="page">
    <div class="page-title">我的订单</div>

    <div class="order-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-item"
        :class="{ active: activeTab === tab.key }"
        @click="onTabChange(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="order-list">
      <OrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
      />
    </div>

    <div v-if="filteredOrders.length === 0" class="empty-state">
      <el-empty :description="`暂无${tabs.find(t=>t.key===activeTab)?.label}订单`" />
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
</style>
