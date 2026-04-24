import api, { authClient } from "@/shared/api/axios"

const loginApi = (data) => {
    return authClient.post("/auth/login", data)
}

const signupApi = (data) => {
    return authClient.post("/auth/signup", data)
}

const forgotPasswordApi = (data) => {
    return authClient.post("/auth/forgot-password", data)
}

const resetPasswordApi = (data) => {
    return authClient.post("/auth/reset-password", data)
}

const changePasswordApi = (data) => {
    return api.post("/auth/change-password", data)
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
    changePasswordApi,
    forgotPasswordApi,
    loginApi,
    logoutAllApi,
    logoutApi,
    meApi,
    refreshApi,
    resetPasswordApi,
    signupApi
}
