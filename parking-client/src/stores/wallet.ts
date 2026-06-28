import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getWallet, recharge, getWalletLogs } from '../api/wallet'

export interface WalletInfo {
  id: number
  balance: number
}

export interface WalletLog {
  id: number
  amount: number
  type: number
  remark: string
  createTime: string
}

export const useWalletStore = defineStore('wallet', () => {
  const wallet = ref<WalletInfo | null>(null)
  const logs = ref<WalletLog[]>([])

  async function fetchWallet() {
    const res: any = await getWallet()
    wallet.value = res.data
  }

  async function doRecharge(amount: number) {
    const res: any = await recharge(amount)
    if (wallet.value) wallet.value.balance = res.data.balance
    return res
  }

  async function fetchLogs() {
    const res: any = await getWalletLogs()
    logs.value = res.data || []
  }

  return {
    wallet,
    logs,
    fetchWallet,
    doRecharge,
    fetchLogs
  }
})
