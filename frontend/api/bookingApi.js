import axiosClient from './axiosClient';

export const bookingApi = {
  create: (payload) => axiosClient.post('/bookings', payload), 
  getAll: (params) => axiosClient.get('/bookings', { params }), 
  getById: (id) => axiosClient.get(`/bookings/${id}`),
  updateStatus: (id, status) => axiosClient.patch(`/bookings/${id}`, { status }),
  getStats: (params) => axiosClient.get('/bookings/stats', { params }), // admin
};