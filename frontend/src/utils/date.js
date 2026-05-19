export function parseUTCDate(dateStr) {
  if (!dateStr) return null
  // Если строка уже содержит Z или смещение, оставляем как есть
  if (dateStr.includes('Z') || dateStr.includes('+')) {
    return new Date(dateStr)
  }
  // Иначе добавляем Z (UTC)
  return new Date(dateStr + 'Z')
}