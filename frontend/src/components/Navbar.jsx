import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">
            Обменник в общежитии
          </Link>
          
          {user && (
            <div className="flex gap-4 items-center">
              <Link to="/" className="text-gray-700 hover:text-blue-600">Главная</Link>
              <Link to="/create" className="text-gray-700 hover:text-blue-600">Создать</Link>
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
          
          {!user && (
            <Link to="/login" className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
              Войти
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}