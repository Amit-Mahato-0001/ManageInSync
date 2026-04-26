import { Navigate } from "react-router-dom"

export default function Security() {
  return <Navigate to="/account?tab=security" replace />
}
