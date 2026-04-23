export interface Student {
  name: string;
  age: number;
  ageGroup: string;
  circle: string;
  nbh: string;
  sessions: number;
  att: number;
  char: number;
  status: string;
}

export interface Murabbi {
  name: string;
  circle: string;
  tier: string;
  att: number;
  students: number;
  reviews: number;
  status: string;
}

export interface Circle {
  name: string;
  nbh: string;
  murabbi: string;
  students: number;
  session: number;
  att: number;
  status: string;
}

export interface TrainingModule {
  n: string;
  title: string;
  time: string;
  desc: string;
  complete: boolean;
}

export interface Neighbourhood {
  name: string;
  area: string;
  circles: number;
  students: number;
  murabbis: number;
  mosques: string;
  status: string;
}

export const students: Student[] = [
  { name: 'Nadia Tariq', age: 11, ageGroup: 'Noor Grower', circle: 'Gulshan Circle 1', nbh: 'Gulshan-e-Iqbal', sessions: 16, att: 94, char: 88, status: 'active' },
  { name: 'Zaid Ahmad', age: 8, ageGroup: 'Noor Seedling', circle: 'Gulshan Circle 1', nbh: 'Gulshan-e-Iqbal', sessions: 16, att: 100, char: 82, status: 'active' },
  { name: 'Fatima Malik', age: 12, ageGroup: 'Noor Grower', circle: 'DHA Circle 1', nbh: 'DHA', sessions: 15, att: 93, char: 91, status: 'active' },
  { name: 'Ibrahim Khan', age: 9, ageGroup: 'Noor Seedling', circle: 'DHA Circle 1', nbh: 'DHA', sessions: 14, att: 87, char: 78, status: 'active' },
  { name: 'Aisha Siddiqui', age: 13, ageGroup: 'Noor Grower', circle: 'Clifton Circle 1', nbh: 'Clifton', sessions: 16, att: 100, char: 95, status: 'active' },
  { name: 'Omar Farooq', age: 10, ageGroup: 'Noor Grower', circle: 'Clifton Circle 1', nbh: 'Clifton', sessions: 12, att: 75, char: 65, status: 'review' },
  { name: 'Mariam Hassan', age: 7, ageGroup: 'Noor Seedling', circle: 'Nazimabad Circle 1', nbh: 'Nazimabad', sessions: 16, att: 94, char: 80, status: 'active' },
  { name: 'Yusuf Ali', age: 11, ageGroup: 'Noor Grower', circle: 'Gulshan Circle 1', nbh: 'Gulshan-e-Iqbal', sessions: 15, att: 93, char: 85, status: 'active' },
  { name: 'Khadijah Baig', age: 6, ageGroup: 'Noor Seedling', circle: 'DHA Circle 1', nbh: 'DHA', sessions: 13, att: 81, char: 72, status: 'active' },
  { name: 'Abdullah Raza', age: 12, ageGroup: 'Noor Grower', circle: 'Nazimabad Circle 1', nbh: 'Nazimabad', sessions: 16, att: 100, char: 92, status: 'active' },
];

export const murabbis: Murabbi[] = [
  { name: 'Umm Aisha', circle: 'Gulshan Circle 1', tier: 'Tier 1', att: 94, students: 8, reviews: 16, status: 'excellent' },
  { name: 'Br. Hassan', circle: 'DHA Circle 1', tier: 'Tier 1', att: 92, students: 10, reviews: 15, status: 'excellent' },
  { name: 'Sr. Maryam', circle: 'Clifton Circle 1', tier: 'Tier 1', att: 88, students: 9, reviews: 14, status: 'good' },
  { name: 'Br. Ibrahim', circle: 'Nazimabad Circle 1', tier: 'Tier 1', att: 96, students: 8, reviews: 16, status: 'excellent' },
  { name: 'Sr. Hana', circle: 'Gulshan Circle 2', tier: 'Tier 1', att: 90, students: 7, reviews: 15, status: 'good' },
];

