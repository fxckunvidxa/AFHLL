import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { items } from '../api'
import { useQueryClient } from '@tanstack/react-query'
import Modal from './Modal'

export default function ItemDetailsModal({ isOpen, onClose, itemId, onUpdate }) {
  const { user } = useAuth()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const queryClient = useQueryClient()

  // Загружаем данные объявления
  useEffect(() => {
    if (isOpen && itemId) {
      fetchItemDetails()
    }
  }, [isOpen, itemId])

  const fetchItemDetails = async () => {
    setLoading(true)
    try {
      const response = await items.getOne(itemId)
      setItem(response.data)
      setCurrentImageIndex(0)
    } catch (err) {
      console.error('Error fetching item:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleReserve = async () => {
    setActionLoading(true)
    try {
      await items.reserve(item.id)
      await fetchItemDetails()
      onUpdate?.()
      queryClient.invalidateQueries(['items'])
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      await items.cancelReserve(item.id)
      await fetchItemDetails()
      onUpdate?.()
      queryClient.invalidateQueries(['items'])
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (window.confirm('Подтвердить обмен?')) {
      setActionLoading(true)
      try {
        await items.confirmExchange(item.id)
        await fetchItemDetails()
        onUpdate?.()
        queryClient.invalidateQueries(['items'])
      } catch (err) {
        alert(err.response?.data?.detail || 'Ошибка')
      } finally {
        setActionLoading(false)
      }
    }
  }

  const getImageUrl = (image) => {
    if (!image) return null
    if (image.url) return `http://localhost:8000${image.url}`
    if (image.thumb_url) return `http://localhost:8000${image.thumb_url}`
    return null
  }

  const nextImage = () => {
    if (item?.images && currentImageIndex < item.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  if (!isOpen) return null

  const isMyItem = item?.owner_id === user?.id
  const isReserved = item?.reserved_until && new Date(item.reserved_until) > new Date()
  const isReservedByMe = isReserved && item?.reserved_by_id === user?.id
  const mainImage = item?.images?.[currentImageIndex] || item?.images?.[0]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={item?.title || 'Загрузка...'}>
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : item ? (
        <div>
          {/* Галерея изображений */}
          {item.images && item.images.length > 0 && (
            <div className="mb-6">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <img
                  src={getImageUrl(mainImage)}
                  alt={item.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=No+Image'
                  }}
                />
                
                {/* Навигация по изображениям */}
                {item.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      disabled={currentImageIndex === 0}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 disabled:opacity-50"
                    >
                      ←
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={currentImageIndex === item.images.length - 1}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 disabled:opacity-50"
                    >
                      →
                    </button>
                  </>
                )}
              </div>
              
              {/* Миниатюры */}
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {item.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded border-2 ${
                      idx === currentImageIndex ? 'border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Информация об объявлении */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.trade_type === 'rent' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {item.trade_type === 'rent' ? 'Аренда' : 'Обмен'}
                </span>
                {!item.is_available && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Недоступно
                  </span>
                )}
              </div>
              
              {item.description && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2">Описание:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
                </div>
              )}
              
              {item.owner && (
                <div className="mt-4 pt-4 border-t">
                  <h3 className="font-semibold mb-2">Владелец:</h3>
                  <p className="text-gray-700">
                    {item.owner.name || item.owner.email}
                    {item.owner.room && `, комната ${item.owner.room}`}
                  </p>
                </div>
              )}
            </div>

            {/* Статус бронирования */}
            {isReserved && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  {isReservedByMe 
                    ? `Забронировано вами до ${new Date(item.reserved_until).toLocaleString()}`
                    : 'Забронировано другим пользователем'
                  }
                </p>
              </div>
            )}

            {/* Кнопки действий */}
            {!isMyItem && item.is_available && !isReserved && (
              <button
                onClick={handleReserve}
                disabled={actionLoading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {item.trade_type === 'rent' ? 'Арендовать' : 'Предложить обмен'}
              </button>
            )}
            
            {isReservedByMe && (
              <div className="space-y-2">
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition"
                >
                  Отменить бронирование
                </button>
                {item.trade_type === 'exchange' && (
                  <button
                    onClick={handleConfirm}
                    disabled={actionLoading}
                    className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition"
                  >
                    Подтвердить обмен
                  </button>
                )}
              </div>
            )}

            {isMyItem && (
              <div className="bg-gray-50 rounded p-4 text-center text-gray-600">
                Это ваше объявление
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          Объявление не найдено
        </div>
      )}
    </Modal>
  )
}