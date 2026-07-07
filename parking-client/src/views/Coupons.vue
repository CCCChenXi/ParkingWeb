<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useInfiniteScroll } from '@vueuse/core'
import { useCouponStore } from '../stores/coupon'
import type { CouponInfo } from '../stores/coupon'
import BottomSheet from '../components/BottomSheet.vue'
import { usePullToRefresh } from '../composables/usePullToRefresh'

const router = useRouter()
const store = useCouponStore()

const activeTab = ref('available')
const pageRef = ref<HTMLElement | null>(null)
const showDetail = ref(false)
const detailItem = ref<CouponInfo | null>(null)
const initialLoadDone = ref(false)

const mineStatusLabels = ['待使用', '已使用', '已过期']

onMounted(async () => {
  await store.refreshAvailable()
  nextTick(() => { initialLoadDone.value = true })
})

function onTabChange(tab: string) {
  activeTab.value = tab
  if (tab === 'mine' && store.mine.items.length === 0) {
    store.refreshMine()
  }
}

useInfiniteScroll(
  pageRef,
  async () => {
    if (!initialLoadDone.value) return
    if (activeTab.value === 'available') {
      await store.loadMoreAvailable()
    } else {
      await store.loadMoreMine()
    }
  },
  { distance: 10 }
)

const { refreshing } = usePullToRefresh(pageRef, async () => {
  if (activeTab.value === 'available') {
    await store.refreshAvailable()
  } else {
    await store.refreshMine()
  }
})

async function onShowDetail(coupon: CouponInfo) {
  if (activeTab.value === 'available') {
    await store.fetchAvailableDetail(coupon.id)
    detailItem.value = store.detail ? { ...store.detail, claim: coupon.claim } : null
  } else {
    const id = coupon.couponId ?? coupon.id
    await store.fetchMineDetail(id)
    detailItem.value = store.detail ? { ...store.detail, status: coupon.status } : null
  }
  showDetail.value = true
}

async function onClaimFromDetail() {
  if (!detailItem.value) return
  try {
    if (detailItem.value.type === 1) {
      await store.flashSale(detailItem.value.id)
      ElMessage.success('秒杀成功！')
    } else {
      await store.claim(detailItem.value.id)
      ElMessage.success('领取成功')
    }
    showDetail.value = false
    await store.refreshAvailable()
  } catch {
    // handled by interceptor
  }
}

async function onStatusChange(status: number | null) {
  await store.setMineStatus(status)
}

let searchTimer: ReturnType<typeof setTimeout>
function onSearchInput(val: string) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.setMineKeyword(val)
  }, 300)
}

function getStatusText(status?: number) {
  return status === 0 ? '未使用' : status === 1 ? '已使用' : '已过期'
}
</script>

