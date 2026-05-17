import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { items, media } from '../api'

export default function CreateItem() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    trade_type: 'exchange',
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
      console.log('Uploaded image IDs:', imageIds)
      
      const newImages = files.map((file, idx) => ({
        id: imageIds[idx],
        preview: URL.createObjectURL(file),
        fileName: file.name
      }))
      
      setUploadedImages(prev => {
        const updated = [...prev, ...newImages]
        console.log('Updated images:', updated)
        return updated
      })
      
      // Устанавливаем главное изображение, если его нет
      if (!mainImageId && imageIds.length > 0) {
        setMainImageId(imageIds[0])
        console.log('Auto-set main image to:', imageIds[0])
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
    
    console.log('Form submitted. Images:', uploadedImages, 'Main ID:', mainImageId)
    
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
        image_ids: imageIds,
        main_image_id: mainImageId,
      }
      
      console.log('Sending item data:', itemData)
      
      await items.create(itemData)
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
      
      // Если удалили главное изображение
      if (mainImageId === imageId) {
        const newMainId = updated[0]?.id || null
        setMainImageId(newMainId)
        console.log('Removed main image, new main:', newMainId)
      }
      
      return updated
    })
  }

  // Проверяем, можно ли отправить форму
  const isFormValid = () => {
    const hasTitle = formData.title.trim().length > 0
    const hasImages = uploadedImages.length > 0
    const hasMainImage = mainImageId !== null
    const notLoading = !loading && !uploading
    
    console.log('Form valid check:', { hasTitle, hasImages, hasMainImage, notLoading })
    
    return hasTitle && hasImages && hasMainImage && notLoading
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Создать объявление</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Название *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Тип *
            </label>
            <select
              value={formData.trade_type}
              onChange={(e) => setFormData({...formData, trade_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="exchange">Обмен</option>
              <option value="rent">Аренда</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Изображения *
            </label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png"
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full"
            />
            {uploading && (
              <div className="text-sm text-blue-500 mt-1">
                Загрузка изображений...
              </div>
            )}
            
            {uploadedImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  {uploadedImages.length} фото загружено. 
                  {mainImageId ? ' ✓ Главное фото выбрано' : ' ✗ Выберите главное фото'}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {uploadedImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.preview}
                        alt={img.fileName}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMainImageId(img.id)
                          console.log('Manual set main image to:', img.id)
                        }}
                        className={`absolute top-1 right-1 p-1 rounded-full text-lg transition ${
                          mainImageId === img.id
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-700 text-white opacity-70 hover:opacity-100'
                        }`}
                        title={mainImageId === img.id ? 'Главное фото' : 'Сделать главным'}
                      >
                        ★
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute bottom-1 right-1 p-1 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition"
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!isFormValid()}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание...' : 'Создать объявление'}
          </button>
          
          {/* Отладочная информация (можно убрать после отладки) */}
          <div className="mt-4 text-xs text-gray-500">
            <div>Статус формы:</div>
            <div>- Название: {formData.title ? '✓' : '✗'}</div>
            <div>- Изображения: {uploadedImages.length > 0 ? `✓ (${uploadedImages.length})` : '✗'}</div>
            <div>- Главное фото: {mainImageId ? '✓' : '✗'}</div>
            <div>- Загрузка: {uploading ? 'да' : 'нет'}</div>
          </div>
        </form>
      </div>
    </div>
  )
}