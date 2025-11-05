import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
    UserGroupIcon,
    DocumentChartBarIcon,
    CalendarDaysIcon,
    ChatBubbleBottomCenterTextIcon,
    ArrowLeftOnRectangleIcon,
    UserPlusIcon,
    ArrowLeftIcon,
    ClockIcon,
    ChartBarIcon,
    ViewGridIcon,
    UsersIcon,
    Squares2X2Icon,
    ArrowTrendingUpIcon,
    ClipboardDocumentListIcon,
    ChartPieIcon
} from './icons';
import type { User } from '../types';

interface MainPageProps {
    currentUser: User;
    onNavigate: (view: string) => void;
    onLogout: () => void;
    initialSubMenu: string | null;
}

// Sub-items for navigation drill-down
const personalSubItems = [
    { view: 'employees', label: 'Empleados', icon: UserGroupIcon, description: 'Gestiona la información del personal.', requiredTools: ['employees'] },
    { view: 'attendance', label: 'Asistencia Diaria', icon: ClockIcon, description: 'Controla y registra la asistencia diaria.', requiredTools: ['attendance'] },
    { view: 'attendanceAnalytics', label: 'Análisis de Asistencia', icon: ChartBarIcon, description: 'Visualiza métricas y tendencias.', requiredTools: ['attendanceAnalytics'] }
];

const evaluacionesSubItems = [
    { view: 'dashboard', label: 'Panel General', icon: ViewGridIcon, description: 'Vista global de las métricas de evaluación.', requiredTools: ['dashboard'] },
    { view: 'evaluateEmployees', label: 'Evaluar Empleados', icon: UsersIcon, description: 'Inicia nuevas evaluaciones de desempeño.', requiredTools: ['evaluateEmployees'] },
    { view: 'compare', label: 'Comparar Perfiles', icon: UserGroupIcon, description: 'Compara lado a lado las evaluaciones de empleados o aspirantes.', requiredTools: ['compare'] },
    { view: 'history', label: 'Historial', icon: Squares2X2Icon, description: 'Consulta todas las evaluaciones pasadas.', requiredTools: ['history'] },
    { view: 'criteria', label: 'Criterios', icon: DocumentChartBarIcon, description: 'Define los factores y características a evaluar.', requiredTools: ['criteria'], adminOnly: true }
];

const strategicAnalysisSubItems = [
    { view: 'promotions', label: 'Promociones', icon: ArrowTrendingUpIcon, description: 'Identifica al personal con mejor rendimiento.', requiredTools: ['promotions'] },
    { view: 'talentMatrix', label: 'Matriz de Talento', icon: Squares2X2Icon, description: 'Visualiza el talento en una matriz 9-Box.', requiredTools: ['talentMatrix'] },
    { view: 'flightRisk', label: 'Riesgo de Fuga', icon: ChartPieIcon, description: 'Predice qué empleados podrían dejar la empresa.', requiredTools: ['flightRisk'] }
];


const mainNavItems = [
    {
        view: 'recruitment',
        label: 'Reclutamiento',
        icon: UserPlusIcon,
        description: 'Gestiona aspirantes desde la postulación hasta la contratación.',
        requiredTools: ['recruitment']
    },
    {
        view: 'personal', // This is now a key for the submenu
        label: 'Gestión de Personal',
        icon: UserGroupIcon,
        description: 'Administra la información, asistencia y horarios de tu equipo.',
        requiredTools: ['employees', 'attendance', 'attendanceAnalytics'],
        isSubMenu: true
    },
    {
        view: 'evaluaciones', // This is now a key for the submenu
        label: 'Evaluaciones',
        icon: DocumentChartBarIcon,
        description: 'Analiza el rendimiento, compara talento y gestiona el crecimiento.',
        requiredTools: ['dashboard', 'evaluateEmployees', 'criteria', 'history', 'compare'],
        isSubMenu: true
    },
    {
        view: 'strategicAnalysis', // New submenu key
        label: 'Análisis Estratégico',
        icon: ChartPieIcon,
        description: 'Utiliza datos para la toma de decisiones estratégicas de talento.',
        requiredTools: ['promotions', 'talentMatrix', 'flightRisk'],
        isSubMenu: true
    },
    {
        view: 'calendar',
        label: 'Calendario',
        icon: CalendarDaysIcon,
        description: 'Planifica y visualiza los eventos y evaluaciones programadas.',
        requiredTools: ['calendar']
    },
    {
        view: 'chat',
        label: 'Chat Interno',
        icon: ChatBubbleBottomCenterTextIcon,
        description: 'Comunícate con tu equipo de forma directa y segura.',
        requiredTools: ['chat']
    },
    {
        view: 'tasks',
        label: 'Gestión de Tareas',
        icon: ClipboardDocumentListIcon,
        description: 'Organiza, asigna y da seguimiento a las tareas del equipo.',
        requiredTools: ['tasks']
    },
    {
        view: 'activityLog',
        label: 'Registro de Actividad',
        icon: ClipboardDocumentListIcon,
        description: 'Audita todas las acciones realizadas en la aplicación.',
        requiredTools: ['activityLog'],
        adminOnly: true,
    },
];

