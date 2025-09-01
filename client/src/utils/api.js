import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://syntharacare-1.onrender.com" // Default production URL
    : "http://localhost:5000"); // Development URL

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
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
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (credentials) => api.post("/api/auth/login", credentials),
  register: (userData) => api.post("/api/auth/register", userData),
  getProfile: () => api.get("/api/auth/me"),
  updateProfile: (profileData) =>
    api.put("/api/auth/profile", { profile: profileData })
};

export const appointmentsAPI = {
  getAll: (params) => api.get("/api/appointments", { params }),
  getById: (id) => api.get(`/api/appointments/${id}`),
  create: (appointmentData) => api.post("/api/appointments", appointmentData),
  updateStatus: (id, status) =>
    api.put(`/api/appointments/${id}/status`, { status }),
  cancel: (id) => api.delete(`/api/appointments/${id}`),
  updateSessionPhase: (id, sessionPhase) =>
    api.put(`/api/appointments/${id}/session-phase`, { sessionPhase }),
  moveUp: (id) => api.put(`/api/appointments/${id}/move-up`),
  moveDown: (id) => api.put(`/api/appointments/${id}/move-down`),
  getQueue: (doctorId, date) =>
    api.get(`/api/appointments/queue/${doctorId}/${date}`),
  reorderQueue: (data) => api.put("/api/appointments/reorder-queue", data)
};

export const doctorsAPI = {
  getAll: (params) => api.get("/api/doctors", { params }),
  getById: (id) => api.get(`/api/doctors/${id}`),
  getByHospital: (hospitalId, params) =>
    api.get(`/api/doctors/by-hospital/${hospitalId}`, { params }),
  getAvailability: (id, date) =>
    api.get(`/api/doctors/${id}/availability`, { params: { date } }),
  createProfile: (profileData) => api.post("/api/doctors", profileData),
  quickSetup: (data) => api.post("/api/doctors/quick-setup", data),
  updateProfile: (id, profileData) =>
    api.put(`/api/doctors/${id}`, profileData),
  updateAvailability: (id, availability) =>
    api.put(`/api/doctors/${id}/availability`, { availability })
};

export const diagnosesAPI = {
  getAll: (params) => api.get("/api/diagnoses", { params }),
  getById: (id) => api.get(`/api/diagnoses/${id}`),
  create: (diagnosisData) => api.post("/api/diagnoses", diagnosisData),
  update: (id, diagnosisData) => api.put(`/api/diagnoses/${id}`, diagnosisData),
  addVoiceRecording: (id, recordingData) =>
    api.post(`/api/diagnoses/${id}/voice-recording`, recordingData)
};

export const remindersAPI = {
  getAll: (params) => api.get("/api/reminders", { params }),
  getById: (id) => api.get(`/api/reminders/${id}`),
  getToday: () => api.get("/api/reminders/today"),
  create: (reminderData) => api.post("/api/reminders", reminderData),
  update: (id, reminderData) => api.put(`/api/reminders/${id}`, reminderData),
  updateStatus: (id, status) =>
    api.put(`/api/reminders/${id}/status`, { status }),
  markTaken: (id, data) => api.post(`/api/reminders/${id}/mark-taken`, data),
  markSkipped: (id, data) =>
    api.post(`/api/reminders/${id}/mark-skipped`, data),
  delete: (id) => api.delete(`/api/reminders/${id}`)
};

export const medicinesAPI = {
  getAll: (params) => api.get("/api/medicines", { params }),
  getById: (id) => api.get(`/api/medicines/${id}`),
  getCategories: () => api.get("/api/medicines/categories"),
  getLowStock: () => api.get("/api/medicines/low-stock"),
  create: (medicineData) => api.post("/api/medicines", medicineData),
  update: (id, medicineData) => api.put(`/api/medicines/${id}`, medicineData),
  delete: (id) => api.delete(`/api/medicines/${id}`)
};

export const patientsAPI = {
  getAll: (params) => api.get("/api/patients", { params }),
  getById: (id) => api.get(`/api/patients/${id}`),
  getAppointments: (id, params) =>
    api.get(`/api/patients/${id}/appointments`, { params }),
  getDiagnoses: (id, params) =>
    api.get(`/api/patients/${id}/diagnoses`, { params }),
  getReminders: (id, params) =>
    api.get(`/api/patients/${id}/reminders`, { params }),
  getStats: (id) => api.get(`/api/patients/${id}/stats`),
  update: (id, profileData) =>
    api.put(`/api/patients/${id}`, { profile: profileData })
};

