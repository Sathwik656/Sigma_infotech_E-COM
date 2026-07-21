import axiosInstance from '../lib/axios';

export async function list() {
  const response = await axiosInstance.get('/api/brands');
  return response.data;
}

export async function create(data) {
  const response = await axiosInstance.post('/api/brands', data);
  return response.data;
}

export async function update(id, data) {
  const response = await axiosInstance.put(`/api/brands/${id}`, data);
  return response.data;
}

export async function remove(id) {
  const response = await axiosInstance.delete(`/api/brands/${id}`);
  return response.data;
}
