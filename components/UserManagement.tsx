import React, { useState, useEffect } from 'react';
import type { User, UserRole } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './icons';

interface UserManagementProps {
    users: User[];
    currentUser: User;
    onAddUser: (name: string, role: UserRole, password: string) => void;
    onUpdateUser: (userId: string, updates: Partial<User>) => void;
    onDeleteUser: (userId: string) => void;
}

const ALL_TOOLS = [
    { id: 'recruitment', name: 'Reclutamiento' },
    { id: 'employees', name: 'Gestión de Empleados' },
    { id: 'attendance', name: 'Asistencia Diaria' },
    { id: 'attendanceAnalytics', name: 'Análisis de Asistencia' },
    { id: 'dashboard', name: 'Panel de Evaluaciones' },
    { id: 'evaluateEmployees', name: 'Evaluar Empleados' },
    { id: 'criteria', name: 'Criterios de Evaluación (Admin)' },
    { id: 'history', name: 'Historial de Evaluaciones' },
    { id: 'promotions', name: 'Panel de Promociones' },
    { id: 'talentMatrix', name: 'Matriz de Talento' },
    { id: 'flightRisk', name: 'Riesgo de Fuga' },
    { id: 'calendar', name: 'Calendario' },
    { id: 'chat', name: 'Chat Interno' },
    { id: 'tasks', name: 'Gestión de Tareas' },
];


