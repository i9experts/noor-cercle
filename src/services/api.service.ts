import { API } from '@/lib/api';

// ─────────────────────────────────────────────────────────────
//  UPLOAD
// ─────────────────────────────────────────────────────────────
export const uploadService = {
  image: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return API.post<{ data: { url: string } }>('/upload/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─────────────────────────────────────────────────────────────
//  USERS (own profile)
// ─────────────────────────────────────────────────────────────
export const usersService = {
  getMe           : ()                                                           => API.get('/auth/me'),
  updateMe        : (data: { fullName?: string; phone?: string; bio?: string; image?: string }) => API.patch('/users/profile', data),
  changePassword  : (data: { currentPassword: string; newPassword: string })    => API.post('/users/change-password', data),
};

// ─────────────────────────────────────────────────────────────
//  ADMIN — murabbis + stats
// ─────────────────────────────────────────────────────────────
export const adminService = {
  getDashboard         : ()                                           => API.get('/admin/stats'),
  getDashboardExtended : ()                                           => API.get('/admin/dashboard/extended'),
  getAllUsers       : ()                                           => API.get('/admin/users'),
  getMurabbis          : ()                                           => API.get('/admin/murabbis'),
  getMurabbisWithStats : ()                                           => API.get('/admin/murabbis/with-stats'),
  createMurabbi    : (data: { fullName: string; email: string; password: string; phone?: string; address?: string; image?: string }) =>
                       API.post('/admin/murabbis', data),
  updateMurabbi    : (id: string, data: { fullName?: string; phone?: string; address?: string; image?: string }) =>
                       API.patch(`/admin/murabbis/${id}`, data),
  updateMurabbiTier: (id: string, tier: 1 | 2 | 3) =>
                       API.patch(`/admin/murabbis/${id}/tier`, { tier }),
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
  getAll      : ()                       => API.get('/admin/neighbourhoods'),
  getPageData : ()                       => API.get('/admin/neighbourhoods/page-data'),
  getOne      : (id: string)             => API.get(`/admin/neighbourhoods/${id}`),
  create      : (data: object)           => API.post('/admin/neighbourhoods', data),
  update      : (id: string, data: object) => API.patch(`/admin/neighbourhoods/${id}`, data),
  remove      : (id: string)             => API.delete(`/admin/neighbourhoods/${id}`),
  // Pipeline
  getPipeline          : ()                       => API.get('/admin/neighbourhoods/pipeline'),
  createPipeline       : (data: object)           => API.post('/admin/neighbourhoods/pipeline', data),
  updatePipeline       : (id: string, data: object) => API.patch(`/admin/neighbourhoods/pipeline/${id}`, data),
  deletePipeline       : (id: string)             => API.delete(`/admin/neighbourhoods/pipeline/${id}`),
  launchPipeline       : (id: string)             => API.post(`/admin/neighbourhoods/pipeline/${id}/launch`, {}),
};

// ─────────────────────────────────────────────────────────────
//  CIRCLES
// ─────────────────────────────────────────────────────────────
export const circlesService = {
  getAll     : ()                                         => API.get('/admin/circles'),
  getPageData: ()                                         => API.get('/admin/circles/page-data'),
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
    fullName        : string;
    fatherName      : string;
    phone           : string;
    email?          : string;
    enrollmentDate? : string;
    address?        : string;
    circleId        : string;
    neighbourhoodId : string;
  })                           => API.post('/admin/students/enroll', data),
  update      : (id: string, data: object) => API.patch(`/admin/students/${id}`, data),
  assignCircle: (id: string, circleId: string) =>
                  API.patch(`/admin/students/${id}/circle`, { circleId }),
  activate    : (id: string)   => API.patch(`/admin/students/${id}/activate`),
  deactivate  : (id: string)   => API.patch(`/admin/students/${id}/deactivate`),
  remove      : (id: string)   => API.delete(`/admin/students/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  ATTENDANCE
// ─────────────────────────────────────────────────────────────
export const attendanceService = {
  submit        : (data: object)       => API.post('/attendance', data),
  getAll        : ()                   => API.get('/attendance'),
  getById       : (id: string)         => API.get(`/attendance/${id}`),
  getByCircle   : (id: string)         => API.get(`/attendance/circle/${id}`),
  getByMurabbi  : (id: string)         => API.get(`/attendance/by-murabbi/${id}`),
  getByStudent  : (id: string)         => API.get(`/attendance/by-student/${id}`),
  getStudentRate: (id: string)         => API.get(`/attendance/student/${id}/rate`),
  update        : (id: string, data: object) => API.patch(`/attendance/${id}`, data),
  remove        : (id: string)         => API.delete(`/attendance/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  INCENTIVES
// ─────────────────────────────────────────────────────────────
export const incentivesService = {
  award        : (data: { studentId: string; awardType: string; note?: string }) =>
                   API.post('/incentives', data),
  getAll       : ()             => API.get('/incentives'),
  getPageData  : ()             => API.get('/incentives/page-data'),
  getLeaderboard: ()            => API.get('/incentives/leaderboard'),
  getByStudent : (id: string)   => API.get(`/incentives/student/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
export const notificationsService = {
  getAll          : ()                    => API.get('/notifications'),
  getUnreadCount  : ()                    => API.get('/notifications/unread-count'),
  markRead        : (id: string)          => API.patch(`/notifications/${id}/read`),
  markAllRead     : ()                    => API.patch('/notifications/read-all'),
  accept          : (id: string)          => API.patch(`/notifications/${id}/accept`),
  reject          : (id: string)          => API.patch(`/notifications/${id}/reject`),
  requestMaterial : (note?: string)       => API.post('/notifications/request-material', { note: note || '' }),
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
  getDashboard  : ()           => API.get('/murabbi/dashboard'),
  getMyCircles  : ()           => API.get('/murabbi/my-circles'),
  getMyStudents : ()           => API.get('/murabbi/my-students'),
  updateStudent : (id: string, data: {
    fullName?   : string;
    fatherName? : string;
    phone?      : string;
    email?      : string;
    dateOfBirth?: string;
    address?    : string;
  })                           => API.patch(`/murabbi/students/${id}`, data),
  requestDeleteStudent: (id: string) => API.post(`/murabbi/request-delete/student/${id}`),
  enrollStudent : (data: {
    fullName        : string;
    fatherName      : string;
    phone           : string;
    email?          : string;
    enrollmentDate? : string;
    address?        : string;
    circleId        : string;
    neighbourhoodId : string;
  })                           => API.post('/murabbi/enroll-student', data),
};

// ─────────────────────────────────────────────────────────────
//  SESSIONS & CURRICULUM
// ─────────────────────────────────────────────────────────────
export const sessionsService = {
  getAll       : () => API.get('/sessions'),
  getCurriculum: () => API.get('/sessions/curriculum'),
  getStats     : () => API.get('/sessions/stats'),
  getList      : () => API.get('/sessions/list'),
};

// ─────────────────────────────────────────────────────────────
//  TRAINING
// ─────────────────────────────────────────────────────────────
export const trainingService = {
  getPageData       : ()                                              => API.get('/training/page-data'),
  getActiveBatch    : ()                                              => API.get('/training/active-batch'),
  getModules        : ()                                              => API.get('/training/modules'),
  getProgressSummary: ()                                              => API.get('/training/progress/summary'),
  updateProgress    : (moduleId: string, progressPercent: number)    => API.patch(`/training/progress/${moduleId}`, { progressPercent }),
  createModule      : (data: object)                                  => API.post('/training/modules', data),
  updateModule      : (id: string, data: object)                      => API.patch(`/training/modules/${id}`, data),
  deleteModule      : (id: string)                                    => API.delete(`/training/modules/${id}`),
  // Batch management
  getAllBatches      : ()                                              => API.get('/training/batches'),
  createBatch       : (data: object)                                  => API.post('/training/batches', data),
  updateBatch       : (id: string, data: object)                      => API.patch(`/training/batches/${id}`, data),
  addCandidates     : (batchId: string, userIds: string[])            => API.post(`/training/batches/${batchId}/candidates`, { userIds }),
  removeCandidate   : (batchId: string, userId: string)               => API.delete(`/training/batches/${batchId}/candidates/${userId}`),
  // Exam + certification
  getExam           : ()                                              => API.get('/training/exam'),
  submitExam        : (answers: number[])                             => API.post('/training/exam/submit', { answers }),
  getMyCertificates : ()                                              => API.get('/training/my-certificates'),
  downloadCertificate: (tier: number)                                 =>
    API.get(`/training/certificate/${tier}/download`, { responseType: 'blob' }),
  // Admin: exam management
  upsertExam        : (data: { tier: number; title: string; questions: object[]; passingScore?: number }) =>
                       API.post('/training/exams', data),
  getExamAdmin      : (tier: number)                                  => API.get(`/training/exams/${tier}`),
  getAllCertificates: ()                                              => API.get('/training/certificates'),
  revokeCertificate : (id: string)                                    => API.delete(`/training/certificates/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  LESSON PLANS
// ─────────────────────────────────────────────────────────────
export const lessonsService = {
  getAll: ()                          => API.get('/lessons'),
  getOne: (id: string)                => API.get(`/lessons/${id}`),
  create: (data: object)              => API.post('/lessons', data),
  update: (id: string, data: object)  => API.patch(`/lessons/${id}`, data),
  remove: (id: string)                => API.delete(`/lessons/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  PERFORMANCE
// ─────────────────────────────────────────────────────────────
export const performanceService = {
  submitReview   : (data: object)                                          => API.post('/performance/reviews', data),
  getReviews     : (params?: { circleId?: string; murabbiId?: string })   => API.get('/performance/reviews', { params }),
  getMyReviews   : ()                                                       => API.get('/performance/my-reviews'),
  getIndicators  : ()                                                       => API.get('/performance/indicators'),
  getSummary     : ()                                                       => API.get('/performance/summary'),
  deleteReview   : (id: string)                                            => API.delete(`/performance/reviews/${id}`),
  resolveFollowUp: (id: string)                                            => API.patch(`/performance/reviews/${id}/resolve`),
};

// ─────────────────────────────────────────────────────────────
//  PARENTS
// ─────────────────────────────────────────────────────────────
export const parentsService = {
  getAll      : ()                       => API.get('/parents'),
  getOne      : (id: string)             => API.get(`/parents/${id}`),
  getStats    : ()                       => API.get('/parents/stats'),
  getPageData : ()                       => API.get('/parents/page-data'),
  // Engagement config
  getEngagement        : ()                              => API.get('/parents/engagement'),
  toggleWeeklyCard     : (active: boolean)               => API.patch('/parents/engagement/weekly-card', { active }),
  toggleWhatsapp       : (enabled: boolean)              => API.patch('/parents/engagement/whatsapp', { enabled }),
  scheduleEvening      : (month: number)                 => API.post('/parents/engagement/schedule-evening', { month }),
  recordEveningHeld    : ()                              => API.post('/parents/engagement/record-evening', {}),
  sendWhatsapp         : (message?: string)              => API.post('/parents/engagement/send-whatsapp', { message }),
  whatsappStreamTicket : (message?: string)              => API.post('/parents/engagement/whatsapp-ticket', { message }),
  register    : (data: {
    fullName      : string;
    phone         : string;
    email?        : string;
    whatsappNumber?: string;
    studentIds    : string[];
    notes?        : string;
  })                                     => API.post('/parents', data),
  update      : (id: string, data: object) => API.patch(`/parents/${id}`, data),
  remove      : (id: string)             => API.delete(`/parents/${id}`),
  addFeedback : (id: string, data: {
    message      : string;
    stars        : number;
    sessionNumber: number;
  })                                     => API.post(`/parents/${id}/feedback`, data),
};

// ─────────────────────────────────────────────────────────────
//  ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────
export const announcementsService = {
  getAll : ()                                             => API.get('/announcements'),
  create : (data: { title: string; body: string; icon?: string }) => API.post('/announcements', data),
  remove : (id: string)                                   => API.delete(`/announcements/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────────────────────
export const reportsService = {
  getAdminReport         : ()                  => API.get('/reports/admin'),
  getMurabbiReport       : ()                  => API.get('/reports/murabbi'),
  getAttendanceTrend     : (circleId?: string) => API.get(`/reports/attendance-trend${circleId ? `?circleId=${circleId}` : ''}`),
  getAttendancePerCircle : ()                  => API.get('/reports/attendance-circles'),
  getCircleReportDetail  : (circleId: string)  => API.get(`/reports/circle/${circleId}/detail`),
};

// ─────────────────────────────────────────────────────────────
//  INTEREST REQUESTS (landing-page "Find your place" form)
// ─────────────────────────────────────────────────────────────
export type InterestStatus = 'new' | 'contacted' | 'closed';
export const interestService = {
  getAll : (params: { status?: string; role?: string } = {}) => API.get('/interest', { params }),
  update : (id: string, data: { status?: InterestStatus; notes?: string }) => API.patch(`/interest/${id}`, data),
  remove : (id: string) => API.delete(`/interest/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  CONTRIBUTIONS (parents + public supporters, min PKR 250/month)
// ─────────────────────────────────────────────────────────────
export const contributionsService = {
  summary          : (month?: string) => API.get('/contributions/summary', { params: { month } }),
  getContributors  : (params: { type?: string; status?: string; search?: string } = {}) => API.get('/contributions/contributors', { params }),
  getContributor   : (id: string)               => API.get(`/contributions/contributors/${id}`),
  createContributor: (data: object)             => API.post('/contributions/contributors', data),
  updateContributor: (id: string, data: object) => API.patch(`/contributions/contributors/${id}`, data),
  removeContributor: (id: string)               => API.delete(`/contributions/contributors/${id}`),
  getPayments      : (params: { month?: string; method?: string; status?: string; contributorId?: string } = {}) =>
                       API.get('/contributions/payments', { params }),
  recordPayment    : (data: object)             => API.post('/contributions/payments', data),
  updatePayment    : (id: string, data: { status: 'refunded' | 'void'; notes?: string }) => API.patch(`/contributions/payments/${id}`, data),
};

// ─────────────────────────────────────────────────────────────
//  MURABBI ENGAGEMENT RATING
// ─────────────────────────────────────────────────────────────
export const engagementService = {
  ratings: (month?: string) => API.get('/engagement/ratings', { params: { month } }),
  adjust : (murabbiId: string, month: string, data: { adjustment: number; note?: string }) =>
             API.patch(`/engagement/ratings/${murabbiId}`, data, { params: { month } }),
  my     : (month?: string) => API.get('/engagement/my', { params: { month } }),
};

// ─────────────────────────────────────────────────────────────
//  MONTHLY REWARD POOL
// ─────────────────────────────────────────────────────────────
export const rewardsService = {
  getPools        : ()                             => API.get('/rewards/pools'),
  getPool         : (month: string)                => API.get(`/rewards/pools/${month}`),
  createPool      : (data: object)                 => API.post('/rewards/pools', data),
  updatePool      : (month: string, data: object)  => API.patch(`/rewards/pools/${month}`, data),
  regenerate      : (month: string)                => API.post(`/rewards/pools/${month}/regenerate`),
  approve         : (month: string)                => API.post(`/rewards/pools/${month}/approve`),
  removePool      : (month: string)                => API.delete(`/rewards/pools/${month}`),
  addAllocation   : (month: string, data: object)  => API.post(`/rewards/pools/${month}/allocations`, data),
  updateAllocation: (id: string, data: object)     => API.patch(`/rewards/allocations/${id}`, data),
  pay             : (id: string, data: object)     => API.post(`/rewards/allocations/${id}/pay`, data),
  my              : ()                             => API.get('/rewards/my'),
};

// ─────────────────────────────────────────────────────────────
//  SYLLABUS · WEEKLY AGENDA · CALENDAR
// ─────────────────────────────────────────────────────────────
export const syllabusService = {
  tracks        : ()                              => API.get('/syllabus/tracks'),
  setupDefaults : ()                              => API.post('/syllabus/tracks/defaults'),
  updateTrack   : (id: string, data: object)      => API.patch(`/syllabus/tracks/${id}`, data),
  sessions      : (trackId: string)               => API.get(`/syllabus/tracks/${trackId}/sessions`),
  createSession : (trackId: string, data: object) => API.post(`/syllabus/tracks/${trackId}/sessions`, data),
  updateSession : (id: string, data: object)      => API.patch(`/syllabus/sessions/${id}`, data),
  deleteSession : (id: string)                    => API.delete(`/syllabus/sessions/${id}`),
  progress      : ()                              => API.get('/syllabus/progress'),
  circleProgress: (circleId: string)              => API.get(`/syllabus/progress/${circleId}`),
  myAgenda      : ()                              => API.get('/syllabus/my-agenda'),
  recordCoverage: (data: { circleId: string; sessionId: string; partsDone: string[]; completed?: boolean; date?: string; notes?: string }) =>
                    API.post('/syllabus/coverage', data),
  deleteCoverage: (id: string)                    => API.delete(`/syllabus/coverage/${id}`),
  addNote       : (data: { studentId: string; note: string; sessionId?: string }) => API.post('/syllabus/notes', data),
  studentNotes  : (studentId: string)             => API.get(`/syllabus/notes/student/${studentId}`),
  deleteNote    : (id: string)                    => API.delete(`/syllabus/notes/${id}`),
  calendar      : (params: { from?: string; to?: string; circleId?: string } = {}) => API.get('/syllabus/calendar', { params }),
  events        : (params: { from?: string; to?: string } = {}) => API.get('/syllabus/events', { params }),
  createEvent   : (data: object)                  => API.post('/syllabus/events', data),
  updateEvent   : (id: string, data: object)      => API.patch(`/syllabus/events/${id}`, data),
  deleteEvent   : (id: string)                    => API.delete(`/syllabus/events/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  ASAAS AUDIO TRAINING COURSE
// ─────────────────────────────────────────────────────────────
export const courseService = {
  // murabbi
  my           : ()                                  => API.get('/course/my'),
  badges       : ()                                  => API.get('/course/badges'),
  me           : (key: string)                       => API.get(`/course/${key}/me`),
  play         : (lessonId: string)                  => API.get(`/course/lessons/${lessonId}/play`),
  heartbeat    : (lessonId: string, data: { segments: number[][]; position: number }) =>
                   API.post(`/course/lessons/${lessonId}/heartbeat`, data),
  assessment   : (key: string)                       => API.get(`/course/${key}/assessment`),
  submit       : (key: string, answers: number[])    => API.post(`/course/${key}/assessment`, { answers }),
  reflect      : (key: string, text: string)         => API.post(`/course/${key}/reflection`, { text }),
  // admin
  outline      : (key: string)                       => API.get(`/course/${key}`),
  settings     : (key: string, data: object)         => API.patch(`/course/${key}/settings`, data),
  questions    : (key: string, questions: object[])  => API.put(`/course/${key}/questions`, { questions }),
  uploadAudio  : (key: string, files: File[], onProgress?: (pct: number) => void) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    return API.post(`/course/${key}/audio`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    });
  },
  assign       : (key: string, data: { userIds: string[]; dueDate?: string; note?: string }) => API.post(`/course/${key}/assign`, data),
  unassign     : (key: string, userId: string)       => API.delete(`/course/${key}/assign/${userId}`),
  progress     : (key: string)                       => API.get(`/course/${key}/progress`),
  userDetail   : (key: string, userId: string)       => API.get(`/course/${key}/progress/${userId}`),
  reflections  : (key: string, status?: string)      => API.get(`/course/${key}/reflections`, { params: status ? { status } : {} }),
  review       : (id: string, data: { status: 'approved' | 'revision'; feedback?: string }) => API.patch(`/course/reflections/${id}`, data),
  practical    : (key: string, userId: string, data: { scores: number[]; notes?: string }) =>
                   API.put(`/course/${key}/practical/${userId}`, data),
};

// ─────────────────────────────────────────────────────────────
//  FAMILY LINKS (private, password-free page per family)
// ─────────────────────────────────────────────────────────────
export const familyService = {
  getLink: (parentId: string) => API.get(`/parents/${parentId}/family-link`),
  rotate : (parentId: string) => API.post(`/parents/${parentId}/family-link/rotate`),
  view   : (token: string)    => API.get(`/family/${encodeURIComponent(token)}`),
};

// ─────────────────────────────────────────────────────────────
//  LIVE SESSIONS (Zoom meetings)
// ─────────────────────────────────────────────────────────────
export const liveSessionsService = {
  getAll     : ()                         => API.get('/live-sessions'),
  getUpcoming: ()                         => API.get('/live-sessions/upcoming'),
  create     : (data: object)             => API.post('/live-sessions', data),
  update     : (id: string, data: object) => API.patch(`/live-sessions/${id}`, data),
  remove     : (id: string)               => API.delete(`/live-sessions/${id}`),
};
