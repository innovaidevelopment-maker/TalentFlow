import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { EvaluationResult, AttendanceRecord, Task, SickLeave, ScheduledBreak, EmployeeNote } from '../types';
import { 
    DocumentChartBarIcon, ClockIcon, ClipboardDocumentListIcon, 
    CalendarDaysIcon, PencilIcon, ArrowDownTrayIcon, SearchIcon
} from './icons';

interface GlobalHistoryProps {
    onViewEvaluationResult: (evaluationId: string) => void;
    onViewEmployeeFile: (employeeId: string) => void;
}

type EventType = 'Evaluación' | 'Asistencia' | 'Tarea' | 'Reposo Médico' | 'Descanso Programado' | 'Nota';
type HistoryEvent = {
    id: string;
    date: Date;
    employeeId: string;
    employeeName: string;
    type: EventType;
    details: string;
    actionTargetId?: string;
};

const EVENT_TYPES: EventType[] = ['Evaluación', 'Asistencia', 'Tarea', 'Reposo Médico', 'Descanso Programado', 'Nota'];

const eventTypeConfig: Record<EventType, { icon: React.FC<any>, color: string }> = {
    'Evaluación': { icon: DocumentChartBarIcon, color: 'text-brand-accent-purple' },
    'Asistencia': { icon: ClockIcon, color: 'text-brand-accent-green' },
    'Tarea': { icon: ClipboardDocumentListIcon, color: 'text-brand-accent-blue' },
    'Reposo Médico': { icon: CalendarDaysIcon, color: 'text-red-400' },
    'Descanso Programado': { icon: CalendarDaysIcon, color: 'text-yellow-400' },
    'Nota': { icon: PencilIcon, color: 'text-brand-accent-cyan' },
};

