import request from './request'

export function getWallet() {
  return request.get('/wallet')
}

export function recharge(amount: number) {
  return request.post('/wallet/recharge', { amount })
}

export function getWalletLogs() {
  return request.get('/wallet/logs')
}
