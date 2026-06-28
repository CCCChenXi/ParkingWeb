import request from './request'

export function getAvailableCoupons() {
  return request.get('/coupons/available')
}

export function claimCoupon(id: number) {
  return request.post(`/coupons/claim/${id}`)
}

export function flashSaleCoupon(id: number) {
  return request.post(`/coupons/flash/${id}`)
}

export function getUserCoupons() {
  return request.get('/user/coupons')
}
