import React, { useState, useMemo } from 'react';
import type { LevelThreshold, User, UserRole } from '../types';
import { useData } from '../context/DataContext';
import { PlusIcon, TrashIcon } from './icons';
import { UserManagement } from './UserManagement';

interface SettingsProps {
    currentUser: User;
    onChangePassword: (newPassword: string) => Promise<boolean>;
}

export const Settings: React.FC<SettingsProps> = ({ currentUser, onChangePassword }) => {
    const { 
        levelThresholds, setLevelThresholds, 
        departments,
        users,
        logActivity,
        // Fix: Add missing handlers from context
        handleAddDepartment: addDepartment,
        handleDeleteDepartment: deleteDepartment,
        addUser,
        updateUser,
        deleteUser
    } = useData();
    
    const [activeTab, setActiveTab] = useState('account');
    const [localThresholds, setLocalThresholds] = useState<LevelThreshold[]>(
        [...levelThresholds].sort((a, b) => a.threshold - b.threshold)
    );
    const [newDepartment, setNewDepartment] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [departmentToDelete, setDepartmentToDelete] = useState<{ name: string; error?: string } | null>(null);
    const [feedback, setFeedback] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
        setFeedback({ text, type });
        setTimeout(() => setFeedback(null), 3000);
    };
    
    const onAddUser = async (name: string, role: UserRole, password: string) => {
        const org = { name: 'talentflow' }; // Simplified, should get from context if multi-org
        const newUser: Omit<User, 'id'> = { name, role, email: `${name.toLowerCase().replace(' ','')}@${org.name.toLowerCase().replace(' ','')}.com`, password, enabledTools: [], organizationId: currentUser.organizationId };
        const addedUser = await addUser(newUser);
        if (addedUser) {
            await logActivity('CREATE_USER', `Se añadió al usuario: ${name} con el rol ${role}.`, addedUser.id, currentUser);
        }
    };

    const onUpdateUser = async (userId: string, updates: Partial<User>) => {
        const user = users.find(u => u.id === userId);
        if(user) {
            await updateUser(userId, updates);
            await logActivity('UPDATE_USER', `Se actualizaron los datos del usuario: ${user.name}`, userId, currentUser);
        }
    };

    const onDeleteUser = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (user) {
            await deleteUser(userId);
            await logActivity('DELETE_USER', `Se eliminó al usuario: ${user.name}`, userId, currentUser);
        }
    };


    const handleThresholdChange = (index: number, value: string) => {
        const newThresholds = [...localThresholds];
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            newThresholds[index].threshold = numericValue;
            setLocalThresholds(newThresholds);
        }
    };

    const handleNameChange = (index: number, value: string) => {
        const newThresholds = [...localThresholds];
        newThresholds[index].name = value as 'Bajo' | 'Medio' | 'Alto';
        setLocalThresholds(newThresholds);
    }

    const saveThresholdChanges = () => {
        for (let i = 0; i < localThresholds.length - 1; i++) {
            if (localThresholds[i].threshold >= localThresholds[i+1].threshold) {
                showFeedback(`El umbral para "${localThresholds[i].name}" debe ser menor que el de "${localThresholds[i+1].name}".`, 'error');
                return;
            }
        }
        setLevelThresholds(localThresholds); // This can remain a local storage operation
        showFeedback('Ajustes de umbrales guardados con éxito.');
    };

    const handleAddDepartment = async () => {
        if (newDepartment.trim()) {
            const success = await addDepartment(newDepartment.trim(), currentUser);
            if (success) {
                setNewDepartment('');
                showFeedback('Departamento añadido con éxito.');
            } else {
                 showFeedback('El departamento ya existe o hubo un error.', 'error');
            }
        }
    };
    
    const handleDeleteConfirm = async () => {
        if (departmentToDelete) {
            const result = await deleteDepartment(departmentToDelete.name, currentUser);
            if (result.success) {
                showFeedback(`Departamento "${departmentToDelete.name}" eliminado.`);
                setDepartmentToDelete(null);
            } else {
                setDepartmentToDelete(prev => prev ? { ...prev, error: result.message } : null);
            }
        }
    };

    const getRangeText = (index: number): string => {
        const previousThreshold = index > 0 ? localThresholds[index - 1].threshold : 0;
        const currentThreshold = localThresholds[index].threshold;
        return `(Rango: ${previousThreshold.toFixed(1)} - ${currentThreshold.toFixed(1)})`;
    }

    const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        if (currentUser.password !== currentPassword) {
            showFeedback('La contraseña actual es incorrecta.', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showFeedback('Las nuevas contraseñas no coinciden.', 'error');
            return;
        }
        if (!newPassword) {
            showFeedback('La nueva contraseña no puede estar vacía.', 'error');
            return;
        }
        
        const success = await onChangePassword(newPassword);
        if (success) {
            showFeedback('Contraseña actualizada con éxito.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            showFeedback('Error al actualizar la contraseña.', 'error');
        }
    };
    
    const TabButton: React.FC<{name: string, label: string}> = ({ name, label }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === name
                    ? 'border-brand-accent-cyan text-brand-accent-cyan'
                    : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
            }`}
        >
            {label}
        </button>
    );
    
    const departmentNames = useMemo(() => departments.map(d => d.name), [departments]);

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-6">
            <h2 className="text-3xl font-bold text-brand-text-primary mb-6">Ajustes</h2>
            
            <div className="flex border-b border-brand-border mb-6">
                <TabButton name="account" label="Cuenta" />
                {currentUser.role === 'Admin' && (
                    <>
                        <TabButton name="users" label="Usuarios" />
                        <TabButton name="departments" label="Departamentos" />
                        <TabButton name="thresholds" label="Niveles" />
                    </>
                )}
            </div>
            
            <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
                {activeTab === 'account' && (
                    <div className="max-w-md mx-auto">
                        <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Cambiar Contraseña</h3>
                        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Contraseña Actual</label>
                                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Nueva Contraseña</label>
                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Confirmar Nueva Contraseña</label>
                                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" required />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-brand-accent-cyan to-brand-accent-blue text-white font-semibold rounded-lg shadow-md">Actualizar Contraseña</button>
                            </div>
                        </form>
                    </div>
                )}

                {currentUser.role === 'Admin' && activeTab === 'users' && (
                    <UserManagement users={users} currentUser={currentUser} onAddUser={onAddUser} onUpdateUser={onUpdateUser} onDeleteUser={onDeleteUser} />
                )}

                {currentUser.role === 'Admin' && activeTab === 'departments' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-brand-text-primary">Gestión de Departamentos</h3>
                         <div className="flex gap-2">
                            <input type="text" value={newDepartment} onChange={(e) => setNewDepartment(e.target.value)} placeholder="Nombre del nuevo departamento" className="flex-grow p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm"/>
                            <button onClick={handleAddDepartment} className="px-4 py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md flex items-center gap-2"><PlusIcon className="w-5 h-5"/> Añadir</button>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {departmentNames.map(dept => (
                                <span key={dept} className="flex items-center gap-2 bg-slate-700/50 text-sm font-medium px-3 py-1 rounded-full border border-brand-border">
                                    {dept}
                                    <button onClick={() => setDepartmentToDelete({ name: dept })} className="text-red-500 hover:text-red-300"><TrashIcon className="w-4 h-4"/></button>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {currentUser.role === 'Admin' && activeTab === 'thresholds' && (
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-brand-text-primary">Umbrales de Nivel de Evaluación</h3>
                        <p className="text-sm text-brand-text-secondary">Define el límite superior de puntuación para cada nivel.</p>
                        <div className="space-y-3 pt-2">
                            {localThresholds.map((level, index) => (
                                <div key={index} className="grid grid-cols-3 gap-4 items-center p-3 bg-brand-bg/50 rounded-md">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Nombre</label>
                                        <select value={level.name} onChange={(e) => handleNameChange(index, e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                                            <option value="Bajo">Bajo</option>
                                            <option value="Medio">Medio</option>
                                            <option value="Alto">Alto</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Umbral Superior <span className="text-xs text-brand-text-secondary/70">{getRangeText(index)}</span></label>
                                        <input type="number" step="0.1" min={index > 0 ? localThresholds[index-1].threshold : 0} max="10" value={level.threshold} onChange={(e) => handleThresholdChange(index, e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md" disabled={index === localThresholds.length - 1} />
                                        {index === localThresholds.length - 1 && <p className="text-xs text-brand-text-secondary mt-1">El último nivel siempre llega hasta 10.</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div className="flex justify-end">
                            <button onClick={saveThresholdChanges} className="px-6 py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md">Guardar Umbrales</button>
                        </div>
                    </div>
                )}
            </div>

            {departmentToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md m-4">
                        <h3 className="text-xl font-bold mb-2">Confirmar Eliminación</h3>
                        {departmentToDelete.error ? (
                            <div>
                                <p className="text-red-400 mb-4">{departmentToDelete.error}</p>
                                <div className="flex justify-end gap-4 pt-4">
                                    <button onClick={() => setDepartmentToDelete(null)} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Entendido</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-brand-text-secondary">¿Estás seguro de que quieres eliminar el departamento <span className="font-bold text-brand-text-primary">"{departmentToDelete.name}"</span>?</p>
                                <div className="flex justify-end gap-4 pt-6">
                                    <button onClick={() => setDepartmentToDelete(null)} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                                    <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Eliminar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {feedback && (
                <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300 ${feedback.type === 'success' ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                    {feedback.text}
                </div>
            )}
        </div>
    );
};
