import React, { useState, useMemo } from 'react';
import type { Applicant, ApplicantStatus, CriteriaTemplate, EvaluationResult, User } from '../types';
import { useData } from '../context/DataContext';
import { ApplicantFormModal } from './ApplicantFormModal';
import { PlusIcon, PencilIcon, LinkedInIcon, SearchIcon } from './icons';

interface RecruitmentDashboardProps {
    currentUser: User;
    onEvaluate: (applicantId: string) => void;
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
    onStartEvaluation: (applicantId: string, type: 'applicant') => void;
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
                        <button onClick={() => onStartEvaluation(applicant.id, 'applicant')} className="w-full text-left p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                            Iniciar Evaluación General
                        </button>
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
    const [statusFilter, setStatusFilter] = useState('Todos los Estados');
    const [departmentFilter, setDepartmentFilter] = useState('Todos los Departamentos');
    const [dateFilter, setDateFilter] = useState('Cualquier fecha');

    const [draggedOverColumn, setDraggedOverColumn] = useState<ApplicantStatus | null>(null);
    const [selectedApplicantForPanel, setSelectedApplicantForPanel] = useState<Applicant | null>(null);

    const statuses: ApplicantStatus[] = ['Nuevo', 'En Proceso', 'Oferta', 'Contratado', 'Rechazado'];
    
    const statusStyles: Record<ApplicantStatus, { pill: string; name: string }> = {
        'Nuevo': { pill: 'bg-blue-200 text-blue-800', name: 'NUEVO' },
        'En Proceso': { pill: 'bg-cyan-200 text-cyan-800', name: 'EN PROCESO' },
        'Oferta': { pill: 'bg-yellow-200 text-yellow-800', name: 'OFERTA' },
        'Contratado': { pill: 'bg-green-200 text-green-800', name: 'CONTRATADO' },
        'Rechazado': { pill: 'bg-red-200 text-red-800', name: 'RECHAZADO' },
    };

