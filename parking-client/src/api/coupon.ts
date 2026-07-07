import request from './request'

export interface CursorParams {
  lastTimestamp?: number | null
  lastId?: number | null
  pageSize?: number
  status?: number | null
  keyword?: string
}

export function getAvailableCoupons(params: CursorParams) {
  return request.get('/coupons/available', { params })
}

export function claimCoupon(id: number) {
  return request.post(`/coupons/claim/${id}`)
}

export function flashSaleCoupon(id: number) {
  return request.post(`/coupons/flash/${id}`)
}

export function getUserCoupons(params: CursorParams) {
  return request.get('/coupons', { params: { scope: 'mine', ...params } })
}

export function getAvailableCouponDetail(id: number) {
  return request.get(`/coupons/available/${id}/detail`)
}

export function getMineCouponDetail(id: number) {
  return request.get(`/coupons/mine/${id}/detail`)
}
