import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? ''  // Use relative URLs in production (same domain)
  : 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (profileData) => api.put('/api/auth/profile', { profile: profileData }),
};

export const appointmentsAPI = {
  getAll: (params) => api.get('/api/appointments', { params }),
  getById: (id) => api.get(`/api/appointments/${id}`),
  create: (appointmentData) => api.post('/api/appointments', appointmentData),
  updateStatus: (id, status) => api.put(`/api/appointments/${id}/status`, { status }),
  cancel: (id) => api.delete(`/api/appointments/${id}`),
  updateSessionPhase: (id, sessionPhase) => api.put(`/api/appointments/${id}/session-phase`, { sessionPhase }),
  moveUp: (id) => api.put(`/api/appointments/${id}/move-up`),
  moveDown: (id) => api.put(`/api/appointments/${id}/move-down`),
  getQueue: (doctorId, date) => api.get(`/api/appointments/queue/${doctorId}/${date}`),
  reorderQueue: (data) => api.put('/api/appointments/reorder-queue', data),
};

export const doctorsAPI = {
  getAll: (params) => api.get('/api/doctors', { params }),
  getById: (id) => api.get(`/api/doctors/${id}`),
  getAvailability: (id, date) => api.get(`/api/doctors/${id}/availability`, { params: { date } }),
  createProfile: (profileData) => api.post('/api/doctors', profileData),
  quickSetup: () => api.post('/api/doctors/quick-setup'),
  updateProfile: (id, profileData) => api.put(`/api/doctors/${id}`, profileData),
  updateAvailability: (id, availability) => api.put(`/api/doctors/${id}/availability`, { availability }),
};

export const diagnosesAPI = {
  getAll: (params) => api.get('/api/diagnoses', { params }),
  getById: (id) => api.get(`/api/diagnoses/${id}`),
  create: (diagnosisData) => api.post('/api/diagnoses', diagnosisData),
  update: (id, diagnosisData) => api.put(`/api/diagnoses/${id}`, diagnosisData),
  addVoiceRecording: (id, recordingData) => api.post(`/api/diagnoses/${id}/voice-recording`, recordingData),
};

export const remindersAPI = {
  getAll: (params) => api.get('/api/reminders', { params }),
  getById: (id) => api.get(`/api/reminders/${id}`),
  getToday: () => api.get('/api/reminders/today'),
  create: (reminderData) => api.post('/api/reminders', reminderData),
  update: (id, reminderData) => api.put(`/api/reminders/${id}`, reminderData),
  updateStatus: (id, status) => api.put(`/api/reminders/${id}/status`, { status }),
  markTaken: (id, data) => api.post(`/api/reminders/${id}/mark-taken`, data),
  markSkipped: (id, data) => api.post(`/api/reminders/${id}/mark-skipped`, data),
  delete: (id) => api.delete(`/api/reminders/${id}`),
};

export const medicinesAPI = {
  getAll: (params) => api.get('/api/medicines', { params }),
  getById: (id) => api.get(`/api/medicines/${id}`),
  getCategories: () => api.get('/api/medicines/categories'),
  getLowStock: () => api.get('/api/medicines/low-stock'),
  create: (medicineData) => api.post('/api/medicines', medicineData),
  update: (id, medicineData) => api.put(`/api/medicines/${id}`, medicineData),
  delete: (id) => api.delete(`/api/medicines/${id}`),
};

export const patientsAPI = {
  getAll: (params) => api.get('/api/patients', { params }),
  getById: (id) => api.get(`/api/patients/${id}`),
  getAppointments: (id, params) => api.get(`/api/patients/${id}/appointments`, { params }),
  getDiagnoses: (id, params) => api.get(`/api/patients/${id}/diagnoses`, { params }),
  getReminders: (id, params) => api.get(`/api/patients/${id}/reminders`, { params }),
  getStats: (id) => api.get(`/api/patients/${id}/stats`),
  update: (id, profileData) => api.put(`/api/patients/${id}`, { profile: profileData }),
};
