// frontend/src/pages/ItemDetails.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'
import { items } from '../services/api'
import { useGalleryContext } from './Gallery'
import Modal from '../components/Modal'
import { parseUTCDate } from '../utils/date'

export default function ItemDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { items: allItems, onUpdate } = useGalleryContext()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [contacts, setContacts] = useState(null)
  const [showContacts, setShowContacts] = useState(false)
  
  // Состояния для редактирования
  const [isEditing, setIsEditing] = useState(false)
  const [editDescription, setEditDescription] = useState('')
  const [editContacts, setEditContacts] = useState('')

  // Загрузка данных
  useEffect(() => {
    fetchItemDetails()
  }, [id])

  // Навигация по стрелкам
  useEffect(() => {
    const currentIndex = allItems.findIndex(i => i.id === parseInt(id))
    const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : null
    const nextItem = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft' && prevItem) {
        navigate(`/item/${prevItem.id}`)
      } else if (e.key === 'ArrowRight' && nextItem) {
        navigate(`/item/${nextItem.id}`)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [id, allItems, navigate])

  const fetchItemDetails = async () => {
    setLoading(true)
    try {
      const response = await items.getOne(id)
      setItem(response.data)
      setEditDescription(response.data.description || '')
      setEditContacts(response.data.contacts || '')
      setCurrentImageIndex(0)
      setShowContacts(false)
      setContacts(null)
      setIsEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReserve = async () => {
    setActionLoading(true)
    try {
      await items.reserve(item.id)
      onUpdate()
      await fetchItemDetails()
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelReserve = async () => {
    setActionLoading(true)
    try {
      await items.cancelReserve(item.id)
      onUpdate()
      await fetchItemDetails()
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!confirm('Подтвердить обмен/аренду? После этого объявление станет недоступным.')) return
    
    setActionLoading(true)
    try {
      await items.confirmExchange(item.id)
      onUpdate()
      await fetchItemDetails()
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleShowContacts = async () => {
    if (showContacts) {
      setShowContacts(false)
      return
    }
    
    setActionLoading(true)
    try {
      const response = await items.getContacts(item.id)
      setContacts(response.data)
      setShowContacts(true)
    } catch (err) {
      alert(err.response?.data?.detail || 'Не удалось получить контакты')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdate = async () => {
    setActionLoading(true)
    try {
      await items.update(item.id, {
        description: editDescription,
        contacts: editContacts,
      })
      setIsEditing(false)
      onUpdate()
      await fetchItemDetails()
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка при обновлении')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.')) return
    
    setActionLoading(true)
    try {
      await items.delete(item.id)
      onUpdate()
      onClose()
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка при удалении')
    } finally {
      setActionLoading(false)
    }
  }

  const onClose = () => navigate('/')

  if (loading) {
    return (
      <Modal onClose={onClose}>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Modal>
    )
  }

  if (!item) {
    return (
      <Modal onClose={onClose}>
        <div className="text-center py-20">
          <p className="text-red-500">Объявление не найдено</p>
        </div>
      </Modal>
    )
  }

  const now = new Date()
  const reserved = item.reserved_by_id !== null && item.reserved_until && parseUTCDate(item.reserved_until) > now
  const reservedByMe = reserved && item.reserved_by_id === user?.id
  const isMyItem = item.owner_id === user?.id
  const isExpired = item.reserved_until && parseUTCDate(item.reserved_until) < now

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

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col md:flex-row">
        {/* Левая часть - галерея */}
        <div className="md:w-2/3 p-6 bg-gray-50">
          <div className="relative bg-white rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
            {item.images?.[currentImageIndex] ? (
              <img
                src={getImageUrl(item.images[currentImageIndex])}
                alt={item.title}
                className="w-full h-full object-contain"
                style={{ maxHeight: '500px' }}
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center text-gray-400">
                Нет фото
              </div>
            )}
            
            {item.images && item.images.length > 1 && (
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
          {item.images && item.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
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
          )}
        </div>

        {/* Правая часть - информация */}
        <div className="md:w-1/3 p-6 flex flex-col">
          <div className="mb-4">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-2xl font-bold">{item.title}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                item.trade_type === 'rent' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-purple-100 text-purple-800'
              }`}>
                {item.trade_type === 'rent' ? 'Аренда' : 'Обмен'}
              </span>
            </div>
            
            {/* Описание - с возможностью редактирования для владельца */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Описание:</h3>
                {isMyItem && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Редактировать
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Описание..."
                  />
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Контакты для связи
                    </label>
                    <input
                      type="text"
                      value={editContacts}
                      onChange={(e) => setEditContacts(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="@telegram или +7..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleUpdate}
                      disabled={actionLoading}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      Сохранить
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {item.description || <span className="text-gray-400 italic">Нет описания</span>}
                  </p>
                  {item.contacts && (
                    <div className="mt-3 pt-3 border-t">
                      <h4 className="text-sm font-semibold text-gray-600 mb-1">Контакты:</h4>
                      <p className="text-sm text-gray-500">{item.contacts}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Контакты владельца (для забронировавших) */}
          {showContacts && contacts && (
            <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
              <p className="text-sm text-green-800 font-semibold mb-1">Контакты владельца:</p>
              <p className="text-sm text-green-700">{contacts.contacts}</p>
              {contacts.owner_name && (
                <p className="text-xs text-green-600 mt-1">Владелец: {contacts.owner_name}</p>
              )}
              <p className="text-xs text-green-600 mt-2">Свяжитесь с владельцем, чтобы договориться</p>
            </div>
          )}

          {/* Статус бронирования */}
          {reserved && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800">
                {reservedByMe 
                  ? `✓ Вы забронировали эту вещь до ${new Date(parseUTCDate(item.reserved_until)).toLocaleTimeString()}`
                  : '⚠️ Эта вещь уже забронирована другим пользователем'
                }
              </p>
              {reservedByMe && item.reserved_until && (
                <p className="text-xs text-yellow-600 mt-1">
                  У вас есть время до {new Date(parseUTCDate(item.reserved_until)).toLocaleTimeString()}, чтобы связаться с владельцем
                </p>
              )}
            </div>
          )}

          {isExpired && !isMyItem && (
            <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
              <p className="text-sm text-gray-600">Бронирование истекло. Вы можете забронировать снова.</p>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="mt-auto space-y-2">
            {/* Не владелец, вещь доступна, не забронирована */}
            {!isMyItem && item.is_available && !reserved && (
              <button
                onClick={handleReserve}
                disabled={actionLoading}
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
              >
                {item.trade_type === 'rent' ? 'Арендовать' : 'Предложить обмен'}
              </button>
            )}
            
            {/* Забронировано мной */}
            {reservedByMe && (
              <>
                {!showContacts && (
                  <button
                    onClick={handleShowContacts}
                    disabled={actionLoading}
                    className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                  >
                    Показать контакты владельца
                  </button>
                )}
                
                <button
                  onClick={handleCancelReserve}
                  disabled={actionLoading}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                >
                  Отменить бронирование
                </button>
              </>
            )}

            {/* Владелец, вещь забронирована кем-то */}
            {isMyItem && reserved && (
              <>
                <div className="bg-blue-50 rounded p-3 text-center text-sm text-blue-800">
                  Вещь забронирована другим пользователем
                </div>
                <button
                  onClick={handleCancelReserve}
                  disabled={actionLoading}
                  className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
                >
                  Снять бронь (освободить вещь)
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
                >
                  Подтвердить сделку
                </button>
              </>
            )}

            {/* Владелец, вещь не забронирована */}
            {isMyItem && !reserved && item.is_available && !isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 transition disabled:opacity-50"
                >
                  Удалить
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}