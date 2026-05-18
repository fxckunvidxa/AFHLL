// frontend/src/components/Navbar.jsx
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import CreateItemModal from './CreateItemModal'
import { useQueryClient } from '@tanstack/react-query'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleItemCreated = () => {
    // Обновляем списки объявлений
    queryClient.invalidateQueries(['items'])
    queryClient.invalidateQueries(['my-items'])
  }

  return (
    <>
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-blue-600">
              какое-то навание (потом придумаю)
            </Link>
            
            {user && (
              <div className="flex gap-4 items-center">
                <Link to="/" className="text-gray-700 hover:text-blue-600">Главная</Link>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-gray-700 hover:text-blue-600"
                >
                  Создать
                </button>
                <Link to="/my-items" className="text-gray-700 hover:text-blue-600">Мои вещи</Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <CreateItemModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleItemCreated}
      />
    </>
  )
}