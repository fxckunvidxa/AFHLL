import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import CreateItem from './pages/CreateItem'
import MyItems from './pages/MyItems'
import Navbar from './components/Navbar'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>
  
  return user ? children : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          <Route path="/create" element={
            <PrivateRoute>
              <CreateItem />
            </PrivateRoute>
          } />
          <Route path="/my-items" element={
            <PrivateRoute>
              <MyItems />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App