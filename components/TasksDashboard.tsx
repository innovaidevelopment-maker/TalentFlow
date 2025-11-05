import React, { useState, useMemo } from 'react';
import type { Task, TaskStatus, TaskPriority, User, Subtask } from '../types';
import { useData } from '../context/DataContext';
import { PlusIcon, FlagIcon, CheckCircleIcon, PencilIcon, TrashIcon, XMarkIcon } from './icons';

const statuses: TaskStatus[] = ['Pendiente', 'En Progreso', 'Completada'];

const priorityMap: Record<TaskPriority, { color: string, name: string }> = {
    'Baja': { color: 'bg-sky-500/20 text-sky-300 border-sky-500/30', name: 'Baja' },
    'Media': { color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', name: 'Media' },
    'Alta': { color: 'bg-red-500/20 text-red-300 border-red-500/30', name: 'Alta' },
};

const TaskModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: Omit<Task, 'id'> | Partial<Task>) => void;
    taskToEdit: Task | null;
    users: User[];
    departments: string[];
    currentUser: User;
}> = ({ isOpen, onClose, onSave, taskToEdit, users, departments, currentUser }) => {
    
    const [formData, setFormData] = useState<Omit<Task, 'id' | 'createdAt' | 'creatorId'>>({
        title: taskToEdit?.title || '',
        description: taskToEdit?.description || '',
        status: taskToEdit?.status || 'Pendiente',
        priority: taskToEdit?.priority || 'Media',
        dueDate: taskToEdit?.dueDate || '',
        assigneeIds: taskToEdit?.assigneeIds || [],
        departmentTags: taskToEdit?.departmentTags || [],
        subtasks: taskToEdit?.subtasks || [],
        organizationId: taskToEdit?.organizationId || currentUser.organizationId,
    });
    const [newSubtask, setNewSubtask] = useState('');

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, field: 'assigneeIds' | 'departmentTags') => {
        const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        setFormData(prev => ({...prev, [field]: values }));
    }

    const handleAddSubtask = () => {
        if(newSubtask.trim()){
            const subtask: Subtask = { id: `st-${Date.now()}`, text: newSubtask.trim(), completed: false };
            setFormData(prev => ({ ...prev, subtasks: [...prev.subtasks, subtask] }));
            setNewSubtask('');
        }
    };
    
    const handleToggleSubtask = (subtaskId: string) => {
        setFormData(prev => ({
            ...prev,
            subtasks: prev.subtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        }));
    };
    
    const handleDeleteSubtask = (subtaskId: string) => {
        setFormData(prev => ({
            ...prev,
            subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-brand-card border border-brand-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <h3 className="text-xl font-bold p-6 border-b border-brand-border">{taskToEdit ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
                <form onSubmit={handleSubmit} id="task-form" className="p-6 space-y-4 overflow-y-auto">
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Título de la tarea" className="w-full p-2 text-lg font-semibold bg-transparent border-b border-brand-border focus:outline-none focus:border-brand-accent-cyan" required />
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Añadir una descripción..." rows={3} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md"></textarea>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md"><option value="Pendiente">Pendiente</option><option value="En Progreso">En Progreso</option><option value="Completada">Completada</option></select>
                        <select name="priority" value={formData.priority} onChange={handleChange} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md"><option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option></select>
                        <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-secondary" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-brand-text-secondary mb-1 block">Asignar a</label>
                            <select multiple value={formData.assigneeIds} onChange={(e) => handleMultiSelectChange(e, 'assigneeIds')} className="w-full p-2 h-24 bg-brand-bg border border-brand-border rounded-md">
                                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-text-secondary mb-1 block">Etiquetar Dptos.</label>
                            <select multiple value={formData.departmentTags} onChange={(e) => handleMultiSelectChange(e, 'departmentTags')} className="w-full p-2 h-24 bg-brand-bg border border-brand-border rounded-md">
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-brand-text-secondary mb-1 block">Subtareas</label>
                        <div className="space-y-2">
                            {formData.subtasks.map(st => (
                                <div key={st.id} className="flex items-center gap-2 bg-brand-bg/50 p-2 rounded">
                                    <input type="checkbox" checked={st.completed} onChange={() => handleToggleSubtask(st.id)} className="w-4 h-4 text-brand-accent-cyan bg-slate-700 border-slate-600 focus:ring-brand-accent-cyan rounded" />
                                    <span className={`flex-grow ${st.completed ? 'line-through text-brand-text-secondary' : ''}`}>{st.text}</span>
                                    <button type="button" onClick={() => handleDeleteSubtask(st.id)}><TrashIcon className="w-4 h-4 text-red-500/70 hover:text-red-500" /></button>
                                </div>
                            ))}
                        </div>
                         <div className="flex gap-2 mt-2">
                            <input type="text" value={newSubtask} onChange={e => setNewSubtask(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())} placeholder="Añadir subtarea y presionar Enter" className="flex-grow p-2 bg-brand-bg border border-brand-border rounded-md"/>
                            <button type="button" onClick={handleAddSubtask} className="px-3 bg-brand-accent-cyan rounded-md text-white"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>

                </form>
                <div className="flex justify-end gap-4 p-6 border-t border-brand-border mt-auto">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 rounded-lg">Cancelar</button>
                    <button type="submit" form="task-form" className="px-4 py-2 bg-gradient-to-r from-brand-accent-cyan to-brand-accent-blue text-white font-semibold rounded-lg">Guardar Tarea</button>
                </div>
            </div>
        </div>
    );
};

interface TasksDashboardProps {
    currentUser: User;
}

export const TasksDashboard: React.FC<TasksDashboardProps> = ({ currentUser }) => {
    // Fix: Add missing task handlers from context
    const { tasks, users, departments, logActivity, addTask, updateTask, deleteTask } = useData();
        
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    const filteredTasks = useMemo(() => {
        if (!searchTerm.trim()) {
            return tasks;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        return tasks.filter(task => 
            task.title.toLowerCase().includes(lowercasedTerm) ||
            (task.description && task.description.toLowerCase().includes(lowercasedTerm))
        );
    }, [tasks, searchTerm]);

    const toggleTaskExpansion = (taskId: string) => {
        setExpandedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
            }
            return newSet;
        });
    };

    const handleSubtaskToggle = async (taskId: string, subtaskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const updatedSubtasks = task.subtasks.map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        await updateTask(taskId, { subtasks: updatedSubtasks });
    };

    const handleSaveTask = async (taskData: Omit<Task, 'id'> | Partial<Task>) => {
        if(taskToEdit) {
            await updateTask(taskToEdit.id, taskData);
            await logActivity('UPDATE_TASK', `Se actualizó la tarea: ${taskToEdit.title}`, taskToEdit.id, currentUser);
        } else {
            const addedTask = await addTask(taskData as Omit<Task, 'id' | 'createdAt' | 'creatorId'>);
            if (addedTask) {
               await logActivity('CREATE_TASK', `Se creó la tarea: ${addedTask.title}`, addedTask.id, currentUser);
            }
        }
        setIsModalOpen(false);
        setTaskToEdit(null);
    };

    const handleDeleteTask = async (taskId: string) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            await deleteTask(taskId);
            await logActivity('DELETE_TASK', `Se eliminó la tarea: ${task.title}`, taskId, currentUser);
        }
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };
    
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            await updateTask(taskId, { status });
        }
        setDraggedOverColumn(null);
    };
    
    const getAssignee = (id: string) => users.find(u => u.id === id);
    const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    
    const departmentNames = useMemo(() => departments.map(d => d.name), [departments]);

    const TaskCard: React.FC<{task: Task}> = ({task}) => {
        const completedSubtasks = task.subtasks.filter(st => st.completed).length;
        const isExpanded = expandedTasks.has(task.id);

        return (
            <div 
                className="bg-brand-card border border-brand-border rounded-lg p-3 cursor-grab active:cursor-grabbing flex flex-col gap-2"
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
            >
                <div className="flex justify-between items-start">
                    <p 
                        className="font-bold text-brand-text-primary pr-2 cursor-pointer hover:text-brand-accent-cyan"
                        onClick={() => { setTaskToEdit(task); setIsModalOpen(true); }}
                    >
                        {task.title}
                    </p>
                    <div className="flex items-center flex-shrink-0">
                        <button onClick={() => { setTaskToEdit(task); setIsModalOpen(true); }} className="p-1 text-brand-text-secondary hover:text-white"><PencilIcon className="w-4 h-4"/></button>
                        {currentUser.role === 'Admin' && (
                             <button onClick={() => setTaskToDelete(task)} className="p-1 text-brand-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${priorityMap[task.priority].color}`}>
                        <FlagIcon className="w-3 h-3 inline-block mr-1" />
                        {priorityMap[task.priority].name}
                    </span>
                    {task.dueDate && <span className="text-xs text-brand-text-secondary">{new Date(task.dueDate + 'T00:00:00').toLocaleDateString()}</span>}
                </div>
                
                {task.subtasks.length > 0 && (
                     <div className="text-xs text-brand-text-secondary">
                        <button onClick={() => toggleTaskExpansion(task.id)} className="w-full flex items-center gap-2 hover:text-white text-left">
                            <CheckCircleIcon className={`w-4 h-4 flex-shrink-0 ${completedSubtasks === task.subtasks.length ? 'text-green-400' : ''}`} />
                            <span>{completedSubtasks} de {task.subtasks.length}</span>
                            <div className="w-full bg-slate-700 rounded-full h-1.5"><div className="bg-brand-accent-cyan h-1.5 rounded-full" style={{width: `${(completedSubtasks / task.subtasks.length) * 100}%`}}></div></div>
                        </button>
                    </div>
                )}

                {isExpanded && (
                    <div className="space-y-2 pt-2 border-t border-brand-border/30">
                        {task.subtasks.map(st => (
                            <div key={st.id} className="flex items-center gap-2">
                                <input 
                                    type="checkbox" 
                                    id={`subtask-card-${st.id}`}
                                    checked={st.completed}
                                    onChange={() => handleSubtaskToggle(task.id, st.id)}
                                    className="w-4 h-4 text-brand-accent-cyan bg-slate-700 border-slate-600 focus:ring-brand-accent-cyan rounded cursor-pointer" 
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <label htmlFor={`subtask-card-${st.id}`} className={`flex-grow text-sm cursor-pointer ${st.completed ? 'line-through text-brand-text-secondary' : 'text-brand-text-primary'}`}>
                                    {st.text}
                                </label>
                            </div>
                        ))}
                    </div>
                )}
                
                <div className="flex justify-between items-end mt-1 pt-2 border-t border-brand-border/50">
                    <div className="flex gap-1 flex-wrap">
                        {task.departmentTags.map(dt => <span key={dt} className="text-xs bg-brand-accent-purple/20 text-brand-accent-purple px-1.5 py-0.5 rounded">{dt}</span>)}
                    </div>
                    <div className="flex -space-x-2">
                        {task.assigneeIds.map(id => {
                           const user = getAssignee(id);
                           return user ? <div key={id} title={user.name} className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold border-2 border-brand-card">{getInitials(user.name)}</div> : null
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-brand-text-primary">Gestión de Tareas</h2>
                    <p className="text-brand-text-secondary">Organiza y da seguimiento al trabajo de tu equipo.</p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por título o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 p-2 pl-10 border border-brand-border bg-brand-bg/50 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent-blue transition-all"
                        />
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-brand-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <button onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }} className="px-4 py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2">
                        <PlusIcon className="w-5 h-5" /> Nueva Tarea
                    </button>
                </div>
            </div>
            
            {isModalOpen && <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveTask} taskToEdit={taskToEdit} users={users} departments={departmentNames} currentUser={currentUser} />}
            
            {taskToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-sm m-4">
                        <h3 className="text-lg font-bold">Eliminar Tarea</h3>
                        <p className="text-brand-text-secondary my-2">¿Estás seguro de que quieres eliminar la tarea "<span className="font-semibold text-brand-text-primary">{taskToDelete.title}</span>"? Esta acción no se puede deshacer.</p>
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={() => setTaskToDelete(null)} className="px-4 py-2 bg-slate-700 rounded-lg">Cancelar</button>
                            <button onClick={async () => {
                                await handleDeleteTask(taskToDelete.id);
                                setTaskToDelete(null);
                            }} className="px-4 py-2 bg-red-600 text-white rounded-lg">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statuses.map(status => (
                    <div key={status} 
                         className={`bg-brand-card/50 border border-brand-border/50 rounded-xl transition-colors duration-300 ${draggedOverColumn === status ? 'bg-brand-accent-blue/20' : ''}`}
                         onDragOver={(e) => e.preventDefault()}
                         onDrop={(e) => handleDrop(e, status)}
                         onDragEnter={() => setDraggedOverColumn(status)}
                         onDragLeave={() => setDraggedOverColumn(null)}
                    >
                         <h3 className="font-bold text-lg text-brand-text-primary p-4 border-b border-brand-border">{status}</h3>
                         <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                            {filteredTasks.filter(t => t.status === status).map(task => <TaskCard key={task.id} task={task} />)}
                         </div>
                    </div>
                ))}
            </div>

        </div>
    );
};
