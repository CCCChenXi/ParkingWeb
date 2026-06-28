import request from './request'

export function getMessages() {
  return request.get('/messages')
}

export function readMessage(id: number) {
  return request.put(`/messages/${id}/read`)
}

export function readAllMessages() {
  return request.put('/messages/read-all')
}
