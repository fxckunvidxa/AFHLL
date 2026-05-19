import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../services/auth'
import TwoFAModal from '../components/TwoFAModal'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, verify2FALogin, requires2FA } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(email, password)
    
    if (result.success) {
      navigate('/')
    } else if (result.requires2FA) {
      // Модалка откроется автоматически, ничего не делаем
      console.log('2FA required, waiting for code')
    } else {
      setError(result.message || 'Неверный email или пароль')
    }
  }

  const handle2FAVerify = async (code) => {
    const result = await verify2FALogin(code)
    if (result.success) {
      navigate('/')
    }
    return result
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Вход</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            Войти
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Нет аккаунта? <Link to="/register" className="text-blue-500 hover:underline">Зарегистрироваться</Link>
        </p>
      </div>
      
      <TwoFAModal
        isOpen={requires2FA}
        onClose={() => {}}  // Не закрываем, только через успешный вход
        onVerify={handle2FAVerify}
      />
    </div>
  )
}