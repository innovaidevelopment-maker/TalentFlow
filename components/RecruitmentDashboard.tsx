import React, { useState, useMemo } from 'react';
import type { Applicant, ApplicantStatus, CriteriaTemplate, EvaluationResult, User } from '../types';
import { useData } from '../context/DataContext';
import { ApplicantFormModal } from './ApplicantFormModal';
import { PlusIcon, PencilIcon, LinkedInIcon } from './icons';

interface RecruitmentDashboardProps {
    currentUser: User;
    onEvaluate: (applicantId: string, type: 'applicant', templateId: string) => void;
    onViewEvaluationResult: (evaluationId: string) => void;
}

const HireModal: React.FC<{
    applicant: Applicant;
    departments: string[];
    onClose: () => void;
    onConfirm: (hireDetails: { department: string, role: string, employeeCode: string }) => void;
}> = ({ applicant, departments, onClose, onConfirm }) => {
    const [department, setDepartment] = useState(applicant.department || departments[0] || '');
    const [role, setRole] = useState(applicant.positionApplied);
    const [employeeCode, setEmployeeCode] = useState('');

    const handleConfirm = () => {
        if (department && role && employeeCode) {
            onConfirm({ department, role, employeeCode });
        }
    };
    
    return (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md m-4">
                <h3 className="text-xl font-bold mb-2">Contratar a {applicant.name}</h3>
                <p className="text-brand-text-secondary mb-4">Confirma los detalles para convertir a este aspirante en empleado.</p>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm">Puesto Final</label>
                        <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" />
                    </div>
                     <div>
                        <label className="text-sm">Departamento</label>
                        <select value={department} onChange={e => setDepartment(e.target.value)} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded">
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm">Código de Empleado</label>
                        <input type="text" value={employeeCode} onChange={e => setEmployeeCode(e.target.value)} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required />
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                    <button onClick={handleConfirm} disabled={!department || !role || !employeeCode} className="px-4 py-2 bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-semibold rounded-lg disabled:opacity-50">Confirmar Contratación</button>
                </div>
            </div>
        </div>
    );
};

