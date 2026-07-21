import axiosInstance from '../lib/axios';

/* -------------------------------------------------------
   Products
   ------------------------------------------------------- */
export async function getProducts({ page, limit, search } = {}) {
  const response = await axiosInstance.get('/api/products', { params: { page, limit, search } });
  return response.data;
}

export async function getProductById(id) {
  const response = await axiosInstance.get(`/api/products/id/${id}`);
  return response.data;
}

export async function createProduct(data) {
  const response = await axiosInstance.post('/api/products', data);
  return response.data;
}

export async function updateProduct(id, data) {
  const response = await axiosInstance.put(`/api/products/${id}`, data);
  return response.data;
}

export async function deleteProduct(id) {
  const response = await axiosInstance.delete(`/api/products/${id}`);
  return response.data;
}

/* -------------------------------------------------------
   Product Images
   ------------------------------------------------------- */
export async function getProductImages(productId) {
  const response = await axiosInstance.get(`/api/products/${productId}/images`);
  return response.data;
}

export async function uploadProductImage(productId, file, { alt = '', is_primary = false } = {}) {
  const formData = new FormData();
  formData.append('image', file);
  if (alt) formData.append('alt', alt);
  if (is_primary) formData.append('is_primary', 'true');

  const response = await axiosInstance.post(`/api/products/${productId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function deleteProductImage(productId, imageId) {
  const response = await axiosInstance.delete(`/api/products/${productId}/images/${imageId}`);
  return response.data;
}

export async function setPrimaryImage(productId, imageId) {
  const response = await axiosInstance.put(`/api/products/${productId}/images/${imageId}/primary`);
  return response.data;
}

/* -------------------------------------------------------
   Dashboard
   ------------------------------------------------------- */
export async function getDashboardStats() {
  const response = await axiosInstance.get('/api/admin/dashboard/stats');
  return response.data;
}

/* -------------------------------------------------------
   Users / Customers
   ------------------------------------------------------- */
export async function getUsers({ page, limit, search, role } = {}) {
  const response = await axiosInstance.get('/api/admin/users', { params: { page, limit, search, role } });
  return response.data;
}

export async function getUserById(id) {
  const response = await axiosInstance.get(`/api/admin/users/${id}`);
  return response.data;
}

// Alias kept for backward compat (maps to role update on server)
export async function updateUserStatus(id, { status }) {
  const response = await axiosInstance.put(`/api/admin/users/${id}/status`, { role: status });
  return response.data;
}

export async function updateUserRole(id, { role }) {
  const response = await axiosInstance.patch(`/api/admin/users/${id}/role`, { role });
  return response.data;
}

/* -------------------------------------------------------
   Orders (Admin)
   ------------------------------------------------------- */
export async function getOrders({ page, limit, status } = {}) {
  const response = await axiosInstance.get('/api/admin/orders', { params: { page, limit, status } });
  return response.data;
}

export async function getOrderById(id) {
  const response = await axiosInstance.get(`/api/admin/orders/${id}`);
  return response.data;
}

export async function updateOrderStatus(id, { status, payment_status, shipment_status, notes } = {}) {
  const response = await axiosInstance.patch(`/api/admin/orders/${id}/status`, {
    status, payment_status, shipment_status, notes,
  });
  return response.data;
}

/* -------------------------------------------------------
   Inventory
   ------------------------------------------------------- */
export async function getInventory({ page, limit, lowStock } = {}) {
  const response = await axiosInstance.get('/api/inventory', { params: { page, limit, lowStock } });
  return response.data;
}

export async function getInventoryByProductId(productId) {
  const response = await axiosInstance.get(`/api/inventory/${productId}`);
  return response.data;
}

export async function addStock({ productId, quantity, notes } = {}) {
  const response = await axiosInstance.post('/api/inventory/add', { productId, quantity, notes });
  return response.data;
}

export async function removeStock({ productId, quantity, notes } = {}) {
  const response = await axiosInstance.post('/api/inventory/remove', { productId, quantity, notes });
  return response.data;
}

export async function getInventoryTransactions(productId, { page, limit } = {}) {
  const response = await axiosInstance.get(`/api/inventory/${productId}/transactions`, { params: { page, limit } });
  return response.data;
}

/* -------------------------------------------------------
   Shipments
   ------------------------------------------------------- */
export async function getShipments({ page, limit, status } = {}) {
  const response = await axiosInstance.get('/api/shipments', { params: { page, limit, status } });
  return response.data;
}

export async function getShipmentByOrderId(orderId) {
  const response = await axiosInstance.get(`/api/shipments/${orderId}`);
  return response.data;
}

export async function updateShipment(orderId, data) {
  const response = await axiosInstance.patch(`/api/shipments/${orderId}`, data);
  return response.data;
}

/* -------------------------------------------------------
   Payments
   ------------------------------------------------------- */
export async function getPayments({ page, limit, status } = {}) {
  const response = await axiosInstance.get('/api/payments/history', { params: { page, limit, status } });
  return response.data;
}

/* -------------------------------------------------------
   Brands
   ------------------------------------------------------- */
export async function getBrands() {
  const response = await axiosInstance.get('/api/brands');
  return response.data;
}

export async function createBrand(data) {
  const response = await axiosInstance.post('/api/brands', data);
  return response.data;
}

export async function deleteBrand(id) {
  const response = await axiosInstance.delete(`/api/brands/${id}`);
  return response.data;
}

/* -------------------------------------------------------
   Categories
   ------------------------------------------------------- */
export async function getCategories() {
  const response = await axiosInstance.get('/api/categories');
  return response.data;
}

export async function createCategory(data) {
  const response = await axiosInstance.post('/api/categories', data);
  return response.data;
}

export async function deleteCategory(id) {
  const response = await axiosInstance.delete(`/api/categories/${id}`);
  return response.data;
}