    const filteredApplicants = useMemo(() => {
        return applicants.filter(applicant => {
            const term = searchTerm.toLowerCase();
            const matchesSearch = term === '' || 
                applicant.name.toLowerCase().includes(term) ||
                applicant.positionApplied.toLowerCase().includes(term);

            const matchesStatus = statusFilter === 'Todos los Estados' || applicant.status === statusFilter;
            const matchesDept = departmentFilter === 'Todos los Departamentos' || applicant.department === departmentFilter;

            let matchesDate = true;
            if (dateFilter !== 'Cualquier fecha') {
                const applicantDate = new Date(applicant.applicationDate + 'T00:00:00');
                const today = new Date();
                const diffTime = Math.abs(today.getTime() - applicantDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (dateFilter === 'Últimos 7 días' && diffDays > 7) matchesDate = false;
                if (dateFilter === 'Últimos 30 días' && diffDays > 30) matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesDept && matchesDate;
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
    
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, applicantId: string) => {
        e.dataTransfer.setData('applicantId', applicantId);
        e.currentTarget.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.style.opacity = '1';
        setDraggedOverColumn(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: ApplicantStatus) => {
        if (status !== 'Nuevo') {
            e.preventDefault();
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, status: ApplicantStatus) => {
        e.preventDefault();
        setDraggedOverColumn(null);
        if (status === 'Nuevo') {
            return;
        }
        const applicantId = e.dataTransfer.getData('applicantId');
        const applicant = applicants.find(a => a.id === applicantId);
        if (applicantId && applicant && applicant.status !== 'Nuevo') {
            handleChangeStatus(applicantId, status);
        }
    };
    
    const handleDragEnter = (status: ApplicantStatus) => {
        if (status !== 'Nuevo') {
            setDraggedOverColumn(status);
        }
    };

    const departmentNames = useMemo(() => departments.map(d => d.name), [departments]);

    return (
        <div className="p-4 md:p-6 space-y-6 flex flex-col">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-brand-text-primary">Panel de Reclutamiento</h1>
                <p className="text-brand-text-secondary">Gestiona el flujo de aspirantes desde la postulación hasta la contratación.</p>
            </div>

             <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex-shrink-0 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-2">
                        <label className="text-xs text-brand-text-secondary mb-1 block">Buscar Aspirante</label>
                        <div className="relative">
                            <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary"/>
                            <input type="text" placeholder="Nombre, puesto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 bg-brand-bg border border-brand-border rounded-md"/>
                        </div>
                    </div>
                     <div className="lg:col-span-2">
                        <label className="text-xs text-brand-text-secondary mb-1 block">Buscar en LinkedIn</label>
                         <div className="relative">
                            <LinkedInIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary"/>
                            <input type="text" placeholder="Ej: React Developer en CDMX" value={linkedInSearchTerm} onChange={e => setLinkedInSearchTerm(e.target.value)} className="w-full p-2 pl-10 bg-brand-bg border border-brand-border rounded-md"/>
                        </div>
                    </div>
                    <div className="lg:col-span-1">
                        <button onClick={handleLinkedInSearch} className="w-full px-4 py-2 bg-brand-accent-blue text-white font-semibold rounded-lg shadow-md">Buscar</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="text-xs text-brand-text-secondary mb-1 block">Estado</label>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                            <option>Todos los Estados</option>
                            {statuses.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-brand-text-secondary mb-1 block">Departamento</label>
                        <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                            <option>Todos los Departamentos</option>
                            {departmentNames.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-brand-text-secondary mb-1 block">Fecha de Postulación</label>
                        <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                            <option>Cualquier fecha</option>
                            <option>Últimos 7 días</option>
                            <option>Últimos 30 días</option>
                        </select>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleOpenAddModal} className="px-4 py-2 bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-semibold rounded-lg shadow-md flex items-center gap-2 hover:shadow-lg hover:shadow-brand-accent-purple/20 transition-all">
                            <PlusIcon className="w-5 h-5" /> Añadir Aspirante
                        </button>
                    </div>
                </div>
            </div>

            <div className="border border-brand-border/50 rounded-xl">
                <div className="grid grid-cols-5 divide-x divide-brand-border/50">
                    {statuses.map(status => {
                        const style = statusStyles[status];
                        const applicantsInStatus = filteredApplicants.filter(a => a.status === status);
                        return (
                            <div key={status} className={`flex flex-col transition-colors duration-300 ${draggedOverColumn === status ? 'bg-white/5' : ''}`} onDragOver={(e) => handleDragOver(e, status)} onDrop={(e) => handleDrop(e, status)} onDragEnter={() => handleDragEnter(status)} onDragLeave={() => setDraggedOverColumn(null)}>
                                <div className="p-4 flex items-center gap-2 flex-shrink-0">
                                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${style.pill}`}>{style.name}</span>
                                    <span className="text-sm font-semibold text-brand-text-secondary">{applicantsInStatus.length}</span>
                                </div>
                                <div className="px-4 pb-4 space-y-3">
                                {applicantsInStatus.map(applicant => {
                                    const isDraggable = applicant.status !== 'Nuevo';
                                    return (
                                        <div 
                                            key={applicant.id} 
                                            className={`bg-brand-card border border-brand-border rounded-lg p-3 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`} 
                                            draggable={isDraggable} 
                                            onDragStart={isDraggable ? (e) => handleDragStart(e, applicant.id) : undefined} 
                                            onDragEnd={isDraggable ? handleDragEnd : undefined}
                                        >
                                            <div className="flex justify-between items-start"><p className="font-bold text-brand-text-primary pr-2">{applicant.name}</p><button onClick={() => handleOpenEditModal(applicant)} className="text-brand-text-secondary hover:text-brand-accent-cyan p-1"><PencilIcon className="w-4 h-4" /></button></div>
                                            <p className="text-sm text-brand-text-secondary truncate mt-1">{applicant.positionApplied}</p>
                                            {applicant.department && <p className="text-xs font-semibold text-brand-accent-purple mt-1">{applicant.department}</p>}
                                            <p className="text-xs text-brand-text-secondary/70 mt-1">{new Date(applicant.applicationDate + 'T00:00:00').toLocaleDateString()}</p>
                                            <div className="mt-3 border-t border-brand-border/50 pt-2">
                                                <button onClick={() => onEvaluate(applicant.id)} className="w-full text-xs py-1.5 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-semibold rounded">
                                                    {applicant.status === 'Nuevo' ? 'Evaluar' : 'Re-evaluar'}
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <ApplicantFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSave} applicantToEdit={applicantToEdit} departments={departmentNames} />
            {applicantToHire && <HireModal applicant={applicantToHire} departments={departmentNames} onClose={() => setApplicantToHire(null)} onConfirm={handleConfirmHire} />}
            {selectedApplicantForPanel && <EvaluationPanelModal applicant={selectedApplicantForPanel} evaluations={evaluations} templates={criteriaTemplates} onClose={() => setSelectedApplicantForPanel(null)} onStartEvaluation={onEvaluate} onViewResult={onViewEvaluationResult} />}
        </div>
    );
};