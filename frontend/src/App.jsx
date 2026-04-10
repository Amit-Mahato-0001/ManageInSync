import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Login from "./pages/Login"
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Projects from './pages/projects/index'
import Clients from './pages/Clients'
import ActivityFeed from './pages/ActivityFeed'
import Signup from './pages/Signup'
import DashboardRouter from './routes/DashboardRouter'
import AcceptInvite from './pages/AcceptInvite'
import Members from './pages/Members'
import ProjectTasks from './pages/projects/ProjectTasks'
import ProjectConversation from './pages/projects/ProjectConversation'
import Billing from './pages/billing'
import CreateInvoice from './pages/billing/CreateInvoice'
import InvoiceDetails from './pages/billing/InvoiceDetails'
import InvoicePrint from './pages/billing/InvoicePrint'

const App = () => {
  return (
    <>
      <Toaster position="top-right" />

      <BrowserRouter>
        <Routes>
          <Route path='/signup' element={<AuthLayout><Signup /></AuthLayout>} />
          <Route path='/login' element={<AuthLayout><Login /></AuthLayout>} />
          <Route path='/accept-invite' element={<AuthLayout><AcceptInvite /></AuthLayout>} />
          <Route path='/' element={<ProtectedRoute><AppLayout><DashboardRouter /></AppLayout></ProtectedRoute>} />
          <Route path='/projects' element={<ProtectedRoute><AppLayout><Projects /></AppLayout></ProtectedRoute>} />
          <Route path='/projects/:projectId/tasks' element={<ProtectedRoute allowedRoles={["owner", "admin", "member"]}><AppLayout><ProjectTasks /></AppLayout></ProtectedRoute>} />
          <Route path='/projects/:projectId/conversation' element={<ProtectedRoute allowedRoles={["owner", "admin", "member", "client"]}><AppLayout><ProjectConversation /></AppLayout></ProtectedRoute>} />
          <Route path='/clients' element={<ProtectedRoute allowedRoles={["owner", "admin"]}><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
          <Route path='/members' element={<ProtectedRoute allowedRoles={["owner", "admin"]}><AppLayout><Members /></AppLayout></ProtectedRoute>} />
          <Route path='/activity-feed' element={<ProtectedRoute allowedRoles={["owner", "admin", "member"]}><AppLayout><ActivityFeed /></AppLayout></ProtectedRoute>} />
          <Route path='/billing' element={<ProtectedRoute allowedRoles={["owner", "client"]}><AppLayout><Billing /></AppLayout></ProtectedRoute>} />
          <Route path='/billing/new' element={<ProtectedRoute allowedRoles={["owner"]}><AppLayout><CreateInvoice /></AppLayout></ProtectedRoute>} />
          <Route path='/billing/:invoiceId' element={<ProtectedRoute allowedRoles={["owner", "client"]}><AppLayout><InvoiceDetails /></AppLayout></ProtectedRoute>} />
          <Route path='/billing/invoices/:invoiceId/print' element={<ProtectedRoute allowedRoles={["owner", "client"]}><InvoicePrint /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
