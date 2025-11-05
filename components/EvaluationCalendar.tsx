import React, { useState, useMemo } from 'react';
import type { ScheduledEvaluation, EvaluationTag, User } from '../types';
import { ScheduleEvaluationModal } from './ScheduleEvaluationModal';
import { CalendarDaysIcon, UserGroupIcon, PencilIcon, TrashIcon, XMarkIcon } from './icons';

interface EvaluationCalendarProps {
  events: ScheduledEvaluation[];
  onSaveEvent: (event: Omit<ScheduledEvaluation, 'id' | 'creatorId'>, id?: string) => void;
  onDeleteEvent: (eventId: string) => void;
  departments: string[];
  tags: EvaluationTag[];
  currentUser: User;
  users: User[];
}

const WEEK_DAYS = [
    { long: 'Domingo', short: 'Dom' },
    { long: 'Lunes', short: 'Lun' },
    { long: 'Martes', short: 'Mar' },
    { long: 'Miércoles', short: 'Mié' },
    { long: 'Jueves', short: 'Jue' },
    { long: 'Viernes', short: 'Vie' },
    { long: 'Sábado', short: 'Sáb' },
];

const EventDetailModal: React.FC<{
    event: ScheduledEvaluation;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    getTagById: (id: string) => EvaluationTag | undefined;
    users: User[];
    currentUser: User;
}> = ({ event, onClose, onEdit, onDelete, getTagById, users, currentUser }) => {
    const tag = getTagById(event.tagId);
    
    const getParticipantsText = () => {
        switch(event.targetType) {
            case 'general': return 'Toda la empresa';
            case 'private': return 'Solo yo';
            case 'department': return `Departamento: ${event.targetId}`;
            case 'users':
                const participantNames = event.participantIds
                    .map(id => users.find(u => u.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                return participantNames ? `Personas: ${participantNames}` : 'Personas Específicas';
        }
    }
    
    const canEditOrDelete = event.creatorId === currentUser.id || currentUser.role === 'Admin';
    
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    // Adjust for timezone offset when displaying
    startDate.setMinutes(startDate.getMinutes() + startDate.getTimezoneOffset());
    endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
    const dateString = startDate.getTime() === endDate.getTime() 
      ? startDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-brand-card border border-brand-border rounded-xl w-full max-w-lg m-4">
                <div className="p-4 flex justify-between items-center">
                    <div className="w-24"></div> {/* Spacer */}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${tag?.color || 'bg-slate-700'}`}>
                        {tag?.name || 'Sin Etiqueta'}
                    </span>
                    <div className="flex items-center gap-1">
                        {canEditOrDelete && (
                            <>
                            <button onClick={onEdit} title="Editar evento" className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                                <PencilIcon className="w-5 h-5 text-brand-text-secondary hover:text-brand-text-primary" />
                            </button>
                            <button onClick={onDelete} title="Eliminar evento" className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                                <TrashIcon className="w-5 h-5 text-red-500/80 hover:text-red-500" />
                            </button>
                            </>
                        )}
                         <button onClick={onClose} title="Cerrar" className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                            <XMarkIcon className="w-6 h-6 text-brand-text-secondary hover:text-brand-text-primary" />
                        </button>
                    </div>
                </div>
                <div className="p-6 pt-0 space-y-4 max-h-[60vh] overflow-y-auto">
                    <h3 className="text-2xl font-bold">{event.title}</h3>
                    <p className="text-sm text-brand-text-secondary">{dateString}</p>
                     <div>
                        <h4 className="text-sm font-semibold text-brand-text-secondary">Dirigido a</h4>
                        <p>{getParticipantsText()}</p>
                    </div>
                    {event.description && (
                         <div>
                            <h4 className="text-sm font-semibold text-brand-text-secondary">Descripción</h4>
                            <p className="whitespace-pre-wrap">{event.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export const EvaluationCalendar: React.FC<EvaluationCalendarProps> = ({ events, onSaveEvent, onDeleteEvent, departments, tags, currentUser, users }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [viewFilter, setViewFilter] = useState<'all' | 'mine'>('all');
  const [searchDate, setSearchDate] = useState('');
  
  const [viewingEvent, setViewingEvent] = useState<ScheduledEvaluation | null>(null);
  const [editingEvent, setEditingEvent] = useState<ScheduledEvaluation | null>(null);
  const [eventToDelete, setEventToDelete] = useState<ScheduledEvaluation | null>(null);


  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const isParticipant = event.participantIds.includes(currentUser.id);
      const isGeneral = event.targetType === 'general';
      const isCreator = event.creatorId === currentUser.id;
      const isPrivate = event.targetType === 'private' && isCreator;
      const isInDepartment = event.targetType === 'department' && event.targetId === currentUser.department;

      const isRelevantToUser = isParticipant || isGeneral || isInDepartment || isPrivate;
      if (!isRelevantToUser) return false;

      if (viewFilter === 'mine' && !isParticipant && !isCreator) return false;

      const departmentMatch = departmentFilter === 'all' || 
                              event.targetType === 'general' ||
                              event.targetType === 'private' ||
                              event.targetType === 'users' ||
                              (event.targetType === 'department' && event.targetId === departmentFilter);
      if (!departmentMatch) return false;

      if (searchDate) {
        const eventStartStr = event.start.split('T')[0];
        const eventEndStr = event.end.split('T')[0];
        return searchDate >= eventStartStr && searchDate <= eventEndStr;
      }

      return true;
    });
  }, [events, departmentFilter, searchDate, currentUser, viewFilter]);

  const handlePrevMonth = () => {
    setSearchDate('');
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setSearchDate('');
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date.toISOString().split('T')[0]);
    setEditingEvent(null);
    setIsModalOpen(true);
  };
  
  const handleOpenModal = () => {
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setEditingEvent(null);
      setIsModalOpen(true);
  }

  const handleSaveEvent = (eventData: Omit<ScheduledEvaluation, 'id' | 'creatorId'>, id?: string) => {
    onSaveEvent(eventData, id);
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSearchDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setSearchDate(dateValue);
    if (dateValue) {
        const utcDate = new Date(dateValue);
        const localDate = new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
        setCurrentDate(localDate);
    }
  };
  
  const handleEventClick = (event: ScheduledEvaluation, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingEvent(event);
  };

  const handleEditFromDetail = () => {
    if (viewingEvent) {
        setEditingEvent(viewingEvent);
        setIsModalOpen(true);
        setViewingEvent(null);
    }
  };

  const handleDeleteFromDetail = () => {
    if (viewingEvent) {
        setEventToDelete(viewingEvent);
        setViewingEvent(null);
    }
  };

  const confirmDelete = () => {
    if (eventToDelete) {
        onDeleteEvent(eventToDelete.id);
        setEventToDelete(null);
    }
  };

  const getTagById = (tagId: string) => tags.find(t => t.id === tagId);

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`blank-${i}`} className="border-r border-b border-brand-border/50"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const today = new Date();
      const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const dayEvents = filteredEvents.filter(e => {
          const start = new Date(e.start);
          const end = new Date(e.end);
          const current = new Date(dateStr);
          start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
          end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
          current.setMinutes(current.getMinutes() + current.getTimezoneOffset());
          return current >= start && current <= end;
      });

      days.push(
        <div key={day} className="border-r border-b border-brand-border/50 p-2 min-h-[160px] flex flex-col hover:bg-white/5 transition-colors cursor-pointer" onClick={() => handleDayClick(day)}>
          <span className={`font-bold ${isToday ? 'bg-brand-accent-blue text-white rounded-full h-7 w-7 flex items-center justify-center' : ''}`}>{day}</span>
          <div className="mt-1 space-y-1">
            {dayEvents.map(event => {
                const tag = getTagById(event.tagId);
                const isUserEvent = event.targetType === 'users' || event.targetType === 'private';
                return (
                    <div key={event.id} title={event.title} onClick={(e) => handleEventClick(event, e)} className={`p-1.5 rounded-md text-xs truncate flex items-center gap-1.5 ${tag?.color || 'bg-slate-700'}`}>
                        {isUserEvent && <UserGroupIcon className="w-3 h-3 flex-shrink-0" />}
                        <span className="truncate">{event.title}</span>
                    </div>
                )
            })}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
            <h2 className="text-3xl font-bold text-brand-text-primary">Calendario de Eventos</h2>
            <p className="text-brand-text-secondary">Planifica y visualiza las próximas actividades y evaluaciones.</p>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
             <input type="date" value={searchDate} onChange={handleSearchDateChange} className="p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm text-sm text-brand-text-secondary" />
            <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm text-sm">
                <option value="all">Filtrar por Departamento</option>
                {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
            </select>
            <button onClick={handleOpenModal} className="px-4 py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-indigo/50 transition-all flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5" />
                Programar Evento
            </button>
        </div>
      </div>
      
      <div className="bg-brand-card border border-brand-border rounded-xl flex flex-col flex-grow min-h-0">
        <div className="flex justify-between items-center p-4 border-b border-brand-border">
            <div className="flex items-center gap-2">
                <button onClick={handlePrevMonth} className="px-3 py-1 bg-slate-700 rounded">&lt;</button>
                <button onClick={handleNextMonth} className="px-3 py-1 bg-slate-700 rounded">&gt;</button>
            </div>
            <h3 className="text-xl font-bold">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}</h3>
            <div className="flex items-center gap-1 p-1 bg-brand-bg rounded-lg border border-brand-border">
                <button onClick={() => setViewFilter('all')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewFilter === 'all' ? 'bg-brand-accent-blue/20 text-brand-accent-cyan' : 'text-brand-text-secondary hover:bg-slate-700'}`}>Todos los Eventos</button>
                <button onClick={() => setViewFilter('mine')} className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${viewFilter === 'mine' ? 'bg-brand-accent-blue/20 text-brand-accent-cyan' : 'text-brand-text-secondary hover:bg-slate-700'}`}>Mis Eventos</button>
            </div>
        </div>
        <div className="flex-grow overflow-y-auto">
            <div className="min-w-[700px]">
                <div className="grid grid-cols-7 text-center font-semibold text-brand-text-secondary border-b border-brand-border">
                    {WEEK_DAYS.map(day => (
                        <div key={day.long} className="py-2 border-r border-brand-border/50 last:border-r-0">{day.short}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {renderCalendarDays()}
                </div>
            </div>
        </div>
      </div>

      {viewingEvent && (
        <EventDetailModal
            event={viewingEvent}
            onClose={() => setViewingEvent(null)}
            onEdit={handleEditFromDetail}
            onDelete={handleDeleteFromDetail}
            getTagById={getTagById}
            users={users}
            currentUser={currentUser}
        />
      )}

      {eventToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70]">
            <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md m-4">
                <h3 className="text-xl font-bold mb-2">Confirmar Eliminación</h3>
                <p className="text-brand-text-secondary">¿Estás seguro de que quieres eliminar el evento <span className="font-bold text-brand-text-primary">"{eventToDelete.title}"</span>? Esta acción no se puede deshacer.</p>
                <div className="flex justify-end gap-4 pt-6">
                    <button onClick={() => setEventToDelete(null)} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Eliminar Evento</button>
                </div>
            </div>
        </div>
      )}

      {isModalOpen && (
        <ScheduleEvaluationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          departments={departments}
          tags={tags}
          selectedDate={selectedDate}
          currentUser={currentUser}
          users={users}
          eventToEdit={editingEvent}
        />
      )}
    </div>
  );
};