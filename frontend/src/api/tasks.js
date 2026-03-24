import api from "./axios";

export const fetchTasks = (projectId, params) => {
  return api.get(`/projects/${projectId}/tasks`, { params });
};

export const createTask = (projectId, data) => {
  return api.post(`/projects/${projectId}/tasks`, data);
};

export const deleteTask = (projectId, taskId) => {
  return api.delete(`/projects/${projectId}/tasks/${taskId}`);
};
