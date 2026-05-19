// frontend/src/services/auth.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import api, { auth as authApi } from './api'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pending2FA, setPending2FA] = useState({ email: null, password: null })

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
    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)
      
      const response = await authApi.login(formData)
      
      localStorage.setItem('access_token', response.data.access_token)
      const userData = await getMe()
      setUser(userData)
      setPending2FA({ email: null, password: null })
      return { success: true }
    } catch (err) {
      // Проверяем на 2FA_REQUIRED (статус 403)
      if (err.response?.status === 403 && err.response?.data?.detail === '2FA_REQUIRED') {
        setPending2FA({ email: username, password })
        return { success: false, requires2FA: true }
      }
      return { success: false, message: err.response?.data?.detail || 'Ошибка входа' }
    }
  }

  const verify2FALogin = async (code) => {
    if (!pending2FA.email) {
      return { success: false, message: 'Сессия истекла' }
    }
    
    try {
      const response = await authApi.loginWith2FA(pending2FA.email, pending2FA.password, code)
      localStorage.setItem('access_token', response.data.access_token)
      const userData = await getMe()
      setUser(userData)
      setPending2FA({ email: null, password: null })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.detail || 'Неверный код' }
    }
  }

  const register = async (userData) => {
    await authApi.register(userData)
    return { success: true }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
    setPending2FA({ email: null, password: null })
  }

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, register, logout, getMe,
      verify2FALogin, pending2FA, requires2FA: !!pending2FA.email
    }}>
      {children}
    </AuthContext.Provider>
  )
}