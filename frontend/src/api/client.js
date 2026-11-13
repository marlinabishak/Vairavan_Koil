const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
    }
    if (window.__API_URL__) {
      return window.__API_URL__.replace(/\/+$/, '');
    }
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

// In-memory cache for Panchangam records by date string ('YYYY-MM-DD')
const panchangamCache = new Map();

export const clearPanchangamCache = () => {
  panchangamCache.clear();
};

export const api = {
  // Kattalai types
  getKattalaiTypes: () => request('/kattalai-types'),
  addKattalaiType: (data) => request('/kattalai-types', { method: 'POST', body: JSON.stringify(data) }),
  updateKattalaiType: (id, max_slots) => request(`/kattalai-types/${id}`, { method: 'PUT', body: JSON.stringify({ max_slots }) }),

  getMyAttendance: (code) => request(`/my-attendance?code=${encodeURIComponent(code)}`),
  getBookingByCode: (code) => request(`/bookings/code/${encodeURIComponent(code)}`),

  // Bookings (supports date, fromDate, toDate, month, year, search, attendance)
  getBookings: (options, search = '') => {
    const params = new URLSearchParams();
    if (typeof options === 'string') {
      if (options) params.append('date', options);
      if (search) params.append('search', search);
    } else if (options && typeof options === 'object') {
      if (options.date) params.append('date', options.date);
      if (options.fromDate) params.append('fromDate', options.fromDate);
      if (options.toDate) params.append('toDate', options.toDate);
      if (options.month) params.append('month', options.month);
      if (options.year) params.append('year', options.year);
      if (options.search) params.append('search', options.search);
      if (options.attendance) params.append('attendance', options.attendance);
    }
    const qs = params.toString();
    return request(`/bookings${qs ? `?${qs}` : ''}`);
  },
  searchBookings: async (q) => {
    if (!q || !q.trim()) return [];
    const cleanQ = q.trim();
    const rawTokens = cleanQ.split(/\s+/).filter(Boolean);
    if (rawTokens.length === 0) return [];

    const LOCATION_ALIASES = {
      'kkdi': 'karaikudi',
      'காரைக்குடி': 'karaikudi',
      'chn': 'chennai',
      'சென்னை': 'chennai',
      'mdu': 'madurai',
      'மதுரை': 'madurai',
      'cbe': 'coimbatore',
      'kovai': 'coimbatore',
      'trichy': 'tiruchirappalli',
      'pdk': 'pudukkottai'
    };

    // Gather terms to query from backend
    const searchTerms = new Set();
    searchTerms.add(cleanQ);

    rawTokens.forEach((t) => {
      const lower = t.toLowerCase();
      if (LOCATION_ALIASES[lower]) {
        searchTerms.add(LOCATION_ALIASES[lower]);
      }
      if (t.length >= 2) {
        searchTerms.add(t);
      }
    });

    if (LOCATION_ALIASES[cleanQ.toLowerCase()]) {
      searchTerms.add(LOCATION_ALIASES[cleanQ.toLowerCase()]);
    }

    // Query terms in parallel (capped to top 3 variations to prevent over-fetching)
    const fetchPromises = Array.from(searchTerms).slice(0, 3).map((term) =>
      request(`/bookings?search=${encodeURIComponent(term)}`).catch(() => [])
    );

    const responses = await Promise.all(fetchPromises);
    const combined = [];
    const seen = new Set();
    responses.flat().forEach((item) => {
      if (item && item.id && !seen.has(item.id)) {
        seen.add(item.id);
        combined.push(item);
      }
    });

    // Client-side compound multi-word filter:
    // If user typed multiple words (e.g. "karaikudi marlin" or "kkdi 267"),
    // EVERY token must match at least one field of the devotee.
    if (rawTokens.length > 1) {
      return combined.filter((devotee) => {
        return rawTokens.every((token) => {
          const t = token.toLowerCase();
          const alias = LOCATION_ALIASES[t] || '';

          const searchableText = [
            devotee.name,
            devotee.name_ta,
            devotee.place,
            devotee.place_ta,
            devotee.code,
            devotee.mobile,
            devotee.whatsapp_number,
            devotee.star,
            devotee.star_ta,
            devotee.kattalai_name,
            devotee.kattalai_name_ta,
            devotee.comm_add_1,
            devotee.comm_add_2,
            devotee.comm_add_3,
            devotee.per_add_1
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return searchableText.includes(t) || (alias && searchableText.includes(alias));
        });
      });
    }

    return combined;
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

  // Panchangam (with in-memory client-side date cache for instantaneous zero-latency navigation)
  getPanchangam: async (date) => {
    if (!date) return null;
    const cacheKey = String(date).trim();
    if (panchangamCache.has(cacheKey)) {
      return panchangamCache.get(cacheKey);
    }
    try {
      const data = await request(`/panchangam/${cacheKey}`);
      panchangamCache.set(cacheKey, data);
      return data;
    } catch (err) {
      // If 404 / no record for this date in DB, cache null so toggling back avoids redundant network calls
      const msg = (err.message || '').toLowerCase();
      if (msg.includes('no panchangam') || msg.includes('not found') || msg.includes('404')) {
        panchangamCache.set(cacheKey, null);
        return null;
      }
      throw err;
    }
  },
  uploadPanchangamCsv: async (csvContent) => {
    panchangamCache.clear(); // Invalidate cache so newly imported data is immediately reflected
    return request('/panchangam/upload-csv', { method: 'POST', body: JSON.stringify({ csvContent }) });
  },
  savePanchangam: async (date, data) => {
    if (date) panchangamCache.delete(String(date).trim());
    return request(`/panchangam/${date}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  clearPanchangamCache: () => {
    panchangamCache.clear();
  },

  // Payments
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  createRazorpayOrder: (data) => request('/payments/razorpay/create-order', { method: 'POST', body: JSON.stringify(data) }),
  verifyRazorpaySignature: (data) => request('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(data) }),

  // WhatsApp
  whatsappHistory: () => request('/whatsapp/history'),
  whatsappPreview: (fromDate, toDate) => request(`/whatsapp/preview?fromDate=${fromDate}&toDate=${toDate}`),
  whatsappSendBatch: (data) => request('/whatsapp/send-batch', { method: 'POST', body: JSON.stringify(data) }),
  whatsappTriggerAutomation: () => request('/whatsapp/trigger-automation', { method: 'POST' }),

  // History
  getHistory: (params) => {
    if (typeof params === 'string') {
      return request(`/history?booking_id=${encodeURIComponent(params)}`);
    }
    if (params && typeof params === 'object') {
      const q = new URLSearchParams();
      if (params.booking_id) q.set('booking_id', params.booking_id);
      if (params.category && params.category !== 'all') q.set('category', params.category);
      if (params.fromDate) q.set('fromDate', params.fromDate);
      if (params.toDate) q.set('toDate', params.toDate);
      if (params.search) q.set('search', params.search);
      if (params.page) q.set('page', params.page);
      if (params.limit) q.set('limit', params.limit);
      const qs = q.toString();
      return request(`/history${qs ? `?${qs}` : ''}`);
    }
    return request('/history');
  },
  createHistoryLog: (data) => request('/history', { method: 'POST', body: JSON.stringify(data) }),
  getPrintStatus: (target_date) => request(`/history/print-status?target_date=${encodeURIComponent(target_date || '')}`),
  logPrintRecord: (data) => request('/history/print-log', { method: 'POST', body: JSON.stringify(data) }),
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

  // Power Users (President, Treasurer, Secretary, Vice President, Joint Secretary)
  getPowerUsers: () => request('/power-users'),
  updatePowerUser: (roleKey, data) => request(`/power-users/${roleKey}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Kattalai Deletion with Triple-OTP Authorization
  initiateKattalaiDeletion: (bookingId) => request('/kattalai-deletion/initiate', { method: 'POST', body: JSON.stringify({ booking_id: bookingId }) }),
  verifyAndDeleteKattalai: (data) => request('/kattalai-deletion/verify-and-delete', { method: 'POST', body: JSON.stringify(data) }),

  // Devotee lookup by Office Code
  getBookingByCode: (code) => request(`/bookings/code/${encodeURIComponent(code)}`),

  // Change Password (Devotee or Staff)
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),

  // Bug & Issue Reporting (For all roles)
  submitBugReport: async (formData) => {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/bug-reports`, {
      method: 'POST',
      headers,
      body: formData
    });
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error || 'Failed to submit bug report');
    }
    return resData;
  },
  getBugReports: (status) => request(`/bug-reports${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`),
  updateBugReportStatus: (id, data) => request(`/bug-reports/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Thuritha Kattalai (On-the-day Walk-in Archanai)
  getThurithaKattalai: (options) => {
    const params = new URLSearchParams();
    if (typeof options === 'string') {
      if (options) params.append('date', options);
    } else if (options && typeof options === 'object') {
      if (options.date) params.append('date', options.date);
      if (options.fromDate) params.append('fromDate', options.fromDate);
      if (options.toDate) params.append('toDate', options.toDate);
    }
    const qs = params.toString();
    return request(`/thuritha-kattalai${qs ? `?${qs}` : ''}`);
  },
  createThurithaKattalai: (data) => request('/thuritha-kattalai', { method: 'POST', body: JSON.stringify(data) }),
  toggleThurithaPresent: (id) => request(`/thuritha-kattalai/${id}/present`, { method: 'PATCH' }),
  updateThurithaKattalai: (id, data) => request(`/thuritha-kattalai/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteThurithaKattalai: (id) => request(`/thuritha-kattalai/${id}`, { method: 'DELETE' }),
};
