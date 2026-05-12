import { API } from '@/lib/api';

// ─────────────────────────────────────────────────────────────
//  USERS (own profile)
// ─────────────────────────────────────────────────────────────
export const usersService = {
  getMe    : ()                            => API.get('/auth/me'),
  updateMe : (data: { fullName?: string }) => API.patch('/users/profile', data),
};

// ─────────────────────────────────────────────────────────────
//  ADMIN — murabbis + stats
// ─────────────────────────────────────────────────────────────
export const adminService = {
  getDashboard     : ()                                           => API.get('/admin/stats'),
  getAllUsers       : ()                                           => API.get('/admin/users'),
  getMurabbis      : ()                                           => API.get('/admin/murabbis'),
  createMurabbi    : (data: { fullName: string; email: string; password: string }) =>
                       API.post('/admin/murabbis', data),
  activateMurabbi  : (id: string)                                 => API.patch(`/admin/murabbis/${id}/activate`),
  deactivateMurabbi: (id: string)                                 => API.patch(`/admin/murabbis/${id}/deactivate`),
  deleteMurabbi    : (id: string)                                 => API.delete(`/admin/murabbis/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  MURABBI (own portal)
// ─────────────────────────────────────────────────────────────
export const murabbiSelfService = {
  getProfile   : ()                            => API.get('/murabbi/profile'),
  updateProfile: (data: { fullName?: string }) => API.patch('/murabbi/profile', data),
};

// ─────────────────────────────────────────────────────────────
//  NEIGHBOURHOODS
// ─────────────────────────────────────────────────────────────
export const neighbourhoodsService = {
  getAll: ()                                          => API.get('/admin/neighbourhoods'),
  getOne: (id: string)                                => API.get(`/admin/neighbourhoods/${id}`),
  create: (data: { name: string; city?: string })     => API.post('/admin/neighbourhoods', data),
  update: (id: string, data: { name?: string; city?: string }) =>
            API.patch(`/admin/neighbourhoods/${id}`, data),
  remove: (id: string)                                => API.delete(`/admin/neighbourhoods/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  CIRCLES
// ─────────────────────────────────────────────────────────────
export const circlesService = {
  getAll : ()                                             => API.get('/admin/circles'),
  getOne : (id: string)                                   => API.get(`/admin/circles/${id}`),
  create : (data: {
    name: string;
    neighbourhoodId: string;
    murabbiId: string;
    capacity?: number;
  })                                                      => API.post('/admin/circles', data),
  update : (id: string, data: object)                     => API.patch(`/admin/circles/${id}`, data),
  remove : (id: string)                                   => API.delete(`/admin/circles/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  STUDENTS
// ─────────────────────────────────────────────────────────────
export const studentsService = {
  getAll      : ()             => API.get('/admin/students'),
  getOne      : (id: string)   => API.get(`/admin/students/${id}`),
  enroll      : (data: {
    fullName       : string;
    fatherName     : string;
    phone          : string;
    email?         : string;
    dateOfBirth?   : string;
    address?       : string;
    circleId       : string;
    neighbourhoodId: string;
  })                           => API.post('/admin/students/enroll', data),
  update      : (id: string, data: object) => API.patch(`/admin/students/${id}`, data),
  assignCircle: (id: string, circleId: string) =>
                  API.patch(`/admin/students/${id}/circle`, { circleId }),
  activate    : (id: string)   => API.patch(`/admin/students/${id}/activate`),
  deactivate  : (id: string)   => API.patch(`/admin/students/${id}/deactivate`),
  remove      : (id: string)   => API.delete(`/admin/students/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  ATTENDANCE  (backend not yet implemented — placeholder)
// ─────────────────────────────────────────────────────────────
export const attendanceService = {
  submit         : (data: object)    => API.post('/attendance', data),
  getAll         : ()                => API.get('/attendance'),
  getByCircle    : (id: string)      => API.get(`/attendance/circle/${id}`),
  getStudentRate : (id: string)      => API.get(`/attendance/student/${id}/rate`),
};

// ─────────────────────────────────────────────────────────────
//  INCENTIVES  (placeholder)
// ─────────────────────────────────────────────────────────────
export const incentivesService = {
  award        : (data: object) => API.post('/incentives', data),
  getAll       : ()             => API.get('/incentives'),
  getLeaderboard: ()            => API.get('/incentives/leaderboard'),
  getByStudent : (id: string)   => API.get(`/incentives/student/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  MURABBIS (admin view — list / single)
// ─────────────────────────────────────────────────────────────
export const murabbisService = {
  getAll       : ()           => API.get('/admin/murabbis'),
  getOne       : (id: string) => API.get('/admin/murabbis').then((r) => ({
    ...r,
    data: { ...r.data, data: r.data?.data?.find((m: any) => m._id === id) },
  })),
  // Murabbi's own portal data
  getDashboard : ()           => API.get('/murabbi/dashboard'),
  getMyCircles : ()           => API.get('/murabbi/my-circles'),
  getMyStudents: ()           => API.get('/murabbi/my-students'),
};

// ─────────────────────────────────────────────────────────────
//  SESSIONS & CURRICULUM  (placeholder)
// ─────────────────────────────────────────────────────────────
export const sessionsService = {
  getAll       : () => API.get('/sessions'),
  getCurriculum: () => API.get('/sessions/curriculum'),
};

// ─────────────────────────────────────────────────────────────
//  TRAINING  (placeholder)
// ─────────────────────────────────────────────────────────────
export const trainingService = {
  getModules        : ()                                              => API.get('/training/modules'),
  getProgressSummary: ()                                              => API.get('/training/progress/summary'),
  updateProgress    : (moduleId: string, progressPercent: number)    => API.patch(`/training/progress/${moduleId}`, { progressPercent }),
  createModule      : (data: object)                                  => API.post('/training/modules', data),
  updateModule      : (id: string, data: object)                      => API.patch(`/training/modules/${id}`, data),
  deleteModule      : (id: string)                                    => API.delete(`/training/modules/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  LESSON PLANS  (placeholder)
// ─────────────────────────────────────────────────────────────
export const lessonsService = {
  getAll: ()                          => API.get('/lessons'),
  getOne: (id: string)                => API.get(`/lessons/${id}`),
  create: (data: object)              => API.post('/lessons', data),
  update: (id: string, data: object)  => API.patch(`/lessons/${id}`, data),
  remove: (id: string)                => API.delete(`/lessons/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  PERFORMANCE  (placeholder)
// ─────────────────────────────────────────────────────────────
export const performanceService = {
  submitReview : (data: object) => API.post('/performance/reviews', data),
  getReviews   : ()             => API.get('/performance/reviews'),
  getIndicators: ()             => API.get('/performance/indicators'),
};

// ─────────────────────────────────────────────────────────────
//  REPORTS  (placeholder)
// ─────────────────────────────────────────────────────────────
export const reportsService = {
  getAdminReport    : () => API.get('/reports/admin'),
  getMurabbiReport  : () => API.get('/reports/murabbi'),
  getAttendanceTrend: () => API.get('/reports/attendance-trend'),
};
