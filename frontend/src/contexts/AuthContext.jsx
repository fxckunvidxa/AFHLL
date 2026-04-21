import React, { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../api'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const response = await auth.getMe()
        setUser(response.data)
      } catch (error) {
        localStorage.removeItem('access_token')
      }
    }
    setLoading(false)
  }

  const login = async (username, password) => {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    
    const response = await auth.login(formData)
    localStorage.setItem('access_token', response.data.access_token)
    await checkAuth()
    return response.data
  }

  const register = async (userData) => {
    const response = await auth.register(userData)
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}