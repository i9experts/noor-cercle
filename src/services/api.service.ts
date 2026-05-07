import { API } from "@/lib/api";

// ─────────────────────────────────────────────────────────────
//  USERS
// ─────────────────────────────────────────────────────────────
export const usersService = {
  getMe: () => API.get("/users/me"),
  updateMe: (data: {
    fullName?: string;
    phone?: string;
    bio?: string;
    emailNotifications?: boolean;
    whatsappAlerts?: boolean;
    language?: string;
  }) => API.patch("/users/me", data),
};

// ─────────────────────────────────────────────────────────────
//  ADMIN
// ─────────────────────────────────────────────────────────────
export const adminService = {
  getDashboard: () => API.get("/admin/dashboard"),
  getOverview: () => API.get("/admin/overview"),
  getMurabbis: () => API.get("/admin/murabbis"),
  createMurabbi: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
  }) => API.post("/admin/murabbis", data),
  updateUserStatus: (userId: string, status: string) =>
    API.patch(`/admin/users/${userId}/status`, { status }),
  deleteUser: (userId: string) => API.delete(`/admin/users/${userId}`),
};

// ─────────────────────────────────────────────────────────────
//  MURABBIS
// ─────────────────────────────────────────────────────────────
export const murabbisService = {
  getAll: () => API.get("/murabbis"),
  getDashboard: () => API.get("/murabbis/dashboard"),
  getMyStudents: () => API.get("/murabbis/my-students"),
  getMyCircles: () => API.get("/murabbis/my-circles"),
  getOne: (id: string) => API.get(`/murabbis/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  NEIGHBOURHOODS
// ─────────────────────────────────────────────────────────────
export const neighbourhoodsService = {
  getAll: () => API.get("/neighbourhoods"),
  getOne: (id: string) => API.get(`/neighbourhoods/${id}`),
  create: (data: { name: string; area: string; mosques?: string }) =>
    API.post("/neighbourhoods", data),
  update: (id: string, data: object) =>
    API.patch(`/neighbourhoods/${id}`, data),
  remove: (id: string) => API.delete(`/neighbourhoods/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  CIRCLES
// ─────────────────────────────────────────────────────────────
export const circlesService = {
  getAll: (neighbourhoodId?: string) =>
    API.get(`/circles${neighbourhoodId ? `?neighbourhoodId=${neighbourhoodId}` : ""}`),
  getOne: (id: string) => API.get(`/circles/${id}`),
  create: (data: {
    name: string;
    neighbourhood: string;
    murabbi?: string;
    venue: string;
    sessionDay?: string;
    sessionTime?: string;
    startDate?: string;
    maxStudents?: number;
  }) => API.post("/circles", data),
  update: (id: string, data: object) => API.patch(`/circles/${id}`, data),
  remove: (id: string) => API.delete(`/circles/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  STUDENTS
// ─────────────────────────────────────────────────────────────
export const studentsService = {
  getAll: (circleId?: string) =>
    API.get(`/students${circleId ? `?circleId=${circleId}` : ""}`),
  getStats: () => API.get("/students/stats"),
  getOne: (id: string) => API.get(`/students/${id}`),
  enroll: (data: {
    fullName: string;
    dateOfBirth: string;
    age: number;
    neighbourhood: string;
    circle: string;
    parentName: string;
    parentPhone: string;
    parentWhatsapp?: string;
    specialNotes?: string;
  }) => API.post("/students", data),
  update: (id: string, data: object) => API.patch(`/students/${id}`, data),
  remove: (id: string) => API.delete(`/students/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  ATTENDANCE
// ─────────────────────────────────────────────────────────────
export const attendanceService = {
  submit: (data: {
    circle: string;
    sessionNumber: number;
    sessionDate: string;
    topic: string;
    records: Array<{ student: string; status: string; note?: string }>;
  }) => API.post("/attendance", data),
  getAll: () => API.get("/attendance"),
  getMine: () => API.get("/attendance/my"),
  getByCircle: (circleId: string) =>
    API.get(`/attendance/circle/${circleId}`),
  getStudentRate: (studentId: string) =>
    API.get(`/attendance/student/${studentId}/rate`),
};

// ─────────────────────────────────────────────────────────────
//  INCENTIVES
// ─────────────────────────────────────────────────────────────
export const incentivesService = {
  award: (data: {
    student: string;
    awardType: string;
    reason: string;
    notifyParent?: boolean;
  }) => API.post("/incentives", data),
  getAll: () => API.get("/incentives"),
  getLeaderboard: () => API.get("/incentives/leaderboard"),
  getByStudent: (studentId: string) =>
    API.get(`/incentives/student/${studentId}`),
};

// ─────────────────────────────────────────────────────────────
//  PERFORMANCE
// ─────────────────────────────────────────────────────────────
export const performanceService = {
  submitReview: (data: object) => API.post("/performance/reviews", data),
  getReviews: () => API.get("/performance/reviews"),
  getIndicators: () => API.get("/performance/indicators"),
};

// ─────────────────────────────────────────────────────────────
//  SESSIONS & CURRICULUM
// ─────────────────────────────────────────────────────────────
export const sessionsService = {
  getAll: () => API.get("/sessions"),
  getCurriculum: () => API.get("/sessions/curriculum"),
};

// ─────────────────────────────────────────────────────────────
//  TRAINING
// ─────────────────────────────────────────────────────────────
export const trainingService = {
  getModules: () => API.get("/training/modules"),
  getProgressSummary: () => API.get("/training/progress/summary"),
  updateProgress: (moduleId: string, progressPercent: number) =>
    API.patch(`/training/progress/${moduleId}`, { progressPercent }),
  createModule: (data: object) => API.post("/training/modules", data),
  updateModule: (id: string, data: object) =>
    API.patch(`/training/modules/${id}`, data),
  deleteModule: (id: string) => API.delete(`/training/modules/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  LESSON PLANS
// ─────────────────────────────────────────────────────────────
export const lessonsService = {
  getAll: () => API.get("/lessons"),
  getOne: (id: string) => API.get(`/lessons/${id}`),
  create: (data: object) => API.post("/lessons", data),
  update: (id: string, data: object) => API.patch(`/lessons/${id}`, data),
  remove: (id: string) => API.delete(`/lessons/${id}`),
};

// ─────────────────────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────────────────────
export const reportsService = {
  getAdminReport: () => API.get("/reports/admin"),
  getMurabbiReport: () => API.get("/reports/murabbi"),
  getAttendanceTrend: () => API.get("/reports/attendance-trend"),
};