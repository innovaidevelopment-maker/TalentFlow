import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { User, ApplicantStatus, LevelThreshold, Department, Factor, EvaluationScore, EvaluationMode, PotentialLevel, ChatThread, ChatMessage, ScheduledEvaluation, Employee, CriteriaTemplate, Applicant, ChatReadStatus, AttendanceRecord, ScheduledBreak, SickLeave, EmployeeNote, WorkSchedule, Task, ActivityLogEntry, AttendanceStatus } from './types';
import { initialData } from './initialData';
import { useData } from './context/DataContext';

// Import all components
import { Login } from './components/Login';
import { Register } from './components/Register';
import { MainPage } from './components/MainPage';
import { CriteriaSetup } from './components/CriteriaSetup';
import { EmployeeList } from './components/CandidateList';
import { EvaluationForm } from './components/EvaluationForm';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ComparisonDashboard } from './components/ComparisonDashboard';
import { EvaluationHistory } from './components/EvaluationHistory';
import { GlobalDashboard } from './components/GlobalDashboard';
import { Settings } from './components/Settings';
import { RecruitmentDashboard } from './components/RecruitmentDashboard';
import { PromotionsDashboard } from './components/PromotionsDashboard';
import { TalentMatrix } from './components/TalentMatrix';
import { EmployeeManagement } from './components/EmployeeManagement';
import { EvaluationCalendar } from './components/EvaluationCalendar';
import Chat from './components/Chat';
import { TasksDashboard } from './components/TasksDashboard';
import { AttendanceDashboard } from './components/AttendanceDashboard';
import { AttendanceAnalyticsDashboard } from './components/AttendanceAnalyticsDashboard';
import { EmployeeFile } from './components/EmployeeFile';
import { ArrowLeftIcon } from './components/icons';
import { ProfileComparisonList } from './components/ProfileComparisonList';
import { ActivityLogDashboard } from './components/ActivityLogDashboard';
import { FlightRiskDashboard } from './components/FlightRiskDashboard';


// A simple useLocalStorage hook to persist session state
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading from localStorage key “${key}”:`, error);
            return initialValue;
        }
    });

    const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error writing to localStorage key “${key}”:`, error);
        }
    };

    return [storedValue, setValue];
}

const ALL_TOOLS = [
    'recruitment', 'employees', 'attendance', 'attendanceAnalytics',
    'dashboard', 'evaluateEmployees', 'criteria', 'history', 'promotions', 'talentMatrix', 'flightRisk',
    'calendar', 'chat', 'tasks', 'compare', 'activityLog'
];

// Mapa para la navegación hacia atrás. Asocia una vista hija con su submenú padre.
const subViewParentMap: { [key: string]: string } = {
    'employees': 'personal',
    'attendance': 'personal',
    'attendanceAnalytics': 'personal',
    'dashboard': 'evaluaciones',
    'evaluateEmployees': 'evaluaciones',
    'compare': 'evaluaciones',
    'history': 'evaluaciones',
    'criteria': 'evaluaciones',
    'promotions': 'strategicAnalysis',
    'talentMatrix': 'strategicAnalysis',
    'flightRisk': 'strategicAnalysis'
};

