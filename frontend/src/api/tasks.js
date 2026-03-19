import api from "./axios";

export const fetchTasks = (params) => {
  return api.get("/tasks", { params });
};

export const createTask = (data) => {
  return api.post("/tasks", data);
};

export const deleteTask = (taskId) => {
  return api.delete(`/tasks/${taskId}`);
};
