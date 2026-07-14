import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createOrder, getOrders, enterPark, settleOrder, cancelOrder } from '../api/order'

export interface OrderInfo {
  id: number
  orderNo: string
  lotId: number
  lotName: string
  spotId: number
  spotNumber: string
  plateNumber: string
  status: number
  startTime: string
  endTime: string
  amount: number
  discount: number
  createTime: string
}

interface TabState {
  items: OrderInfo[]
  loading: boolean
  loaded: boolean
  nextTimestamp?: number
  nextId?: number
  hasMore: boolean
}

const PAGE_SIZE = 10

function freshTab(): TabState {
  return { items: [], loading: false, loaded: false, hasMore: true }
}

export const useOrderStore = defineStore('order', () => {
  const activeStatus = ref(0)
  const tabMap = ref<Record<number, TabState>>({})

  const currentOrders = computed(() => tabMap.value[activeStatus.value]?.items || [])

  const initialLoading = computed(() => {
    const t = tabMap.value[activeStatus.value]
    return !t?.loaded && t?.loading
  })

  function ensureTab(status: number): TabState {
    if (!tabMap.value[status]) tabMap.value[status] = freshTab()
    return tabMap.value[status]!
  }

  async function fetchTab(status: number, append = false) {
    const t = ensureTab(status)
    if (t.loading) return
    if (append && !t.hasMore) return
    t.loading = true
    try {
      const params: any = { status, pageSize: PAGE_SIZE }
      if (append && t.nextTimestamp !== undefined) {
        params.lastTimestamp = t.nextTimestamp
        params.lastId = t.nextId
      }
      const res: any = await getOrders(params)
      const page = res.data
      if (append) t.items.push(...page.data)
      else t.items = page.data
      t.nextTimestamp = page.nextTimestamp
      t.nextId = page.nextId
      t.hasMore = page.hasMore
      t.loaded = true
    } finally {
      t.loading = false
    }
  }

  function switchTab(status: number) {
    activeStatus.value = status
    if (!ensureTab(status).loaded) fetchTab(status)
  }

  function loadMore() {
    fetchTab(activeStatus.value, true)
  }

  function refreshCurrent() {
    tabMap.value[activeStatus.value] = freshTab()
    fetchTab(activeStatus.value)
  }

  async function reserve(data: { lotId: number; spotId: number; seq: number; plateNumber: string }) {
    const res: any = await createOrder(data)
    refreshCurrent()
    return res
  }

  async function directEnter(data: { lotId: number; spotId: number; seq: number; plateNumber: string }) {
    const res: any = await createOrder(data)
    const orderId = res.data.id
    await enterPark(orderId)
    refreshCurrent()
    return res
  }

  async function doEnter(id: number) {
    await enterPark(id)
    refreshCurrent()
  }

  async function doSettle(id: number, couponId?: number) {
    const res: any = await settleOrder(id, { couponId: couponId ?? null })
    refreshCurrent()
    return res
  }

  async function doCancel(id: number) {
    await cancelOrder(id)
    refreshCurrent()
  }

  return {
    activeStatus,
    currentOrders,
    initialLoading,
    tabMap,
    fetchTab,
    switchTab,
    loadMore,
    refreshCurrent,
    reserve,
    directEnter,
    doEnter,
    doSettle,
    doCancel
  }
})
