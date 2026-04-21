import axios from 'axios'

const API_BASE = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const auth = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  getMe: () => api.get('/users/me'),
}

export const items = {
  getAll: (tradeType) => api.get('/items/available', { params: { trade_type: tradeType } }),
  getMy: () => api.get('/items/user/my'),
  getOne: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items/', data),
  reserve: (id) => api.post(`/items/${id}/reserve`),
  cancelReserve: (id) => api.post(`/items/${id}/cancel-reserve`),
  confirmExchange: (id) => api.post(`/items/${id}/confirm-exchange`),
  setMainImage: (itemId, imageId) => api.patch(`/items/${itemId}/set-main-image`, null, { params: { image_id: imageId } }),
}

export const media = {
  upload: (files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    return api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

export default api