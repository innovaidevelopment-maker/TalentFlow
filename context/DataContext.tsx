import React, { createContext, useContext, useState, useMemo } from 'react';
import type { User, Employee, Applicant, CriteriaTemplate, EvaluationResult, Factor, EvaluationScore, EvaluationMode, PotentialLevel, LevelThreshold, ScheduledEvaluation, EvaluationTag, ChatThread, ChatMessage, ChatReadStatus, AttendanceRecord, ScheduledBreak, SickLeave, EmployeeNote, WorkSchedule, Task, Organization, Department, ApplicantStatus, ActivityLogEntry } from '../types';
import { initialData } from '../initialData';
import { generateFeedback } from '../services/geminiService';
import { calculateScoresAndLevel, getLevel } from '../utils';

// A simple useLocalStorage hook to persist state
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item && key === 'users' && JSON.parse(item).length === 0) {
                 return initialValue;
            }
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            // FIX: Correctly handle functional updates for useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error writing to localStorage key “${key}”:`, error);
        }
    };

    return [storedValue, setValue];
}

interface DataContextType {
    // State
    organizations: Organization[];
    users: User[];
    employees: Employee[];
    applicants: Applicant[];
    criteriaTemplates: CriteriaTemplate[];
    evaluations: EvaluationResult[];
    departments: Department[];
    scheduledEvaluations: ScheduledEvaluation[];
    chatThreads: ChatThread[];
    chatMessages: ChatMessage[];
    chatReadStatuses: ChatReadStatus[];
    attendanceRecords: AttendanceRecord[];
    scheduledBreaks: ScheduledBreak[];
    sickLeaves: SickLeave[];
    employeeNotes: EmployeeNote[];
    workSchedules: WorkSchedule[];
    tasks: Task[];
    activityLog: ActivityLogEntry[];
    levelThresholds: LevelThreshold[];
    evaluationTags: EvaluationTag[];
    criteriaInEdit: Factor[];

    // State Setters
    setOrganizations: React.Dispatch<React.SetStateAction<Organization[]>>;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
    setApplicants: React.Dispatch<React.SetStateAction<Applicant[]>>;
    setCriteriaTemplates: React.Dispatch<React.SetStateAction<CriteriaTemplate[]>>;
    setEvaluations: React.Dispatch<React.SetStateAction<EvaluationResult[]>>;
    setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
    setScheduledEvaluations: React.Dispatch<React.SetStateAction<ScheduledEvaluation[]>>;
    setChatThreads: React.Dispatch<React.SetStateAction<ChatThread[]>>;
    setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setChatReadStatuses: React.Dispatch<React.SetStateAction<ChatReadStatus[]>>;
    setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
    setScheduledBreaks: React.Dispatch<React.SetStateAction<ScheduledBreak[]>>;
    setSickLeaves: React.Dispatch<React.SetStateAction<SickLeave[]>>;
    setEmployeeNotes: React.Dispatch<React.SetStateAction<EmployeeNote[]>>;
    setWorkSchedules: React.Dispatch<React.SetStateAction<WorkSchedule[]>>;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    setActivityLog: React.Dispatch<React.SetStateAction<ActivityLogEntry[]>>;
    setLevelThresholds: React.Dispatch<React.SetStateAction<LevelThreshold[]>>;
    setCriteriaInEdit: React.Dispatch<React.SetStateAction<Factor[]>>;

