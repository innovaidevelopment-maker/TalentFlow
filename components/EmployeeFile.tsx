import React, { useState, useMemo, useEffect } from 'react';
import type { Employee, AttendanceRecord, ScheduledBreak, SickLeave, EmployeeNote, User, WorkSchedule, ShiftTemplate } from '../types';
import { useData } from '../context/DataContext';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from './icons';
import { EmployeeFormModal } from './EmployeeFormModal';

interface EmployeeFileProps {
  employeeId: string;
  onBack: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const RecurringScheduleSetter: React.FC<{
    employee: Employee;
    onSave: (updates: Partial<Employee>) => void;
}> = ({ employee, onSave }) => {
    const { shiftTemplates } = useData();
    const [selectedTemplateId, setSelectedTemplateId] = useState(employee.recurringSchedule?.templateId || '');
    const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set(employee.recurringSchedule?.days || []));

    const weekDays = [ { name: 'L', value: 1 }, { name: 'M', value: 2 }, { name: 'M', value: 3 }, { name: 'J', value: 4 }, { name: 'V', value: 5 }, { name: 'S', value: 6 }, { name: 'D', value: 7 }];

    const handleDayToggle = (day: number) => {
        setSelectedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(day)) newSet.delete(day);
            else newSet.add(day);
            return newSet;
        });
    };

    const handleSave = () => {
        if (selectedTemplateId && selectedDays.size > 0) {
            onSave({ recurringSchedule: { templateId: selectedTemplateId, days: Array.from(selectedDays) } });
        }
    };
    
    const handleClear = () => {
        onSave({ recurringSchedule: undefined });
        setSelectedTemplateId('');
        setSelectedDays(new Set());
    };

    return (
        <div className="space-y-3">
             <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md text-sm">
                <option value="">Seleccionar plantilla base...</option>
                {shiftTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <div className="flex justify-center gap-2">
                {weekDays.map(day => (
                    <button 
                        key={day.value} 
                        onClick={() => handleDayToggle(day.value)}
                        className={`w-8 h-8 text-sm rounded-full font-bold transition-colors ${selectedDays.has(day.value) ? 'bg-slate-600 text-white' : 'bg-slate-800 text-brand-text-secondary hover:bg-slate-700'}`}
                    >
                        {day.name}
                    </button>
                ))}
            </div>
            <div className="flex gap-2">
                <button onClick={handleSave} disabled={!selectedTemplateId} className="flex-grow px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg disabled:opacity-50 text-sm transition-shadow shadow-md hover:shadow-lg">Guardar Patrón</button>
                <button onClick={handleClear} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg text-sm transition-colors">Limpiar</button>
            </div>
        </div>
    );
};


