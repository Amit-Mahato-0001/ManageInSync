import { createContext, useContext, useMemo, useState } from "react";
import { decodeToken } from "../utils/decodeToken";

const AuthContext = createContext(null)

const AuthProvider = ({ children}) => {

    const [token, setToken] = useState(() => localStorage.getItem("token"))

    const user = useMemo(() => {
        if(!token) return null
        return decodeToken(token)
    }, [token])

    const login = (newToken) => {
        localStorage.setItem("token", newToken)
        setToken(newToken)
    }

    const logout = () => {
        localStorage.removeItem("token")
        setToken(null)
    }
    
    return(
        <AuthContext.Provider value={{token, user, login, logout}}>
            {children}
        </AuthContext.Provider>
    )

}

export default AuthProvider

export const useAuth = () => useContext(AuthContext)
