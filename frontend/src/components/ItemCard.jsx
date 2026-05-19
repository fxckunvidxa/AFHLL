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
    if (image.thumb_url) return `http://localhost:8000${image.thumb_url}`
    if (image.url) return `http://localhost:8000${image.url}`
    return null
  }

  return (
    <Link to={`/item/${item.id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden">
        <div className="relative aspect-square bg-gray-100">
          {mainImage ? (
            <img
              src={getImageUrl(mainImage)}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Бейдж типа */}
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              item.trade_type === 'rent' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-purple-100 text-purple-700'
            }`}>
              {item.trade_type === 'rent' ? 'Аренда' : 'Обмен'}
            </span>
          </div>
          
          {/* Оверлей бронирования */}
          {isReserved && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold text-xs tracking-wider px-2 py-1 bg-black bg-opacity-50 rounded">
                ЗАБРОНИРОВАНО
              </span>
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="text-sm font-semibold truncate">{item.title}</h3>
          {item.description ? (
            <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
          ) : (
            <p className="text-xs text-gray-400 italic mt-0.5">Нет описания</p>
          )}
        </div>
      </div>
    </Link>
  )
}