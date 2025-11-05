import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, AttendanceRecord, WorkSchedule, AttendanceStatus, ScheduledBreak, SickLeave } from '../types';
import { ClockIcon, BarcodeIcon, ViewColumnsIcon, ListBulletIcon, PencilIcon } from './icons';

interface AttendanceDashboardProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  workSchedules: WorkSchedule[];
  scheduledBreaks: ScheduledBreak[];
  sickLeaves: SickLeave[];
  departments: string[];
  onViewEmployeeFile: (employeeId: string) => void;
  onAddOrUpdateAttendanceRecord: (data: { employeeId: string; date: string; clockIn: string; clockOut: string | null }) => void;
  onUpdateAttendanceStatus: (employeeId: string, date: string, status: AttendanceStatus) => void;
}

type DailyStatus = AttendanceStatus;

const getStatusForEmployee = (
    employeeId: string,
    date: string,
    records: AttendanceRecord[],
    schedules: WorkSchedule[],
    breaks: ScheduledBreak[],
    sickLeaves: SickLeave[]
): { status: DailyStatus; record?: AttendanceRecord } => {
    // 1. Check for existing attendance record
    const record = records.find(r => r.employeeId === employeeId && r.date === date);
    if (record) {
      if (record.clockIn) {
        const schedule = schedules.find(s => s.employeeId === employeeId && s.date === date);
        if (schedule && record.clockIn > schedule.startTime) {
            return { status: 'Atrasado', record };
        }
        return { status: 'Presente', record };
      }
      // A record exists but without clock-in, means it's a manually set status.
      return { status: record.status, record };
    }

    // 2. No record, so check for non-working reasons
    const isOnSickLeave = sickLeaves.some(sl => sl.employeeId === employeeId && sl.date === date);
    if (isOnSickLeave) {
        return { status: 'Reposo' };
    }
    
    const currentDate = new Date(date + 'T00:00:00');
    const isOnBreak = breaks.some(b => {
        const startDate = new Date(b.startDate + 'T00:00:00');
        const endDate = new Date(b.endDate + 'T00:00:00');
        return b.employeeId === employeeId && currentDate >= startDate && currentDate <= endDate;
    });
    if (isOnBreak) {
        return { status: 'Descanso Programado' };
    }

    // 3. Check if they were even supposed to work
    const schedule = schedules.find(s => s.employeeId === employeeId && s.date === date);
    if (!schedule) {
        return { status: 'Fuera de Horario' };
    }

    // 4. If they were scheduled but no record and no valid reason, they are absent
    return { status: 'Ausente' };
};


