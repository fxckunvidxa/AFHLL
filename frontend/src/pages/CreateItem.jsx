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
  const [images, setImages] = useState([])
  const [uploadedImages, setUploadedImages] = useState([])
  const [mainImageId, setMainImageId] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    setImages([...images, ...files])
    
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    
    try {
      const response = await media.upload(files)
      const newImageIds = response.data
      const newImages = files.map((file, idx) => ({
        file,
        id: newImageIds[idx],
        preview: URL.createObjectURL(file)
      }))
      setUploadedImages([...uploadedImages, ...newImages])
      if (!mainImageId && newImageIds[0]) {
        setMainImageId(newImageIds[0])
      }
    } catch (err) {
      alert('Ошибка загрузки изображений')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (uploadedImages.length === 0) {
      alert('Добавьте хотя бы одно изображение')
      return
    }
    
    setLoading(true)
    try {
      await items.create({
        ...formData,
        image_ids: uploadedImages.map(img => img.id),
        main_image_id: mainImageId
      })
      navigate('/')
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка создания')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Создать объявление</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Название
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
              Тип
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
              Изображения
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full"
            />
            
            <div className="mt-4 grid grid-cols-3 gap-4">
              {uploadedImages.map((img) => (
                <div key={img.id} className="relative">
                  <img
                    src={img.preview}
                    alt="Preview"
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => setMainImageId(img.id)}
                    className={`absolute top-1 right-1 p-1 rounded-full ${
                      mainImageId === img.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }`}
                  >
                    ★
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition disabled:opacity-50"
          >
            {loading ? 'Создание...' : 'Создать'}
          </button>
        </form>
      </div>
    </div>
  )
}