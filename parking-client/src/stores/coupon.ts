import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getAvailableCoupons, claimCoupon, flashSaleCoupon, getUserCoupons } from '../api/coupon'

export interface CouponInfo {
  id: number
  name: string
  description: string
  discountAmount: number
  minAmount: number
  type: number
  stock: number
  remainStock: number
  startTime: string
  endTime: string
  status?: number
}

export const useCouponStore = defineStore('coupon', () => {
  const availableCoupons = ref<CouponInfo[]>([])
  const userCoupons = ref<CouponInfo[]>([])
  const loading = ref(false)

  async function fetchAvailable() {
    loading.value = true
    try {
      const res: any = await getAvailableCoupons()
      availableCoupons.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  async function claim(id: number) {
    loading.value = true
    try {
      const res: any = await claimCoupon(id)
      await fetchUserCoupons()
      return res
    } finally {
      loading.value = false
    }
  }

  async function flashSale(id: number) {
    loading.value = true
    try {
      const res: any = await flashSaleCoupon(id)
      await fetchUserCoupons()
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchUserCoupons() {
    loading.value = true
    try {
      const res: any = await getUserCoupons()
      userCoupons.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  return {
    availableCoupons,
    userCoupons,
    loading,
    fetchAvailable,
    claim,
    flashSale,
    fetchUserCoupons
  }
})
