import request from './request'

export function createOrder(data: { lotId: number; spotId: number; seq: number; plateNumber: string }) {
  return request.post('/orders', data)
}

export function getOrders(params?: { status?: number }) {
  return request.get('/orders', { params })
}

export function getOrderDetail(id: number) {
  return request.get(`/orders/${id}`)
}

export function enterPark(id: number) {
  return request.put(`/orders/${id}/enter`)
}

export function settleOrder(id: number, data?: { couponId?: number }) {
  return request.put(`/orders/${id}/settle`, data)
}

export function cancelOrder(id: number) {
  return request.put(`/orders/${id}/cancel`)
}
