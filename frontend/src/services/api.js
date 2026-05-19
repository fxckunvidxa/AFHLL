import axios from 'axios'

const API_BASE = 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const auth = {
  register: (data) => api.post('/register', data),
  login: (formData) => api.post('/login', formData, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  getMe: () => api.get('/users/me'),
}

export const items = {
  getAll: async (tradeType) => {
    const response = await api.get('/items/available', { 
      params: { trade_type: tradeType } 
    })
    return Array.isArray(response.data) ? response.data : []
  },
  getMy: async () => {
    const response = await api.get('/items/user/my')
    return Array.isArray(response.data) ? response.data : []
  },
  getOne: (id) => api.get(`/items/${id}`),
  create: (data) => api.post('/items/', data),
  reserve: (id) => api.post(`/items/${id}/reserve`),
  cancelReserve: (id) => api.post(`/items/${id}/cancel-reserve`),
  confirmExchange: (id) => api.post(`/items/${id}/confirm-exchange`),
  getContacts: (id) => api.get(`/items/${id}/contacts`),
  setMainImage: (itemId, imageId) => api.patch(`/items/${itemId}/set-main-image`, null, { params: { image_id: imageId } }),
  update: (id, data) => api.patch(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
}

export const media = {
  upload: async (files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    const response = await api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return Array.isArray(response.data) ? response.data : []
  },
}

export default api