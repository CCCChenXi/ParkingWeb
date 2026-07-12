<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCouponStore } from '../stores/coupon'

const props = defineProps<{
  order: {
    id: number
    lotName: string
    spotNumber: string
    plateNumber: string
    startTime: string
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', couponId?: number): void
}>()

const couponStore = useCouponStore()
const selectedCouponId = ref<number | undefined>(undefined)

const exitTime = computed(() => {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
})

const durationText = computed(() => {
  if (!props.order.startTime) return '--'
  const start = new Date(props.order.startTime)
  const end = new Date()
  const diffMs = end.getTime() - start.getTime()
  const hours = Math.floor(diffMs / 3600000)
  const mins = Math.floor((diffMs % 3600000) / 60000)
  if (hours > 0) return `${hours}小时${mins}分钟`
  return `${mins}分钟`
})

onMounted(() => {
  couponStore.refreshMine()
})

function toggleCoupon(coupon: any) {
  if (selectedCouponId.value === coupon.id) {
    selectedCouponId.value = undefined
  } else {
    selectedCouponId.value = coupon.id
  }
}

function confirm() {
  emit('confirm', selectedCouponId.value)
}
</script>

<template>
  <div class="dialog-overlay" @click.self="emit('close')">
    <div class="dialog-content">
      <div class="dialog-header">
        <div class="dialog-title">结算停车</div>
        <el-icon @click="emit('close')" class="close-icon"><Close /></el-icon>
      </div>

      <div class="dialog-body">
        <div class="info-line">
          <span class="info-label">停车场</span>
          <span class="info-val">{{ order.lotName }}</span>
        </div>
        <div class="info-line">
          <span class="info-label">车位</span>
          <span class="info-val spot-badge">{{ order.spotNumber }}</span>
        </div>
        <div class="info-line">
          <span class="info-label">车牌</span>
          <span class="info-val plate">{{ order.plateNumber }}</span>
        </div>
        <div class="info-line">
          <span class="info-label">入场时间</span>
          <span class="info-val">{{ order.startTime }}</span>
        </div>
        <div class="info-line">
          <span class="info-label">出场时间</span>
          <span class="info-val">{{ exitTime }}</span>
        </div>
        <div class="info-line">
          <span class="info-label">停车时长</span>
          <span class="info-val">{{ durationText }}</span>
        </div>

        <div class="form-section">
          <div class="form-label">优惠券 (可选)</div>
          <div v-if="couponStore.mine.items.length > 0" class="coupon-select">
            <div
              v-for="c in couponStore.mine.items.filter(i => i.status === 0)"
              :key="c.id"
              class="coupon-option"
              :class="{ selected: selectedCouponId === c.id }"
              @click="toggleCoupon(c)"
            >
              <div class="coupon-left">
                <span class="c-amount">¥{{ c.discountAmount }}</span>
                <span class="c-name">{{ c.name }}</span>
              </div>
              <span class="c-min">满{{ c.minAmount }}可用</span>
              <el-icon v-if="selectedCouponId === c.id" color="#409EFF"><CircleCheck /></el-icon>
            </div>
          </div>
          <div v-else class="no-coupon">暂无可用优惠券</div>
        </div>
      </div>

      <div class="dialog-footer">
        <el-button @click="emit('close')" round>取消</el-button>
        <el-button type="primary" round @click="confirm">确认结算</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.dialog-content {
  width: 430px;
  max-width: 100%;
  background: #ffffff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.close-icon {
  cursor: pointer;
  color: #999;
  font-size: 20px;
}

.info-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-label {
  font-size: 13px;
  color: #999;
}

.info-val {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.spot-badge {
  color: #409EFF;
  font-weight: 700;
}

.plate {
  font-weight: 600;
  letter-spacing: 1px;
}

.form-section {
  margin-top: 16px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.coupon-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coupon-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.coupon-option.selected {
  border-color: #409EFF;
  background: #f0f7ff;
}

.coupon-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.c-amount {
  font-size: 16px;
  font-weight: 700;
  color: #F56C6C;
}

.c-name {
  font-size: 12px;
  color: #666;
}

.c-min {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}

.no-coupon {
  font-size: 12px;
  color: #ccc;
  text-align: center;
  padding: 12px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.dialog-footer .el-button {
  flex: 1;
  height: 44px;
}
</style>
