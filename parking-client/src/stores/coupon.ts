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

  async function fetchAvailable() {
    const res: any = await getAvailableCoupons()
    availableCoupons.value = res.data || []
  }

  async function claim(id: number) {
    const res: any = await claimCoupon(id)
    await fetchUserCoupons()
    return res
  }

  async function flashSale(id: number) {
    const res: any = await flashSaleCoupon(id)
    await fetchUserCoupons()
    return res
  }

  async function fetchUserCoupons() {
    const res: any = await getUserCoupons()
    userCoupons.value = res.data || []
  }

  return {
    availableCoupons,
    userCoupons,
    fetchAvailable,
    claim,
    flashSale,
    fetchUserCoupons
  }
})
