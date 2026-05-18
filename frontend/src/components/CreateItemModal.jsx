import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { items, media } from '../api'
import Modal from './Modal'

export default function CreateItemModal({ isOpen, onClose, onSuccess }) {
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
        image_ids: imageIds,
        main_image_id: mainImageId,
      }
      
      await items.create(itemData)
      onSuccess?.()
      onClose()
      // Очищаем форму
      setFormData({ title: '', description: '', trade_type: 'exchange' })
      setUploadedImages([])
      setMainImageId(null)
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

  const resetForm = () => {
    setFormData({ title: '', description: '', trade_type: 'exchange' })
    setUploadedImages([])
    setMainImageId(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Создать объявление">
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
                      onClick={() => setMainImageId(img.id)}
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
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 transition"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading || uploading || uploadedImages.length === 0 || !mainImageId || !formData.title.trim()}
            className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание...' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  )
}