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

export const useOrderStore = defineStore('order', () => {
  const orders = ref<OrderInfo[]>([])
  const loading = ref(false)

  const reservedOrders = computed(() => orders.value.filter(o => o.status === 0))
  const activeOrders = computed(() => orders.value.filter(o => o.status === 1))
  const settledOrders = computed(() => orders.value.filter(o => o.status === 2))

  async function fetchOrders(status?: number) {
    loading.value = true
    try {
      const res: any = await getOrders(status !== undefined ? { status } : undefined)
      orders.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  async function reserve(data: { lotId: number; spotId: number; seq: number; plateNumber: string }) {
    const res: any = await createOrder(data)
    await fetchOrders()
    return res
  }

  async function directEnter(data: { lotId: number; spotId: number; seq: number; plateNumber: string }) {
    const res: any = await createOrder(data)
    const orderId = res.data.id
    await enterPark(orderId)
    await fetchOrders()
    return res
  }

  async function doEnter(id: number) {
    await enterPark(id)
    await fetchOrders()
  }

  async function doSettle(id: number, couponId?: number) {
    const res: any = await settleOrder(id, couponId !== undefined ? { couponId } : undefined)
    await fetchOrders()
    return res
  }

  async function doCancel(id: number) {
    await cancelOrder(id)
    await fetchOrders()
  }

  return {
    orders,
    loading,
    reservedOrders,
    activeOrders,
    settledOrders,
    fetchOrders,
    reserve,
    directEnter,
    doEnter,
    doSettle,
    doCancel
  }
})
