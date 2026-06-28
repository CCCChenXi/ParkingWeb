import request from './request'

export function login(data: { username: string; password: string }) {
  return request.post('/admin/login', data)
}

export function logout() {
  return request.post('/admin/logout')
}

export function getDashboard() {
  return request.get('/admin/dashboard')
}

export function getParkingLots() {
  return request.get('/admin/parking-lots')
}

export function createParkingLot(data: any) {
  return request.post('/admin/parking-lots', data)
}

export function updateParkingLot(id: number, data: any) {
  return request.put(`/admin/parking-lots/${id}`, data)
}

export function deleteParkingLot(id: number) {
  return request.delete(`/admin/parking-lots/${id}`)
}

export function getParkingSpots(lotId: number) {
  return request.get(`/admin/parking-lots/${lotId}/spots`)
}

export function createParkingSpots(lotId: number, data: { spotNumbers: string[]; type: number }) {
  return request.post(`/admin/parking-spots`, { lotId, ...data })
}

export function deleteParkingSpot(id: number) {
  return request.delete(`/admin/parking-spots/${id}`)
}

export function updateParkingSpot(id: number, data: any) {
  return request.put(`/admin/parking-spots/${id}`, data)
}

export function getCoupons() {
  return request.get('/admin/coupons')
}

export function createCoupon(data: any) {
  return request.post('/admin/coupons', data)
}

export function updateCoupon(id: number, data: any) {
  return request.put(`/admin/coupons/${id}`, data)
}

export function deleteCoupon(id: number) {
  return request.delete(`/admin/coupons/${id}`)
}

export function getUsers() {
  return request.get('/admin/users')
}

export function getUserDetail(id: number) {
  return request.get(`/admin/users/${id}`)
}

export function getAdmins() {
  return request.get('/admin/admins')
}

export function createAdmin(data: any) {
  return request.post('/admin/admins', data)
}

export function updateAdminProfile(data: any) {
  return request.put('/admin/profile', data)
}