    // Handlers
    logActivity: (action: string, details: string, targetId?: string, user?: User | null) => void;
    handleCompleteEvaluation: (personToEvaluate: { id: string; type: 'employee' | 'applicant' }, scores: EvaluationScore[], mode: EvaluationMode, usedCriteria: Factor[], potential: PotentialLevel, user: User) => Promise<string | null>;
    handleSaveApplicant: (applicantData: Applicant, isEditing: boolean, user: User) => void;
    handleUpdateApplicantStatus: (applicantId: string, newStatus: ApplicantStatus, user: User) => void;
    handleHireApplicant: (applicantId: string, hireDetails: { department: string; role: string; employeeCode: string; }, user: User) => void;
    handleSaveEmployee: (employeeData: Employee, isEditing: boolean, user: User) => void;
    handleDeleteEmployee: (employeeId: string, user: User) => void;
    handleImportEmployees: (newEmps: Omit<Employee, 'id'>[], newDepts: string[], user: User) => void;
    handleAddDepartment: (name: string, user: User) => boolean;
    handleDeleteDepartment: (name: string, user: User) => { success: boolean; message?: string };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // --- GLOBAL STATE ---
    const [organizations, setOrganizations] = useLocalStorage<Organization[]>('organizations', initialData.organizations);
    const [users, setUsers] = useLocalStorage<User[]>('users', initialData.users);
    const [employees, setEmployees] = useLocalStorage<Employee[]>('employees', initialData.employees);
    const [applicants, setApplicants] = useLocalStorage<Applicant[]>('applicants', initialData.applicants);
    const [criteriaTemplates, setCriteriaTemplates] = useLocalStorage<CriteriaTemplate[]>('criteriaTemplates', initialData.criteriaTemplates);
    const [evaluations, setEvaluations] = useLocalStorage<EvaluationResult[]>('evaluations', initialData.evaluations);
    const [departments, setDepartments] = useLocalStorage<Department[]>('departments', initialData.departments);
    const [scheduledEvaluations, setScheduledEvaluations] = useLocalStorage<ScheduledEvaluation[]>('scheduledEvaluations', initialData.scheduledEvaluations);
    const [chatThreads, setChatThreads] = useLocalStorage<ChatThread[]>('chatThreads', initialData.chatThreads);
    const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('chatMessages', initialData.chatMessages);
    const [chatReadStatuses, setChatReadStatuses] = useLocalStorage<ChatReadStatus[]>('chatReadStatuses', initialData.chatReadStatuses);
    const [attendanceRecords, setAttendanceRecords] = useLocalStorage<AttendanceRecord[]>('attendanceRecords', initialData.attendanceRecords);
    const [scheduledBreaks, setScheduledBreaks] = useLocalStorage<ScheduledBreak[]>('scheduledBreaks', initialData.scheduledBreaks);
    const [sickLeaves, setSickLeaves] = useLocalStorage<SickLeave[]>('sickLeaves', initialData.sickLeaves);
    const [employeeNotes, setEmployeeNotes] = useLocalStorage<EmployeeNote[]>('employeeNotes', initialData.employeeNotes);
    const [workSchedules, setWorkSchedules] = useLocalStorage<WorkSchedule[]>('workSchedules', initialData.workSchedules);
    const [tasks, setTasks] = useLocalStorage<Task[]>('tasks', initialData.tasks);
    const [activityLog, setActivityLog] = useLocalStorage<ActivityLogEntry[]>('activityLog', initialData.activityLog);
    const [levelThresholds, setLevelThresholds] = useLocalStorage<LevelThreshold[]>('levelThresholds', initialData.levelThresholds);
    const [evaluationTags] = useState<EvaluationTag[]>(initialData.evaluationTags);
    const [criteriaInEdit, setCriteriaInEdit] = useLocalStorage<Factor[]>('criteriaInEdit', []);

