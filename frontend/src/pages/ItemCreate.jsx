import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { items, media } from '../services/api'
import { useGalleryContext } from './Gallery'
import Modal from '../components/Modal'

export default function ItemCreate() {
  const navigate = useNavigate()
  const { onUpdate } = useGalleryContext()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trade_type: 'exchange',
    contacts: '',
  })
  const [uploadedImages, setUploadedImages] = useState([])
  const [mainImageId, setMainImageId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    setUploading(true)  
    
    try {
      const imageIds = await media.upload(files)
      
      const newImages = files.map((file, idx) => ({
        id: imageIds[idx],
        preview: URL.createObjectURL(file),
        fileName: file.name
      }))
      
      setUploadedImages(prev => [...prev, ...newImages])
      
      if (!mainImageId && imageIds.length > 0) {
        setMainImageId(imageIds[0])
      }
      
      e.target.value = ''
      
    } catch (err) {
      console.error('Upload error:', err)
      alert('Ошибка загрузки изображений: ' + (err.response?.data?.detail || err.message))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (uploadedImages.length === 0) {
      alert('Добавьте хотя бы одно изображение')
      return
    }
    
    if (!mainImageId) {
      alert('Выберите главное изображение')
      return
    }
    
    setLoading(true)
    
    try {
      const imageIds = uploadedImages.map(img => img.id)
      
      const itemData = {
        title: formData.title,
        description: formData.description,
        trade_type: formData.trade_type,
        contacts: formData.contacts,
        image_ids: imageIds,
        main_image_id: mainImageId,
      }
      
      await items.create(itemData)
      onUpdate()
      navigate('/')
    } catch (err) {
      console.error('Create item error:', err)
      alert('Ошибка создания объявления: ' + (err.response?.data?.detail || err.message))
    } finally {
      setLoading(false)
    }
  }

  const removeImage = (imageId) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)
      
      if (mainImageId === imageId) {
        const newMainId = updated[0]?.id || null
        setMainImageId(newMainId)
      }
      
      return updated
    })
  }

  const onClose = () => navigate('/')

  const mainImage = uploadedImages.find(img => img.id === mainImageId) || uploadedImages[0]

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col md:flex-row">
        {/* Левая часть - галерея */}
        <div className="md:w-2/3 p-6 bg-gray-50">
          <div className="relative bg-white rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
            {mainImage ? (
              <img
                src={mainImage.preview}
                alt="Preview"
                className="w-full h-full object-contain"
                style={{ maxHeight: '350px' }}
              />
            ) : (
              <div className="w-full h-64 flex flex-col items-center justify-center text-gray-400">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Здесь будет главное фото</span>
              </div>
            )}
          </div>
          
          {/* Миниатюры загруженных фото */}
          {uploadedImages.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto">
              {uploadedImages.map((img) => (
                <div key={img.id} className="relative flex-shrink-0">
                  <button
                    onClick={() => setMainImageId(img.id)}
                    className={`w-16 h-16 rounded border-2 overflow-hidden ${
                      mainImageId === img.id ? 'border-blue-500' : 'border-gray-300'
                    }`}
                  >
                    <img
                      src={img.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center hover:bg-red-600"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Область загрузки новых фото */}
          <div className="mt-4">
            <label className={`flex items-center justify-center w-full h-20 border-2 border-dashed rounded-lg cursor-pointer transition ${
              uploading ? 'bg-gray-100 border-gray-300' : 'hover:bg-gray-100 border-gray-300 hover:border-blue-400'
            }`}>
              <div className="text-center">
                {uploading ? (
                  <span className="text-sm text-gray-500">⏳ Загрузка...</span>
                ) : (
                  <span className="text-sm text-gray-500">📸 + Добавить фото</span>
                )}
              </div>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Правая часть - форма */}
        <div className="md:w-1/3 p-6 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Новое объявление</h2>
          
          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Название *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Например: Велосипед"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Описание
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Опишите вещь, её состояние..."
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Тип *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, trade_type: 'exchange'})}
                  className={`flex-1 py-2 rounded-lg border transition ${
                    formData.trade_type === 'exchange'
                      ? 'bg-purple-100 border-purple-400 text-purple-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  🔄 Обмен
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, trade_type: 'rent'})}
                  className={`flex-1 py-2 rounded-lg border transition ${
                    formData.trade_type === 'rent'
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  💰 Аренда
                </button>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-1">
                Контакты для связи
              </label>
              <input
                type="text"
                value={formData.contacts}
                onChange={(e) => setFormData({...formData, contacts: e.target.value})}
                placeholder="@telegram или +7..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Покажутся только тому, кто забронирует
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Отмена
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || uploading || uploadedImages.length === 0 || !mainImageId}
              className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 font-medium"
            >
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}