import request from './request'

export function getNearbyParkingLots(params: { longitude: number; latitude: number; radius?: number }) {
  return request.get('/parking-lots/nearby', { params })
}

export function getParkingLotDetail(id: number) {
  return request.get(`/parking-lots/${id}`)
}

export function getParkingSpots(lotId: number) {
  return request.get(`/parking-lots/${lotId}/spots`)
}
