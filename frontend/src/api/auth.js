import api from "./axios"

const loginApi = (data) => {

    return api.post("/auth/login", data)
}

const signupApi = (data) => {

    return api.post("/auth/signup", data)
}

export default {loginApi, signupApi}