const SchedulePlanner: React.FC<{
    employee: Employee;
    schedules: WorkSchedule[];
    onSaveSchedule: (schedule: Omit<WorkSchedule, 'id'>) => void;
    onDeleteSchedule: (employeeId: string, date: string) => void;
    onUpdateEmployee: (updates: Partial<Employee>) => void;
}> = ({ employee, schedules, onSaveSchedule, onDeleteSchedule, onUpdateEmployee }) => {
    const { shiftTemplates, addShiftTemplate, updateShiftTemplate, deleteShiftTemplate, currentUser } = useData();
    const [monthOffset, setMonthOffset] = useState(0);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateToEdit, setTemplateToEdit] = useState<ShiftTemplate | null>(null);

     const { calendarDays, currentMonthName, currentYear } = useMemo(() => {
        const calendarDays: { date: Date, isCurrentMonth: boolean }[] = [];
        const date = new Date();
        date.setDate(1); // Avoid month-end issues
        date.setMonth(date.getMonth() + monthOffset);

        const month = date.getMonth();
        const year = date.getFullYear();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const prevMonthLastDate = new Date(year, month, 0);
        const daysInPrevMonth = prevMonthLastDate.getDate();
        for (let i = startDayIndex; i > 0; i--) {
            const day = new Date(prevMonthLastDate);
            day.setDate(daysInPrevMonth - i + 1);
            calendarDays.push({ date: day, isCurrentMonth: false });
        }

        for (let i = 1; i <= daysInMonth; i++) {
            calendarDays.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        const nextMonthFirstDate = new Date(year, month + 1, 1);
        while (calendarDays.length < 42) {
             calendarDays.push({ date: new Date(nextMonthFirstDate), isCurrentMonth: false });
             nextMonthFirstDate.setDate(nextMonthFirstDate.getDate() + 1);
        }
        
        const currentMonthName = new Date(year, month).toLocaleString('es-ES', { month: 'long' });
        
        return { calendarDays, currentMonthName: currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1), currentYear: year };
    }, [monthOffset]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, day: Date) => {
        e.preventDefault();
        const templateId = e.dataTransfer.getData('templateId');
        const template = shiftTemplates.find(t => t.id === templateId);
        if (template) {
            onSaveSchedule({
                employeeId: employee.id,
                date: day.toISOString().split('T')[0],
                startTime: template.startTime,
                endTime: template.endTime,
                organizationId: currentUser!.organizationId
            });
        }
        e.currentTarget.classList.remove('bg-brand-accent-blue/20');
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, template: ShiftTemplate) => {
        e.dataTransfer.setData('templateId', template.id);
    };

    const handleSaveTemplate = (templateData: Omit<ShiftTemplate, 'id' | 'organizationId'>) => {
        if (templateToEdit) {
            updateShiftTemplate(templateToEdit.id, templateData);
        } else {
            addShiftTemplate({ ...templateData, organizationId: currentUser!.organizationId });
        }
    };
    
    return (
        <div>
            {isTemplateModalOpen && (
                <ShiftTemplateModal 
                    isOpen={isTemplateModalOpen}
                    onClose={() => { setIsTemplateModalOpen(false); setTemplateToEdit(null); }}
                    onSave={handleSaveTemplate}
                    templateToEdit={templateToEdit}
                />
            )}
             <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-brand-text-primary">Planificación de Turnos</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setMonthOffset(m => m - 1)} className="p-1.5 rounded-full hover:bg-slate-700 transition-colors"><ChevronLeftIcon className="w-5 h-5" /></button>
                        <span className="text-lg font-semibold w-40 text-center">{currentMonthName} de {currentYear}</span>
                        <button onClick={() => setMonthOffset(m => m + 1)} className="p-1.5 rounded-full hover:bg-slate-700 transition-colors"><ChevronRightIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                
                <div className="p-4 border border-brand-border/50 rounded-lg mb-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 items-start">
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-2">Plantillas de Turno</h4>
                            <div className="flex flex-wrap items-start gap-3">
                                {shiftTemplates.map(template => (
                                    <div key={template.id} draggable onDragStart={(e) => handleDragStart(e, template)} className={`w-40 p-3 rounded-lg cursor-grab ${template.color}`}>
                                        <p className="font-bold">{template.name}</p>
                                        <p className="text-sm">{template.startTime} - {template.endTime}</p>
                                        <div className="text-right mt-2 text-xs">
                                            <button onClick={() => { setTemplateToEdit(template); setIsTemplateModalOpen(true); }} className="font-semibold text-blue-300 hover:underline">Editar</button>
                                            <span className="text-white/30 mx-1">|</span>
                                            <button onClick={() => deleteShiftTemplate(template.id)} className="font-semibold text-red-400 hover:underline">Borrar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-2">Horario Recurrente</h4>
                            <RecurringScheduleSetter employee={employee} onSave={onUpdateEmployee} />
                        </div>
                    </div>
                </div>


                <div>
                     <div className="grid grid-cols-7 border-t border-l border-brand-border/50 bg-brand-card/50 rounded-t-lg">
                         {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(day => (
                             <div key={day} className="text-center font-bold p-2 border-r border-b border-brand-border/50 text-xs text-brand-text-secondary">
                                {day}
                             </div>
                         ))}
                    </div>
                    <div className="grid grid-cols-7 border-l border-b border-r border-brand-border/50 bg-brand-card/30 rounded-b-lg">
                        {calendarDays.map(({ date, isCurrentMonth }) => {
                            const dayStr = date.toISOString().split('T')[0];
                            const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();

                            let scheduleForDay: (WorkSchedule & { isRecurring?: boolean }) | null = null;
                            let templateForDay: ShiftTemplate | null = null;
                            
                            if (isCurrentMonth) {
                                const specificSchedule = schedules.find(s => s.date === dayStr);
                                if (specificSchedule) {
                                    scheduleForDay = { ...specificSchedule, isRecurring: false };
                                } else if (employee.recurringSchedule) {
                                    const { templateId, days } = employee.recurringSchedule;
                                    if (days.includes(dayOfWeek)) {
                                        const recurringTemplate = shiftTemplates.find(t => t.id === templateId);
                                        if (recurringTemplate) {
                                            scheduleForDay = { id: `recurring-${dayStr}`, employeeId: employee.id, date: dayStr, startTime: recurringTemplate.startTime, endTime: recurringTemplate.endTime, organizationId: employee.organizationId, isRecurring: true };
                                        }
                                    }
                                }
                                if (scheduleForDay) {
                                    templateForDay = shiftTemplates.find(t => t.startTime === scheduleForDay!.startTime && t.endTime === scheduleForDay!.endTime) || null;
                                }
                            }

                            return (
                                <div 
                                    key={dayStr} 
                                    className={`border-r border-b border-brand-border/50 min-h-[120px] p-1.5 flex flex-col transition-colors duration-200 ${!isCurrentMonth ? 'bg-brand-bg/20' : ''}`}
                                    onDragOver={(e) => isCurrentMonth && e.preventDefault()}
                                    onDrop={(e) => isCurrentMonth && handleDrop(e, date)}
                                    onDragEnter={(e) => isCurrentMonth && e.currentTarget.classList.add('bg-brand-accent-blue/20')}
                                    onDragLeave={(e) => isCurrentMonth && e.currentTarget.classList.remove('bg-brand-accent-blue/20')}
                                >
                                    <span className={`font-semibold text-sm ${!isCurrentMonth ? 'text-brand-text-secondary/30' : ''}`}>{date.getDate()}</span>
                                    {scheduleForDay && (
                                        <div className={`relative mt-1 p-2 rounded-md text-xs flex-grow flex flex-col justify-center ${templateForDay?.color || 'bg-slate-700'} ${scheduleForDay.isRecurring ? 'opacity-70' : ''}`}>
                                            {!scheduleForDay.isRecurring && (
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteSchedule(employee.id, dayStr); }} className="absolute top-1 right-1 p-0.5 rounded-full bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-colors z-10" title="Eliminar turno" aria-label="Eliminar turno">
                                                    <XMarkIcon className="w-3 h-3" />
                                                </button>
                                            )}
                                            <p className="font-bold pr-4">{templateForDay?.name || 'Turno'}</p>
                                            {templateForDay?.name !== 'Día Libre' && <p>{scheduleForDay.startTime} - {scheduleForDay.endTime}</p>}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ShiftTemplateModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: Omit<ShiftTemplate, 'id' | 'organizationId'>) => void;
    templateToEdit: ShiftTemplate | null;
}> = ({ isOpen, onClose, onSave, templateToEdit }) => {
    const [name, setName] = useState(templateToEdit?.name || '');
    const [startTime, setStartTime] = useState(templateToEdit?.startTime || '09:00');
    const [endTime, setEndTime] = useState(templateToEdit?.endTime || '17:00');
    const [color, setColor] = useState(templateToEdit?.color || 'bg-sky-500/20');
    
    const colorOptions = ['bg-sky-500/20', 'bg-blue-500/20', 'bg-green-500/20', 'bg-yellow-500/20', 'bg-orange-500/20', 'bg-red-500/20', 'bg-purple-500/20', 'bg-indigo-500/20', 'bg-slate-700/50'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, startTime, endTime, color });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md m-4">
                <h3 className="text-xl font-bold mb-4">{templateToEdit ? 'Editar Plantilla' : 'Nueva Plantilla de Turno'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la plantilla" className="w-full p-2 bg-brand-bg border border-brand-border rounded" required />
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-sm">Hora de Inicio</label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required /></div>
                        <div><label className="text-sm">Hora de Fin</label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required /></div>
                    </div>
                    <div>
                        <label className="text-sm">Color</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {colorOptions.map(c => <button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${c} ${color === c ? 'ring-2 ring-brand-accent-cyan' : ''}`}></button>)}
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-accent-blue text-white rounded-lg">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const EmployeeFile: React.FC<EmployeeFileProps> = ({ employeeId, onBack }) => {
  const {
      employees,
      attendanceRecords,
      scheduledBreaks,
      sickLeaves,
      employeeNotes,
      workSchedules,
      users,
      departments,
      currentUser,
      updateAttendanceRecord,
      addSickLeave,
      addScheduledBreak,
      addEmployeeNote,
      addOrUpdateWorkSchedule,
      deleteWorkSchedule,
      updateEmployee,
  } = useData();

  const [activeTab, setActiveTab] = useState('scheduling');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // States for forms
  const [newSickLeave, setNewSickLeave] = useState<{ date: string; reason: string; justificationImage?: string }>({ date: '', reason: '' });
  const [newBreak, setNewBreak] = useState<{ startDate: string; endDate: string; type: 'Vacaciones' | 'Permiso' | 'Día Libre' }>({ startDate: '', endDate: '', type: 'Vacaciones' });
  const [newNote, setNewNote] = useState('');
  
  const employee = useMemo(() => employees.find(c => c.id === employeeId), [employeeId, employees]);

  const employeeAttendance = useMemo(() => 
    attendanceRecords.filter(r => r.employeeId === employeeId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [attendanceRecords, employeeId]
  );
  
  const employeeBreaks = useMemo(() =>
    scheduledBreaks.filter(b => b.employeeId === employeeId).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    [scheduledBreaks, employeeId]
  );
  
  const employeeSickLeaves = useMemo(() =>
    sickLeaves.filter(s => s.employeeId === employeeId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [sickLeaves, employeeId]
  );
  
  const employeeFilteredNotes = useMemo(() =>
    employeeNotes.filter(n => n.employeeId === employeeId), // Already sorted newest first from App state
    [employeeNotes, employeeId]
  );
  
  const employeeSchedules = useMemo(() => 
    workSchedules.filter(ws => ws.employeeId === employeeId),
    [workSchedules, employeeId]
  );


  if (!employee || !currentUser) {
    return <div>Empleado no encontrado o sesión no válida.</div>;
  }
  
  const handleTimeChange = (record: AttendanceRecord, type: 'clockIn' | 'clockOut', value: string) => {
      updateAttendanceRecord(record.id, { [type]: value });
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const base64 = await fileToBase64(e.target.files[0]);
        setNewSickLeave(prev => ({ ...prev, justificationImage: base64 }));
    }
  };

  const handleAddSickLeaveSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newSickLeave.date && newSickLeave.reason){
          addSickLeave({ ...newSickLeave, employeeId, organizationId: employee.organizationId });
          setNewSickLeave({ date: '', reason: '' });
      }
  };
  
  const handleAddBreakSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newBreak.startDate && newBreak.endDate) {
          addScheduledBreak({ ...newBreak, employeeId, organizationId: employee.organizationId });
          setNewBreak({ startDate: '', endDate: '', type: 'Vacaciones' });
      }
  };
  
  const handleAddNoteSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newNote.trim()){
          addEmployeeNote({ text: newNote.trim(), employeeId, authorId: currentUser.id, timestamp: new Date().toISOString(), organizationId: employee.organizationId });
          setNewNote('');
      }
  };

  const handleSaveEmployee = (updatedEmployee: Employee) => {
    updateEmployee(updatedEmployee.id, updatedEmployee);
    setIsEditModalOpen(false);
  };
  
  const handleUpdateEmployeeForRecurring = (updates: Partial<Employee>) => {
    updateEmployee(employee.id, updates);
  };

  const calculateHours = (clockIn: string | null, clockOut: string | null): string => {
    if (!clockIn || !clockOut) return '-';
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const inDate = new Date();
    inDate.setHours(inH, inM, 0);
    const outDate = new Date();
    outDate.setHours(outH, outM, 0);
    const diff = (outDate.getTime() - inDate.getTime()) / 1000 / 60 / 60;
    return `${diff.toFixed(2)} hrs`;
  };

  const calculateOvertime = (record: AttendanceRecord, schedules: WorkSchedule[]): string => {
    if (!record.clockOut) return '0.00';
    const schedule = schedules.find(s => s.date === record.date);
    if (!schedule) return '0.00';

    const endTime = new Date(`1970-01-01T${schedule.endTime}`);
    const clockOutTime = new Date(`1970-01-01T${record.clockOut}`);

    if (clockOutTime > endTime) {
        const diffMs = clockOutTime.getTime() - endTime.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours.toFixed(2);
    }
    return '0.00';
  };
  
  const getAuthorName = (authorId: string) => users.find(u => u.id === authorId)?.name || 'Desconocido';

  const handleDownloadCV = () => {
    if (employee.cvFile) {
        const link = document.createElement('a');
        link.href = employee.cvFile.data;
        link.download = employee.cvFile.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };
  
  const InfoField = ({ label, value }: { label: string, value?: string }) => (
    <div>
        <p className="text-sm text-brand-text-secondary">{label}</p>
        <p className="font-semibold text-brand-text-primary">{value || 'No especificado'}</p>
    </div>
  );

  const TabButton = ({ tabName, label }: { tabName: string; label: string }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
        activeTab === tabName
          ? 'bg-brand-card border-brand-border border-b-transparent text-brand-accent-cyan'
          : 'bg-transparent text-brand-text-secondary hover:bg-slate-800'
      }`}
    >
      {label}
    </button>
  );

  const departmentNames = useMemo(() => departments.map(d => d.name), [departments]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-brand-accent-cyan hover:underline font-semibold">
        <ArrowLeftIcon className="w-5 h-5"/>
        Volver al Panel de Asistencia
      </button>
      
      {isEditModalOpen && (
          <EmployeeFormModal 
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              onSave={handleSaveEmployee}
              employeeToEdit={employee}
              departments={departmentNames}
              organizationId={employee.organizationId}
          />
      )}

      <header className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-extrabold text-brand-text-primary">{employee.name}</h1>
                <p className="text-xl text-brand-text-secondary mt-1">{employee.role} - {employee.department}</p>
            </div>
            <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-all">
                <PencilIcon className="w-4 h-4" />
                Editar Datos
            </button>
        </div>
      </header>

      <div className="border-b border-brand-border flex">
          <TabButton tabName="info" label="Información Personal" />
          <TabButton tabName="attendance" label="Asistencia" />
          <TabButton tabName="scheduling" label="Planificación de Horarios" />
          <TabButton tabName="leaves" label="Descansos y Reposos" />
          <TabButton tabName="notes" label="Notas Generales" />
      </div>

      <div className="-mt-px">
         {activeTab === 'info' && (
            <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-b-xl p-6">
                 <h3 className="text-xl font-bold mb-6">Datos del Empleado</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Col 1 */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-brand-accent-cyan border-b border-brand-border pb-2">Información Laboral</h4>
                        <InfoField label="Puesto" value={employee.role} />
                        <InfoField label="Departamento" value={employee.department} />
                        <InfoField label="Código de Empleado" value={employee.employeeCode} />
                        <InfoField label="Fecha de Contratación" value={employee.hireDate ? new Date(employee.hireDate + 'T00:00:00').toLocaleDateString() : 'N/A'} />
                    </div>
                    {/* Col 2 */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-brand-accent-cyan border-b border-brand-border pb-2">Información de Contacto</h4>
                        <InfoField label="Email" value={employee.email} />
                        <InfoField label="Teléfono" value={employee.phone} />
                        <InfoField label="Dirección" value={employee.address} />
                    </div>
                     {/* Col 3 */}
                    <div className="space-y-6">
                         <h4 className="text-lg font-semibold text-brand-accent-cyan border-b border-brand-border pb-2">Contacto de Emergencia</h4>
                         <InfoField label="Nombre" value={employee.emergencyContactName} />
                         <InfoField label="Teléfono" value={employee.emergencyContactPhone} />
                         <h4 className="text-lg font-semibold text-brand-accent-cyan border-b border-brand-border pb-2 pt-4">Documentos</h4>
                         {employee.cvFile ? (
                            <button onClick={handleDownloadCV} className="w-full py-2 bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-semibold rounded-lg">Descargar CV ({employee.cvFile.name})</button>
                         ) : (
                            <p className="text-brand-text-secondary">No hay CV adjunto.</p>
                         )}
                    </div>
                 </div>
                 {employee.personalNotes && (
                     <div className="mt-8 pt-4 border-t border-brand-border">
                        <h4 className="text-lg font-semibold text-brand-accent-cyan mb-2">Notas Adicionales</h4>
                        <p className="text-brand-text-secondary whitespace-pre-wrap">{employee.personalNotes}</p>
                     </div>
                 )}
            </div>
         )}
         {activeTab === 'attendance' && (
            <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-b-xl p-6">
                <h3 className="text-xl font-bold mb-4">Registro de Asistencia</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Fecha</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Entrada</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Salida</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Horas Trabajadas</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Horas Extra</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {employeeAttendance.map(record => (
                                <tr key={record.id}>
                                    <td className="px-4 py-2">{record.date}</td>
                                    <td className="px-4 py-2"><input type="time" value={record.clockIn || ''} onChange={(e) => handleTimeChange(record, 'clockIn', e.target.value)} className="bg-brand-bg border border-brand-border rounded p-1" /></td>
                                    <td className="px-4 py-2"><input type="time" value={record.clockOut || ''} onChange={(e) => handleTimeChange(record, 'clockOut', e.target.value)} className="bg-brand-bg border border-brand-border rounded p-1" /></td>
                                    <td className="px-4 py-2">{calculateHours(record.clockIn, record.clockOut)}</td>
                                    <td className="px-4 py-2 font-semibold text-brand-accent-yellow">{calculateOvertime(record, employeeSchedules)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {employeeAttendance.length === 0 && <p className="text-center py-4 text-brand-text-secondary">No hay registros de asistencia.</p>}
                </div>
            </div>
         )}
         {activeTab === 'scheduling' && (
             <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-b-xl p-6">
                 <SchedulePlanner employee={employee} schedules={employeeSchedules} onSaveSchedule={addOrUpdateWorkSchedule} onDeleteSchedule={deleteWorkSchedule} onUpdateEmployee={handleUpdateEmployeeForRecurring} />
            </div>
         )}
         {activeTab === 'leaves' && (
             <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-b-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-4">Registrar Reposo Médico</h3>
                    <form onSubmit={handleAddSickLeaveSubmit} className="space-y-4 bg-brand-bg/50 p-4 rounded-lg">
                        <div>
                            <label className="text-sm">Fecha</label>
                            <input type="date" value={newSickLeave.date} onChange={e => setNewSickLeave(prev => ({...prev, date: e.target.value}))} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required />
                        </div>
                        <div>
                            <label className="text-sm">Motivo</label>
                            <input type="text" value={newSickLeave.reason} onChange={e => setNewSickLeave(prev => ({...prev, reason: e.target.value}))} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required />
                        </div>
                         <div>
                            <label className="text-sm">Adjuntar Justificante</label>
                            <input type="file" onChange={handleImageUpload} accept="image/*" className="w-full mt-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent-cyan/20 file:text-brand-accent-cyan hover:file:bg-brand-accent-cyan/30" />
                        </div>
                        {newSickLeave.justificationImage && <img src={newSickLeave.justificationImage} alt="Justificante" className="max-h-32 rounded mt-2" />}
                        <button type="submit" className="w-full py-2 bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-semibold rounded-lg">Añadir Reposo</button>
                    </form>
                    <div className="mt-6 space-y-2">
                         {employeeSickLeaves.map(leave => (
                            <div key={leave.id} className="bg-brand-bg/50 p-3 rounded-md">
                                <p><strong>{leave.date}:</strong> {leave.reason}</p>
                                {leave.justificationImage && <a href={leave.justificationImage} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-accent-cyan hover:underline">Ver justificante</a>}
                            </div>
                         ))}
                    </div>
                </div>
                 <div>
                    <h3 className="text-xl font-bold mb-4">Programar Descanso</h3>
                    <form onSubmit={handleAddBreakSubmit} className="space-y-4 bg-brand-bg/50 p-4 rounded-lg">
                        <div>
                            <label className="text-sm">Tipo</label>
                            <select value={newBreak.type} onChange={e => setNewBreak(prev => ({...prev, type: e.target.value as any}))} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded">
                                <option>Vacaciones</option>
                                <option>Permiso</option>
                                <option>Día Libre</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                               <label className="text-sm">Desde</label>
                               <input type="date" value={newBreak.startDate} onChange={e => setNewBreak(prev => ({...prev, startDate: e.target.value}))} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required />
                            </div>
                            <div>
                               <label className="text-sm">Hasta</label>
                               <input type="date" value={newBreak.endDate} onChange={e => setNewBreak(prev => ({...prev, endDate: e.target.value}))} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-2 bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-semibold rounded-lg">Programar</button>
                    </form>
                    <div className="mt-6 space-y-2">
                         {employeeBreaks.map(br => (
                            <div key={br.id} className="bg-brand-bg/50 p-3 rounded-md">
                                <p><strong>{br.type}:</strong> {br.startDate} al {br.endDate}</p>
                            </div>
                         ))}
                    </div>
                </div>
             </div>
         )}
         {activeTab === 'notes' && (
             <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-b-xl p-6">
                 <h3 className="text-xl font-bold mb-4">Notas Generales</h3>
                 <form onSubmit={handleAddNoteSubmit} className="mb-6">
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={4} placeholder="Añadir una nueva nota..." className="w-full p-2 bg-brand-bg border border-brand-border rounded"></textarea>
                    <div className="text-right mt-2">
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-semibold rounded-lg">Guardar Nota</button>
                    </div>
                 </form>
                 <div className="space-y-4">
                     {employeeFilteredNotes.map(note => (
                        <div key={note.id} className="bg-brand-bg/50 p-4 rounded-lg border-l-4 border-brand-accent-blue">
                            <p>{note.text}</p>
                            <p className="text-xs text-brand-text-secondary mt-2 text-right">
                                por {getAuthorName(note.authorId)} - {new Date(note.timestamp).toLocaleString()}
                            </p>
                        </div>
                     ))}
                     {employeeFilteredNotes.length === 0 && <p className="text-center py-4 text-brand-text-secondary">No hay notas para este empleado.</p>}
                 </div>
             </div>
         )}
      </div>

    </div>
  );
};