<template>
  <div ref="pageRef" class="page">
    <div class="back-header" @click="router.back()">
      <el-icon :size="20"><ArrowLeft /></el-icon>
      <span class="back-text">优惠券</span>
    </div>

    <div class="coupon-tabs">
      <div class="tab-item" :class="{ active: activeTab === 'available' }" @click="onTabChange('available')">
        可领取
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'mine' }" @click="onTabChange('mine')">
        我的优惠券
      </div>
    </div>

    <!-- Available tab -->
    <div v-show="activeTab === 'available'" v-loading="store.available.loading" class="tab-content">
      <div v-if="refreshing" class="refresh-indicator">刷新中...</div>
      <div class="coupon-list">
        <div v-for="c in store.available.items" :key="c.id" class="card coupon-card"
             :class="{
               flash: c.type === 1 && !c.claim,
               claim: c.claim
             }" @click="onShowDetail(c)">
          <div class="coupon-left">
            <div class="coupon-amount">
              <span class="amount-symbol">¥</span>
              <span class="amount-value">{{ c.discountAmount }}</span>
            </div>
            <div class="coupon-min">满{{ c.minAmount }}可用</div>
          </div>
          <div class="coupon-divider" />
          <div class="coupon-right">
            <div class="right-text">
              <div class="coupon-name">{{ c.name }}</div>
              <div class="coupon-desc">{{ c.description }}</div>
              <div class="coupon-extra">
                <span class="coupon-date">{{ c.startTime }} ~ {{ c.endTime }}</span>
              </div>
            </div>
            <el-button v-if="!c.claim"
              :type="c.type === 1 ? 'danger' : 'success'"
              size="small" round
              @click.stop="onShowDetail(c)">
              {{ c.type === 1 ? '秒杀' : '领取' }}
            </el-button>
            <el-button v-else size="small" round disabled>已领取</el-button>
          </div>
        </div>
        <div v-if="store.available.loadingMore" class="list-footer">正在加载更多...</div>
        <div v-else-if="!store.available.hasMore && store.available.items.length > 0" class="list-footer">— 没有更多了 —</div>
        <div v-if="store.available.items.length === 0 && !store.available.loading" class="empty-state">
          <el-empty description="暂无可用优惠券" />
        </div>
      </div>
    </div>

    <!-- Mine tab -->
    <div v-show="activeTab === 'mine'" class="tab-content">
      <div class="sub-tabs">
        <div class="sub-tab" :class="{ active: store.mine.status === null }" @click="onStatusChange(null)">全部</div>
        <div v-for="(label, idx) in mineStatusLabels" :key="idx" class="sub-tab"
             :class="{ active: store.mine.status === idx }" @click="onStatusChange(idx)">
          {{ label }}
        </div>
      </div>

      <div class="search-bar">
        <el-icon :size="16"><Search /></el-icon>
        <input class="search-input" placeholder="输入券名搜索"
               @input="onSearchInput(($event.target as HTMLInputElement).value)" />
      </div>

      <div v-loading="store.mine.loading" class="mine-list-wrap">
        <div v-if="refreshing" class="refresh-indicator">刷新中...</div>
        <div class="coupon-list">
          <div v-for="c in store.mine.items" :key="c.id" class="card coupon-card mine"
               :class="{ used: c.status === 1, expired: c.status === 2 }" @click="onShowDetail(c)">
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
                  {{ getStatusText(c.status) }}
                </span>
                <span class="coupon-date">{{ c.startTime }} ~ {{ c.endTime }}</span>
              </div>
              <el-button v-if="c.status === 0" size="small" round type="primary" @click.stop="">去使用</el-button>
            </div>
          </div>
          <div v-if="store.mine.loadingMore" class="list-footer">正在加载更多...</div>
          <div v-else-if="!store.mine.hasMore && store.mine.items.length > 0" class="list-footer">— 没有更多了 —</div>
          <div v-if="store.mine.items.length === 0 && !store.mine.loading" class="empty-state">
            <el-empty description="暂无优惠券" />
          </div>
        </div>
      </div>
    </div>

    <!-- BottomSheet detail -->
    <BottomSheet v-model="showDetail">
      <div v-loading="store.detailLoading" class="detail-body">
        <template v-if="detailItem">
          <div class="detail-amount-area">
            <div class="detail-amount">
              <span class="detail-symbol">¥</span>
              <span class="detail-value">{{ detailItem.discountAmount }}</span>
            </div>
            <div class="detail-min">满{{ detailItem.minAmount }}可用</div>
          </div>
          <div class="detail-info">
            <div class="info-row"><span class="info-label">名称</span><span>{{ detailItem.name }}</span></div>
            <div class="info-row"><span class="info-label">描述</span><span>{{ detailItem.description }}</span></div>
            <div class="info-row"><span class="info-label">类型</span><span>{{ detailItem.type === 1 ? '秒杀券' : '普通券' }}</span></div>
            <div v-if="detailItem.stock != null" class="info-row"><span class="info-label">总库存</span><span>{{ detailItem.stock }} 张</span></div>
            <div v-if="detailItem.remainStock != null" class="info-row"><span class="info-label">剩余</span><span>{{ detailItem.remainStock }} 张</span></div>
            <div class="info-row"><span class="info-label">有效期</span><span>{{ detailItem.startTime }} ~ {{ detailItem.endTime }}</span></div>
          </div>
          <div class="detail-action">
            <el-button v-if="activeTab === 'available' && !detailItem.claim" type="primary" round class="action-btn"
                       @click="onClaimFromDetail">
              {{ detailItem.type === 1 ? '秒杀抢购' : '立即领取' }}
            </el-button>
            <div v-else-if="activeTab === 'available' && detailItem.claim" class="status-tag">已领取</div>
            <el-button v-else-if="detailItem.status === 0" type="primary" round class="action-btn">
              去使用
            </el-button>
            <div v-else class="status-tag">{{ getStatusText(detailItem.status) }}</div>
          </div>
        </template>
      </div>
    </BottomSheet>
  </div>
</template>

<style scoped>
.page {
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
}

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
  background: #fff;
  color: #409EFF;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.tab-content {
  min-height: 200px;
}

.sub-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.sub-tab {
  padding: 4px 14px;
  font-size: 13px;
  color: #666;
  border-radius: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.sub-tab.active {
  background: #409EFF;
  color: #fff;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 12px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  outline: none;
}

.search-input::placeholder {
  color: #bbb;
}

.refresh-indicator {
  text-align: center;
  font-size: 12px;
  color: #999;
  padding: 12px 0;
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
.coupon-card.flash .coupon-amount {
  color: #F56C6C;
}

.coupon-card.claim {
  opacity: 0.5;
}
.coupon-card.claim .coupon-amount {
  color: #999;
}

.coupon-card:not(.flash):not(.claim) .coupon-amount {
  color: #67C23A;
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
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.right-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
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

.coupon-right .el-button {
  flex-shrink: 0;
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

.list-footer {
  text-align: center;
  font-size: 12px;
  color: #bbb;
  padding: 16px 0;
}

/* BottomSheet detail styles */
.detail-body {
  min-height: 200px;
}

.detail-amount-area {
  text-align: center;
  padding: 20px 0 24px;
}

.detail-amount {
  display: flex;
  align-items: baseline;
  justify-content: center;
  color: #F56C6C;
}

.detail-symbol {
  font-size: 18px;
}

.detail-value {
  font-size: 42px;
  font-weight: 700;
}

.detail-min {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.info-label {
  color: #999;
}

.detail-action {
  padding: 20px 0 12px;
}

.action-btn {
  width: 100%;
}

.status-tag {
  text-align: center;
  font-size: 14px;
  color: #999;
  padding: 10px 0;
}
</style>
