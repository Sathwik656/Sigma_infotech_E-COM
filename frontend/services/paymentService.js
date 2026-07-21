import axiosInstance from '../lib/axios';

export async function createOrder({ orderId, amount }) {
  const response = await axiosInstance.post('/api/payments/create-order', { orderId, amount });
  return response.data;
}

export async function verify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId }) {
  const response = await axiosInstance.post('/api/payments/verify', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId,
  });
  return response.data;
}

export async function getHistory({ page, limit } = {}) {
  const response = await axiosInstance.get('/api/payments/history', { params: { page, limit } });
  return response.data;
}

export async function getById(id) {
  const response = await axiosInstance.get(`/api/payments/${id}`);
  return response.data;
}
