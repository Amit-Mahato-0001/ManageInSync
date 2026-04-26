import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Login from "@/features/auth/pages/Login"
import ForgotPassword from "@/features/auth/pages/ForgotPassword"
import ResetPassword from "@/features/auth/pages/ResetPassword"
import AuthLayout from "@/shared/layouts/AuthLayout"
import AppLayout from "@/shared/layouts/AppLayout"
import ProtectedRoute from "@/shared/components/ProtectedRoute"
import Projects from "@/features/projects/pages/ProjectsPage"
import Clients from "@/features/clients/pages/Clients"
import ActivityFeed from "@/features/activity/pages/ActivityFeed"
import Signup from "@/features/auth/pages/Signup"
import DashboardRouter from "./routes/DashboardRouter"
import AcceptInvite from "@/features/auth/pages/AcceptInvite"
import Members from "@/features/members/pages/Members"
import ProjectTasks from "@/features/projects/pages/ProjectTasks"
import ProjectConversation from "@/features/projects/pages/ProjectConversation"
import Billing from "@/features/billing/pages/BillingPage"
import CreateInvoice from "@/features/billing/pages/CreateInvoice"
import InvoiceDetails from "@/features/billing/pages/InvoiceDetails"
import InvoicePrint from "@/features/billing/pages/InvoicePrint"
import Security from "@/features/auth/pages/Security"
import Account from "@/features/auth/pages/Account"

function AuthPage({ children }) {
  return <AuthLayout>{children}</AuthLayout>
}

function ProtectedPage({ children, allowedRoles }) {
  return (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

const App = () => {
  return (
    <>
      <Toaster position="top-right" />

      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<AuthPage><Signup /></AuthPage>} />
          <Route path="/login" element={<AuthPage><Login /></AuthPage>} />
          <Route
            path="/forgot-password"
            element={<AuthPage><ForgotPassword /></AuthPage>}
          />
          <Route
            path="/reset-password"
            element={<AuthPage><ResetPassword /></AuthPage>}
          />
          <Route
            path="/accept-invite"
            element={<AuthPage><AcceptInvite /></AuthPage>}
          />

          <Route path="/" element={<ProtectedPage><DashboardRouter /></ProtectedPage>} />
          <Route path="/projects" element={<ProtectedPage><Projects /></ProtectedPage>} />
          <Route
            path="/projects/:projectId/tasks"
            element={
              <ProtectedPage allowedRoles={["owner", "admin", "member"]}>
                <ProjectTasks />
              </ProtectedPage>
            }
          />
          <Route
            path="/projects/:projectId/conversation"
            element={
              <ProtectedPage allowedRoles={["owner", "admin", "member", "client"]}>
                <ProjectConversation />
              </ProtectedPage>
            }
          />
          <Route
            path="/clients"
            element={
              <ProtectedPage allowedRoles={["owner", "admin"]}>
                <Clients />
              </ProtectedPage>
            }
          />
          <Route
            path="/members"
            element={
              <ProtectedPage allowedRoles={["owner", "admin"]}>
                <Members />
              </ProtectedPage>
            }
          />
          <Route
            path="/activity-feed"
            element={
              <ProtectedPage allowedRoles={["owner", "admin", "member"]}>
                <ActivityFeed />
              </ProtectedPage>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedPage allowedRoles={["owner", "client"]}>
                <Billing />
              </ProtectedPage>
            }
          />
          <Route
            path="/billing/new"
            element={
              <ProtectedPage allowedRoles={["owner"]}>
                <CreateInvoice />
              </ProtectedPage>
            }
          />
          <Route
            path="/billing/:invoiceId"
            element={
              <ProtectedPage allowedRoles={["owner", "client"]}>
                <InvoiceDetails />
              </ProtectedPage>
            }
          />
          <Route
            path="/billing/invoices/:invoiceId/print"
            element={
              <ProtectedRoute allowedRoles={["owner", "client"]}>
                <InvoicePrint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account"
            element={
              <ProtectedPage>
                <Account />
              </ProtectedPage>
            }
          />
          <Route
            path="/security"
            element={
              <ProtectedPage>
                <Security />
              </ProtectedPage>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
