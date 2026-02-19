import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({children, allowedRoles }) => {

    const { token, user} = useAuth()

    //If not logged in
    if(!token){
        return <Navigate to='/login'/>
    }

    //check the role
    if(allowedRoles && !allowedRoles.includes(user?.role)){
      return <Navigate to='/' />
    }

  return children
}

export default ProtectedRoute