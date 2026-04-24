import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Login from "@/features/auth/pages/Login"
import ForgotPassword from "@/features/auth/pages/ForgotPassword"
import ResetPassword from "@/features/auth/pages/ResetPassword"
import AuthLayout from '@/shared/layouts/AuthLayout'
import AppLayout from '@/shared/layouts/AppLayout'
import ProtectedRoute from '@/shared/components/ProtectedRoute'
import Projects from '@/features/projects/pages/ProjectsPage'
import Clients from '@/features/clients/pages/Clients'
import ActivityFeed from '@/features/activity/pages/ActivityFeed'
import Signup from '@/features/auth/pages/Signup'
import DashboardRouter from './routes/DashboardRouter'
import AcceptInvite from '@/features/auth/pages/AcceptInvite'
import Members from '@/features/members/pages/Members'
import ProjectTasks from '@/features/projects/pages/ProjectTasks'
import ProjectConversation from '@/features/projects/pages/ProjectConversation'
import Billing from '@/features/billing/pages/BillingPage'
import CreateInvoice from '@/features/billing/pages/CreateInvoice'
import InvoiceDetails from '@/features/billing/pages/InvoiceDetails'
import InvoicePrint from '@/features/billing/pages/InvoicePrint'
import AuditLogs from '@/features/audit/pages/AuditLogs'
import Security from '@/features/auth/pages/Security'

const App = () => {
  return (
    <>
      <Toaster position="top-right" />

      <BrowserRouter>
        <Routes>
          <Route path='/signup' element={<AuthLayout><Signup /></AuthLayout>} />
          <Route path='/login' element={<AuthLayout><Login /></AuthLayout>} />
          <Route path='/forgot-password' element={<AuthLayout><ForgotPassword /></AuthLayout>} />
          <Route path='/reset-password' element={<AuthLayout><ResetPassword /></AuthLayout>} />
          <Route path='/accept-invite' element={<AuthLayout><AcceptInvite /></AuthLayout>} />
          <Route path='/' element={<ProtectedRoute><AppLayout><DashboardRouter /></AppLayout></ProtectedRoute>} />
          <Route path='/projects' element={<ProtectedRoute><AppLayout><Projects /></AppLayout></ProtectedRoute>} />
          <Route path='/projects/:projectId/tasks' element={<ProtectedRoute allowedRoles={["owner", "admin", "member"]}><AppLayout><ProjectTasks /></AppLayout></ProtectedRoute>} />
          <Route path='/projects/:projectId/conversation' element={<ProtectedRoute allowedRoles={["owner", "admin", "member", "client"]}><AppLayout><ProjectConversation /></AppLayout></ProtectedRoute>} />
          <Route path='/clients' element={<ProtectedRoute allowedRoles={["owner", "admin"]}><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
          <Route path='/members' element={<ProtectedRoute allowedRoles={["owner", "admin"]}><AppLayout><Members /></AppLayout></ProtectedRoute>} />
          <Route path='/activity-feed' element={<ProtectedRoute allowedRoles={["owner", "admin", "member"]}><AppLayout><ActivityFeed /></AppLayout></ProtectedRoute>} />
          <Route path='/audit-logs' element={<ProtectedRoute allowedRoles={["owner", "admin"]}><AppLayout><AuditLogs /></AppLayout></ProtectedRoute>} />
          <Route path='/billing' element={<ProtectedRoute allowedRoles={["owner", "client"]}><AppLayout><Billing /></AppLayout></ProtectedRoute>} />
          <Route path='/billing/new' element={<ProtectedRoute allowedRoles={["owner"]}><AppLayout><CreateInvoice /></AppLayout></ProtectedRoute>} />
          <Route path='/billing/:invoiceId' element={<ProtectedRoute allowedRoles={["owner", "client"]}><AppLayout><InvoiceDetails /></AppLayout></ProtectedRoute>} />
          <Route path='/billing/invoices/:invoiceId/print' element={<ProtectedRoute allowedRoles={["owner", "client"]}><InvoicePrint /></ProtectedRoute>} />
          <Route path='/security' element={<ProtectedRoute><AppLayout><Security /></AppLayout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