const NavCard: React.FC<{ 
    item: { view: string; label: string; icon: React.FC<any>; description: string; adminOnly?: boolean; notificationCount?: number; };
    onClick: () => void;
    currentUser: any;
}> = ({ item, onClick, currentUser }) => {
    if (item.adminOnly && currentUser.role !== 'Admin') {
        return null;
    }
    
    return (
        <button
            onClick={onClick}
            className="relative bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-5 text-left hover:border-brand-accent-cyan hover:shadow-lg hover:shadow-brand-accent-cyan/10 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col"
        >
            {item.notificationCount > 0 && (
                <div className="absolute top-4 right-4 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-brand-card">
                    {item.notificationCount}
                </div>
            )}
            <item.icon className="w-10 h-10 mb-4 text-brand-accent-cyan" />
            <h3 className="text-xl font-bold text-brand-text-primary mb-2">{item.label}</h3>
            <p className="text-sm text-brand-text-secondary flex-grow">{item.description}</p>
        </button>
    );
};


export const MainPage: React.FC<MainPageProps> = ({ currentUser, onNavigate, onLogout, initialSubMenu }) => {
    const { chatThreads, chatMessages, chatReadStatuses } = useData();
    
    const unreadChatCount = useMemo(() => {
        if (!currentUser) return 0;
        let count = 0;
        chatThreads.forEach(thread => {
            if (!thread.participantIds.includes(currentUser.id)) return;
            const lastSeenStatus = chatReadStatuses.find(s => s.threadId === thread.id && s.userId === currentUser.id);
            const lastSeenTimestamp = lastSeenStatus ? new Date(lastSeenStatus.lastSeenTimestamp).getTime() : 0;
            const hasNewMessages = chatMessages.some(m => m.chatId === thread.id && new Date(m.timestamp).getTime() > lastSeenTimestamp && m.senderId !== currentUser.id);
            if (hasNewMessages) {
                count++;
            }
        });
        return count;
    }, [currentUser, chatThreads, chatMessages, chatReadStatuses]);


    const [activeSubMenu, setActiveSubMenu] = useState<'personal' | 'evaluaciones' | 'strategicAnalysis' | null>(initialSubMenu as any);

    const availableTools = useMemo(() => new Set(currentUser.enabledTools || []), [currentUser.enabledTools]);
    
    const mainNavItemsWithNotifications = useMemo(() => mainNavItems.map(item => {
        if (item.view === 'chat') {
            return { ...item, notificationCount: unreadChatCount };
        }
        return item;
    }), [unreadChatCount]);

    const getFilteredItems = (items: any[]) => {
        return items.filter(item => {
            if (item.adminOnly && currentUser.role !== 'Admin') {
                return false;
            }
            if (!item.requiredTools) return true;
            return item.requiredTools.some((tool: string) => availableTools.has(tool));
        });
    };

    const handleCardClick = (item: typeof mainNavItems[0]) => {
        if (item.isSubMenu) {
            setActiveSubMenu(item.view as 'personal' | 'evaluaciones' | 'strategicAnalysis');
        } else {
            onNavigate(item.view);
        }
    };
    
    const renderContent = () => {
        if (activeSubMenu) {
            let subMenuItems;
            let title;
            switch(activeSubMenu) {
                case 'personal':
                    subMenuItems = personalSubItems;
                    title = 'Gestión de Personal';
                    break;
                case 'evaluaciones':
                    subMenuItems = evaluacionesSubItems;
                    title = 'Evaluaciones';
                    break;
                case 'strategicAnalysis':
                    subMenuItems = strategicAnalysisSubItems;
                    title = 'Análisis Estratégico';
                    break;
                default:
                    subMenuItems = [];
                    title = '';
            }
            
            return (
                <>
                    <header className="text-center mb-8 relative">
                        <button onClick={() => setActiveSubMenu(null)} className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-brand-accent-cyan hover:underline font-semibold">
                            <ArrowLeftIcon className="w-5 h-5"/>
                            Volver
                        </button>
                        <h2 className="text-4xl font-bold">{title}</h2>
                        <p className="text-lg text-brand-text-secondary mt-2">Selecciona una herramienta para continuar.</p>
                    </header>
                    <main>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {getFilteredItems(subMenuItems).map(item => (
                                <NavCard 
                                    key={item.view} 
                                    item={item} 
                                    onClick={() => onNavigate(item.view)}
                                    currentUser={currentUser}
                                />
                            ))}
                        </div>
                    </main>
                </>
            );
        }

        return (
            <>
                <header className="text-center mb-8">
                    <h2 className="text-4xl font-bold">Bienvenido, {currentUser.name}</h2>
                    <p className="text-lg text-brand-text-secondary mt-2">Selecciona una opción para comenzar a gestionar tu equipo.</p>
                </header>
                <main>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getFilteredItems(mainNavItemsWithNotifications).map(item => (
                            <NavCard 
                                key={item.view} 
                                item={item}
                                onClick={() => handleCardClick(item)}
                                currentUser={currentUser}
                            />
                        ))}
                    </div>
                </main>
            </>
        );
    };

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text-primary flex flex-col items-center justify-center p-4 md:p-6 relative">
            <div className="absolute top-6 right-6">
                 <button
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-brand-border text-brand-text-secondary rounded-lg hover:bg-slate-800 hover:text-brand-text-primary transition-colors"
                >
                    <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                    <span>Cerrar Sesión</span>
                </button>
            </div>

            <div className="w-full max-w-5xl mx-auto">
                {renderContent()}
                <footer className="w-full text-center mt-8">
                    <p className="text-md text-brand-text-secondary">
                        Transforma tus datos en decisiones concretas
                    </p>
                </footer>
            </div>
        </div>
    );
};