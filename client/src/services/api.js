import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  verifyEmail: (token) => api.get(`/auth/verify/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

export const chatApi = {
  createSession: () => api.post('/chat/session'),
  sendMessage: (data) => api.post('/chat/message', data, { responseType: 'stream' }),
  transcribeVoice: (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    return api.post('/chat/transcribe', formData);
  },
  textToSpeech: (text) => api.post('/chat/tts', { text }, { responseType: 'arraybuffer' }),
  getConversations: () => api.get('/chat/conversations'),
  getConversation: (sessionId) => api.get(`/chat/conversations/${sessionId}`),
  deleteConversation: (sessionId) => api.delete(`/chat/conversations/${sessionId}`),
};

export const productApi = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
  seedProducts: () => api.get('/products/seed'),
};

export const orderApi = {
  createOrder: (data) => api.post('/orders', data),
  getOrders: (sessionId) => api.get('/orders', { params: { sessionId } }),
  getOrder: (id) => api.get(`/orders/${id}`),
};

export const paymentApi = {
  createPaymentIntent: (data) => api.post('/payments/create-intent', data),
};

export const reservationApi = {
  reserve: (items) => api.post('/reservations', { items }),
  release: () => api.delete('/reservations'),
};

export default api;
