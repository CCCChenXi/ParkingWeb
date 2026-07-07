import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import {
  getAvailableCoupons, claimCoupon, flashSaleCoupon,
  getUserCoupons, getAvailableCouponDetail, getMineCouponDetail
} from '../api/coupon'
import type { CursorParams } from '../api/coupon'

export interface CouponInfo {
  id: number
  couponId?: number
  name: string
  description?: string
  discountAmount: number
  minAmount: number
  type: number
  claim?: boolean
  startTime: string
  endTime: string
  status?: number
  stock?: number
  remainStock?: number
}

interface TabState {
  items: CouponInfo[]
  cursor: { timestamp: number | null; id: number | null }
  hasMore: boolean
  loading: boolean
  loadingMore: boolean
}

function initialTabState(): TabState {
  return {
    items: [],
    cursor: { timestamp: null, id: null },
    hasMore: true,
    loading: false,
    loadingMore: false
  }
}

export const useCouponStore = defineStore('coupon', () => {
  const available = reactive<TabState>(initialTabState())
  const mine = reactive<TabState & { status: number | null; keyword: string }>({
    ...initialTabState(),
    status: 0,
    keyword: ''
  })
  const detail = ref<CouponInfo | null>(null)
  const detailLoading = ref(false)

  async function refreshAvailable() {
    available.loading = true
    available.cursor = { timestamp: null, id: null }
    available.hasMore = true
    try {
      const res: any = await getAvailableCoupons({ pageSize: 10 })
      const d = res.data
      available.items = d.list || []
      available.cursor = { timestamp: d.nextTimestamp, id: d.nextId }
      available.hasMore = d.hasMore
    } finally {
      available.loading = false
    }
  }

  async function loadMoreAvailable() {
    if (!available.hasMore || available.loadingMore) return
    available.loadingMore = true
    try {
      const res: any = await getAvailableCoupons({
        lastTimestamp: available.cursor.timestamp,
        lastId: available.cursor.id,
        pageSize: 10
      })
      const d = res.data
      available.items.push(...(d.list || []))
      available.cursor = { timestamp: d.nextTimestamp, id: d.nextId }
      available.hasMore = d.hasMore
    } catch {
      available.hasMore = false
    } finally {
      available.loadingMore = false
    }
  }

  async function refreshMine() {
    mine.loading = true
    mine.cursor = { timestamp: null, id: null }
    mine.hasMore = true
    try {
      const params: CursorParams = { pageSize: 10 }
      if (mine.status !== null) params.status = mine.status
      if (mine.keyword) params.keyword = mine.keyword
      const res: any = await getUserCoupons(params)
      const d = res.data
      mine.items = d.list || []
      mine.cursor = { timestamp: d.nextTimestamp, id: d.nextId }
      mine.hasMore = d.hasMore
    } finally {
      mine.loading = false
    }
  }

  async function loadMoreMine() {
    if (!mine.hasMore || mine.loadingMore) return
    mine.loadingMore = true
    try {
      const params: CursorParams = {
        lastTimestamp: mine.cursor.timestamp,
        lastId: mine.cursor.id,
        pageSize: 10
      }
      if (mine.status !== null) params.status = mine.status
      if (mine.keyword) params.keyword = mine.keyword
      const res: any = await getUserCoupons(params)
      const d = res.data
      mine.items.push(...(d.list || []))
      mine.cursor = { timestamp: d.nextTimestamp, id: d.nextId }
      mine.hasMore = d.hasMore
    } catch {
      mine.hasMore = false
    } finally {
      mine.loadingMore = false
    }
  }

  async function setMineStatus(status: number | null) {
    mine.status = status
    await refreshMine()
  }

  async function setMineKeyword(keyword: string) {
    mine.keyword = keyword
    await refreshMine()
  }

  async function fetchAvailableDetail(id: number) {
    detailLoading.value = true
    detail.value = null
    try {
      const res: any = await getAvailableCouponDetail(id)
      detail.value = res.data || null
    } finally {
      detailLoading.value = false
    }
  }

  async function fetchMineDetail(id: number) {
    detailLoading.value = true
    detail.value = null
    try {
      const res: any = await getMineCouponDetail(id)
      detail.value = res.data || null
    } finally {
      detailLoading.value = false
    }
  }

  async function claim(id: number) {
    await claimCoupon(id)
  }

  async function flashSale(id: number) {
    await flashSaleCoupon(id)
  }

  return {
    available, mine, detail, detailLoading,
    refreshAvailable, loadMoreAvailable,
    refreshMine, loadMoreMine,
    setMineStatus, setMineKeyword,
    fetchAvailableDetail, fetchMineDetail, claim, flashSale
  }
})
