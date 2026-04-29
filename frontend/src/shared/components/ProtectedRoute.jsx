import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { PageLoader } from '@/shared/components/LoadingSpinner'

const ProtectedRoute = ({children, allowedRoles }) => {
    const location = useLocation()
    const { status, user} = useAuth()

    if(status === "loading"){
        return <PageLoader />
    }

    if(status !== "authenticated"){
        return <Navigate to='/login' replace state={{ from: location }} />
    }

    if(allowedRoles && !allowedRoles.includes(user?.role)){
      return <Navigate to='/' replace />
    }

  return children
}

export default ProtectedRoute
