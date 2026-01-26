import { createContext, use, useContext, useState} from "react";

const AuthContext = createContext(null)

const AuthProvider = ({ children}) => {

    //check pehle se token hai kya (getItem)
    //ager token nhi hoga matlab login nhi hai toh login feature.. newToken lo aur token me set krdo (setItem)
    //ager token hai matlab login hai toh logout feature.. token remove kardo(removeItem)

    const [token, setToken] = useState(
        localStorage.getItem("token")
    )

    const login = (newToken) => {
        localStorage.setItem("token", newToken)
        setToken(newToken)
    }

    const logout = () => {
        localStorage.removeItem("token")
        setToken(null)
    }
    
    return(
        <AuthContext.Provider value={{token, login, logout}}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuth = () => useContext(AuthContext)