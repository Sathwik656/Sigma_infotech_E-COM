import axiosInstance from '../lib/axios';

export async function list() {
  const response = await axiosInstance.get('/api/categories');
  return response.data;
}

export async function create(data) {
  const response = await axiosInstance.post('/api/categories', data);
  return response.data;
}

export async function update(id, data) {
  const response = await axiosInstance.put(`/api/categories/${id}`, data);
  return response.data;
}

export async function remove(id) {
  const response = await axiosInstance.delete(`/api/categories/${id}`);
  return response.data;
}
