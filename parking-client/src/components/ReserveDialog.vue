<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useCouponStore } from '../stores/coupon'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  spot: any
  lotName: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'confirm', data: { plateNumber: string; couponId?: number }): void
}>()

const userStore = useUserStore()
const couponStore = useCouponStore()

const selectedPlate = ref('')
const selectedCouponId = ref<number | undefined>(undefined)

onMounted(() => {
  userStore.fetchVehicles()
  couponStore.fetchUserCoupons()
  if (userStore.vehicles.length > 0) {
    selectedPlate.value = userStore.vehicles[0].plateNumber
  }
})

function confirm() {
  if (!selectedPlate.value) {
    ElMessage.warning('请选择车辆')
    return
  }
  emit('confirm', {
    plateNumber: selectedPlate.value,
    couponId: selectedCouponId.value
  })
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-content">
      <div class="dialog-header">
        <div class="dialog-title">预约车位</div>
        <el-icon @click="close" class="close-icon"><Close /></el-icon>
      </div>

      <div class="dialog-body">
        <div class="info-line">
          <span class="info-label">停车场</span>
          <span class="info-val">{{ lotName }}</span>
        </div>
        <div class="info-line">
          <span class="info-label">车位</span>
          <span class="info-val spot-badge">{{ spot.spotNumber }}</span>
        </div>
        <div class="info-line">
          <span class="info-label">车位类型</span>
          <span class="info-val">{{ spot.type === 2 ? '新能源充电桩' : spot.type === 1 ? '大型车位' : '标准车位' }}</span>
        </div>

        <div class="form-section">
          <div class="form-label">选择车辆</div>
          <el-radio-group v-model="selectedPlate" class="vehicle-group">
            <el-radio
              v-for="v in userStore.vehicles"
              :key="v.id"
              :value="v.plateNumber"
              class="vehicle-radio"
            >
              <div class="vehicle-option">
                <span class="v-plate">{{ v.plateNumber }}</span>
                <span class="v-brand">{{ v.brand }}</span>
              </div>
            </el-radio>
          </el-radio-group>
        </div>

        <div class="form-section">
          <div class="form-label">优惠券 (可选)</div>
          <div v-if="couponStore.userCoupons.length > 0" class="coupon-select">
            <div
              v-for="c in couponStore.userCoupons"
              :key="c.id"
              class="coupon-option"
              :class="{ selected: selectedCouponId === c.id }"
              @click="selectedCouponId = selectedCouponId === c.id ? undefined : c.id"
            >
              <span class="c-name">¥{{ c.discountAmount }} {{ c.name }}</span>
              <span class="c-min">满{{ c.minAmount }}可用</span>
              <el-icon v-if="selectedCouponId === c.id" color="#409EFF"><CircleCheck /></el-icon>
            </div>
          </div>
          <div v-else class="no-coupon">暂无可用优惠券</div>
        </div>

        <div class="notice">
          <el-icon color="#E6A23C"><WarningFilled /></el-icon>
          <span>预约后15分钟内未入场将自动取消</span>
        </div>
      </div>

      <div class="dialog-footer">
        <el-button @click="close" round>取消</el-button>
        <el-button type="primary" round @click="confirm">确认预约</el-button>
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

.form-section {
  margin-top: 16px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.vehicle-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vehicle-radio {
  margin-right: 0 !important;
}

.vehicle-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.v-plate {
  font-weight: 600;
  color: #1a1a1a;
  font-size: 14px;
}

.v-brand {
  font-size: 12px;
  color: #999;
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

.c-name {
  flex: 1;
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.c-min {
  font-size: 11px;
  color: #999;
}

.no-coupon {
  font-size: 12px;
  color: #ccc;
  text-align: center;
  padding: 12px;
}

.notice {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px 12px;
  background: #fffbe6;
  border-radius: 10px;
  font-size: 12px;
  color: #b8860b;
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
