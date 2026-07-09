<script setup lang="ts">
import { ref, computed } from 'vue'
import { useOrderStore } from '../stores/order'
import { ElMessage, ElMessageBox } from 'element-plus'
import SettleDialog from './SettleDialog.vue'

const props = defineProps<{
  order: {
    id: number
    orderNo: string
    lotName: string
    spotNumber: string
    plateNumber: string
    status: number
    startTime: string
    endTime: string
    amount: number
    discount: number
    createTime: string
  }
}>()

const orderStore = useOrderStore()
const showSettleDialog = ref(false)

const statusMap: Record<number, { label: string; color: string }> = {
  0: { label: '已预约', color: '#409EFF' },
  1: { label: '进行中', color: '#67C23A' },
  2: { label: '已结算', color: '#999' },
  3: { label: '已取消', color: '#ccc' }
}

const statusInfo = computed(() => statusMap[props.order.status] || { label: '未知', color: '#999' })

function handleEnter() {
  ElMessageBox.confirm('确认入场？入场后开始计时计费', '提示', { confirmButtonText: '确认入场', cancelButtonText: '取消', type: 'info' })
    .then(async () => {
      await orderStore.doEnter(props.order.id)
      ElMessage.success('入场成功')
    })
    .catch(() => {})
}

function handleCancel() {
  ElMessageBox.confirm('确认取消此预约？', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    .then(async () => {
      await orderStore.doCancel(props.order.id)
      ElMessage.success('已取消')
    })
    .catch(() => {})
}

function handleSettle() {
  showSettleDialog.value = true
}

async function handleSettleConfirm(couponId?: number) {
  showSettleDialog.value = false
  await orderStore.doSettle(props.order.id, couponId)
  ElMessage.success('结算成功')
}
</script>

<template>
  <div class="card order-card">
    <div class="order-header">
      <div class="order-lot">
        <el-icon color="#409EFF"><OfficeBuilding /></el-icon>
        <span>{{ order.lotName }}</span>
      </div>
      <div class="order-status" :style="{ color: statusInfo.color, background: statusInfo.color + '15' }">
        {{ statusInfo.label }}
      </div>
    </div>
    <div class="order-info">
      <div class="info-row">
        <span class="info-label">车位</span>
        <span class="info-value">{{ order.spotNumber }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">车牌</span>
        <span class="info-value plate">{{ order.plateNumber }}</span>
      </div>
      <div class="info-row" v-if="order.status === 0">
        <span class="info-label">预约时间</span>
        <span class="info-value">{{ order.createTime }}</span>
      </div>
      <div class="info-row" v-if="order.status === 1">
        <span class="info-label">入场时间</span>
        <span class="info-value">{{ order.startTime }}</span>
      </div>
      <div class="info-row" v-if="order.status === 2">
        <span class="info-label">停车时长</span>
        <span class="info-value">{{ order.startTime }} ~ {{ order.endTime }}</span>
      </div>
      <div class="info-row" v-if="order.status === 2">
        <span class="info-label">实付金额</span>
        <span class="info-value amount">¥{{ (order.amount - order.discount).toFixed(2) }}</span>
      </div>
    </div>
    <div class="order-footer" v-if="order.status === 0">
      <el-button size="small" round @click="handleCancel">取消预约</el-button>
      <el-button type="primary" size="small" round @click="handleEnter">入场</el-button>
    </div>
    <div class="order-footer" v-if="order.status === 1">
      <el-button type="primary" size="small" round @click="handleSettle">立即结算</el-button>
    </div>

    <SettleDialog
      v-if="showSettleDialog"
      :order="order"
      @close="showSettleDialog = false"
      @confirm="handleSettleConfirm"
    />
  </div>
</template>

<style scoped>
.order-card {
  padding: 14px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-lot {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.order-status {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 13px;
  color: #333;
}

.info-value.plate {
  font-weight: 600;
  letter-spacing: 1px;
}

.info-value.amount {
  font-size: 16px;
  font-weight: 700;
  color: #F56C6C;
}

.order-footer {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f5f5f5;
  padding-top: 12px;
}
</style>
