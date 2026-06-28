import request from './request'

export function login(data: { username: string; password: string }) {
  return request.post('/user/login', data)
}

export function sendCode(phone: string) {
  return request.post('/user/send-code', { phone })
}

export function register(data: { username: string; password: string; phone: string; code: string }) {
  return request.post('/user/register', data)
}

export function logout() {
  return request.post('/user/logout')
}

export function getUserProfile() {
  return request.get('/user/profile')
}

export function updateUserProfile(data: any) {
  return request.put('/user/profile', data)
}

export function getVehicles() {
  return request.get('/vehicles')
}

export function addVehicle(data: { plateNumber: string; brand: string; color: string }) {
  return request.post('/vehicles', data)
}

export function updateVehicle(id: number, data: any) {
  return request.put(`/vehicles/${id}`, data)
}

export function deleteVehicle(id: number) {
  return request.delete(`/vehicles/${id}`)
}