export const circles: Circle[] = [
  { name: 'Gulshan Circle 1', nbh: 'Gulshan-e-Iqbal', murabbi: 'Umm Aisha', students: 8, session: 16, att: 94, status: 'active' },
  { name: 'Gulshan Circle 2', nbh: 'Gulshan-e-Iqbal', murabbi: 'Sr. Hana', students: 7, session: 14, att: 91, status: 'active' },
  { name: 'DHA Circle 1', nbh: 'DHA', murabbi: 'Br. Hassan', students: 10, session: 16, att: 88, status: 'active' },
  { name: 'DHA Circle 2', nbh: 'DHA', murabbi: 'Br. Usman', students: 8, session: 12, att: 82, status: 'active' },
  { name: 'Clifton Circle 1', nbh: 'Clifton', murabbi: 'Sr. Maryam', students: 9, session: 16, att: 78, status: 'review' },
  { name: 'Nazimabad Circle 1', nbh: 'Nazimabad', murabbi: 'Br. Ibrahim', students: 8, session: 16, att: 96, status: 'active' },
  { name: 'Nazimabad Circle 2', nbh: 'Nazimabad', murabbi: 'Sr. Zainab', students: 8, session: 10, att: 85, status: 'active' },
  { name: 'PECHS Circle 1', nbh: 'PECHS', murabbi: 'Br. Tariq', students: 7, session: 8, att: 89, status: 'active' },
  { name: 'PECHS Circle 2', nbh: 'PECHS', murabbi: 'Sr. Amina', students: 9, session: 8, att: 86, status: 'active' },
];

export const moduleData: TrainingModule[] = [
  { n: '1', title: 'Foundations of Tarbiyah', time: 'Day 1 · 9:20–10:30 AM · 70 min', desc: 'Tarbiyah philosophy, fitrah framework, the three gaps, prophetic Halqah model.', complete: true },
  { n: '2', title: 'The Murabbi Identity', time: 'Day 1 · 10:45 AM–12:00 PM · 75 min', desc: 'Six Murabbi qualities, unique role vs teacher/parent/imam, Muraqabah foundation.', complete: true },
  { n: '3', title: 'Child Development', time: 'Day 1 · 1:00–2:30 PM · 90 min', desc: 'Ages 6–9 and 10–13 developmental stages, adaptation strategies, quick reference.', complete: true },
  { n: '4', title: 'Circle Facilitation Skills', time: 'Day 2 · 9:00–10:30 AM · 90 min', desc: 'Rituals, art of questioning, group dynamics, mock circle simulation.', complete: false },
  { n: '5', title: 'Safeguarding & Parents', time: 'Day 2 · 10:45 AM–12:00 PM · 75 min', desc: 'Safeguarding obligations, disclosure protocol, parent relationship principles.', complete: false },
  { n: '6', title: 'The Year Ahead', time: 'Day 2 · 1:00–2:15 PM · 75 min', desc: 'Emotional arc of the year, sustainability, peer group, Session 1 preparation.', complete: false },
];

export const neighbourhoods: Neighbourhood[] = [
  { name: 'Gulshan-e-Iqbal', area: 'East Karachi', circles: 2, students: 22, murabbis: 2, mosques: 'Masjid Bilal, Masjid Umar', status: 'active' },
  { name: 'DHA', area: 'South Karachi', circles: 2, students: 26, murabbis: 2, mosques: 'Masjid Al-Noor', status: 'active' },
  { name: 'Clifton', area: 'South Karachi', circles: 1, students: 13, murabbis: 1, mosques: 'Masjid Ibrahim', status: 'review' },
  { name: 'Nazimabad', area: 'Central Karachi', circles: 2, students: 18, murabbis: 2, mosques: 'Jama Masjid No.5', status: 'active' },
];

export const pageNames: Record<string, string> = {
  dashboard: 'Admin Dashboard',
  'murabbi-dashboard': 'Murabbi Dashboard',
  'murabbi-students': 'My Students',
  'murabbi-circles': 'My Circles',
  'murabbi-attendance': 'Mark Attendance',
  'murabbi-lessons': 'Lesson Plans',
  'murabbi-training': 'Training Materials',
  'murabbi-reports': 'My Reports',
  world: 'Noor Circles World',
  students: 'Student Management',
  murabbis: 'Murabbi Management',
  parents: 'Parent Network',
  circles: 'Circle Management',
  attendance: 'Attendance Overview',
  sessions: 'Sessions & Curriculum',
  performance: 'Performance & Reviews',
  incentives: 'Incentives & Awards',
  training: 'Murabbi Training',
  neighbourhoods: 'Neighbourhoods',
  reports: 'Reports & Analytics',
  settings: 'System Settings',
};

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('');
}
