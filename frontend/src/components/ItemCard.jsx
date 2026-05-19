import { Link } from 'react-router-dom'
import { parseUTCDate } from '../utils/date'

export default function ItemCard({ item }) {
  const mainImage = item.images?.find(img => img.is_main) || item.images?.[0]
  
  // Проверяем, забронирована ли вещь сейчас
  const isReserved = item.reserved_by_id !== null && 
    item.reserved_until && 
    parseUTCDate(item.reserved_until) > new Date()

  const getImageUrl = (image) => {
    if (!image) return null
    if (image.url) return `http://localhost:8000${image.url}`
    if (image.thumb_url) return `http://localhost:8000${image.thumb_url}`
    return null
  }

  return (
    <Link to={`/item/${item.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer">
        <div className="relative h-48 bg-gray-200">
          {mainImage ? (
            <img
              src={getImageUrl(mainImage)}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              Нет фото
            </div>
          )}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              item.trade_type === 'rent' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {item.trade_type === 'rent' ? 'Аренда' : 'Обмен'}
            </span>
          </div>
          {isReserved && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-bold text-lg">ЗАБРОНИРОВАНО</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
          {item.description && (
            <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
          )}
        </div>
      </div>
    </Link>
  )
}