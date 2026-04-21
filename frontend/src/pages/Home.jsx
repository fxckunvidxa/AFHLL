import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { items } from '../api'
import ItemCard from '../components/ItemCard'

export default function Home() {
  const [filter, setFilter] = useState('all')
  const queryClient = useQueryClient()

  const { data: itemsList = [], isLoading, refetch } = useQuery({
    queryKey: ['items', filter],
    queryFn: () => items.getAll(filter === 'all' ? null : filter),
  })

  // Обновление в реальном времени каждые 5 секунд
  React.useEffect(() => {
    const interval = setInterval(() => {
      refetch()
    }, 5000)
    return () => clearInterval(interval)
  }, [refetch])

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

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : itemsList.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          Нет доступных объявлений
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itemsList.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={refetch} />
          ))}
        </div>
      )}
    </div>
  )
}