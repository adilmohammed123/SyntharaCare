import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://syntharacare-api-205506659521.us-central1.run.app" // Cloud Run production URL
    : "http://localhost:8080"); // Development URL

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

export const patientsAPI = {
  getPatients: (params) => api.get("/api/patients", { params }),
  getPatientById: (id) => api.get(`/api/patients/${id}`),
  updatePatient: (id, patientData) =>
    api.put(`/api/patients/${id}`, patientData),
  deletePatient: (id) => api.delete(`/api/patients/${id}`)
};

export const doctorsAPI = {
  getAll: (params) => api.get("/api/doctors", { params }),
  getDoctors: (params) => api.get("/api/doctors", { params }),
  getDoctorById: (id) => api.get(`/api/doctors/${id}`),
  getByHospital: (hospitalId) =>
    api.get(`/api/doctors/by-hospital/${hospitalId}`),
  getAvailability: (doctorId, date) =>
    api.get(`/api/doctors/${doctorId}/availability`, { params: { date } }),
  updateDoctor: (id, doctorData) => api.put(`/api/doctors/${id}`, doctorData),
  deleteDoctor: (id) => api.delete(`/api/doctors/${id}`),
  approveDoctor: (id, approvalData) =>
    api.put(`/api/doctors/${id}/approve`, approvalData)
};

export const hospitalsAPI = {
  getAll: (params) => api.get("/api/hospitals", { params }),
  getHospitals: (params) => api.get("/api/hospitals", { params }),
  getHospitalById: (id) => api.get(`/api/hospitals/${id}`),
  createHospital: (hospitalData) => api.post("/api/hospitals", hospitalData),
  updateHospital: (id, hospitalData) =>
    api.put(`/api/hospitals/${id}`, hospitalData),
  deleteHospital: (id) => api.delete(`/api/hospitals/${id}`)
};

export const appointmentsAPI = {
  // Main appointments endpoint - works for all user types
  getAll: (params) => api.get("/api/appointments", { params }),
  getAppointments: (params) => api.get("/api/appointments", { params }),
  getAppointmentById: (id) => api.get(`/api/appointments/${id}`),
  create: (appointmentData) => api.post("/api/appointments", appointmentData),
  createAppointment: (appointmentData) =>
    api.post("/api/appointments", appointmentData),
  update: (id, appointmentData) =>
    api.put(`/api/appointments/${id}`, appointmentData),
  updateAppointment: (id, appointmentData) =>
    api.put(`/api/appointments/${id}`, appointmentData),
  delete: (id) => api.delete(`/api/appointments/${id}`),
  deleteAppointment: (id) => api.delete(`/api/appointments/${id}`),
  cancel: (id) => api.delete(`/api/appointments/${id}`),
  getPatientAppointments: (params) =>
    api.get("/api/appointments/patient", { params }),
  getDoctorAppointments: (params) =>
    api.get("/api/appointments/doctor", { params }),
  updateStatus: (id, status) =>
    api.put(`/api/appointments/${id}/status`, { status }),
  updateAppointmentStatus: (id, status) =>
    api.put(`/api/appointments/${id}/status`, { status }),
  updateSessionPhase: (id, phase) =>
    api.put(`/api/appointments/${id}/session-phase`, { phase }),
  moveUp: (id) => api.put(`/api/appointments/${id}/move-up`),
  moveDown: (id) => api.put(`/api/appointments/${id}/move-down`),
  getQueuePosition: (doctorId, date) =>
    api.get(`/api/appointments/queue/${doctorId}/${date}`)
};

export const diagnosesAPI = {
  getDiagnoses: (params) => api.get("/api/diagnoses", { params }),
  getAll: (params) => api.get("/api/diagnoses", { params }), // Alias for backward compatibility
  getDiagnosisById: (id) => api.get(`/api/diagnoses/${id}`),
  createDiagnosis: (diagnosisData) => api.post("/api/diagnoses", diagnosisData),
  create: (diagnosisData) => api.post("/api/diagnoses", diagnosisData), // Alias for backward compatibility
  updateDiagnosis: (id, diagnosisData) =>
    api.put(`/api/diagnoses/${id}`, diagnosisData),
  deleteDiagnosis: (id) => api.delete(`/api/diagnoses/${id}`)
};

export const medicinesAPI = {
  getMedicines: (params) => api.get("/api/medicines", { params }),
  getMedicineById: (id) => api.get(`/api/medicines/${id}`),
  createMedicine: (medicineData) => api.post("/api/medicines", medicineData),
  updateMedicine: (id, medicineData) =>
    api.put(`/api/medicines/${id}`, medicineData),
  deleteMedicine: (id) => api.delete(`/api/medicines/${id}`)
};

export const remindersAPI = {
  getReminders: (params) => api.get("/api/reminders", { params }),
  getReminderById: (id) => api.get(`/api/reminders/${id}`),
  createReminder: (reminderData) => api.post("/api/reminders", reminderData),
  updateReminder: (id, reminderData) =>
    api.put(`/api/reminders/${id}`, reminderData),
  deleteReminder: (id) => api.delete(`/api/reminders/${id}`)
};

export const adminAPI = {
  // Doctor management endpoints
  getPendingDoctors: () => api.get("/api/admin/doctors/pending"),
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
  getSuspendedDoctors: () => api.get("/api/admin/doctors/suspended")
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
  getDoctorStats: () => api.get("/api/prescriptions/stats/doctor"),
  // Appointment-related endpoints
  getAppointmentPrescriptions: (appointmentId) =>
    api.get(`/api/prescriptions/appointment/${appointmentId}`),
  createPrescriptionForAppointment: (appointmentId, prescriptionData) =>
    api.post(
      `/api/prescriptions/appointment/${appointmentId}`,
      prescriptionData
    ),
  updatePrescriptionForAppointment: (
    appointmentId,
    prescriptionId,
    prescriptionData
  ) =>
    api.put(
      `/api/prescriptions/appointment/${appointmentId}/${prescriptionId}`,
      prescriptionData
    )
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

export const uploadsAPI = {
  // Upload a single file
  uploadSingle: (formData) =>
    api.post("/api/uploads/general", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }),

  // Upload multiple files
  uploadMultiple: (formData) =>
    api.post("/api/uploads/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }),

  // Delete a file
  deleteFile: (filePath) => api.delete(`/api/uploads/${filePath}`),

  // Get signed URL for private file access
  getSignedUrl: (filePath, expires = 60) =>
    api.get(`/api/uploads/signed-url/${filePath}`, { params: { expires } }),

  // Check GCS connectivity (admin only)
  checkConnectivity: () => api.get("/api/uploads/check-connectivity")
};

export const chatbotAPI = {
  // Chat with AI assistant
  chat: (data) => api.post("/api/chatbot/chat", data),

  // Search medical information
  search: (data) => api.post("/api/chatbot/search", data),

  // Check drug interactions
  checkDrugInteractions: (medications) =>
    api.post("/api/chatbot/drug-interactions", { medications }),

  // Suggest diagnostic tests
  suggestDiagnosticTests: (symptoms, suspectedConditions = []) =>
    api.post("/api/chatbot/diagnostic-tests", {
      symptoms,
      suspectedConditions
    }),

  // Get treatment protocol
  getTreatmentProtocol: (condition, severity = "moderate") =>
    api.post("/api/chatbot/treatment-protocol", { condition, severity }),

  // Get quick medical facts
  getQuickFacts: (topic) => api.get(`/api/chatbot/quick-facts/${topic}`)
};
