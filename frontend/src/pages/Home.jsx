import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { items } from '../api'
import ItemCard from '../components/ItemCard'
import ItemDetailsModal from '../components/ItemDetailsModal'

export default function Home() {
  const [filter, setFilter] = useState('all')
  const [selectedItemId, setSelectedItemId] = useState(null)

  const { data: itemsList = [], isLoading, error, refetch } = useQuery({
    queryKey: ['items', filter],
    queryFn: async () => {
      console.log('Fetching items with filter:', filter)
      const result = await items.getAll(filter === 'all' ? null : filter)
      console.log('Fetched items:', result)
      return result
    },
  })

  // Обновление в реальном времени каждые 5 секунд
  React.useEffect(() => {
    const interval = setInterval(() => {
      console.log('Refetching items...')
      refetch()
    }, 5000)
    return () => clearInterval(interval)
  }, [refetch])

  const handleItemClick = (itemId) => {
    setSelectedItemId(itemId)
  }

  const handleCloseModal = () => {
    setSelectedItemId(null)
    refetch() // Обновляем список после закрытия модалки
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    console.error('Query error:', error)
    return (
      <div className="text-center py-10 text-red-500">
        Ошибка загрузки: {error.message}
      </div>
    )
  }

  const itemsArray = Array.isArray(itemsList) ? itemsList : []

  return (
    <div>
      <div className="mb-6">
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium ${
              filter === 'all'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setFilter('exchange')}
            className={`px-4 py-2 font-medium ${
              filter === 'exchange'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Обмен
          </button>
          <button
            onClick={() => setFilter('rent')}
            className={`px-4 py-2 font-medium ${
              filter === 'rent'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Аренда
          </button>
        </div>
      </div>

      {itemsArray.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-gray-500 mb-2">Нет доступных объявлений</div>
          <div className="text-sm text-gray-400">
            Попробуйте создать новое объявление или изменить фильтр
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itemsArray.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onUpdate={refetch}
              onClick={() => handleItemClick(item.id)}
            />
          ))}
        </div>
      )}

      {/* Модальное окно с деталями объявления */}
      <ItemDetailsModal
        isOpen={!!selectedItemId}
        onClose={handleCloseModal}
        itemId={selectedItemId}
        onUpdate={refetch}
      />
    </div>
  )
}