const ManualAttendanceModal: React.FC<{
    employee: Employee;
    record: AttendanceRecord | undefined;
    selectedDate: string;
    onClose: () => void;
    onSave: (data: { employeeId: string; date: string; clockIn: string; clockOut: string | null }) => void;
}> = ({ employee, record, selectedDate, onClose, onSave }) => {
    const [clockIn, setClockIn] = useState(record?.clockIn || '');
    const [clockOut, setClockOut] = useState(record?.clockOut || '');

    const handleSave = () => {
        if (clockIn) {
            onSave({
                employeeId: employee.id,
                date: selectedDate,
                clockIn,
                clockOut: clockOut || null,
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-sm m-4">
                <h3 className="text-xl font-bold mb-2">Registrar Asistencia Manual</h3>
                <p className="text-brand-text-secondary mb-1">Empleado: <span className="font-semibold text-brand-text-primary">{employee.name}</span></p>
                <p className="text-brand-text-secondary mb-4">Fecha: <span className="font-semibold text-brand-text-primary">{new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</span></p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Hora de Entrada</label>
                        <input type="time" value={clockIn} onChange={e => setClockIn(e.target.value)} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Hora de Salida (opcional)</label>
                        <input type="time" value={clockOut} onChange={e => setClockOut(e.target.value)} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" />
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                    <button onClick={handleSave} disabled={!clockIn} className="px-4 py-2 bg-gradient-to-r from-brand-accent-cyan to-brand-accent-blue text-white font-semibold rounded-lg disabled:opacity-50">Guardar</button>
                </div>
            </div>
        </div>
    );
};

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ employees, attendanceRecords, workSchedules, scheduledBreaks, sickLeaves, departments, onViewEmployeeFile, onAddOrUpdateAttendanceRecord, onUpdateAttendanceStatus }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployeeForEntry, setSelectedEmployeeForEntry] = useState<Employee | null>(null);

  const filteredEmployees = useMemo(() => {
    if (departmentFilter === 'all') return employees;
    return employees.filter(c => c.department === departmentFilter);
  }, [employees, departmentFilter]);
  
  const dailyAttendanceData = useMemo(() => {
    return filteredEmployees.map(employee => {
        const { status, record } = getStatusForEmployee(employee.id, selectedDate, attendanceRecords, workSchedules, scheduledBreaks, sickLeaves);
        return { ...employee, status, record };
    });
  }, [filteredEmployees, selectedDate, attendanceRecords, workSchedules, scheduledBreaks, sickLeaves]);

  const summaryStats = useMemo(() => {
      const stats: Record<DailyStatus, number> = { 'Presente': 0, 'Ausente': 0, 'Reposo': 0, 'Descanso Programado': 0, 'Fuera de Horario': 0, 'Atrasado': 0 };
      dailyAttendanceData.forEach(item => { stats[item.status]++; });
      return stats;
  }, [dailyAttendanceData]);

  const kanbanColumns: { title: DailyStatus; data: typeof dailyAttendanceData }[] = [
    { title: 'Presente', data: dailyAttendanceData.filter(e => e.status === 'Presente') },
    { title: 'Atrasado', data: dailyAttendanceData.filter(e => e.status === 'Atrasado') },
    { title: 'Ausente', data: dailyAttendanceData.filter(e => e.status === 'Ausente') },
    { title: 'Fuera de Horario', data: dailyAttendanceData.filter(e => e.status === 'Fuera de Horario' || e.status === 'Reposo' || e.status === 'Descanso Programado') },
  ];

  const getStatusColor = (status: DailyStatus) => {
    switch (status) {
      case 'Presente': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Atrasado': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Ausente': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-slate-700 text-slate-300 border-slate-500/30';
    }
  };
  
  const handleOpenManualEntry = (employee: Employee) => {
    setSelectedEmployeeForEntry(employee);
    setIsModalOpen(true);
  };
  
  const ViewSwitcher = () => (
    <div className="flex items-center gap-1 p-1 bg-brand-bg rounded-lg border border-brand-border">
      <button onClick={() => setView('list')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${view === 'list' ? 'bg-brand-accent-blue/20 text-brand-accent-cyan' : 'text-brand-text-secondary hover:bg-slate-700'}`}>
        <ListBulletIcon className="w-5 h-5" /> Lista
      </button>
      <button onClick={() => setView('kanban')} className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${view === 'kanban' ? 'bg-brand-accent-blue/20 text-brand-accent-cyan' : 'text-brand-text-secondary hover:bg-slate-700'}`}>
        <ViewColumnsIcon className="w-5 h-5" /> Kanban
      </button>
    </div>
  );

  const statusOptions: AttendanceStatus[] = ['Presente', 'Atrasado', 'Ausente', 'Reposo', 'Descanso Programado', 'Fuera de Horario'];
  
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {isModalOpen && selectedEmployeeForEntry && (
          <ManualAttendanceModal
              employee={selectedEmployeeForEntry}
              record={dailyAttendanceData.find(d => d.id === selectedEmployeeForEntry.id)?.record}
              selectedDate={selectedDate}
              onClose={() => setIsModalOpen(false)}
              onSave={onAddOrUpdateAttendanceRecord}
          />
      )}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-brand-text-primary">Panel de Asistencia</h2>
            <p className="text-brand-text-secondary">Vista diaria del estado de asistencia del personal.</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
             <ViewSwitcher />
             <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm text-sm text-brand-text-secondary" />
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm text-sm min-w-[200px]">
                <option value="all">Todos los Departamentos</option>
                {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
            </select>
             <button className="px-4 py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-indigo/50 transition-all flex items-center gap-2">
                <BarcodeIcon className="w-5 h-5" /> Registrar por Lector
            </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h4 className="text-sm font-semibold text-brand-text-secondary">Presentes</h4><p className="text-3xl font-bold mt-1 text-green-400">{summaryStats.Presente}</p></div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h4 className="text-sm font-semibold text-brand-text-secondary">Atrasados</h4><p className="text-3xl font-bold mt-1 text-yellow-400">{summaryStats.Atrasado}</p></div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h4 className="text-sm font-semibold text-brand-text-secondary">Ausentes</h4><p className="text-3xl font-bold mt-1 text-red-400">{summaryStats.Ausente}</p></div>
           <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h4 className="text-sm font-semibold text-brand-text-secondary">Total</h4><p className="text-3xl font-bold mt-1 text-brand-text-primary">{filteredEmployees.length}</p></div>
      </div>
      
      {view === 'list' && (
        <div className="bg-brand-card border border-brand-border rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Detalle de Empleados</h3>
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-brand-border">
                  <thead className="bg-white/5">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Empleado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Departamento</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase">Estado</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase">Hora de Entrada</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase">Hora de Salida</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase">Acciones</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                      {dailyAttendanceData.map(item => (
                          <tr key={item.id} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-4 whitespace-nowrap">
                                  <button onClick={() => onViewEmployeeFile(item.id)} className="text-left hover:text-brand-accent-cyan">
                                    <div className="text-sm font-medium text-brand-text-primary">{item.name}</div>
                                    <div className="text-xs text-brand-text-secondary">{item.role}</div>
                                  </button>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{item.department}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-center text-sm">
                                <select 
                                  value={item.status} 
                                  onChange={(e) => onUpdateAttendanceStatus(item.id, selectedDate, e.target.value as AttendanceStatus)}
                                  className={`border text-xs leading-5 font-semibold rounded-full appearance-none text-center py-1 px-2 focus:outline-none focus:ring-2 focus:ring-brand-accent-cyan ${getStatusColor(item.status)} bg-transparent`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {statusOptions.map(opt => <option key={opt} value={opt} className="bg-brand-bg text-brand-text-primary">{opt}</option>)}
                                </select>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-brand-text-secondary">{item.record?.clockIn || '--:--'}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-brand-text-secondary">{item.record?.clockOut || '--:--'}</td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm space-x-2">
                                   <button onClick={() => handleOpenManualEntry(item)} className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-700 text-brand-text-primary hover:bg-slate-600 transition-colors inline-flex items-center gap-1"><PencilIcon className="w-3 h-3"/> {item.record?.clockIn ? 'Editar' : 'Registrar'}</button>
                                   <button onClick={() => onViewEmployeeFile(item.id)} className="text-brand-accent-cyan hover:underline font-semibold text-xs">Ver Ficha</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {dailyAttendanceData.length === 0 && <p className="text-center text-brand-text-secondary py-8">No hay empleados en el departamento seleccionado.</p>}
          </div>
        </div>
      )}

      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {kanbanColumns.map(column => (
                <div key={column.title} className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4">
                    <h4 className="font-bold text-lg text-brand-text-primary mb-4 pb-2 border-b border-brand-border flex items-center gap-2">
                        <span className={`h-3 w-3 rounded-full ${getStatusColor(column.title).split(' ')[0]}`}></span>
                        {column.title}
                        <span className="text-sm font-normal text-brand-text-secondary ml-auto">{column.data.length}</span>
                    </h4>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        {column.data.map(item => (
                            <div key={item.id} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-4 transition-all duration-300">
                                <button onClick={() => onViewEmployeeFile(item.id)} className="text-left w-full hover:text-brand-accent-cyan">
                                    <p className="font-bold text-md text-brand-text-primary">{item.name}</p>
                                    <p className="text-sm text-brand-text-secondary">{item.role}</p>
                                </button>
                                <div className="mt-2">
                                  <select 
                                    value={item.status} 
                                    onChange={(e) => onUpdateAttendanceStatus(item.id, selectedDate, e.target.value as AttendanceStatus)}
                                    className={`w-full border text-xs leading-5 font-semibold rounded-full appearance-none text-center py-1 px-2 focus:outline-none focus:ring-2 focus:ring-brand-accent-cyan ${getStatusColor(item.status)} bg-transparent`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {statusOptions.map(opt => <option key={opt} value={opt} className="bg-brand-bg text-brand-text-primary">{opt}</option>)}
                                  </select>
                                </div>
                                <div className="mt-3 border-t border-brand-border/50 pt-2 flex justify-end gap-2">
                                     <button onClick={() => handleOpenManualEntry(item)} className="px-3 py-1 text-xs font-semibold rounded-md bg-slate-700 text-brand-text-primary hover:bg-slate-600 transition-colors inline-flex items-center gap-1"><PencilIcon className="w-3 h-3"/> {item.record?.clockIn ? 'Editar' : 'Registrar'}</button>
                                     <button onClick={() => onViewEmployeeFile(item.id)} className="text-brand-accent-cyan hover:underline font-semibold text-xs">Ver Ficha</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};