// --- TYPE DEFINITIONS ---
export type UserRole = 'Admin' | 'Usuario';

export interface Organization {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  organizationId: string;
}

export interface Person {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cvFile?: { name: string; type: string; data: string } | null; // Base64 encoded file
  personalNotes?: string;
}

export interface Employee extends Person {
  role: string; // Puesto dentro de la empresa
  department?: string;
  employeeCode?: string;
  hireDate?: string; // YYYY-MM-DD
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  organizationId: string;
  recurringSchedule?: {
    templateId: string;
    days: number[]; // 1 for Monday, 2 for Tuesday, ..., 7 for Sunday
  };
}

export type ApplicantStatus = 'Nuevo' | 'En Proceso' | 'Oferta' | 'Contratado' | 'Rechazado';

export interface Applicant extends Person {
  positionApplied: string; // Puesto al que aplica
  department?: string; // Departamento al que aplica
  status: ApplicantStatus;
  applicationDate: string; // YYYY-MM-DD
  organizationId: string;
}

export interface Characteristic {
  id: string;
  name: string;
  weight: number;
}

export interface Factor {
  id: string;
  name: string;
  characteristics: Characteristic[];
}

export interface CriteriaTemplate {
  id: string;
  name: string;
  criteria: Factor[];
  organizationId: string;
}

export interface EvaluationScore {
  characteristicId: string;
  score: number;
}

export type EvaluationMode = 'Bajo' | 'Medio' | 'Riguroso';
export type PotentialLevel = 'Bajo' | 'Medio' | 'Alto';
export type EvaluationLevel = 'Bajo' | 'Medio' | 'Alto' | 'Indeterminado';

export interface CalculatedFactorScore {
    factorId: string;
    factorName: string;
    score: number;
}

export interface CalculatedScores {
    overall: number;
    factors: CalculatedFactorScore[];
}

export interface EvaluationResult {
  id: string;
  personId: string;
  personType: 'employee' | 'applicant';
  feedback: string;
  scores: EvaluationScore[];
  mode: EvaluationMode;
  evaluatedAt: string; // ISO date string
  criteria: Factor[];
  potential: PotentialLevel;
  level: EvaluationLevel;
  calculatedScores: CalculatedScores;
  organizationId: string;
}

export interface LevelThreshold {
    name: EvaluationLevel;
    threshold: number;
}

export interface EvaluationTag {
    id:string;
    name: string;
    color: string;
}

export interface ScheduledEvaluation {
    id: string;
    title: string;
    start: string; // ISO date string
    end: string; // ISO date string
    targetType: 'general' | 'department' | 'users' | 'private';
    targetId: string; // 'all' or department name
    participantIds: string[];
    creatorId: string;
    tagId: string;
    description?: string;
    organizationId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  department?: string;
  enabledTools?: string[];
  organizationId: string;
}

export interface ChatThread {
    id: string;
    participantIds: string[];
    isGroup: boolean;
    name?: string;
    organizationId: string;
}

export interface ChatMessage {
    id: string;
    chatId: string;
    senderId: string;
    text: string;
    timestamp: string; // ISO date string
}

export interface ChatReadStatus {
    id: string;
    threadId: string;
    userId: string;
    lastSeenTimestamp: string; // ISO date string
}

// --- ATTENDANCE MODULE TYPES ---

export type AttendanceStatus = 'Presente' | 'Ausente' | 'Reposo' | 'Descanso Programado' | 'Fuera de Horario' | 'Atrasado';

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD
    clockIn: string | null; // HH:mm
    clockOut: string | null;
    status: AttendanceStatus;
    organizationId: string;
}

export interface ScheduledBreak {
    id: string;
    employeeId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    type: 'Vacaciones' | 'Permiso' | 'Día Libre';
    organizationId: string;
}

export interface SickLeave {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD
    reason: string;
    justificationImage?: string; // Base64 encoded image
    organizationId: string;
}

export interface EmployeeNote {
    id: string;
    employeeId: string;
    authorId: string;
    text: string;
    timestamp: string; // ISO date string
    organizationId: string;
}

export interface WorkSchedule {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    organizationId: string;
}

export interface ShiftTemplate {
  id: string;
  organizationId: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  color: string; // Tailwind color class e.g., 'bg-blue-500'
}


// --- TASK MODULE TYPES ---

export type TaskStatus = 'Pendiente' | 'En Progreso' | 'Completada';
export type TaskPriority = 'Baja' | 'Media' | 'Alta';

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
  createdAt: string; // ISO date string
  creatorId: string; // User ID
  assigneeIds: string[]; // User IDs
  departmentTags: string[]; // Department names
  subtasks: Subtask[];
  organizationId: string;
}

// --- FLIGHT RISK MODULE TYPES ---
export type FlightRiskLevel = 'Bajo' | 'Medio' | 'Alto';

export interface FlightRiskResult {
  employeeId: string;
  riskScore: number; // 0-100
  riskLevel: FlightRiskLevel;
  summary: string; // AI-generated summary
  factors: {
    evaluationTrend: 'ascendente' | 'descendente' | 'estable';
    absencesLast90Days: number;
    latesLast90Days: number;
    tenureMonths: number;
  };
}

// --- ACTIVITY LOG ---
export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  action: string; // e.g., 'CREATE_USER', 'DELETE_EVALUATION'
  details: string; // Human-readable description, e.g., "Created employee 'John Doe'"
  targetId?: string; // Optional ID of the affected object
  organizationId: string;
}