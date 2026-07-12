import request from './request'

export function readMessage(id: number) {
  return request.put(`/messages/${id}/read`)
}

export function readAllMessages() {
  return request.put('/messages/read-all')
}
