const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.__API_URL__) {
    return window.__API_URL__.replace(/\/+$/, '');
  }
  return (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
};

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      headers,
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      const errorMsg = err.details ? `${err.error}: ${err.details}` : (err.error || 'Request failed');
      throw new Error(errorMsg);
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (err) {
    if (err.name === 'TypeError' || err.message === 'Failed to fetch' || err.message?.includes('Load failed')) {
      throw new Error('Backend server is not reachable from this device. Please check your backend API URL.');
    }
    throw err;
  }
}

export const api = {
  // Kattalai types
  getKattalaiTypes: () => request('/kattalai-types'),
  addKattalaiType: (data) => request('/kattalai-types', { method: 'POST', body: JSON.stringify(data) }),
  updateKattalaiType: (id, max_slots) => request(`/kattalai-types/${id}`, { method: 'PUT', body: JSON.stringify({ max_slots }) }),

  getMyAttendance: (code) => request(`/my-attendance?code=${encodeURIComponent(code)}`),

  // Bookings
  getBookings: (date, search = '') => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (search) params.append('search', search);
    const qs = params.toString();
    return request(`/bookings${qs ? `?${qs}` : ''}`);
  },
  getBooking: (id) => request(`/bookings/${id}`),
  createBooking: (data) => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id, data) => request(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  transferBooking: (id, data) => request(`/bookings/${id}/transfer`, { method: 'POST', body: JSON.stringify(data) }),
  togglePresent: (id, present, user_id, user_name, user_role, target_year) =>
    request(`/bookings/${id}/present`, { method: 'PATCH', body: JSON.stringify({ present, user_id, user_name, user_role, target_year }) }),
  deleteBooking: (id) => request(`/bookings/${id}`, { method: 'DELETE' }),

  // Todos
  getTodos: () => request('/todos'),
  addTodoItem: (listId, name, booking_id) =>
    request(`/todos/${listId}/items`, { method: 'POST', body: JSON.stringify({ name, booking_id }) }),
  toggleTodoItem: (itemId, completed) =>
    request(`/todos/items/${itemId}`, { method: 'PATCH', body: JSON.stringify({ completed }) }),
  deleteTodoItem: (itemId) => request(`/todos/items/${itemId}`, { method: 'DELETE' }),

  // Panchangam
  getPanchangam: (date) => request(`/panchangam/${date}`),

  // Payments
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  createRazorpayOrder: (data) => request('/payments/razorpay/create-order', { method: 'POST', body: JSON.stringify(data) }),
  verifyRazorpaySignature: (data) => request('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(data) }),

  // WhatsApp
  whatsappHistory: () => request('/whatsapp/history'),
  whatsappPreview: (fromDate, toDate) => request(`/whatsapp/preview?fromDate=${fromDate}&toDate=${toDate}`),
  whatsappSendBatch: (data) => request('/whatsapp/send-batch', { method: 'POST', body: JSON.stringify(data) }),

  // History
  getHistory: (booking_id) => request(`/history${booking_id ? `?booking_id=${booking_id}` : ''}`),
  createHistoryLog: (data) => request('/history', { method: 'POST', body: JSON.stringify(data) }),
  getEditRequests: () => request('/edit-requests'),
  getEditRequestForBooking: (booking_id) => request(`/edit-requests/booking/${booking_id}`),
  createEditRequest: (data) => request('/edit-requests', { method: 'POST', body: JSON.stringify(data) }),
  updateEditRequestStatus: (id, status) => request(`/edit-requests/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Dropdown Options
  getDropdownOptions: (category) => request(`/dropdown-options${category ? `?category=${category}` : ''}`),
  addDropdownOption: (data) => request('/dropdown-options', { method: 'POST', body: JSON.stringify(data) }),
  deleteDropdownOption: (id) => request(`/dropdown-options/${id}`, { method: 'DELETE' }),

  // System Settings
  getSettings: () => request('/settings'),
  updateSetting: (key, value) => request('/settings', { method: 'PUT', body: JSON.stringify({ key, value }) }),

  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // Export
  downloadBookings: async () => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${BASE_URL}/bookings/export`, { headers });
    if (!response.ok) throw new Error('Failed to export');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `vairavan_kovil_bookings_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Staff Profiles & Roles (Superadmin)
  getUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};
