import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { items } from '../api'
import ItemCard from '../components/ItemCard'
import ItemDetailsModal from '../components/ItemDetailsModal'

export default function MyItems() {
  const [selectedItemId, setSelectedItemId] = useState(null)
  
  const { data: itemsList = [], isLoading, refetch } = useQuery({
    queryKey: ['my-items'],
    queryFn: items.getMy,
  })

  const handleItemClick = (itemId) => {
    setSelectedItemId(itemId)
  }

  const handleCloseModal = () => {
    setSelectedItemId(null)
    refetch()
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Мои объявления</h2>
      
      {itemsList.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          У вас пока нет объявлений
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itemsList.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item} 
              onUpdate={refetch}
              onClick={() => handleItemClick(item.id)}
            />
          ))}
        </div>
      )}

      <ItemDetailsModal
        isOpen={!!selectedItemId}
        onClose={handleCloseModal}
        itemId={selectedItemId}
        onUpdate={refetch}
      />
    </div>
  )
}