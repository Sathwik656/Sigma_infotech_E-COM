import axiosInstance from '../lib/axios';

export async function getCart() {
  const response = await axiosInstance.get('/api/cart');
  return response.data;
}

export async function addItem({ productId, quantity }) {
  const response = await axiosInstance.post('/api/cart/items', { productId, quantity });
  return response.data;
}

export async function updateItemQuantity(itemId, { quantity }) {
  const response = await axiosInstance.patch(`/api/cart/items/${itemId}`, { quantity });
  return response.data;
}

export async function removeItem(itemId) {
  const response = await axiosInstance.delete(`/api/cart/items/${itemId}`);
  return response.data;
}

export async function clearCart() {
  const response = await axiosInstance.delete('/api/cart');
  return response.data;
}
