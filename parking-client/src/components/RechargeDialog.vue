<script setup lang="ts">
import { ref } from 'vue'
import { useWalletStore } from '../stores/wallet'
import { ElMessage } from 'element-plus'

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success', amount: number): void
}>()

const walletStore = useWalletStore()
const selectedAmount = ref(0)
const customAmount = ref('')

const amounts = [10, 20, 50, 100, 200, 500]
const loading = ref(false)

function selectAmount(amount: number) {
  selectedAmount.value = amount
  customAmount.value = ''
}

function getFinalAmount(): number | null {
  if (selectedAmount.value > 0) return selectedAmount.value
  if (customAmount.value) {
    const val = parseFloat(customAmount.value)
    if (val > 0) return val
  }
  return null
}

async function handleRecharge() {
  const amount = getFinalAmount()
  if (!amount) {
    ElMessage.warning('请选择或输入充值金额')
    return
  }
  if (amount < 1) {
    ElMessage.warning('最低充值1元')
    return
  }
  loading.value = true
  try {
    await walletStore.doRecharge(amount)
    emit('success', amount)
    close()
  } catch {
    // handled
  } finally {
    loading.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <div class="dialog-overlay" @click.self="close">
    <div class="dialog-content">
      <div class="dialog-header">
        <div class="dialog-title">充值</div>
        <el-icon @click="close" class="close-icon"><Close /></el-icon>
      </div>

      <div class="dialog-body">
        <div class="quick-amounts">
          <div
            v-for="amount in amounts"
            :key="amount"
            class="amount-btn"
            :class="{ selected: selectedAmount === amount }"
            @click="selectAmount(amount)"
          >
            ¥{{ amount }}
          </div>
        </div>

        <div class="custom-input">
          <span class="custom-label">自定义金额</span>
          <div class="custom-field">
            <span class="prefix">¥</span>
            <el-input
              v-model="customAmount"
              type="number"
              placeholder="输入金额"
              :min="1"
              @focus="selectedAmount = 0"
            />
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <el-button @click="close" round>取消</el-button>
        <el-button
          type="primary"
          round
          :loading="loading"
          :disabled="!getFinalAmount()"
          @click="handleRecharge"
        >
          确认充值 {{ getFinalAmount() ? '¥' + getFinalAmount() : '' }}
        </el-button>
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
  margin-bottom: 24px;
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

.quick-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.amount-btn {
  padding: 14px 0;
  text-align: center;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  -webkit-tap-highlight-color: transparent;
}

.amount-btn.selected {
  border-color: #409EFF;
  background: #f0f7ff;
  color: #409EFF;
}

.amount-btn:active {
  transform: scale(0.95);
}

.custom-input {
  margin-bottom: 8px;
}

.custom-label {
  display: block;
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.custom-field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prefix {
  font-size: 20px;
  color: #333;
  font-weight: 600;
}

.custom-field :deep(.el-input__wrapper) {
  border-radius: 12px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.dialog-footer .el-button {
  flex: 1;
  height: 44px;
}
</style>
