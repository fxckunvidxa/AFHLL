import { useState, useEffect } from 'react'

export default function TwoFAModal({ isOpen, onClose, onVerify }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setCode('')
      setError('')
      setLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!code || code.length !== 6) {
      setError('Введите 6-значный код')
      return
    }
    
    setLoading(true)
    setError('')
    const result = await onVerify(code)
    setLoading(false)
    
    if (!result.success) {
      setError(result.message)
      setCode('')
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-center">Двухфакторная аутентификация</h2>
          <p className="text-gray-600 mb-4 text-center">
            Введите код из приложения-аутентификатора
          </p>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              autoFocus
            />
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
              >
                {loading ? 'Проверка...' : 'Подтвердить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}