import axios from "axios"
import api from "@/shared/api/axios"

export const createUploadUrl = (projectId, data) => {
  return api.post(`/projects/${projectId}/files/upload-url`, data)
}

export const completeUpload = (projectId, fileId) => {
  return api.post(`/projects/${projectId}/files/${fileId}/complete`)
}

export const fetchProjectFiles = (projectId, params) => {
  return api.get(`/projects/${projectId}/files`, { params })
}

export const getDownloadUrl = (projectId, fileId) => {
  return api.get(`/projects/${projectId}/files/${fileId}/download-url`)
}

export const deleteProjectFile = (projectId, fileId) => {
  return api.delete(`/projects/${projectId}/files/${fileId}`)
}

export const uploadFileToS3 = ({ uploadUrl, file, headers, onUploadProgress }) => {
  return axios.put(uploadUrl, file, {
    headers,
    onUploadProgress
  })
}

export const uploadFileThroughBackend = ({ projectId, file, mimeType, folder, onUploadProgress }) => {
  return api.put(`/projects/${projectId}/files/upload`, file, {
    headers: {
      "Content-Type": mimeType || "application/octet-stream"
    },
    params: {
      fileName: file.name,
      mimeType: mimeType || file.type || "application/octet-stream"
      ,
      folder: folder || undefined
    },
    onUploadProgress
  })
}