const App: React.FC = () => {
    // --- CONTEXT DATA HOOK ---
    const {
        organizations, users, employees, applicants, criteriaTemplates, evaluations, departments, scheduledEvaluations,
        chatThreads, chatMessages, chatReadStatuses, attendanceRecords, scheduledBreaks, sickLeaves, employeeNotes,
        workSchedules, tasks, activityLog, levelThresholds, evaluationTags, criteriaInEdit,
        
        setOrganizations, setUsers, setEmployees, setApplicants, setCriteriaTemplates, setEvaluations, setDepartments,
        setScheduledEvaluations, setChatThreads, setChatMessages, setChatReadStatuses, setAttendanceRecords,
        setScheduledBreaks, setSickLeaves, setEmployeeNotes, setWorkSchedules, setTasks, setActivityLog,
        setLevelThresholds, setCriteriaInEdit,
        
        logActivity, handleCompleteEvaluation,
    } = useData();
    
    // --- SESSION AND VIEW STATE (The only state App.tsx now manages) ---
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
    const [currentView, setCurrentView] = useLocalStorage<string>('currentView', 'main');
    const [authView, setAuthView] = useState<'login' | 'register'>('login');
    const [selectedThreadId, setSelectedThreadId] = useLocalStorage<string|null>('selectedThreadId', null);
    const [personToEvaluate, setPersonToEvaluate] = useState<{ id: string; type: 'employee' | 'applicant' } | null>(null);
    const [evaluationToView, setEvaluationToView] = useState<string | null>(null);
    const [personIdsToCompare, setPersonIdsToCompare] = useState<string[] | null>(null);
    const [employeeFileToView, setEmployeeFileToView] = useState<string | null>(null);
    const [initialSubMenu, setInitialSubMenu] = useState<string | null>(null);

    // --- State for Profile Comparison persistence ---
    const [comparisonSelection, setComparisonSelection] = useState<Set<string>>(new Set());
    const [comparisonSearchTerm, setComparisonSearchTerm] = useState('');
    const [comparisonDepartmentFilter, setComparisonDepartmentFilter] = useState('all');
    const [comparisonTypeFilter, setComparisonTypeFilter] = useState<'all' | 'employee' | 'applicant'>('all');

    // Effect to clear comparison state when navigating away from the 'compare' view.
    const prevViewRef = useRef<string | null>(null);
    useEffect(() => {
        if (prevViewRef.current === 'compare' && currentView !== 'compare') {
            setComparisonSelection(new Set());
            setComparisonSearchTerm('');
            setComparisonDepartmentFilter('all');
            setComparisonTypeFilter('all');
        }
        prevViewRef.current = currentView;
    }, [currentView]);


    // --- ORGANIZATION-SPECIFIC DATA SELECTORS ---
    const organizationData = useMemo(() => {
        if (!currentUser) return {
            currentOrganization: null,
            users: [], employees: [], applicants: [], criteriaTemplates: [], evaluations: [],
            departments: [], scheduledEvaluations: [], chatThreads: [], tasks: [],
            attendanceRecords: [], scheduledBreaks: [], sickLeaves: [], employeeNotes: [], workSchedules: [],
            activityLog: []
        };
        
        const orgId = currentUser.organizationId;
        return {
            currentOrganization: organizations.find(o => o.id === orgId) || null,
            users: users.filter(u => u.organizationId === orgId),
            employees: employees.filter(e => e.organizationId === orgId),
            applicants: applicants.filter(a => a.organizationId === orgId),
            criteriaTemplates: criteriaTemplates.filter(ct => ct.organizationId === orgId),
            evaluations: evaluations.filter(ev => ev.organizationId === orgId),
            departments: departments.filter(d => d.organizationId === orgId),
            scheduledEvaluations: scheduledEvaluations.filter(se => se.organizationId === orgId),
            chatThreads: chatThreads.filter(ct => ct.organizationId === orgId),
            tasks: tasks.filter(t => t.organizationId === orgId),
            attendanceRecords: attendanceRecords.filter(ar => ar.organizationId === orgId),
            scheduledBreaks: scheduledBreaks.filter(sb => sb.organizationId === orgId),
            sickLeaves: sickLeaves.filter(sl => sl.organizationId === orgId),
            employeeNotes: employeeNotes.filter(en => en.organizationId === orgId),
            workSchedules: workSchedules.filter(ws => ws.organizationId === orgId),
            activityLog: activityLog.filter(log => log.organizationId === orgId),
        };
    }, [currentUser, organizations, users, employees, applicants, criteriaTemplates, evaluations, departments, scheduledEvaluations, chatThreads, tasks, attendanceRecords, scheduledBreaks, sickLeaves, employeeNotes, workSchedules, activityLog]);
    
    const organizationDepartmentNames = useMemo(() => organizationData.departments.map(d => d.name), [organizationData.departments]);

    const unreadThreads = useMemo(() => {
        if (!currentUser) return new Set<string>();
        const unread = new Set<string>();
        organizationData.chatThreads.forEach(thread => {
            if (!thread.participantIds.includes(currentUser.id)) return;
            const lastSeenStatus = chatReadStatuses.find(s => s.threadId === thread.id && s.userId === currentUser.id);
            const lastSeenTimestamp = lastSeenStatus ? new Date(lastSeenStatus.lastSeenTimestamp).getTime() : 0;
            const hasNewMessages = chatMessages.some(m => m.chatId === thread.id && new Date(m.timestamp).getTime() > lastSeenTimestamp && m.senderId !== currentUser.id);
            if (hasNewMessages) {
                unread.add(thread.id);
            }
        });
        return unread;
    }, [currentUser, organizationData.chatThreads, chatMessages, chatReadStatuses]);

    const organizationChatMessages = useMemo(() => {
        if (!currentUser) return [];
        const threadIds = new Set(organizationData.chatThreads.map(t => t.id));
        return chatMessages.filter(m => threadIds.has(m.chatId));
    }, [currentUser, organizationData.chatThreads, chatMessages]);


    // --- AUTH & NAVIGATION HANDLERS ---
    const handleLogin = (user: User) => {
        setCurrentUser(user);
        logActivity('USER_LOGIN', `El usuario ${user.name} inició sesión.`, undefined, user);
        if (employees.filter(e => e.organizationId === user.organizationId).length === 0) {
            setCurrentView('employees');
        } else {
            setCurrentView('main');
        }
    };

    const handleLogout = () => {
        if(currentUser) logActivity('USER_LOGOUT', `El usuario ${currentUser.name} cerró sesión.`, undefined, currentUser);
        setCurrentUser(null);
        setAuthView('login');
        setCurrentView('main');
    };

     const handleRegister = (orgName: string, userName: string, userEmail: string, userPassword: string): boolean => {
        if (organizations.some(o => o.name.toLowerCase() === orgName.toLowerCase())) return false;
        if (users.some(u => u.email.toLowerCase() === userEmail.toLowerCase())) return false;

        const newOrg = { id: `org-${Date.now()}`, name: orgName };
        setOrganizations(prev => [...prev, newOrg]);

        const newUser: User = {
            id: `user-${Date.now()}`,
            name: userName,
            email: userEmail,
            password: userPassword,
            role: 'Admin',
            organizationId: newOrg.id,
            enabledTools: ALL_TOOLS,
        };
        setUsers(prev => [...prev, newUser]);
        
        const defaultDepts: Department[] = [
            { id: `dept-${Date.now()}-1`, name: 'General', organizationId: newOrg.id },
            { id: `dept-${Date.now()}-2`, name: 'Recursos Humanos', organizationId: newOrg.id },
        ];
        setDepartments(prev => [...prev, ...defaultDepts]);
        
        const baseTemplates = initialData.criteriaTemplates.filter(t => t.organizationId === 'org-1');
        const newOrgTemplates = baseTemplates.map((t, index) => ({
            ...t,
            id: `template-${newOrg.id}-${index}`,
            organizationId: newOrg.id,
        }));
        setCriteriaTemplates(prev => [...prev, ...newOrgTemplates]);

        handleLogin(newUser);
        logActivity('ORG_REGISTER', `Se registró la organización '${orgName}' con el usuario admin '${userName}'.`, newOrg.id, newUser);
        return true;
    };

    const handleNavigate = (view: string) => {
        setEvaluationToView(null);
        setPersonIdsToCompare(null);
        setPersonToEvaluate(null);
        setEmployeeFileToView(null);
        setInitialSubMenu(null); // Limpiar el submenú al navegar
        setCurrentView(view);
    };
    
    const handleBack = () => {
        const parentSubMenu = subViewParentMap[currentView];
        if (parentSubMenu) {
            setInitialSubMenu(parentSubMenu);
            setCurrentView('main');
        } else {
            handleNavigate('main');
        }
    };
    
    // --- HANDLERS FOR COMPONENTS THAT STILL USE PROPS ---

    const handleSelectTemplate = (templateId: string) => {
        const template = organizationData.criteriaTemplates.find(t => t.id === templateId);
        if (template) {
            setCriteriaInEdit(template.criteria);
        }
    };
    const handleSaveNewTemplate = (name: string, criteria: Factor[]) => {
        const newTemplate: CriteriaTemplate = {
            id: `template-${Date.now()}`,
            name,
            criteria,
            organizationId: currentUser!.organizationId,
        };
        setCriteriaTemplates(prev => [...prev, newTemplate]);
        logActivity('CREATE_CRITERIA_TEMPLATE', `Se creó la plantilla de criterios: ${name}`, newTemplate.id, currentUser);
    };
    const handleDeleteTemplate = (templateId: string) => {
        const template = organizationData.criteriaTemplates.find(t => t.id === templateId);
        if(template) {
            setCriteriaTemplates(prev => prev.filter(t => t.id !== templateId));
            logActivity('DELETE_CRITERIA_TEMPLATE', `Se eliminó la plantilla de criterios: ${template.name}`, templateId, currentUser);
        }
    };
    const handleRenameTemplate = (templateId: string, newName: string) => {
        const template = organizationData.criteriaTemplates.find(t => t.id === templateId);
        if(template) {
            setCriteriaTemplates(prev => prev.map(t => t.id === templateId ? { ...t, name: newName } : t));
            logActivity('RENAME_CRITERIA_TEMPLATE', `Se renombró la plantilla '${template.name}' a '${newName}'`, templateId, currentUser);
        }
    };
    const handleUpdateTemplate = (templateId: string, criteria: Factor[]) => {
        const template = organizationData.criteriaTemplates.find(t => t.id === templateId);
        if(template) {
            setCriteriaTemplates(prev => prev.map(t => t.id === templateId ? { ...t, criteria } : t));
            logActivity('UPDATE_CRITERIA_TEMPLATE', `Se actualizó la plantilla: ${template.name}`, templateId, currentUser);
        }
    };

    const handleSaveEvaluationEvent = (eventData: Omit<ScheduledEvaluation, 'id' | 'creatorId' | 'organizationId'>, id?: string) => {
        if (id) {
            setScheduledEvaluations(prev => prev.map(e => e.id === id ? { ...e, ...eventData } : e));
            logActivity('UPDATE_SCHEDULED_EVALUATION', `Se actualizó el evento del calendario: ${eventData.title}`, id, currentUser);
        } else {
            const newEvent: ScheduledEvaluation = { ...eventData, id: `se-${Date.now()}`, creatorId: currentUser!.id, organizationId: currentUser!.organizationId };
            setScheduledEvaluations(prev => [...prev, newEvent]);
            logActivity('CREATE_SCHEDULED_EVALUATION', `Se creó el evento del calendario: ${newEvent.title}`, newEvent.id, currentUser);
        }
    };
    const handleDeleteEvaluationEvent = (eventId: string) => {
        const event = scheduledEvaluations.find(e => e.id === eventId);
        if(event) {
            setScheduledEvaluations(prev => prev.filter(e => e.id !== eventId));
            logActivity('DELETE_SCHEDULED_EVALUATION', `Se eliminó el evento del calendario: ${event.title}`, eventId, currentUser);
        }
    };

    const handleCreateThread = (threadData: Omit<ChatThread, 'id'>): string => {
        const newThread = { ...threadData, id: `thread-${Date.now()}` };
        setChatThreads(prev => [...prev, newThread]);
        logActivity('CREATE_CHAT_THREAD', `Se creó el chat: ${threadData.name || 'privado'}`, newThread.id, currentUser);
        return newThread.id;
    };
    const handleSendMessage = (chatId: string, text: string) => {
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            chatId, text,
            senderId: currentUser!.id,
            timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, newMessage]);
    };
    const handleEditMessage = (messageId: string, newText: string) => {
        setChatMessages(prev => prev.map(m => m.id === messageId ? { ...m, text: newText } : m));
    };
    const handleDeleteMessage = (messageId: string) => {
        setChatMessages(prev => prev.filter(m => m.id !== messageId));
    };
    const handleEditThread = (threadId: string, newName: string) => {
        setChatThreads(prev => prev.map(t => t.id === threadId ? { ...t, name: newName } : t));
    };
    const handleDeleteThread = (threadId: string) => {
        setChatThreads(prev => prev.filter(t => t.id !== threadId));
        setChatMessages(prev => prev.filter(m => m.chatId !== threadId));
        if (selectedThreadId === threadId) {
            setSelectedThreadId(null);
        }
    };
    const handleMarkAsRead = (threadId: string) => {
        setChatReadStatuses(prev => {
            const existing = prev.find(s => s.threadId === threadId && s.userId === currentUser!.id);
            if (existing) {
                return prev.map(s => s.id === existing.id ? { ...s, lastSeenTimestamp: new Date().toISOString() } : s);
            }
            return [...prev, { id: `read-${Date.now()}`, threadId, userId: currentUser!.id, lastSeenTimestamp: new Date().toISOString() }];
        });
    };
    
    const handleAddOrUpdateAttendance = (data: { employeeId: string; date: string; clockIn: string; clockOut: string | null }) => {
        setAttendanceRecords(prev => {
            const existingIndex = prev.findIndex(r => r.employeeId === data.employeeId && r.date === data.date);
            if (existingIndex > -1) {
                const updated = [...prev];
                const currentRecord = updated[existingIndex];
                updated[existingIndex] = { ...currentRecord, ...data, status: currentRecord.status === 'Ausente' ? 'Presente' : currentRecord.status };
                return updated;
            } else {
                return [...prev, { id: `att-${Date.now()}`, ...data, status: 'Presente', organizationId: currentUser!.organizationId }];
            }
        });
        logActivity('UPDATE_ATTENDANCE', `Se registró/actualizó asistencia para el empleado con ID ${data.employeeId} en la fecha ${data.date}`, data.employeeId, currentUser);
    };
    const handleUpdateAttendanceStatus = (employeeId: string, date: string, status: AttendanceStatus) => {
        setAttendanceRecords(prev => {
            const existingIndex = prev.findIndex(r => r.employeeId === employeeId && r.date === date);
            const clockUpdates = status === 'Presente' ? {} : { clockIn: null, clockOut: null };
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], status, ...clockUpdates };
                return updated;
            } else {
                return [...prev, { id: `att-${Date.now()}`, employeeId, date, status, clockIn: null, clockOut: null, organizationId: currentUser!.organizationId }];
            }
        });
        logActivity('UPDATE_ATTENDANCE_STATUS', `Se cambió estado de asistencia a ${status} para el empleado con ID ${employeeId} en la fecha ${date}`, employeeId, currentUser);
    };

    const handleUpdateAttendanceRecord = (record: AttendanceRecord) => {
        setAttendanceRecords(prev => prev.map(r => r.id === record.id ? record : r));
    };
    const handleAddSickLeave = (leave: Omit<SickLeave, 'id'>) => {
        const newLeave = { ...leave, id: `sick-${Date.now()}`};
        setSickLeaves(prev => [newLeave, ...prev]);
        logActivity('ADD_SICK_LEAVE', `Se añadió reposo para empleado ID ${leave.employeeId}`, leave.employeeId, currentUser);
    };
    const handleAddScheduledBreak = (sBreak: Omit<ScheduledBreak, 'id'>) => {
        const newBreak = { ...sBreak, id: `break-${Date.now()}`};
        setScheduledBreaks(prev => [newBreak, ...prev]);
        logActivity('ADD_SCHEDULED_BREAK', `Se añadió descanso para empleado ID ${sBreak.employeeId}`, sBreak.employeeId, currentUser);
    };
    const handleAddEmployeeNote = (note: Omit<EmployeeNote, 'id'>) => {
        const newNote = { ...note, id: `note-${Date.now()}`};
        setEmployeeNotes(prev => [newNote, ...prev]);
        logActivity('ADD_EMPLOYEE_NOTE', `Se añadió nota para empleado ID ${note.employeeId}`, note.employeeId, currentUser);
    };
    const handleAddOrUpdateWorkSchedule = (schedule: Omit<WorkSchedule, 'id'>) => {
        setWorkSchedules(prev => {
            const existing = prev.find(s => s.employeeId === schedule.employeeId && s.date === schedule.date);
            if(existing) {
                return prev.map(s => s.id === existing.id ? { ...s, ...schedule } : s);
            }
            return [...prev, { ...schedule, id: `ws-${Date.now()}`}];
        });
        logActivity('UPDATE_WORK_SCHEDULE', `Se actualizó horario para empleado ID ${schedule.employeeId} en fecha ${schedule.date}`, schedule.employeeId, currentUser);
    };

    // --- RENDER LOGIC ---
    if (!currentUser) {
        if (authView === 'login') {
            return <Login onLogin={handleLogin} onNavigateToRegister={() => setAuthView('register')} users={users} />;
        }
        return <Register onRegister={handleRegister} onNavigateToLogin={() => setAuthView('login')} users={users} organizations={organizations} />;
    }
    
    if (evaluationToView) {
        const result = organizationData.evaluations.find(e => e.id === evaluationToView);
        if (result) {
            const person = result.personType === 'employee' 
                ? organizationData.employees.find(p => p.id === result.personId) 
                : organizationData.applicants.find(p => p.id === result.personId);
            if (person) {
                return <ResultsDashboard 
                            result={result} 
                            person={person} 
                            allEvaluations={organizationData.evaluations.filter(e => e.personId === person.id && e.personType === result.personType)}
                            onBack={() => setEvaluationToView(null)} 
                        />;
            }
        }
    }
    
    if (personToEvaluate) {
         const person = personToEvaluate.type === 'employee' 
            ? organizationData.employees.find(e => e.id === personToEvaluate.id) 
            : organizationData.applicants.find(a => a.id === personToEvaluate.id);
        if (person) {
            return <EvaluationForm 
                        person={person} 
                        personType={personToEvaluate.type}
                        criteria={organizationData.criteriaTemplates[0]?.criteria || []}
                        templates={organizationData.criteriaTemplates}
                        onCompleteEvaluation={async (...args) => {
                            if (!currentUser) return;
                            const newEvalId = await handleCompleteEvaluation(personToEvaluate, ...args, currentUser);
                            if (newEvalId) {
                                setEvaluationToView(newEvalId);
                                setPersonToEvaluate(null);
                            }
                        }}
                        onCancel={() => setPersonToEvaluate(null)}
                    />;
        }
    }
    
    if (personIdsToCompare) {
        return <ComparisonDashboard 
                    personIds={personIdsToCompare}
                    employees={organizationData.employees}
                    applicants={organizationData.applicants}
                    evaluations={organizationData.evaluations}
                    onBack={() => setPersonIdsToCompare(null)}
                />;
    }

    let viewContent;
    switch (currentView) {
        case 'main': viewContent = <MainPage currentUser={currentUser} onNavigate={handleNavigate} onLogout={handleLogout} initialSubMenu={initialSubMenu} />; break;
        case 'employees': viewContent = <EmployeeManagement currentUser={currentUser} />; break;
        case 'recruitment': viewContent = <RecruitmentDashboard currentUser={currentUser} onEvaluate={(applicantId) => setPersonToEvaluate({id: applicantId, type: 'applicant' })} onViewEvaluationResult={setEvaluationToView} />; break;
        case 'evaluateEmployees': viewContent = <EmployeeList employees={organizationData.employees} departments={organizationDepartmentNames} evaluations={organizationData.evaluations} onSelectEmployee={(employeeId, type) => setPersonToEvaluate({id: employeeId, type})} />; break;
        case 'compare': viewContent = <ProfileComparisonList 
            employees={organizationData.employees} 
            applicants={organizationData.applicants} 
            departments={organizationDepartmentNames} 
            onCompare={setPersonIdsToCompare}
            selectedToCompare={comparisonSelection}
            setSelectedToCompare={setComparisonSelection}
            searchTerm={comparisonSearchTerm}
            setSearchTerm={setComparisonSearchTerm}
            departmentFilter={comparisonDepartmentFilter}
            setDepartmentFilter={setComparisonDepartmentFilter}
            typeFilter={comparisonTypeFilter}
            setTypeFilter={setComparisonTypeFilter}
        />; break;
        case 'criteria': viewContent = <CriteriaSetup criteria={criteriaInEdit} setCriteria={setCriteriaInEdit} templates={organizationData.criteriaTemplates} currentUser={currentUser} onSelectTemplate={handleSelectTemplate} onSaveNewTemplate={handleSaveNewTemplate} onDeleteTemplate={handleDeleteTemplate} onRenameTemplate={handleRenameTemplate} onUpdateTemplate={handleUpdateTemplate} />; break;
        case 'history': viewContent = <EvaluationHistory evaluations={organizationData.evaluations} employees={organizationData.employees} applicants={organizationData.applicants} onViewDetails={setEvaluationToView} />; break;
        case 'dashboard': viewContent = <GlobalDashboard evaluations={organizationData.evaluations} employees={organizationData.employees} scheduledEvals={organizationData.scheduledEvaluations} currentUser={currentUser} users={organizationData.users} />; break;
        case 'promotions': viewContent = <PromotionsDashboard evaluations={organizationData.evaluations} employees={organizationData.employees} departments={organizationDepartmentNames} />; break;
        case 'talentMatrix': viewContent = <TalentMatrix evaluations={organizationData.evaluations} employees={organizationData.employees} departments={organizationDepartmentNames} />; break;
        case 'flightRisk': viewContent = <FlightRiskDashboard employees={organizationData.employees} evaluations={organizationData.evaluations} attendanceRecords={organizationData.attendanceRecords} departments={organizationDepartmentNames} />; break;
        case 'settings': viewContent = <Settings 
            currentUser={currentUser} 
            onChangePassword={(newPassword) => {
                const userToUpdate = users.find(u => u.id === currentUser.id);
                if (!userToUpdate) return false;
                
                const updatedUser: User = { ...userToUpdate, password: newPassword };

                setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
                setCurrentUser(updatedUser);
                logActivity('UPDATE_PASSWORD', 'El usuario cambió su propia contraseña.', undefined, updatedUser);

                return true;
            }} 
        />; break;
        case 'calendar': viewContent = <EvaluationCalendar events={organizationData.scheduledEvaluations} onSaveEvent={handleSaveEvaluationEvent} onDeleteEvent={handleDeleteEvaluationEvent} departments={organizationDepartmentNames} tags={evaluationTags} currentUser={currentUser} users={organizationData.users} />; break;
        case 'chat': viewContent = <Chat currentUser={currentUser} users={organizationData.users} threads={organizationData.chatThreads} messages={organizationChatMessages} onCreateThread={handleCreateThread} onSendMessage={handleSendMessage} onEditMessage={handleEditMessage} onDeleteMessage={handleDeleteMessage} onEditThread={handleEditThread} onDeleteThread={handleDeleteThread} selectedThreadId={selectedThreadId} setSelectedThreadId={setSelectedThreadId} unreadThreads={unreadThreads} onMarkAsRead={handleMarkAsRead} />; break;
        case 'tasks': viewContent = <TasksDashboard currentUser={currentUser} />; break;
        case 'attendance': viewContent = <AttendanceDashboard employees={organizationData.employees} attendanceRecords={organizationData.attendanceRecords} workSchedules={organizationData.workSchedules} scheduledBreaks={organizationData.scheduledBreaks} sickLeaves={organizationData.sickLeaves} departments={organizationDepartmentNames} onViewEmployeeFile={(id) => {setCurrentView('employeeFile'); setEmployeeFileToView(id);}} onAddOrUpdateAttendanceRecord={handleAddOrUpdateAttendance} onUpdateAttendanceStatus={handleUpdateAttendanceStatus} />; break;
        case 'attendanceAnalytics': viewContent = <AttendanceAnalyticsDashboard employees={organizationData.employees} attendanceRecords={organizationData.attendanceRecords} workSchedules={organizationData.workSchedules} departments={organizationDepartmentNames} />; break;
        case 'employeeFile': if(employeeFileToView) { viewContent = <EmployeeFile employeeId={employeeFileToView} employees={organizationData.employees} setEmployees={setEmployees} attendanceRecords={organizationData.attendanceRecords} scheduledBreaks={organizationData.scheduledBreaks} sickLeaves={organizationData.sickLeaves} employeeNotes={organizationData.employeeNotes} workSchedules={organizationData.workSchedules} currentUser={currentUser} users={organizationData.users} departments={organizationDepartmentNames} onUpdateAttendance={handleUpdateAttendanceRecord} onAddSickLeave={handleAddSickLeave} onAddScheduledBreak={handleAddScheduledBreak} onAddEmployeeNote={handleAddEmployeeNote} onAddOrUpdateWorkSchedule={handleAddOrUpdateWorkSchedule} onBack={() => { setCurrentView('attendance'); setEmployeeFileToView(null);}}/> } else { viewContent = <p>No employee selected</p>; } break;
        case 'activityLog': viewContent = <ActivityLogDashboard logs={organizationData.activityLog} users={organizationData.users} />; break;
        default: viewContent = <p>View not found: {currentView}</p>;
    }
    
    const showHeader = !personToEvaluate && !evaluationToView && !personIdsToCompare;

    return (
        <div className="h-screen w-screen bg-brand-bg text-brand-text-primary flex flex-col">
            {showHeader && (
                <header className="bg-brand-card/80 backdrop-blur-sm border-b border-brand-border p-3 flex justify-between items-center text-sm sticky top-0 z-40 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        {currentView !== 'main' ? (
                            <button onClick={handleBack} className="flex items-center gap-2 text-brand-accent-cyan hover:underline font-semibold text-lg">
                                <ArrowLeftIcon className="w-5 h-5"/>
                                <span>Atrás</span>
                            </button>
                        ) : (
                            <h1 className="font-bold text-lg text-brand-text-primary cursor-pointer" onClick={() => handleNavigate('main')}>TalentFlow</h1>
                        )}
                        {organizationData.currentOrganization && (
                             <span className="hidden md:block text-brand-text-secondary font-semibold pl-4 border-l border-brand-border">
                                {organizationData.currentOrganization.name}
                            </span>
                        )}
                    </div>
                     <div className="flex items-center gap-4">
                        <p className="text-brand-text-secondary hidden md:block">Sesión: <strong className="text-brand-text-primary">{currentUser.name}</strong></p>
                        <button onClick={() => handleNavigate('settings')} className="text-brand-text-secondary hover:text-white">Ajustes</button>
                    </div>
                </header>
            )}
            <main className="flex-grow overflow-y-auto min-h-0">
              {viewContent}
            </main>
        </div>
    );
};

export default App;