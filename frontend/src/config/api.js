export const API_URL = 'http://localhost:3000/api'

export const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken')
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }
}
