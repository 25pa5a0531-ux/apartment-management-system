// API Client service using Fetch API with REST endpoints

const API_BASE_URL = '/api';

// Helper to get stored auth token
export const getToken = () => localStorage.getItem('apartment_auth_token');
export const setToken = (token) => localStorage.setItem('apartment_auth_token', token);
export const removeToken = () => localStorage.removeItem('apartment_auth_token');

// Generic request wrapper with auth header & error handling
async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error.message);
    throw error;
  }
}

// Auth API
export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getMe: () => request('/auth/me'),
  updateProfile: (profileData) => request('/auth/update-profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  logout: () => request('/auth/logout', { method: 'POST' })
};

// Dashboard API
export const dashboardApi = {
  getStats: () => request('/dashboard/stats')
};

// Flats API
export const flatsApi = {
  getAll: () => request('/flats'),
  getById: (id) => request(`/flats/${id}`),
  create: (flatData) => request('/flats', { method: 'POST', body: JSON.stringify(flatData) }),
  update: (id, flatData) => request(`/flats/${id}`, { method: 'PUT', body: JSON.stringify(flatData) }),
  delete: (id) => request(`/flats/${id}`, { method: 'DELETE' })
};

// Residents / Users API
export const usersApi = {
  getResidents: () => request('/users/residents'),
  getAll: () => request('/users'),
  createResident: (userData) => request('/users/residents', { method: 'POST', body: JSON.stringify(userData) }),
  updateResident: (id, userData) => request(`/users/residents/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteResident: (id) => request(`/users/residents/${id}`, { method: 'DELETE' })
};

// Visitors API
export const visitorsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/visitors${query ? `?${query}` : ''}`);
  },
  getInside: () => request('/visitors/inside'),
  register: (visitorData) => request('/visitors', { method: 'POST', body: JSON.stringify(visitorData) }),
  checkout: (id) => request(`/visitors/${id}/checkout`, { method: 'PUT' })
};

// Maintenance API
export const maintenanceApi = {
  getBills: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/maintenance/bills${query ? `?${query}` : ''}`);
  },
  getSummary: () => request('/maintenance/summary'),
  createBill: (billData) => request('/maintenance/bills', { method: 'POST', body: JSON.stringify(billData) }),
  recordPayment: (id, paymentData) => request(`/maintenance/bills/${id}/pay`, { method: 'PUT', body: JSON.stringify(paymentData) })
};

// Complaints API
export const complaintsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/complaints${query ? `?${query}` : ''}`);
  },
  getById: (id) => request(`/complaints/${id}`),
  create: (complaintData) => request('/complaints', { method: 'POST', body: JSON.stringify(complaintData) }),
  updateStatus: (id, updateData) => request(`/complaints/${id}/status`, { method: 'PUT', body: JSON.stringify(updateData) })
};
