<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useCouponStore } from '../stores/coupon'

const router = useRouter()
const couponStore = useCouponStore()

const activeTab = ref('available')

onMounted(() => {
  couponStore.fetchAvailable()
  couponStore.fetchUserCoupons()
})

async function handleClaim(id: number, type: number) {
  try {
    if (type === 1) {
      await couponStore.flashSale(id)
      ElMessage.success('秒杀成功！')
    } else {
      await couponStore.claim(id)
      ElMessage.success('领取成功')
    }
  } catch {
    // handled
  }
}
</script>

<template>
  <div class="page">
    <div class="back-header" @click="router.back()">
      <el-icon :size="20"><ArrowLeft /></el-icon>
      <span class="back-text">优惠券</span>
    </div>

    <div class="coupon-tabs">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'available' }"
        @click="activeTab = 'available'"
      >
        可领取
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'mine' }"
        @click="activeTab = 'mine'"
      >
        我的优惠券
      </div>
    </div>

    <div v-if="activeTab === 'available'" class="coupon-list">
      <div v-for="c in couponStore.availableCoupons" :key="c.id" class="card coupon-card" :class="{ flash: c.type === 1 }">
        <div class="coupon-left">
          <div class="coupon-amount">
            <span class="amount-symbol">¥</span>
            <span class="amount-value">{{ c.discountAmount }}</span>
          </div>
          <div class="coupon-min">满{{ c.minAmount }}可用</div>
        </div>
        <div class="coupon-divider" />
        <div class="coupon-right">
          <div class="coupon-name">{{ c.name }}</div>
          <div class="coupon-desc">{{ c.description }}</div>
          <div class="coupon-extra">
            <span class="coupon-stock" v-if="c.type === 1">剩余 {{ c.remainStock }}/{{ c.stock }}</span>
            <span class="coupon-date">{{ c.startTime }} ~ {{ c.endTime }}</span>
          </div>
          <el-button
            :type="c.type === 1 ? 'danger' : 'primary'"
            size="small"
            round
            :disabled="c.remainStock <= 0"
            @click.stop="handleClaim(c.id, c.type)"
          >
            {{ c.type === 1 ? '秒杀' : '领取' }}
          </el-button>
        </div>
      </div>
      <div v-if="couponStore.availableCoupons.length === 0" class="empty-state">
        <el-empty description="暂无可用优惠券" />
      </div>
    </div>

    <div v-if="activeTab === 'mine'" class="coupon-list">
      <div v-for="c in couponStore.userCoupons" :key="c.id" class="card coupon-card mine" :class="{ used: c.status === 1, expired: c.status === 2 }">
        <div class="coupon-left">
          <div class="coupon-amount">
            <span class="amount-symbol">¥</span>
            <span class="amount-value">{{ c.discountAmount }}</span>
          </div>
          <div class="coupon-min">满{{ c.minAmount }}可用</div>
        </div>
        <div class="coupon-divider" />
        <div class="coupon-right">
          <div class="coupon-name">{{ c.name }}</div>
          <div class="coupon-desc">{{ c.description }}</div>
          <div class="coupon-extra">
            <span class="coupon-status" :class="{ 'status-used': c.status === 1, 'status-expired': c.status === 2 }">
              {{ c.status === 0 ? '未使用' : c.status === 1 ? '已使用' : '已过期' }}
            </span>
            <span class="coupon-date">{{ c.startTime }} ~ {{ c.endTime }}</span>
          </div>
        </div>
      </div>
      <div v-if="couponStore.userCoupons.length === 0" class="empty-state">
        <el-empty description="暂无优惠券" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.back-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.coupon-tabs {
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

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-card {
  display: flex;
  align-items: stretch;
  padding: 0;
  overflow: hidden;
  min-height: 110px;
}

.coupon-card.flash {
  background: linear-gradient(135deg, #fff5f5, #fff0f0);
}

.coupon-card.mine.used {
  opacity: 0.6;
}

.coupon-card.mine.expired {
  opacity: 0.4;
}

.coupon-left {
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 8px;
  flex-shrink: 0;
}

.coupon-amount {
  display: flex;
  align-items: baseline;
  color: #F56C6C;
}

.amount-symbol {
  font-size: 14px;
}

.amount-value {
  font-size: 32px;
  font-weight: 700;
}

.coupon-min {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.coupon-divider {
  width: 1px;
  background: repeating-linear-gradient(to bottom, #e8e8e8 0, #e8e8e8 6px, transparent 6px, transparent 12px);
  flex-shrink: 0;
}

.coupon-right {
  flex: 1;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
}

.coupon-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.coupon-desc {
  font-size: 12px;
  color: #999;
}

.coupon-extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #bbb;
  margin-top: auto;
}

.coupon-stock {
  color: #F56C6C;
}

.coupon-right .el-button {
  position: absolute;
  right: 16px;
  bottom: 14px;
}

.coupon-status {
  font-weight: 500;
}

.status-used {
  color: #999;
}

.status-expired {
  color: #ccc;
}

.empty-state {
  margin-top: 60px;
}
</style>
