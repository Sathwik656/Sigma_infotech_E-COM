import axiosInstance from '../lib/axios';

export async function list() {
  const response = await axiosInstance.get('/api/addresses');
  return response.data;
}

export async function create(data) {
  const response = await axiosInstance.post('/api/addresses', data);
  return response.data;
}

export async function update(id, data) {
  const response = await axiosInstance.patch(`/api/addresses/${id}`, data);
  return response.data;
}

export async function remove(id) {
  const response = await axiosInstance.delete(`/api/addresses/${id}`);
  return response.data;
}

export async function setDefault(id) {
  const response = await axiosInstance.patch(`/api/addresses/${id}/default`);
  return response.data;
}
