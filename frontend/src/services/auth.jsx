import React, { createContext, useContext, useState, useEffect } from 'react'
import api from './api'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('access_token')
          setUser(null)
        })
    }
    setLoading(false)
  }, [])

  const getMe = async () => {
    const response = await api.get('/users/me')
    return response.data
  }

  const login = async (username, password) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    
    const response = await api.post('/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    
    localStorage.setItem('access_token', response.data.access_token)
    const userData = await getMe()
    setUser(userData)
    return { success: true }
  }

  const register = async (userData) => {
    await api.post('/register', userData)
    return { success: true }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getMe }}>
      {children}
    </AuthContext.Provider>
  )
}