export const hospitalsAPI = {
  getAll: (params) => api.get("/api/hospitals", { params }),
  getById: (id) => api.get(`/api/hospitals/${id}`),
  create: (hospitalData) => api.post("/api/hospitals", hospitalData),
  update: (id, hospitalData) => api.put(`/api/hospitals/${id}`, hospitalData),
  delete: (id) => api.delete(`/api/hospitals/${id}`),
  getMyHospitals: () => api.get("/api/hospitals/my-hospitals"),
  getPendingApprovals: () => api.get("/api/hospitals/pending/approvals"),
  approve: (id, approvalData) =>
    api.put(`/api/hospitals/${id}/approve`, approvalData)
};

export const adminAPI = {
  getDashboard: () => api.get("/api/admin/dashboard"),
  getPendingUsers: () => api.get("/api/admin/pending-users"),
  approveUser: (id, approvalData) =>
    api.put(`/api/admin/users/${id}/approve`, approvalData),
  getPendingDoctors: () => api.get("/api/admin/pending-doctors"),
  approveDoctor: (id, approvalData) =>
    api.put(`/api/admin/doctors/${id}/approve`, approvalData),
  getUsers: (params) => api.get("/api/admin/users", { params }),
  // Hospital admin endpoints
  getHospitalDashboard: () => api.get("/api/admin/hospital/dashboard"),
  getHospitalPendingDoctors: () =>
    api.get("/api/admin/hospital/pending-doctors"),
  approveHospitalDoctor: (id, approvalData) =>
    api.put(`/api/admin/hospital/doctors/${id}/approve`, approvalData),
  // New hospital admin doctor management endpoints
  getHospitalDoctors: (params) =>
    api.get("/api/admin/hospital/doctors", { params }),
  updateHospitalDoctor: (id, doctorData) =>
    api.put(`/api/admin/hospital/doctors/${id}`, doctorData),
  removeHospitalDoctor: (id) => api.delete(`/api/admin/hospital/doctors/${id}`),
  getHospitalDoctorAppointments: (doctorId, params) =>
    api.get(`/api/admin/hospital/doctors/${doctorId}/appointments`, { params }),
  updateHospitalAppointment: (doctorId, appointmentId, status) =>
    api.put(
      `/api/admin/hospital/doctors/${doctorId}/appointments/${appointmentId}`,
      { status }
    ),
  // Suspension management endpoints
  suspendDoctor: (id, suspensionData) =>
    api.post(`/api/admin/doctors/${id}/suspend`, suspensionData),
  unsuspendDoctor: (id) => api.post(`/api/admin/doctors/${id}/unsuspend`),
  getSuspendedDoctors: () => api.get("/api/admin/doctors/suspended"),

  // Doctor approval endpoints
  approveDoctor: (id) => api.post(`/api/admin/doctors/${id}/approve`)
};

export const prescriptionsAPI = {
  // Patient endpoints
  getPatientPrescriptions: () => api.get("/api/prescriptions/patient"),
  // Doctor endpoints
  getDoctorPrescriptions: () => api.get("/api/prescriptions/doctor"),
  getPrescriptionById: (id) => api.get(`/api/prescriptions/${id}`),
  createPrescription: (prescriptionData) =>
    api.post("/api/prescriptions", prescriptionData),
  updatePrescription: (id, prescriptionData) =>
    api.put(`/api/prescriptions/${id}`, prescriptionData),
  deletePrescription: (id) => api.delete(`/api/prescriptions/${id}`),
  getDoctorStats: () => api.get("/api/prescriptions/stats/doctor")
};

export const healthHistoryAPI = {
  // Upload health history document
  upload: (formData) =>
    api.post("/api/health-history/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }),

  // Get patient's health history
  getAll: (params) => api.get("/api/health-history", { params }),

  // Get specific health history document
  getById: (id) => api.get(`/api/health-history/${id}`),

  // Update health history document
  update: (id, data) => api.put(`/api/health-history/${id}`, data),

  // Delete health history document
  delete: (id) => api.delete(`/api/health-history/${id}`),

  // Share health history with appointment
  shareWithAppointment: (data) =>
    api.post("/api/health-history/share-with-appointment", data),

  // Get health history shared with appointment
  getAppointmentHealthHistory: (appointmentId) =>
    api.get(`/api/health-history/appointment/${appointmentId}`)
};
