import api from "./axios";

export const fetchTasks = () => {
  return api.get("/tasks");
};

export const createTask = (data) => {
  return api.post("/tasks", data);
};

export const deleteTask = (taskId) => {
  return api.delete(`/tasks/${taskId}`);
};
