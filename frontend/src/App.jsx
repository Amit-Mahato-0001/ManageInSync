import React from 'react'
import {BrowserRouter, Routes, Route} from "react-router-dom"
import Login from "./pages/Login"
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Projects from './pages/Projects'
import Clients from './pages/Clients'
import AuditLogs from './pages/AuditLogs'
import Signup from './pages/Signup'
import DashboardRouter from './routes/DashboardRouter'
import AcceptInvite from './pages/AcceptInvite'

const App = () => {

  return (
    <BrowserRouter>
    <Routes>
      <Route path='/signup' element={<AuthLayout><Signup/></AuthLayout>}/>
      <Route path='/login' element={<AuthLayout><Login/></AuthLayout>}/>
      <Route path='/accept-invite' element={<AuthLayout><AcceptInvite/></AuthLayout>}/>
      <Route path='/' element={<ProtectedRoute><AppLayout><DashboardRouter/></AppLayout></ProtectedRoute>}/>
      <Route path='/projects' element={<ProtectedRoute><AppLayout><Projects/></AppLayout></ProtectedRoute>}/>
      <Route path='/clients' element={<ProtectedRoute allowedRoles={["owner", "admin"]}><AppLayout><Clients/></AppLayout></ProtectedRoute>}/>
      <Route path='/audit-logs' element={<ProtectedRoute allowedRoles={["owner", "admin"]}><AppLayout><AuditLogs/></AppLayout></ProtectedRoute>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App