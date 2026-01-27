import api from "./axios"

const login = (data) => {

    return api.post("/auth/login", data)
}