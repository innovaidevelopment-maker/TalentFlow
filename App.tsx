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
import { GlobalHistory } from './components/GlobalHistory';


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
    'recruitment', 'employees', 'attendance', 'attendanceAnalytics', 'globalHistory',
    'dashboard', 'evaluateEmployees', 'criteria', 'history', 'promotions', 'talentMatrix', 'flightRisk',
    'calendar', 'chat', 'tasks', 'compare', 'activityLog'
];

// Mapa para la navegación hacia atrás. Asocia una vista hija con su submenú padre.
const subViewParentMap: { [key: string]: string } = {
    'employees': 'personal',
    'attendance': 'personal',
    'attendanceAnalytics': 'personal',
    'globalHistory': 'personal',
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
        
        setCriteriaInEdit,
        currentUser, setCurrentUser,
        
        logActivity, handleCompleteEvaluation, handleRegister: handleRegisterInContext,
        addCriteriaTemplate, updateCriteriaTemplate, deleteCriteriaTemplate,
        addScheduledEvaluation, updateScheduledEvaluation, deleteScheduledEvaluation,
        addChatThread, addChatMessage, updateChatMessage, deleteChatMessage, updateChatThread, deleteChatThread, markThreadAsRead,
        addOrUpdateAttendanceRecord, updateAttendanceStatus, updateAttendanceRecord,
        addSickLeave, addScheduledBreak, addEmployeeNote, addOrUpdateWorkSchedule,
        updateUser,
    } = useData();
    
    // --- VIEW STATE (The only state App.tsx now manages besides authView) ---
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

    const handleLogout = async () => {
        if(currentUser) await logActivity('USER_LOGOUT', `El usuario ${currentUser.name} cerró sesión.`, undefined, currentUser);
        setCurrentUser(null);
        setAuthView('login');
        setCurrentView('main');
    };

     const handleRegister = async (orgName: string, userName: string, userEmail: string, userPassword: string): Promise<boolean> => {
        if (organizations.some(o => o.name.toLowerCase() === orgName.toLowerCase())) return false;
        if (users.some(u => u.email.toLowerCase() === userEmail.toLowerCase())) return false;

        const newUser = await handleRegisterInContext(orgName, userName, userEmail, userPassword, ALL_TOOLS);
        if(newUser) {
            handleLogin(newUser);
            return true;
        }
        return false;
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
    const handleSaveNewTemplate = async (name: string, criteria: Factor[]) => {
        if(!currentUser) return;
        const newTemplate = await addCriteriaTemplate({ name, criteria, organizationId: currentUser.organizationId });
        await logActivity('CREATE_CRITERIA_TEMPLATE', `Se creó la plantilla de criterios: ${name}`, newTemplate.id, currentUser);
    };
    const handleDeleteTemplate = async (templateId: string) => {
        const template = organizationData.criteriaTemplates.find(t => t.id === templateId);
        if(template && currentUser) {
            await deleteCriteriaTemplate(templateId);
            await logActivity('DELETE_CRITERIA_TEMPLATE', `Se eliminó la plantilla de criterios: ${template.name}`, templateId, currentUser);
        }
    };
    const handleRenameTemplate = async (templateId: string, newName: string) => {
        const template = organizationData.criteriaTemplates.find(t => t.id === templateId);
        if(template && currentUser) {
            await updateCriteriaTemplate(templateId, { name: newName });
            await logActivity('RENAME_CRITERIA_TEMPLATE', `Se renombró la plantilla '${template.name}' a '${newName}'`, templateId, currentUser);
        }
    };
    const handleUpdateTemplate = async (templateId: string, criteria: Factor[]) => {
        const template = organizationData.criteriaTemplates.find(t => t.id === templateId);
        if(template && currentUser) {
            await updateCriteriaTemplate(templateId, { criteria });
            await logActivity('UPDATE_CRITERIA_TEMPLATE', `Se actualizó la plantilla: ${template.name}`, templateId, currentUser);
        }
    };

    const handleSaveEvaluationEvent = async (eventData: Omit<ScheduledEvaluation, 'id' | 'creatorId' | 'organizationId'>, id?: string) => {
        if(!currentUser) return;
        if (id) {
            await updateScheduledEvaluation(id, eventData);
            await logActivity('UPDATE_SCHEDULED_EVALUATION', `Se actualizó el evento del calendario: ${eventData.title}`, id, currentUser);
        } else {
            const newEvent = { ...eventData, creatorId: currentUser.id, organizationId: currentUser.organizationId };
            const addedEvent = await addScheduledEvaluation(newEvent);
            if(addedEvent) {
                await logActivity('CREATE_SCHEDULED_EVALUATION', `Se creó el evento del calendario: ${addedEvent.title}`, addedEvent.id, currentUser);
            }
        }
    };
    const handleDeleteEvaluationEvent = async (eventId: string) => {
        const event = scheduledEvaluations.find(e => e.id === eventId);
        if(event && currentUser) {
            await deleteScheduledEvaluation(eventId);
            await logActivity('DELETE_SCHEDULED_EVALUATION', `Se eliminó el evento del calendario: ${event.title}`, eventId, currentUser);
        }
    };

    const handleCreateThread = async (threadData: Omit<ChatThread, 'id'>): Promise<string> => {
        const newThread = await addChatThread(threadData);
        if(newThread && currentUser) {
            await logActivity('CREATE_CHAT_THREAD', `Se creó el chat: ${threadData.name || 'privado'}`, newThread.id, currentUser);
            return newThread.id;
        }
        return '';
    };

    const handleSendMessage = async (chatId: string, text: string) => {
        if(!currentUser) return;
        await addChatMessage({ chatId, text, senderId: currentUser.id, timestamp: new Date().toISOString() });
    };

    const handleEditMessage = async (messageId: string, newText: string) => {
        await updateChatMessage(messageId, { text: newText });
    };

    const handleDeleteMessage = async (messageId: string) => {
        await deleteChatMessage(messageId);
    };

    const handleEditThread = async (threadId: string, newName: string) => {
        await updateChatThread(threadId, { name: newName });
    };

    const handleDeleteThread = async (threadId: string) => {
        await deleteChatThread(threadId);
        if (selectedThreadId === threadId) {
            setSelectedThreadId(null);
        }
    };
    
    const handleMarkAsRead = async (threadId: string) => {
        if(!currentUser) return;
        await markThreadAsRead(threadId, currentUser.id);
    };
    
    const handleAddOrUpdateAttendance = async (data: { employeeId: string; date: string; clockIn: string; clockOut: string | null }) => {
        if(!currentUser) return;
        await addOrUpdateAttendanceRecord(data, currentUser.organizationId);
        await logActivity('UPDATE_ATTENDANCE', `Se registró/actualizó asistencia para el empleado con ID ${data.employeeId} en la fecha ${data.date}`, data.employeeId, currentUser);
    };
    const handleUpdateAttendanceStatus = async (employeeId: string, date: string, status: AttendanceStatus) => {
        if(!currentUser) return;
        await updateAttendanceStatus(employeeId, date, status, currentUser.organizationId);
        await logActivity('UPDATE_ATTENDANCE_STATUS', `Se cambió estado de asistencia a ${status} para el empleado con ID ${employeeId} en la fecha ${date}`, employeeId, currentUser);
    };

    const handleUpdateAttendanceRecord = async (record: AttendanceRecord) => {
        await updateAttendanceRecord(record.id, record);
    };

    const handleAddSickLeave = async (leave: Omit<SickLeave, 'id'>) => {
        const addedLeave = await addSickLeave(leave);
        if(addedLeave) await logActivity('ADD_SICK_LEAVE', `Se añadió reposo para empleado ID ${leave.employeeId}`, leave.employeeId, currentUser);
    };
    const handleAddScheduledBreak = async (sBreak: Omit<ScheduledBreak, 'id'>) => {
        const addedBreak = await addScheduledBreak(sBreak);
        if(addedBreak) await logActivity('ADD_SCHEDULED_BREAK', `Se añadió descanso para empleado ID ${sBreak.employeeId}`, sBreak.employeeId, currentUser);
    };
    const handleAddEmployeeNote = async (note: Omit<EmployeeNote, 'id'>) => {
        const addedNote = await addEmployeeNote(note);
        if(addedNote) await logActivity('ADD_EMPLOYEE_NOTE', `Se añadió nota para empleado ID ${note.employeeId}`, note.employeeId, currentUser);
    };
    const handleAddOrUpdateWorkSchedule = async (schedule: Omit<WorkSchedule, 'id'>) => {
        if(!currentUser) return;
        await addOrUpdateWorkSchedule(schedule, currentUser.organizationId);
        await logActivity('UPDATE_WORK_SCHEDULE', `Se actualizó horario para empleado ID ${schedule.employeeId} en fecha ${schedule.date}`, schedule.employeeId, currentUser);
    };

    // --- RENDER LOGIC ---
    if (!currentUser) {
        if (authView === 'login') {
            return <Login onLogin={handleLogin} onNavigateToRegister={() => setAuthView('register')} users={users} />;
        }
        // Fix: Pass correct prop type for onRegister
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
        case 'history': viewContent = <EvaluationHistory evaluations={organizationData.evaluations} employees={organizationData.employees} applicants={organizationData.applicants} onViewDetails={setEvaluationToView} departments={organizationDepartmentNames} />; break;
        case 'globalHistory': viewContent = <GlobalHistory onViewEvaluationResult={setEvaluationToView} onViewEmployeeFile={(id) => {setCurrentView('employeeFile'); setEmployeeFileToView(id);}} />; break;
        case 'dashboard': viewContent = <GlobalDashboard evaluations={organizationData.evaluations} employees={organizationData.employees} scheduledEvals={organizationData.scheduledEvaluations} currentUser={currentUser} users={organizationData.users} />; break;
        case 'promotions': viewContent = <PromotionsDashboard evaluations={organizationData.evaluations} employees={organizationData.employees} departments={organizationDepartmentNames} />; break;
        case 'talentMatrix': viewContent = <TalentMatrix evaluations={organizationData.evaluations} employees={organizationData.employees} departments={organizationDepartmentNames} />; break;
        case 'flightRisk': viewContent = <FlightRiskDashboard employees={organizationData.employees} evaluations={organizationData.evaluations} attendanceRecords={organizationData.attendanceRecords} departments={organizationDepartmentNames} />; break;
        case 'settings': viewContent = <Settings 
            currentUser={currentUser} 
            onChangePassword={async (newPassword) => {
                const updatedUser = { ...currentUser, password: newPassword };
                await updateUser(currentUser.id, { password: newPassword });
                setCurrentUser(updatedUser);
                await logActivity('UPDATE_PASSWORD', 'El usuario cambió su propia contraseña.', undefined, updatedUser);
                return true;
            }} 
        />; break;
        case 'calendar': viewContent = <EvaluationCalendar events={organizationData.scheduledEvaluations} onSaveEvent={handleSaveEvaluationEvent} onDeleteEvent={handleDeleteEvaluationEvent} departments={organizationDepartmentNames} tags={evaluationTags} currentUser={currentUser} users={organizationData.users} />; break;
        // Fix: Pass correct prop type for onCreateThread
        case 'chat': viewContent = <Chat currentUser={currentUser} users={organizationData.users} threads={organizationData.chatThreads} messages={organizationChatMessages} onCreateThread={handleCreateThread} onSendMessage={handleSendMessage} onEditMessage={handleEditMessage} onDeleteMessage={handleDeleteMessage} onEditThread={handleEditThread} onDeleteThread={handleDeleteThread} selectedThreadId={selectedThreadId} setSelectedThreadId={setSelectedThreadId} unreadThreads={unreadThreads} onMarkAsRead={handleMarkAsRead} />; break;
        case 'tasks': viewContent = <TasksDashboard currentUser={currentUser} />; break;
        case 'attendance': viewContent = <AttendanceDashboard employees={organizationData.employees} attendanceRecords={organizationData.attendanceRecords} workSchedules={organizationData.workSchedules} scheduledBreaks={organizationData.scheduledBreaks} sickLeaves={organizationData.sickLeaves} departments={organizationDepartmentNames} onViewEmployeeFile={(id) => {setCurrentView('employeeFile'); setEmployeeFileToView(id);}} onAddOrUpdateAttendanceRecord={handleAddOrUpdateAttendance} onUpdateAttendanceStatus={handleUpdateAttendanceStatus} />; break;
        case 'attendanceAnalytics': viewContent = <AttendanceAnalyticsDashboard employees={organizationData.employees} attendanceRecords={organizationData.attendanceRecords} workSchedules={organizationData.workSchedules} departments={organizationDepartmentNames} />; break;
        case 'employeeFile': if(employeeFileToView) { viewContent = <EmployeeFile employeeId={employeeFileToView} onBack={() => { setCurrentView('attendance'); setEmployeeFileToView(null);}}/> } else { viewContent = <p>No employee selected</p>; } break;
        case 'activityLog': viewContent = <ActivityLogDashboard logs={organizationData.activityLog} users={organizationData.users} />; break;
        default: viewContent = <p>View not found: {currentView}</p>;
    }
    
    const showHeader = !personToEvaluate && !evaluationToView && !personIdsToCompare;

    return (
        <div className="h-screen w-screen bg-brand-bg text-brand-text-primary flex flex-col">
            {showHeader && (
                <header className="bg-brand-card/80 backdrop-blur-sm border-b border-brand-border p-3 flex justify-between items-center text-sm sticky top-0 z-40 flex-shrink-0">
                    <div className="flex-1">
                        {currentView !== 'main' ? (
                            <button onClick={handleBack} className="flex items-center gap-2 text-brand-accent-cyan hover:underline font-semibold text-lg">
                                <ArrowLeftIcon className="w-5 h-5"/>
                                <span>Atrás</span>
                            </button>
                        ) : <div/>}
                    </div>
                    <div className="flex-1 text-center">
                        {currentView !== 'main' && organizationData.currentOrganization ? (
                            <span className="font-bold text-lg text-brand-text-primary">
                                {organizationData.currentOrganization.name}
                            </span>
                        ) : (
                            <h1 className="font-bold text-lg text-brand-text-primary cursor-pointer" onClick={() => handleNavigate('main')}>TalentFlow</h1>
                        )}
                    </div>
                     <div className="flex-1 flex justify-end items-center gap-4">
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