    // --- ACTIVITY LOGGING ---
    const logActivity = (action: string, details: string, targetId?: string, user?: User | null) => {
        if (!user) return;
        const newLogEntry: ActivityLogEntry = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: user.id,
            userName: user.name,
            action,
            details,
            targetId,
            organizationId: user.organizationId,
        };
        setActivityLog(prevLog => [newLogEntry, ...prevLog]);
    };

    // --- HANDLERS (ORGANIZATION-AWARE) ---
    const handleAddDepartment = (name: string, user: User): boolean => {
        if (user.role !== 'Admin') return false;
        if (!departments.some(d => d.name === name && d.organizationId === user.organizationId)) {
            const newDept = { id: `dept-${Date.now()}`, name, organizationId: user.organizationId };
            setDepartments(prev => [...prev, newDept]);
            logActivity('CREATE_DEPARTMENT', `Se añadió el departamento: ${name}`, newDept.id, user);
            return true;
        }
        return false;
    };

    const handleDeleteDepartment = (name: string, user: User): { success: boolean; message?: string } => {
        if (user.role !== 'Admin') {
            return { success: false, message: 'No tienes permiso para realizar esta acción.' };
        }
    
        const orgDepartments = departments.filter(d => d.organizationId === user.organizationId);
        if (orgDepartments.length <= 1) {
            return { success: false, message: 'No se puede eliminar el último departamento. Debe existir al menos uno en la organización.' };
        }
    
        const orgEmployees = employees.filter(e => e.organizationId === user.organizationId);
        const isDepartmentInUse = orgEmployees.some(e => e.department === name);
    
        if (isDepartmentInUse) {
            return { success: false, message: `No se puede eliminar "${name}" porque tiene empleados asignados. Reasigna a los empleados primero.` };
        }
    
        const deptToDelete = orgDepartments.find(d => d.name === name);
        if (deptToDelete) {
            setDepartments(prev => prev.filter(d => d.id !== deptToDelete.id));
            logActivity('DELETE_DEPARTMENT', `Se eliminó el departamento: ${name}`, deptToDelete.id, user);
            return { success: true };
        }
        
        return { success: false, message: 'No se encontró el departamento.' };
    };
    
    const handleCompleteEvaluation = async (
        personToEvaluate: { id: string; type: 'employee' | 'applicant' },
        scores: EvaluationScore[],
        mode: EvaluationMode,
        usedCriteria: Factor[],
        potential: PotentialLevel,
        user: User
    ): Promise<string | null> => {
        const person = personToEvaluate.type === 'employee' 
            ? employees.find(e => e.id === personToEvaluate!.id)
            : applicants.find(a => a.id === personToEvaluate!.id);
            
        if (!person) return null;
        
        const feedback = await generateFeedback(person, usedCriteria, scores, mode);
        const calculatedScores = calculateScoresAndLevel(scores, usedCriteria);
        const level = getLevel(calculatedScores.overall, levelThresholds);

        const newEvaluation: EvaluationResult = {
            id: `eval-${Date.now()}`,
            personId: personToEvaluate.id,
            personType: personToEvaluate.type,
            feedback, scores, mode,
            evaluatedAt: new Date().toISOString(),
            criteria: usedCriteria,
            potential, level, calculatedScores,
            organizationId: user.organizationId
        };

        setEvaluations(prev => [...prev, newEvaluation]);
        logActivity('COMPLETE_EVALUATION', `Se completó una evaluación para ${person.name} (${personToEvaluate.type}).`, newEvaluation.id, user);
        return newEvaluation.id;
    };
    
    const handleSaveApplicant = (applicantData: Applicant, isEditing: boolean, user: User) => {
        if (isEditing) {
            setApplicants(prev => prev.map(app => app.id === applicantData.id ? applicantData : app));
            logActivity('UPDATE_APPLICANT', `Se actualizaron los datos del aspirante: ${applicantData.name}`, applicantData.id, user);
        } else {
            const newApplicant: Applicant = { ...applicantData, id: `appl-${Date.now()}`, organizationId: user.organizationId };
            setApplicants(prev => [newApplicant, ...prev]);
            logActivity('CREATE_APPLICANT', `Se añadió al nuevo aspirante: ${newApplicant.name}`, newApplicant.id, user);
        }
    };
    
    const handleUpdateApplicantStatus = (applicantId: string, newStatus: ApplicantStatus, user: User) => {
        const applicant = applicants.find(a => a.id === applicantId);
        if (applicant) {
            setApplicants(prev => prev.map(app => app.id === applicantId ? { ...app, status: newStatus } : app));
            logActivity('UPDATE_APPLICANT_STATUS', `Se cambió el estado de ${applicant.name} a ${newStatus}.`, applicantId, user);
        }
    };
    
    const handleHireApplicant = (applicantId: string, hireDetails: { department: string; role: string; employeeCode: string; }, user: User) => {
        const applicant = applicants.find(a => a.id === applicantId);
        if (!applicant) return;

        const newEmployee: Employee = {
            id: `emp-${Date.now()}`,
            name: applicant.name, email: applicant.email, phone: applicant.phone, address: applicant.address,
            cvFile: applicant.cvFile, personalNotes: applicant.personalNotes,
            role: hireDetails.role, department: hireDetails.department, employeeCode: hireDetails.employeeCode,
            hireDate: new Date().toISOString().split('T')[0],
            organizationId: user.organizationId
        };

        setEmployees(prev => [...prev, newEmployee]);
        setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, status: 'Contratado' } : a));
        logActivity('HIRE_APPLICANT', `Se contrató a ${applicant.name} como ${hireDetails.role}.`, newEmployee.id, user);
    };
    
    const handleSaveEmployee = (employeeData: Employee, isEditing: boolean, user: User) => {
        if (isEditing) {
            setEmployees(prev => prev.map(emp => emp.id === employeeData.id ? employeeData : emp));
            logActivity('UPDATE_EMPLOYEE', `Se actualizaron los datos del empleado: ${employeeData.name}`, employeeData.id, user);
        } else {
            const newEmployee = { ...employeeData, id: `emp-${Date.now()}`, organizationId: user.organizationId };
            setEmployees(prev => [...prev, newEmployee]);
            logActivity('CREATE_EMPLOYEE', `Se creó al empleado: ${newEmployee.name}`, newEmployee.id, user);
        }
    };

    const handleDeleteEmployee = (employeeId: string, user: User) => {
        const employee = employees.find(e => e.id === employeeId);
        if (employee) {
            setEmployees(prev => prev.filter(emp => emp.id !== employeeId));
            logActivity('DELETE_EMPLOYEE', `Se eliminó al empleado: ${employee.name}`, employeeId, user);
        }
    };
    
    const handleImportEmployees = (newEmps: Omit<Employee, 'id'>[], newDepts: string[], user: User) => {
        const orgId = user.organizationId;
        const currentDepartments = departments.filter(d => d.organizationId === orgId).map(d => d.name);
        const employeesWithOrg = newEmps.map((e, i) => ({...e, id: `emp-import-${Date.now()}-${i}`, organizationId: orgId }));
        const deptsWithOrg = newDepts.filter(d => !currentDepartments.includes(d)).map(d => ({ id: `dept-import-${Date.now()}-${d}`, name: d, organizationId: orgId }));
        setEmployees(prev => [...prev, ...employeesWithOrg]);
        setDepartments(prev => [...prev, ...deptsWithOrg]);
        logActivity('IMPORT_EMPLOYEES', `Se importaron ${newEmps.length} empleados via CSV.`, undefined, user);
    };
    
    const value = {
        organizations, users, employees, applicants, criteriaTemplates, evaluations, departments, scheduledEvaluations,
        chatThreads, chatMessages, chatReadStatuses, attendanceRecords, scheduledBreaks, sickLeaves, employeeNotes,
        workSchedules, tasks, activityLog, levelThresholds, evaluationTags, criteriaInEdit,
        
        setOrganizations, setUsers, setEmployees, setApplicants, setCriteriaTemplates, setEvaluations, setDepartments,
        setScheduledEvaluations, setChatThreads, setChatMessages, setChatReadStatuses, setAttendanceRecords,
        setScheduledBreaks, setSickLeaves, setEmployeeNotes, setWorkSchedules, setTasks, setActivityLog,
        setLevelThresholds, setCriteriaInEdit,
        
        logActivity,
        handleCompleteEvaluation,
        handleSaveApplicant,
        handleUpdateApplicantStatus,
        handleHireApplicant,
        handleSaveEmployee,
        handleDeleteEmployee,
        handleImportEmployees,
        handleAddDepartment,
        handleDeleteDepartment,
    };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};