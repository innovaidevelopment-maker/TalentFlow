import React, { useState, useMemo } from 'react';
import type { Employee, AttendanceRecord, ScheduledBreak, SickLeave, EmployeeNote, User, WorkSchedule } from '../types';
import { useData } from '../context/DataContext';
import { ArrowLeftIcon, PlusIcon, PencilIcon } from './icons';
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

const WeeklyScheduler: React.FC<{
    employeeId: string,
    schedules: WorkSchedule[],
    onSave: (schedule: Omit<WorkSchedule, 'id'>) => void,
    organizationId: string,
}> = ({ employeeId, schedules, onSave, organizationId }) => {
    const [weekOffset, setWeekOffset] = useState(0);
    const [editingDay, setEditingDay] = useState<{ day: Date, schedule?: WorkSchedule } | null>(null);

    const getWeekDays = () => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + (weekOffset * 7)); // Start on Monday
        return Array.from({ length: 7 }, (_, i) => {
            const day = new Date(startOfWeek);
            day.setDate(day.getDate() + i);
            return day;
        });
    };
    
    const weekDays = getWeekDays();

    const handleSaveSchedule = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingDay) return;
        const formData = new FormData(e.currentTarget);
        const startTime = formData.get('startTime') as string;
        const endTime = formData.get('endTime') as string;

        onSave({
            employeeId,
            date: editingDay.day.toISOString().split('T')[0],
            startTime,
            endTime,
            organizationId
        });
        setEditingDay(null);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => setWeekOffset(w => w - 1)} className="px-3 py-1 bg-slate-700 rounded">&lt; Semana Anterior</button>
                <span className="font-semibold">
                    {weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}
                </span>
                <button onClick={() => setWeekOffset(w => w + 1)} className="px-3 py-1 bg-slate-700 rounded">Semana Siguiente &gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-2">
                {weekDays.map(day => {
                    const dayStr = day.toISOString().split('T')[0];
                    const schedule = schedules.find(s => s.date === dayStr);
                    return (
                        <div key={dayStr} onClick={() => setEditingDay({ day, schedule })} className="border border-brand-border/50 rounded-lg p-3 text-center cursor-pointer hover:bg-brand-bg/50">
                            <p className="font-bold">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</p>
                            <p className="text-2xl">{day.getDate()}</p>
                            {schedule ? (
                                <p className="text-sm mt-2 text-brand-accent-cyan">{schedule.startTime} - {schedule.endTime}</p>
                            ) : (
                                <p className="text-sm mt-2 text-brand-text-secondary">Sin horario</p>
                            )}
                        </div>
                    )
                })}
            </div>

            {editingDay && (
                 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-sm m-4">
                        <h3 className="text-xl font-bold mb-4">
                            Establecer Horario para {editingDay.day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h3>
                        <form onSubmit={handleSaveSchedule} className="space-y-4">
                             <div>
                                <label className="text-sm">Hora de Inicio</label>
                                <input type="time" name="startTime" defaultValue={editingDay.schedule?.startTime || "09:00"} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required />
                            </div>
                            <div>
                                <label className="text-sm">Hora de Fin</label>
                                <input type="time" name="endTime" defaultValue={editingDay.schedule?.endTime || "17:00"} className="w-full mt-1 p-2 bg-brand-bg border border-brand-border rounded" required />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <button type="button" onClick={() => setEditingDay(null)} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-gradient-to-r from-brand-accent-cyan to-brand-accent-blue text-white font-semibold rounded-lg">Guardar Horario</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
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
      // Fix: Add missing properties from context
      currentUser,
      updateAttendanceRecord,
      addSickLeave,
      addScheduledBreak,
      addEmployeeNote,
      addOrUpdateWorkSchedule,
      updateEmployee,
  } = useData();

  const [activeTab, setActiveTab] = useState('info');
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
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
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
          <TabButton tabName="attendance" label="Asistencia y Horarios" />
          <TabButton tabName="scheduling" label="Planificación de Horarios" />
          <TabButton tabName="leaves" label="Descansos y Reposos" />
          <TabButton tabName="notes" label="Notas Generales" />
      </div>

      <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-b-xl p-6">
         {activeTab === 'info' && (
            <div>
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
                            <button onClick={handleDownloadCV} className="w-full py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg">Descargar CV ({employee.cvFile.name})</button>
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
            <div>
                <h3 className="text-xl font-bold mb-4">Registro de Asistencia</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Fecha</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Entrada</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Salida</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-brand-text-secondary uppercase">Horas Trabajadas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {employeeAttendance.map(record => (
                                <tr key={record.id}>
                                    <td className="px-4 py-2">{record.date}</td>
                                    <td className="px-4 py-2"><input type="time" value={record.clockIn || ''} onChange={(e) => handleTimeChange(record, 'clockIn', e.target.value)} className="bg-brand-bg border border-brand-border rounded p-1" /></td>
                                    <td className="px-4 py-2"><input type="time" value={record.clockOut || ''} onChange={(e) => handleTimeChange(record, 'clockOut', e.target.value)} className="bg-brand-bg border border-brand-border rounded p-1" /></td>
                                    <td className="px-4 py-2">{calculateHours(record.clockIn, record.clockOut)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {employeeAttendance.length === 0 && <p className="text-center py-4 text-brand-text-secondary">No hay registros de asistencia.</p>}
                </div>
            </div>
         )}
         {activeTab === 'scheduling' && (
            <div>
                 <h3 className="text-xl font-bold mb-4">Planificación de Turnos Semanales</h3>
                 <WeeklyScheduler employeeId={employee.id} schedules={employeeSchedules} onSave={addOrUpdateWorkSchedule} organizationId={employee.organizationId} />
            </div>
         )}
         {activeTab === 'leaves' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                        <button type="submit" className="w-full py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg">Añadir Reposo</button>
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
                        <button type="submit" className="w-full py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg">Programar</button>
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
             <div>
                 <h3 className="text-xl font-bold mb-4">Notas Generales</h3>
                 <form onSubmit={handleAddNoteSubmit} className="mb-6">
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={4} placeholder="Añadir una nueva nota..." className="w-full p-2 bg-brand-bg border border-brand-border rounded"></textarea>
                    <div className="text-right mt-2">
                        <button type="submit" className="px-4 py-2 bg-gradient-to-r from-brand-accent-cyan to-brand-accent-blue text-white font-semibold rounded-lg">Guardar Nota</button>
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
