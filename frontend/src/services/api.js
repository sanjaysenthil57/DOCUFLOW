import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('docuflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-clear if already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('docuflow_token');
        localStorage.removeItem('docuflow_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  googleAuth: (data) => api.post('/auth/google', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

export const facultyApi = {
  getMyDocuments: () => api.get('/faculty/my-documents'),
  getMySubjects: () => api.get('/faculty/subjects'),
  getAssignedSubjects: () => api.get('/faculty/assigned-subjects'),
  getMetadata: () => api.get('/faculty/metadata'),
  createSubject: (data) => api.post('/faculty/subjects', data),
  updateSubject: (id, data) => api.put(`/faculty/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/faculty/subjects/${id}`),
  uploadDocument: (formData) => api.post('/faculty/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  reuploadDocument: (id, formData) => api.post(`/faculty/reupload/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocumentDetails: (id) => api.get(`/faculty/documents/${id}`),
  updateDocument: (id, data) => api.put(`/faculty/documents/${id}`, data),
  deleteDocument: (id) => api.delete(`/faculty/documents/${id}`)
};

export const expertApi = {
  getAssignedDocuments: () => api.get('/expert/assigned-documents'),
  getDocumentDetails: (id) => api.get(`/expert/documents/${id}`),
  submitReview: (documentId, data) => api.post(`/expert/review/${documentId}`, data),
  getReviewHistory: () => api.get('/expert/review-history')
};

export const hodApi = {
  getPendingApprovals: () => api.get('/hod/pending-approvals'),
  getDocumentDetails: (id) => api.get(`/hod/documents/${id}`),
  submitApproval: (documentId, data) => api.post(`/hod/approve/${documentId}`, data),
  getApprovalHistory: () => api.get('/hod/approval-history'),

  // HOD Academic Structure Management
  getRegulations: () => api.get('/hod/regulations'),
  getRegulationById: (id) => api.get(`/hod/regulations/${id}`),
  createRegulation: (data) => api.post('/hod/regulations', data),
  updateRegulation: (id, data) => api.put(`/hod/regulations/${id}`, data),
  getAcademicYears: () => api.get('/hod/academic-years'),
  createAcademicYear: (data) => api.post('/hod/academic-years', data),
  getBatches: () => api.get('/hod/batches'),
  createBatch: (data) => api.post('/hod/batches', data),
  getSemesters: (params) => api.get('/hod/semesters', { params }),
  getSubjects: (params) => api.get('/hod/subjects', { params }),
  createSubject: (data) => api.post('/hod/subjects', data),
  updateSubject: (id, data) => api.put(`/hod/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/hod/subjects/${id}`),

  // Workload Monitoring & Auto Allocation Engine
  getFacultyWorkloads: () => api.get('/hod/workloads'),
  triggerAutoAllocation: () => api.post('/hod/auto-allocate'),
  autoAllocateBatchSubjects: (data) => api.post('/hod/auto-allocate/batch', data),

  // Student Directory & HOD Promotion
  getStudents: () => api.get('/hod/students'),
  promoteStudentByHod: (id) => api.post(`/hod/students/${id}/promote`),

  // HOD Faculty & Expert Assignments
  getFacultyAssignments: () => api.get('/hod/faculty-assignments'),
  assignFaculty: (data) => api.post('/hod/faculty-assignments', data),
  getExpertAssignments: () => api.get('/hod/expert-assignments'),
  assignExpert: (data) => api.post('/hod/expert-assignments', data),

  // Department Faculty Directory & Expert Designation / Account Authorization
  getFacultyList: () => api.get('/hod/faculty'),
  designateExpert: (id) => api.post(`/hod/users/${id}/designate-expert`),
  approveUser: (id) => api.post(`/hod/users/${id}/approve`),
  rejectUser: (id) => api.post(`/hod/users/${id}/reject`)
};

export const studentApi = {
  getEnrollment: () => api.get('/student/enrollment'),
  getApprovedDocuments: (params) => api.get('/student/approved-documents', { params }),
  getStudyMaterials: (params) => api.get('/student/study-materials', { params }),
  getSemesterSubjects: () => api.get('/student/semester-subjects'),
  promoteSemester: () => api.post('/student/promote'),
  getMyLanguages: () => api.get('/student/languages'),
  askChatbot: (data) => api.post('/student/chatbot/ask', data, { timeout: 120000 }),
  getChatbotHistory: (params) => api.get('/student/chatbot/history', { params }),
  clearChatbotHistory: (params) => api.delete('/student/chatbot/clear', { params })
};

export const codingApi = {
  getLanguages: () => api.get('/coding/languages'),
  getQuestions: (params) => api.get('/coding/questions', { params }),
  getQuestionById: (id) => api.get(`/coding/questions/${id}`),
  runCode: (data) => api.post('/coding/run', data),
  submitCode: (data) => api.post('/coding/submit', data),
  askAiHelp: (data) => api.post('/coding/ai-help', data),
  getMySubmissions: (params) => api.get('/coding/my-submissions', { params })
};

export const notificationApi = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/mark-all-read')
};

export const analyticsApi = {
  getAnalytics: () => api.get('/analytics')
};

export const adminApi = {
  getMetrics: () => api.get('/admin/metrics'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  approveUser: (id) => api.post(`/admin/users/${id}/approve`),
  rejectUser: (id, reason) => api.post(`/admin/users/${id}/reject`, { reason }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getSubjectAssignments: (params) => api.get('/admin/subject-assignments', { params }),
  getAssignmentOptions: () => api.get('/admin/assignment-options'),
  assignSubject: (data) => api.post('/admin/assign-subject', data),
  removeSubjectAssignment: (role, id) => api.delete(`/admin/subject-assignments/${role}/${id}`)
};

export default api;
