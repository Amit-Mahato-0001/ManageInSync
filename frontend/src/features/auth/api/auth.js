import api, { authClient } from "@/shared/api/axios"

const loginApi = (data) => {
    return authClient.post("/auth/login", data)
}

const signupApi = (data) => {
    return authClient.post("/auth/signup", data)
}

const refreshApi = () => {
    return authClient.post("/auth/refresh")
}

const logoutApi = () => {
    return authClient.post("/auth/logout")
}

const logoutAllApi = () => {
    return api.post("/auth/logout-all")
}

const acceptInviteApi = (data) => {

    return api.post("/user-invite/accept-invite", data)
}

const meApi = () => {

    return api.get("/me")
}

export default {
    acceptInviteApi,
    loginApi,
    logoutAllApi,
    logoutApi,
    meApi,
    refreshApi,
    signupApi
}
