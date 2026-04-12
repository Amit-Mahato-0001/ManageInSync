import { useAuth } from "../context/useAuth"
import Dashboard from "../pages/Dashboard"
import ClientDashboard from "../pages/ClientDashboard"
import MemberDashboard from "../pages/MemberDashboard"

const DashboardRouter = () => {

    const { status, user } = useAuth()

    if(status === "loading"){
        return <p>Loading dashboard...</p>
    }

    if(!user){
        return null
    }

    if(user.role === "client"){

        return <ClientDashboard/>
    }

    if(user.role === "member"){

        return <MemberDashboard/>
    }

    return <Dashboard/>

}

export default DashboardRouter
