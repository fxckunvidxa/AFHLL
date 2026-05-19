// frontend/src/pages/Gallery.jsx
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Outlet, useOutletContext } from 'react-router-dom'
import { items } from '../services/api'
import ItemCard from '../components/ItemCard'
import { useAuth } from '../services/auth'

export function useGalleryContext() {
  return useOutletContext()
}

export default function Gallery() {
  const [filter, setFilter] = useState('all')
  const { user } = useAuth()
  
  const queryFn = async () => {
    if (filter === 'my') {
      const result = await items.getMy()
      return Array.isArray(result) ? result : []
    }
    const tradeType = filter === 'all' || filter === 'my' ? null : filter
    const result = await items.getAll(tradeType)
    return Array.isArray(result) ? result : []
  }

  const { data: itemsList = [], isLoading, error, refetch } = useQuery({
    queryKey: ['items', filter],
    queryFn,
  })

  useEffect(() => {
    refetch()
  }, [filter, refetch])

  const contextValue = {
    items: itemsList,
    onUpdate: refetch
  }

  const isMyItemsTab = filter === 'my'

  return (
    <>
      <div>
        {/* Фильтры */}
        <div className="mb-5">
          <div className="flex gap-1 border-b">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm font-medium ${
                filter === 'all'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter('exchange')}
              className={`px-3 py-1.5 text-sm font-medium ${
                filter === 'exchange'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Обмен
            </button>
            <button
              onClick={() => setFilter('rent')}
              className={`px-3 py-1.5 text-sm font-medium ${
                filter === 'rent'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Аренда
            </button>
            
            {user && (
              <button
                onClick={() => setFilter('my')}
                className={`px-3 py-1.5 text-sm font-medium ${
                  filter === 'my'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Мои
              </button>
            )}
          </div>
        </div>

        {/* Сетка карточек — уменьшенные карточки */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 text-sm">
            Ошибка загрузки: {error.message}
          </div>
        ) : itemsList.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-gray-500 text-sm mb-2">
              {isMyItemsTab 
                ? 'У вас пока нет объявлений' 
                : 'Нет доступных объявлений'
              }
            </div>
            {isMyItemsTab && (
              <button
                onClick={() => setFilter('all')}
                className="text-blue-500 hover:underline text-sm"
              >
                Посмотреть все объявления
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {itemsList.map((item) => (
              <ItemCard key={item.id} item={item} onUpdate={refetch} />
            ))}
          </div>
        )}
      </div>
      
      <Outlet context={contextValue} />
    </>
  )
}