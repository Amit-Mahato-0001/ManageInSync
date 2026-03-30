import api from "./axios"

export const getConversation = (projectId) => {
  return api.get(`/projects/${projectId}/conversation`)
}

export const getMessages = (projectId, cursor, limit = 20) => {
  const params = { limit }

  if (cursor) {
    params.cursor = cursor
  }

  return api.get(`/projects/${projectId}/conversation/messages`, { params })
}

export const sendMessage = (projectId, text) => {
  return api.post(`/projects/${projectId}/conversation/messages`, { text })
}

export const editMessage = (projectId, messageId, text) => {
  return api.patch(`/projects/${projectId}/conversation/messages/${messageId}`, {
    text
  })
}

export const deleteMessage = (projectId, messageId) => {
  return api.delete(`/projects/${projectId}/conversation/messages/${messageId}`)
}

export const markConversationRead = (projectId) => {
  return api.post(`/projects/${projectId}/conversation/read`)
}
