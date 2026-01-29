import React from 'react'
import {BrowserRouter, Routes, Route} from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from './pages/Dashboard'
import AuthLayout from './layouts/AuthLayout'
import AppLayout from './layouts/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Projects from './pages/Projects'

const App = () => {

  return (
    <BrowserRouter>
    <Routes>
      <Route path='/login' element={<AuthLayout><Login/></AuthLayout>}/>
      <Route path='/' element={<ProtectedRoute><AppLayout><Dashboard/></AppLayout></ProtectedRoute>}/>
      <Route path='/projects' element={<ProtectedRoute><AppLayout><Projects/></AppLayout></ProtectedRoute>}/>
    </Routes>
    </BrowserRouter>
  )
}

export default App