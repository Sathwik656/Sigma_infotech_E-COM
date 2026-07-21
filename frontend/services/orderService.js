import axiosInstance from '../lib/axios';

export async function create({ addressId, shippingCharge = 0, taxRate = 0 } = {}) {
  const response = await axiosInstance.post('/api/orders', { addressId, shippingCharge, taxRate });
  return response.data;
}


export async function list({ page, limit, status } = {}) {
  const response = await axiosInstance.get('/api/orders', { params: { page, limit, status } });
  return response.data;
}

export async function getById(id) {
  const response = await axiosInstance.get(`/api/orders/${id}`);
  return response.data;
}