export const UserManagement: React.FC<UserManagementProps> = ({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser }) => {
    // State for adding a new user
    const [newUserName, setNewUserName] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('Usuario');
    const [newUserPassword, setNewUserPassword] = useState('');

    // State for modals
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // State for the edit form
    const [editedName, setEditedName] = useState('');
    const [editedRole, setEditedRole] = useState<UserRole>('Usuario');
    const [newPassword, setNewPassword] = useState('');
    const [editedEnabledTools, setEditedEnabledTools] = useState<Set<string>>(new Set());


    // State for feedback toast
    const [feedback, setFeedback] = useState<string | null>(null);

    useEffect(() => {
        if (userToEdit) {
            setEditedName(userToEdit.name);
            setEditedRole(userToEdit.role);
            setNewPassword(''); // Clear password field on modal open
            setEditedEnabledTools(new Set(userToEdit.enabledTools || []));
        }
    }, [userToEdit]);
    
    const showFeedback = (message: string) => {
        setFeedback(message);
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserName.trim() && newUserPassword.trim()) {
            onAddUser(newUserName.trim(), newUserRole, newUserPassword.trim());
            showFeedback(`Usuario "${newUserName.trim()}" añadido. Edítalo para asignarle herramientas.`);
            setNewUserName('');
            setNewUserRole('Usuario');
            setNewUserPassword('');
        }
    };

    const handleToolToggle = (toolId: string) => {
        setEditedEnabledTools(prev => {
            const newSet = new Set(prev);
            if (newSet.has(toolId)) {
                newSet.delete(toolId);
            } else {
                newSet.add(toolId);
            }
            return newSet;
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userToEdit) return;
        
        const updates: Partial<User> = {
            name: editedName.trim(),
            role: editedRole,
            enabledTools: Array.from(editedEnabledTools),
        };
        // Only include password if it's been changed
        if (newPassword.trim()) {
            updates.password = newPassword.trim();
        }

        onUpdateUser(userToEdit.id, updates);
        showFeedback(`Usuario "${editedName.trim()}" actualizado.`);
        setUserToEdit(null);
    };

    const handleDeleteConfirm = () => {
        if (userToDelete) {
            onDeleteUser(userToDelete.id);
            showFeedback(`Usuario "${userToDelete.name}" eliminado.`);
            setUserToDelete(null);
        }
    };

    return (
        <div className="space-y-8">
            {/* Add User Form */}
            <div>
                <h3 className="text-xl font-bold mb-4 text-brand-text-primary">Añadir Nuevo Usuario</h3>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 bg-brand-bg/50 rounded-lg">
                    <div className="md:col-span-1">
                        <label htmlFor="user-name" className="block text-sm font-medium text-brand-text-secondary mb-1">Nombre de Usuario</label>
                        <input
                            id="user-name"
                            type="text"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            placeholder="Ej: Juan García"
                            className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-brand-accent-blue focus:border-brand-accent-blue"
                            required
                        />
                    </div>
                     <div className="md:col-span-1">
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Contraseña</label>
                        <input
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Contraseña inicial"
                            className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm"
                            required
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label htmlFor="user-role" className="block text-sm font-medium text-brand-text-secondary mb-1">Rol</label>
                        <select
                            id="user-role"
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                            className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-brand-accent-blue focus:border-brand-accent-blue"
                        >
                            <option value="Usuario">Usuario</option>
                            <option value="Admin">Admin</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-indigo/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        disabled={!newUserName.trim() || !newUserPassword.trim()}
                    >
                        <PlusIcon className="w-5 h-5" />
                        Añadir
                    </button>
                </form>
            </div>

            {/* Users Table */}
            <div>
                 <h3 className="text-xl font-bold mb-4 text-brand-text-primary">Lista de Usuarios</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                         <thead className="bg-white/5">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Nombre de Usuario</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Rol</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{user.name} {user.id === currentUser.id && '(Tú)'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{user.role}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-4">
                                            <button
                                                onClick={() => setUserToEdit(user)}
                                                className="text-brand-accent-blue hover:text-brand-accent-cyan p-1"
                                                aria-label={`Editar ${user.name}`}
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setUserToDelete(user)}
                                                className="text-red-500 hover:text-red-400 p-1 disabled:text-slate-600 disabled:cursor-not-allowed"
                                                disabled={user.id === currentUser.id}
                                                aria-label={`Eliminar ${user.name}`}
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            {/* Edit User Modal */}
            {userToEdit && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-lg m-4 max-h-[90vh] flex flex-col">
                        <h3 className="text-xl font-bold mb-4">Editando a {userToEdit.name}</h3>
                        <form onSubmit={handleEditSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2" id="user-edit-form">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Nombre</label>
                                <input type="text" value={editedName} onChange={e => setEditedName(e.target.value)} className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Rol</label>
                                <select value={editedRole} onChange={e => setEditedRole(e.target.value as UserRole)} className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm" disabled={userToEdit.id === currentUser.id}>
                                    <option value="Usuario">Usuario</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Nueva Contraseña (opcional)</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar" className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Herramientas Habilitadas</label>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-3 bg-brand-bg/50 rounded-lg border border-brand-border/50">
                                    {ALL_TOOLS.map(tool => (
                                        <div key={tool.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`tool-${tool.id}`}
                                                checked={editedEnabledTools.has(tool.id)}
                                                onChange={() => handleToolToggle(tool.id)}
                                                className="h-4 w-4 rounded bg-brand-bg border-brand-border text-brand-accent-cyan focus:ring-brand-accent-cyan"
                                            />
                                            <label htmlFor={`tool-${tool.id}`} className="ml-2 text-sm text-brand-text-primary">{tool.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                         <div className="flex justify-end gap-4 pt-4 mt-auto">
                            <button type="button" onClick={() => setUserToEdit(null)} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                            <button type="submit" form="user-edit-form" className="px-4 py-2 bg-gradient-to-r from-brand-accent-cyan to-brand-accent-blue text-white font-semibold rounded-lg">Guardar Cambios</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md m-4">
                        <h3 className="text-xl font-bold mb-2">Confirmar Eliminación</h3>
                        <p className="text-brand-text-secondary">¿Estás seguro de que quieres eliminar al usuario <span className="font-bold text-brand-text-primary">{userToDelete.name}</span>? Esta acción no se puede deshacer.</p>
                        <div className="flex justify-end gap-4 pt-6">
                            <button onClick={() => setUserToDelete(null)} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                            <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Eliminar Usuario</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Feedback Toast */}
            {feedback && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-500/80 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300">
                    {feedback}
                </div>
            )}
        </div>
    );
};