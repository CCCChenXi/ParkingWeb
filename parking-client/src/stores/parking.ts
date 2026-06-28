import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNearbyParkingLots, getParkingLotDetail, getParkingSpots } from '../api/parking'

export interface ParkingLot {
  id: number
  name: string
  address: string
  longitude: number
  latitude: number
  totalSpots: number
  availableSpots: number
  imageUrl: string
  status: number
  distance?: string
}

export interface ParkingSpot {
  id: number
  spotNumber: string
  type: number
  status: number
}

export const useParkingStore = defineStore('parking', () => {
  const parkingLots = ref<ParkingLot[]>([])
  const currentLot = ref<ParkingLot | null>(null)
  const spots = ref<ParkingSpot[]>([])
  const loading = ref(false)

  async function fetchNearbyLots(longitude: number, latitude: number) {
    loading.value = true
    try {
      const res: any = await getNearbyParkingLots({ longitude, latitude })
      parkingLots.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  async function fetchLotDetail(id: number) {
    loading.value = true
    try {
      const res: any = await getParkingLotDetail(id)
      currentLot.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function fetchSpots(lotId: number) {
    loading.value = true
    try {
      const res: any = await getParkingSpots(lotId)
      spots.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  return {
    parkingLots,
    currentLot,
    spots,
    loading,
    fetchNearbyLots,
    fetchLotDetail,
    fetchSpots
  }
})