export const GlobalHistory: React.FC<GlobalHistoryProps> = ({ onViewEvaluationResult, onViewEmployeeFile }) => {
    const { employees, evaluations, attendanceRecords, tasks, sickLeaves, scheduledBreaks, employeeNotes, users } = useData();

    const [searchTerm, setSearchTerm] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedEventTypes, setSelectedEventTypes] = useState<Set<EventType>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    const allEvents = useMemo(() => {
        const getAuthorName = (id: string) => users.find(u => u.id === id)?.name || 'Desconocido';

        const evalEvents: HistoryEvent[] = evaluations.map(ev => ({
            id: `ev-${ev.id}`, date: new Date(ev.evaluatedAt), employeeId: ev.personId,
            employeeName: employees.find(e => e.id === ev.personId)?.name || 'N/A',
            type: 'Evaluación', details: `Puntuación: ${ev.calculatedScores.overall.toFixed(2)} (${ev.level})`,
            actionTargetId: ev.id,
        }));

        const attendanceEvents: HistoryEvent[] = attendanceRecords.map(rec => ({
            id: `att-${rec.id}`, date: new Date(rec.date + 'T00:00:00'), employeeId: rec.employeeId,
            employeeName: employees.find(e => e.id === rec.employeeId)?.name || 'N/A',
            type: 'Asistencia', details: `Estado: ${rec.status}${rec.clockIn ? ` (Entrada: ${rec.clockIn})` : ''}`,
            actionTargetId: rec.employeeId,
        }));

        const taskEvents: HistoryEvent[] = tasks.flatMap(task => 
            task.assigneeIds.map(assigneeId => ({
                id: `task-${task.id}-${assigneeId}`, date: new Date(task.createdAt), employeeId: assigneeId,
                employeeName: users.find(u => u.id === assigneeId)?.name || 'N/A',
                type: 'Tarea', details: `Tarea: "${task.title}" - Estado: ${task.status}`,
                actionTargetId: task.id,
            }))
        );

        const sickLeaveEvents: HistoryEvent[] = sickLeaves.map(sl => ({
            id: `sl-${sl.id}`, date: new Date(sl.date + 'T00:00:00'), employeeId: sl.employeeId,
            employeeName: employees.find(e => e.id === sl.employeeId)?.name || 'N/A',
            type: 'Reposo Médico', details: `Motivo: ${sl.reason}`,
            actionTargetId: sl.employeeId,
        }));

        const breakEvents: HistoryEvent[] = scheduledBreaks.map(br => ({
            id: `br-${br.id}`, date: new Date(br.startDate + 'T00:00:00'), employeeId: br.employeeId,
            employeeName: employees.find(e => e.id === br.employeeId)?.name || 'N/A',
            type: 'Descanso Programado', details: `${br.type}: ${br.startDate} a ${br.endDate}`,
            actionTargetId: br.employeeId,
        }));

        const noteEvents: HistoryEvent[] = employeeNotes.map(note => ({
            id: `note-${note.id}`, date: new Date(note.timestamp), employeeId: note.employeeId,
            employeeName: employees.find(e => e.id === note.employeeId)?.name || 'N/A',
            type: 'Nota', details: `Nota por ${getAuthorName(note.authorId)}: "${note.text.substring(0, 50)}..."`,
            actionTargetId: note.employeeId,
        }));

        return [...evalEvents, ...attendanceEvents, ...taskEvents, ...sickLeaveEvents, ...breakEvents, ...noteEvents]
            .sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [evaluations, attendanceRecords, tasks, sickLeaves, scheduledBreaks, employeeNotes, employees, users]);

    const filteredEvents = useMemo(() => {
        return allEvents.filter(event => {
            if (!event.employeeName || event.employeeName === 'N/A') return false;
            
            if (searchTerm && !event.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            if (selectedEventTypes.size > 0 && !selectedEventTypes.has(event.type)) return false;
            
            const from = dateFrom ? new Date(dateFrom + 'T00:00:00') : null;
            const to = dateTo ? new Date(dateTo + 'T23:59:59') : null;
            if (from && event.date < from) return false;
            if (to && event.date > to) return false;

            return true;
        });
    }, [allEvents, searchTerm, selectedEventTypes, dateFrom, dateTo]);

    const pageCount = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
    const paginatedEvents = filteredEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleEventTypeToggle = (type: EventType) => {
        setSelectedEventTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            setCurrentPage(1);
            return newSet;
        });
    };

    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,Fecha,Empleado,Tipo,Detalles\n";
        filteredEvents.forEach(event => {
            const row = [
                event.date.toISOString(),
                `"${event.employeeName}"`,
                event.type,
                `"${event.details.replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "historial_global.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            <h2 className="text-3xl font-bold text-brand-text-primary">Historial Global de Empleados</h2>
            
            <div className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4 space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="relative">
                         <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary"/>
                        <input type="text" placeholder="Buscar por nombre de empleado..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 pl-10 bg-brand-bg border border-brand-border rounded-md" />
                    </div>
                    <div className="flex gap-2">
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-secondary" />
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-secondary" />
                    </div>
                    <button onClick={handleExportCSV} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2">
                        <ArrowDownTrayIcon className="w-5 h-5"/> Exportar CSV
                    </button>
                </div>
                <div>
                    <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Filtrar por Tipo de Evento:</label>
                    <div className="flex flex-wrap gap-2">
                        {EVENT_TYPES.map(type => (
                            <button key={type} onClick={() => handleEventTypeToggle(type)} className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${selectedEventTypes.has(type) ? 'bg-brand-accent-cyan/20 text-brand-accent-cyan border-brand-accent-cyan/50' : 'bg-slate-800 text-brand-text-secondary border-slate-700 hover:bg-slate-700'}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Empleado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Tipo de Evento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Detalles</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase">Acciones</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-brand-border">
                            {paginatedEvents.map(event => {
                                const config = eventTypeConfig[event.type];
                                return (
                                <tr key={event.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{event.date.toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{event.employeeName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`flex items-center gap-2 font-semibold ${config.color}`}>
                                            <config.icon className="w-4 h-4" />
                                            {event.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-brand-text-secondary max-w-sm truncate">{event.details}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button 
                                            onClick={() => {
                                                if(event.type === 'Evaluación' && event.actionTargetId) onViewEvaluationResult(event.actionTargetId);
                                                else if (event.actionTargetId) onViewEmployeeFile(event.employeeId);
                                            }}
                                            className="text-brand-accent-cyan hover:underline"
                                        >
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                 </div>
                 {filteredEvents.length === 0 && <p className="text-center py-12 text-brand-text-secondary">No se encontraron eventos con los filtros seleccionados.</p>}
                 {pageCount > 1 && (
                      <div className="flex justify-between items-center p-4 border-t border-brand-border">
                         <span className="text-sm text-brand-text-secondary">Página {currentPage} de {pageCount}</span>
                         <div className="flex gap-2">
                             <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-1.5 text-sm bg-slate-700 rounded-lg disabled:opacity-50">Anterior</button>
                             <button onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount} className="px-4 py-1.5 text-sm bg-slate-700 rounded-lg disabled:opacity-50">Siguiente</button>
                         </div>
                     </div>
                 )}
            </div>
        </div>
    );
};