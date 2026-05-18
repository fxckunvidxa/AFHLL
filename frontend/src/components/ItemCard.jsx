import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { items } from '../api'
import { useQueryClient } from '@tanstack/react-query'

export default function ItemCard({ item, onUpdate, onClick }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const mainImage = item.images?.find(img => img.is_main) || item.images?.[0]
  const isReserved = item.reserved_until && new Date(item.reserved_until) > new Date()
  const isMyItem = item.owner_id === user?.id
  const isReservedByMe = isReserved && item.reserved_by_id === user?.id

  const handleReserve = async (e) => {
    e.stopPropagation() // Останавливаем всплытие, чтобы не открывать модалку
    setLoading(true)
    try {
      await items.reserve(item.id)
      onUpdate()
      queryClient.invalidateQueries(['items'])
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (e) => {
    e.stopPropagation()
    setLoading(true)
    try {
      await items.cancelReserve(item.id)
      onUpdate()
      queryClient.invalidateQueries(['items'])
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e) => {
    e.stopPropagation()
    if (window.confirm('Подтвердить обмен?')) {
      setLoading(true)
      try {
        await items.confirmExchange(item.id)
        onUpdate()
        queryClient.invalidateQueries(['items'])
      } catch (err) {
        alert(err.response?.data?.detail || 'Ошибка')
      } finally {
        setLoading(false)
      }
    }
  }

  const getTradeTypeLabel = () => {
    return item.trade_type === 'rent' ? 'Аренда' : 'Обмен'
  }

  const getTradeTypeColor = () => {
    return item.trade_type === 'rent' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
  }

  const getImageUrl = (image) => {
    if (!image) return null
    if (image.url) return `http://localhost:8000${image.url}`
    if (image.thumb_url) return `http://localhost:8000${image.thumb_url}`
    return null
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer"
      onClick={() => onClick?.(item.id)}
    >
      <div className="relative h-48 bg-gray-200">
        {mainImage ? (
          <img
            src={getImageUrl(mainImage)}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Нет фото
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTradeTypeColor()}`}>
            {getTradeTypeLabel()}
          </span>
        </div>
        {isReserved && !isMyItem && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">ЗАБРОНИРОВАНО</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
        {item.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
        )}
        
        {isReserved && isReservedByMe && (
          <div className="text-sm text-orange-600 mb-2">
            Забронировано до {new Date(item.reserved_until).toLocaleTimeString()}
          </div>
        )}

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {!isMyItem && !isReserved && (
            <button
              onClick={handleReserve}
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
            >
              {item.trade_type === 'rent' ? 'Арендовать' : 'Предложить обмен'}
            </button>
          )}
          
          {isReservedByMe && (
            <>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 transition"
              >
                Отменить
              </button>
              {item.trade_type === 'exchange' && (
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
                >
                  Подтвердить обмен
                </button>
              )}
            </>
          )}

          {isMyItem && (
            <div className="text-sm text-gray-500 text-center w-full">
              Ваше объявление
            </div>
          )}
        </div>
      </div>
    </div>
  )
}