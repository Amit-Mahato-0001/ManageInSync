import api from "@/shared/api/axios";

export const fetchTasks = (projectId, params) => {
  return api.get(`/projects/${projectId}/tasks`, { params });
};

export const createTask = (projectId, data) => {
  return api.post(`/projects/${projectId}/tasks`, data);
};

export const deleteTask = (projectId, taskId) => {
  return api.delete(`/projects/${projectId}/tasks/${taskId}`);
};

export const updateTask = (projectId, taskId, data) => {
  return api.patch(`/projects/${projectId}/tasks/${taskId}`, data);
};
