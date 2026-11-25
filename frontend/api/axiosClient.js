import axios from 'axios';


const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); 
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) =>
    Promise.reject({
      status: error.response?.status,
      message: error.response?.data?.message || error.message || 'Không kết nối được máy chủ',
      data: error.response?.data?.data,
    })
);

export default axiosClient;