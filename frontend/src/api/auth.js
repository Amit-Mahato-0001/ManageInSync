import api from "./axios"

const loginApi = (data) => {

    return api.post("/auth/login", data)
}

const signupApi = (data) => {

    return api.post("/auth/signup", data)
}

const acceptInviteApi = (data) => {

    return api.post("/user-invite/accept-invite", data)
}

const meApi = () => {

    return api.get("/me")
}

export default {loginApi, signupApi, acceptInviteApi, meApi}