const EvaluationPanelModal: React.FC<{
    applicant: Applicant;
    evaluations: EvaluationResult[];
    templates: CriteriaTemplate[];
    onClose: () => void;
    onStartEvaluation: (templateId: string) => void;
    onViewResult: (evaluationId: string) => void;
}> = ({ applicant, evaluations, templates, onClose, onStartEvaluation, onViewResult }) => {
    
    const applicantEvaluations = useMemo(() => {
        return evaluations
            .filter(ev => ev.personId === applicant.id)
            .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
    }, [evaluations, applicant.id]);

    const getTemplateName = (criteria: any[]) => {
        const criteriaJSON = JSON.stringify(criteria.map(({ id, name, characteristics }) => ({ id, name, characteristics })));
        const template = templates.find(t => JSON.stringify(t.criteria.map(({ id, name, characteristics }) => ({ id, name, characteristics }))) === criteriaJSON);
        return template?.name || 'Criterios Personalizados';
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-2xl m-4 max-h-[80vh] flex flex-col">
                <h3 className="text-xl font-bold mb-2">Panel de Evaluación: {applicant.name}</h3>
                <p className="text-brand-text-secondary mb-4">Consulta el historial o inicia una nueva evaluación para este aspirante.</p>
                
                <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                    {/* Historial de Evaluaciones */}
                    <div>
                        <h4 className="text-lg font-semibold text-brand-accent-cyan mb-3">Evaluaciones Realizadas</h4>
                        {applicantEvaluations.length > 0 ? (
                            <div className="space-y-2">
                                {applicantEvaluations.map(ev => (
                                    <div key={ev.id} className="bg-brand-bg/50 p-3 rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{getTemplateName(ev.criteria)}</p>
                                            <p className="text-xs text-brand-text-secondary">{new Date(ev.evaluatedAt).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-lg">{ev.calculatedScores.overall.toFixed(2)}</p>
                                            <button onClick={() => onViewResult(ev.id)} className="text-xs text-brand-accent-blue hover:underline">Ver Detalles</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-center text-brand-text-secondary py-4">Este aspirante aún no ha sido evaluado.</p>
                        )}
                    </div>

                    {/* Iniciar Nueva Evaluación */}
                    <div>
                        <h4 className="text-lg font-semibold text-brand-accent-cyan mb-3">Iniciar Nueva Evaluación</h4>
                        {templates.length > 0 ? (
                             <ul className="space-y-2">
                                {templates.map(template => (
                                    <li key={template.id}>
                                        <button onClick={() => onStartEvaluation(template.id)} className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                                            {template.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-center text-brand-text-secondary py-4">No hay plantillas de evaluación creadas.</p>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-6 mt-auto">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cerrar</button>
                </div>
            </div>
        </div>
    );
};


export const RecruitmentDashboard: React.FC<RecruitmentDashboardProps> = ({ currentUser, onEvaluate, onViewEvaluationResult }) => {
    const { applicants, handleSaveApplicant, handleUpdateApplicantStatus, handleHireApplicant, departments, criteriaTemplates, evaluations } = useData();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [applicantToEdit, setApplicantToEdit] = useState<Applicant | null>(null);
    const [applicantToHire, setApplicantToHire] = useState<Applicant | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [linkedInSearchTerm, setLinkedInSearchTerm] = useState('');
    const [draggedOverColumn, setDraggedOverColumn] = useState<ApplicantStatus | null>(null);
    const [selectedApplicantForPanel, setSelectedApplicantForPanel] = useState<Applicant | null>(null);

    // Advanced filters state
    const [statusFilter, setStatusFilter] = useState<ApplicantStatus | 'all'>('all');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');

    const statuses: ApplicantStatus[] = ['Nuevo', 'En Proceso', 'Oferta', 'Contratado', 'Rechazado'];
    
    const dateFilterOptions = [
        { value: 'all', label: 'Cualquier fecha' },
        { value: 'today', label: 'Hoy' },
        { value: '7days', label: 'Últimos 7 días' },
        { value: '30days', label: 'Últimos 30 días' },
        { value: 'this_month', label: 'Este mes' },
    ];

    const filteredApplicants = useMemo(() => {
        return applicants.filter(applicant => {
            // Text search
            const term = searchTerm.toLowerCase();
            const matchesSearch = (
                applicant.name.toLowerCase().includes(term) ||
                applicant.positionApplied.toLowerCase().includes(term) ||
                (applicant.department && applicant.department.toLowerCase().includes(term))
            );

            // Status filter
            const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter;

            // Department filter
            const matchesDepartment = departmentFilter === 'all' || applicant.department === departmentFilter;

            // Date filter
            const matchesDate = (() => {
                if (dateFilter === 'all') return true;
                
                const applicantDateUTC = new Date(applicant.applicationDate);
                const applicantDate = new Date(applicantDateUTC.getUTCFullYear(), applicantDateUTC.getUTCMonth(), applicantDateUTC.getUTCDate());

                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                let startDate = new Date(today);

                switch (dateFilter) {
                    case 'today':
                        return applicantDate.getTime() === today.getTime();
                    case '7days':
                        startDate.setDate(today.getDate() - 6);
                        return applicantDate >= startDate;
                    case '30days':
                        startDate.setDate(today.getDate() - 29);
                        return applicantDate >= startDate;
                    case 'this_month':
                        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                        return applicantDate >= startDate;
                    default:
                        return true;
                }
            })();

            return matchesSearch && matchesStatus && matchesDepartment && matchesDate;
        });
    }, [applicants, searchTerm, statusFilter, departmentFilter, dateFilter]);


    const handleOpenAddModal = () => {
        setApplicantToEdit(null);
        setIsModalOpen(true);
    };
    
    const handleOpenEditModal = (applicant: Applicant) => {
        setApplicantToEdit(applicant);
        setIsModalOpen(true);
    };

    const handleSave = (applicantData: Applicant) => {
        handleSaveApplicant(applicantData, !!applicantToEdit, currentUser);
        setIsModalOpen(false);
    };
    
    const handleChangeStatus = (applicantId: string, newStatus: ApplicantStatus) => {
        if (newStatus === 'Contratado') {
            const applicant = applicants.find(a => a.id === applicantId);
            if (applicant) setApplicantToHire(applicant);
        } else {
            handleUpdateApplicantStatus(applicantId, newStatus, currentUser);
        }
    };
    
    const handleConfirmHire = (hireDetails: { department: string, role: string, employeeCode: string }) => {
        if(applicantToHire) {
            handleHireApplicant(applicantToHire.id, hireDetails, currentUser);
            setApplicantToHire(null);
        }
    };

    const handleLinkedInSearch = () => {
        if (linkedInSearchTerm.trim()) {
            const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(linkedInSearchTerm.trim())}`;
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };
    
    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, applicantId: string) => {
        e.dataTransfer.setData('applicantId', applicantId);
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        setDraggedOverColumn(null);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: ApplicantStatus) => {
        e.preventDefault();
        const applicantId = e.dataTransfer.getData('applicantId');
        if (applicantId) {
            handleChangeStatus(applicantId, status);
        }
        setDraggedOverColumn(null);
    };
    
    const handleDragEnter = (status: ApplicantStatus) => {
        setDraggedOverColumn(status);
    };

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-brand-text-primary">Panel de Reclutamiento</h2>
                    <p className="text-brand-text-secondary">Gestiona el flujo de aspirantes desde la postulación hasta la contratación.</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Search Applicant */}
                        <div className="lg:col-span-1">
                            <label htmlFor="search-applicant" className="block text-xs font-medium text-brand-text-secondary mb-1">Buscar Aspirante</label>
                            <div className="relative">
                                <input id="search-applicant" type="text" placeholder="Nombre, puesto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-3 pl-10 border border-brand-border bg-brand-bg rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent-blue transition-all" />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-brand-text-secondary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                </div>
                            </div>
                        </div>
                        
                        {/* LinkedIn Search */}
                        <div className="lg:col-span-2">
                            <label htmlFor="search-linkedin" className="block text-xs font-medium text-brand-text-secondary mb-1">Buscar en LinkedIn</label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <input id="search-linkedin" type="text" placeholder="Ej: React Developer en CDMX" value={linkedInSearchTerm} onChange={(e) => setLinkedInSearchTerm(e.target.value)} className="w-full p-3 pl-10 border border-brand-border bg-brand-bg rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent-blue transition-all" />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LinkedInIcon className="w-5 h-5 text-brand-text-secondary" />
                                    </div>
                                </div>
                                <button type="button" onClick={handleLinkedInSearch} className="px-4 py-2 bg-[#0A66C2] text-white font-semibold rounded-lg shadow-md hover:bg-[#004182] transition-colors flex-shrink-0 self-end">
                                    Buscar
                                </button>
                            </div>
                        </div>
                        
                        {/* Filters */}
                        <div>
                            <label htmlFor="filter-status" className="block text-xs font-medium text-brand-text-secondary mb-1">Estado</label>
                            <select id="filter-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ApplicantStatus | 'all')} className="w-full p-3 border border-brand-border bg-brand-bg/50 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent-blue transition-all">
                                <option value="all">Todos los Estados</option>
                                {statuses.map(s => <option key={s} value={s} className="bg-brand-bg">{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filter-department" className="block text-xs font-medium text-brand-text-secondary mb-1">Departamento</label>
                            <select id="filter-department" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="w-full p-3 border border-brand-border bg-brand-bg/50 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent-blue transition-all">
                                <option value="all">Todos los Departamentos</option>
                                {departments.map(d => <option key={d.id} value={d.name} className="bg-brand-bg">{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="filter-date" className="block text-xs font-medium text-brand-text-secondary mb-1">Fecha de Postulación</label>
                            <select id="filter-date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full p-3 border border-brand-border bg-brand-bg/50 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent-blue transition-all">
                                {dateFilterOptions.map(opt => <option key={opt.value} value={opt.value} className="bg-brand-bg">{opt.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center justify-end">
                    <button onClick={handleOpenAddModal} className="px-4 py-3 bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2 w-full md:w-auto flex-shrink-0">
                        <PlusIcon className="w-5 h-5" /> Añadir Aspirante
                    </button>
                </div>
            </div>

            <div className="flex space-x-6 overflow-x-auto pb-4">
                {statuses.map(status => (
                    <div 
                        key={status} 
                        className={`bg-brand-card/50 border border-brand-border/50 rounded-xl flex flex-col w-72 flex-shrink-0 h-[75vh] transition-colors duration-300 ${draggedOverColumn === status ? 'bg-brand-accent-blue/20' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status)}
                        onDragEnter={() => handleDragEnter(status)}
                        onDragLeave={() => setDraggedOverColumn(null)}
                    >
                        <h3 className="font-bold text-lg text-brand-text-primary p-4 border-b border-brand-border flex-shrink-0">
                            {status}
                            <span className="text-sm font-normal text-brand-text-secondary ml-2">
                                ({filteredApplicants.filter(a => a.status === status).length})
                            </span>
                        </h3>
                        <div className="overflow-y-auto p-4">
                          <div className="space-y-4">
                           {filteredApplicants.filter(a => a.status === status).map(applicant => (
                                   <div 
                                       key={applicant.id} 
                                       className="bg-brand-card border border-brand-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all"
                                       draggable="true"
                                       onDragStart={(e) => handleDragStart(e, applicant.id)}
                                       onDragEnd={handleDragEnd}
                                    >
                                       <div className="flex justify-between items-start">
                                            <p className="font-bold text-brand-text-primary pr-2">{applicant.name}</p>
                                          <button onClick={() => handleOpenEditModal(applicant)} className="text-brand-text-secondary hover:text-brand-accent-cyan p-1"><PencilIcon className="w-4 h-4" /></button>
                                       </div>
                                       <p className="text-sm text-brand-text-secondary truncate mt-1">{applicant.positionApplied}</p>
                                       {applicant.department && (
                                           <p className="text-xs font-semibold text-brand-accent-purple mt-1">{applicant.department}</p>
                                       )}
                                       <p className="text-xs text-brand-text-secondary/70 mt-1">{new Date(applicant.applicationDate + 'T00:00:00').toLocaleDateString()}</p>
                                       <div className="mt-3 border-t border-brand-border/50 pt-2">
                                          <button onClick={() => setSelectedApplicantForPanel(applicant)} className="w-full text-xs py-1.5 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-semibold rounded">
                                            Evaluar
                                          </button>
                                       </div>
                                   </div>
                               ))}
                          </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <ApplicantFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                applicantToEdit={applicantToEdit}
                departments={departments.map(d => d.name)}
            />

            {applicantToHire && (
                <HireModal
                    applicant={applicantToHire}
                    departments={departments.map(d => d.name)}
                    onClose={() => setApplicantToHire(null)}
                    onConfirm={handleConfirmHire}
                />
            )}
            
            {selectedApplicantForPanel && (
                <EvaluationPanelModal 
                    applicant={selectedApplicantForPanel}
                    evaluations={evaluations}
                    templates={criteriaTemplates}
                    onClose={() => setSelectedApplicantForPanel(null)}
                    onStartEvaluation={(templateId) => {
                        onEvaluate(selectedApplicantForPanel.id, 'applicant', templateId);
                        setSelectedApplicantForPanel(null);
                    }}
                    onViewResult={(evaluationId) => {
                        onViewEvaluationResult(evaluationId);
                        setSelectedApplicantForPanel(null);
                    }}
                />
            )}

        </div>
    );
};