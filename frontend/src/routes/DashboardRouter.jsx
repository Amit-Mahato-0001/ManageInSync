import { useAuth } from "../context/AuthContext"
import Dashboard from "../pages/Dashboard"
import ClientDashboard from "../pages/ClientDashboard"
import MemberDashboard from "../pages/memberDashboard"

const DashboardRouter = () => {

    const { user } = useAuth()

    if(user?.role == "client"){

        return <ClientDashboard/>
    }

    if(user?.role == "member"){

        return <MemberDashboard/>
    }

    return <Dashboard/>

}

export default DashboardRouter