import React, { useState, useEffect } from 'react';
import type { ScheduledEvaluation, EvaluationTag, User } from '../types';
import { TagIcon } from './icons';

interface ScheduleEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<ScheduledEvaluation, 'id' | 'creatorId'>, id?: string) => void;
  departments: string[];
  tags: EvaluationTag[];
  selectedDate: string | null;
  currentUser: User;
  users: User[];
  eventToEdit?: ScheduledEvaluation | null;
}

type TargetType = 'general' | 'department' | 'users' | 'private';

export const ScheduleEvaluationModal: React.FC<ScheduleEvaluationModalProps> = ({ isOpen, onClose, onSave, departments, tags, selectedDate, currentUser, users, eventToEdit }) => {
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [targetType, setTargetType] = useState<TargetType>('general');
  const [targetId, setTargetId] = useState('all');
  const [participantIds, setParticipantIds] = useState<Set<string>>(new Set());
  const [tagId, setTagId] = useState(tags[0]?.id || '');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (eventToEdit) {
        setTitle(eventToEdit.title);
        setStart(eventToEdit.start.split('T')[0]);
        setEnd(eventToEdit.end.split('T')[0]);
        setTargetType(eventToEdit.targetType);
        setTargetId(eventToEdit.targetId);
        setParticipantIds(new Set(eventToEdit.participantIds.filter(id => id !== currentUser.id))); // Exclude current user for checkbox state
        setTagId(eventToEdit.tagId);
        setDescription(eventToEdit.description || '');
    } else {
        // Reset form for new entry, using selectedDate if available
        const initialDate = selectedDate || new Date().toISOString().split('T')[0];
        setTitle('');
        setStart(initialDate);
        setEnd(initialDate);
        setTargetType('general');
        setTargetId('all');
        setParticipantIds(new Set());
        setTagId(tags[0]?.id || '');
        setDescription('');
    }
  }, [eventToEdit, selectedDate, isOpen, tags, currentUser.id]);

  if (!isOpen) return null;

  const handleParticipantToggle = (userId: string) => {
    setParticipantIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(userId)) {
            newSet.delete(userId);
        } else {
            newSet.add(userId);
        }
        return newSet;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && start && end && tagId) {
      let finalParticipantIds: string[] = [];
      let finalTargetId = 'all';

      switch (targetType) {
        case 'private':
          finalParticipantIds = [currentUser.id];
          break;
        case 'users':
          finalParticipantIds = Array.from(new Set([currentUser.id, ...Array.from(participantIds)]));
          break;
        case 'department':
          finalTargetId = targetId;
          break;
        case 'general':
        default:
          break;
      }
      
      onSave({ 
        title, 
        start, 
        end, 
        targetType, 
        targetId: finalTargetId,
        participantIds: finalParticipantIds,
        tagId, 
        description,
        organizationId: currentUser.organizationId,
      }, eventToEdit?.id);
    }
  };
  
  const handleTargetTypeChange = (newType: TargetType) => {
      setTargetType(newType);
      if (newType === 'department' && departments.length > 0) {
          setTargetId(departments[0]);
      } else {
          setTargetId('all');
      }
      setParticipantIds(new Set());
  }

  const TargetOption: React.FC<{ value: TargetType, label: string }> = ({ value, label }) => (
      <label className={`flex items-center p-3 rounded-lg cursor-pointer border-2 transition-colors ${targetType === value ? 'bg-brand-accent-blue/20 border-brand-accent-cyan' : 'bg-brand-bg/50 border-transparent hover:border-slate-700'}`}>
          <input type="radio" name="targetType" value={value} checked={targetType === value} onChange={() => handleTargetTypeChange(value)} className="w-4 h-4 text-brand-accent-cyan bg-slate-700 border-slate-600 focus:ring-brand-accent-cyan" />
          <span className="ml-3 font-medium text-brand-text-primary">{label}</span>
      </label>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-brand-card border border-brand-border rounded-xl w-full max-w-lg m-4 max-h-[90vh] flex flex-col">
        <h3 className="text-xl font-bold p-6 border-b border-brand-border">{eventToEdit ? 'Editar Evento' : 'Programar Nuevo Evento'}</h3>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto" id="event-form">
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Título del Evento</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-brand-border bg-brand-bg rounded-md" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Fecha de Inicio</label>
              <input type="date" value={start} onChange={e => setStart(e.target.value)} className="w-full p-2 border border-brand-border bg-brand-bg rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Fecha de Fin</label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="w-full p-2 border border-brand-border bg-brand-bg rounded-md" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">Público Objetivo</label>
            <div className="grid grid-cols-2 gap-2">
                <TargetOption value="general" label="Toda la empresa" />
                <TargetOption value="private" label="Solo yo" />
                <TargetOption value="department" label="Departamento" />
                <TargetOption value="users" label="Personas Específicas" />
            </div>
          </div>
          
          {targetType === 'department' && (
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Seleccionar Departamento</label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full p-2 border border-brand-border bg-brand-bg rounded-md">
                    {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>
          )}
          {targetType === 'users' && (
            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Seleccionar Participantes</label>
                <div className="max-h-32 overflow-y-auto border border-brand-border bg-brand-bg p-2 rounded-md space-y-1">
                    {users.filter(u => u.id !== currentUser.id).map(user => (
                        <div key={user.id} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`user-participant-${user.id}`}
                                checked={participantIds.has(user.id)}
                                onChange={() => handleParticipantToggle(user.id)}
                                className="h-4 w-4 rounded bg-brand-bg border-brand-border text-brand-accent-cyan focus:ring-brand-accent-cyan"
                            />
                            <label htmlFor={`user-participant-${user.id}`} className="ml-2 text-sm">{user.name}</label>
                        </div>
                    ))}
                </div>
                 <p className="text-xs text-brand-text-secondary mt-1">Tu usuario ({currentUser.name}) se incluirá automáticamente.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Etiqueta</label>
            <select value={tagId} onChange={e => setTagId(e.target.value)} className="w-full p-2 border border-brand-border bg-brand-bg rounded-md">
                {tags.map(tag => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Descripción (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border border-brand-border bg-brand-bg rounded-md" rows={3}></textarea>
          </div>
        </form>
         <div className="flex justify-end gap-4 p-6 border-t border-brand-border mt-auto">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
            <button type="submit" form="event-form" className="px-4 py-2 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-semibold rounded-lg">{eventToEdit ? 'Guardar Cambios' : 'Guardar Evento'}</button>
        </div>
      </div>
    </div>
  );
};