<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useWalletStore } from '../stores/wallet'
import RechargeDialog from '../components/RechargeDialog.vue'

const router = useRouter()
const walletStore = useWalletStore()
const showRecharge = ref(false)

onMounted(() => {
  walletStore.fetchWallet()
  walletStore.fetchLogs()
})

async function onRecharged(amount: number) {
  await walletStore.doRecharge(amount)
  await walletStore.fetchLogs()
  ElMessage.success(`充值 ¥${amount} 成功`)
}
</script>

<template>
  <div v-loading="walletStore.loading" class="page">
    <div class="back-header" @click="router.back()">
      <el-icon :size="20"><ArrowLeft /></el-icon>
      <span class="back-text">钱包</span>
    </div>

    <div class="card balance-card">
      <div class="balance-label">余额 (元)</div>
      <div class="balance-amount">¥{{ walletStore.wallet?.balance.toFixed(2) ?? '0.00' }}</div>
      <el-button type="primary" size="large" round class="recharge-btn" @click="showRecharge = true">
        充值
      </el-button>
    </div>

    <div class="section-title">交易记录</div>

    <div class="log-list">
      <div v-for="log in walletStore.logs" :key="log.id" class="card log-item">
        <div class="log-icon" :class="{ income: log.type === 0, expense: log.type === 1 }">
          <el-icon :size="18">{{ log.type === 0 ? 'TopUp' : 'Bottom' }}</el-icon>
        </div>
        <div class="log-info">
          <div class="log-remark">{{ log.remark }}</div>
          <div class="log-time">{{ log.createTime }}</div>
        </div>
        <div class="log-amount" :class="{ income: log.type === 0, expense: log.type === 1 }">
          {{ log.type === 0 ? '+' : '' }}{{ log.amount }}
        </div>
      </div>
    </div>

    <RechargeDialog
      v-if="showRecharge"
      v-model="showRecharge"
      @success="onRecharged"
    />
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

.balance-card {
  text-align: center;
  padding: 32px 16px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.balance-label {
  font-size: 13px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 20px;
}

.recharge-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 15px;
  padding: 12px 40px;
}

.recharge-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
}

.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.log-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.log-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.log-icon.income {
  background: #e1f3d8;
  color: #67C23A;
}

.log-icon.expense {
  background: #fde2e2;
  color: #F56C6C;
}

.log-info {
  flex: 1;
}

.log-remark {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.log-time {
  font-size: 11px;
  color: #bbb;
  margin-top: 2px;
}

.log-amount {
  font-size: 16px;
  font-weight: 600;
}

.log-amount.income {
  color: #67C23A;
}

.log-amount.expense {
  color: #F56C6C;
}
</style>
