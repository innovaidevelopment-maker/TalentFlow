import React, { useState, useMemo } from 'react';
import type { Employee, User } from '../types';
import { useData } from '../context/DataContext';
import { PlusIcon, TrashIcon, PencilIcon, ArrowUpTrayIcon } from './icons';
import { EmployeeFormModal } from './EmployeeFormModal';
import { EmployeeImportModal } from './EmployeeImportModal';

interface EmployeeManagementProps {
    currentUser: User;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ currentUser }) => {
    const { employees, handleSaveEmployee, handleDeleteEmployee, handleImportEmployees } = useData();
    const organizationDepartments = useMemo(() => {
        const depts = new Set(employees.map(e => e.department).filter(Boolean));
        return Array.from(depts) as string[];
    }, [employees]);


    // State for modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

    // State for filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('all');

    // State for feedback toast
    const [feedback, setFeedback] = useState<string | null>(null);
    
    const showFeedback = (message: string) => {
        setFeedback(message);
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleOpenAddModal = () => {
        setEmployeeToEdit(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditModal = (employee: Employee) => {
        setEmployeeToEdit(employee);
        setIsFormModalOpen(true);
    };

    const handleSave = (employeeData: Employee) => {
        const isEditing = !!employeeToEdit;
        handleSaveEmployee(employeeData, isEditing, currentUser);
        showFeedback(`Empleado "${employeeData.name}" ${isEditing ? 'actualizado' : 'añadido'} con éxito.`);
        setIsFormModalOpen(false);
    };

    const handleDelete = () => {
        if (employeeToDelete) {
            handleDeleteEmployee(employeeToDelete.id, currentUser);
            showFeedback(`Empleado "${employeeToDelete.name}" eliminado.`);
            setEmployeeToDelete(null);
        }
    };
    
    const handleImport = (newEmployees: Omit<Employee, 'id'>[], newDepartments: string[]) => {
        handleImportEmployees(newEmployees, newDepartments, currentUser);
        showFeedback(`${newEmployees.length} empleados importados con éxito.`);
    };

    const filteredEmployees = useMemo(() => {
        return employees.filter(employee => {
            const searchTermLower = searchTerm.toLowerCase();
            const matchesSearch = searchTermLower === '' ||
                employee.name.toLowerCase().includes(searchTermLower) ||
                employee.role.toLowerCase().includes(searchTermLower) ||
                (employee.employeeCode && employee.employeeCode.toLowerCase().includes(searchTermLower));

            const matchesDepartment = departmentFilter === 'all' ||
                employee.department === departmentFilter;

            return matchesSearch && matchesDepartment;
        });
    }, [employees, searchTerm, departmentFilter]);
    
    // Welcome Assistant for first time use
    const WelcomeAssistant = () => (
        <div className="text-center py-20 bg-brand-card border border-brand-border rounded-xl">
            <h2 className="text-3xl font-bold text-brand-text-primary">¡Bienvenido a la Gestión de Personal!</h2>
            <p className="mt-2 text-lg text-brand-text-secondary">Para empezar, necesitas añadir a tus empleados al sistema.</p>
            <div className="mt-8 flex justify-center gap-4">
                <button 
                    onClick={handleOpenAddModal}
                    className="px-6 py-3 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" /> Añadir mi primer empleado
                </button>
                 {currentUser.role === 'Admin' && (
                    <button 
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg shadow-md flex items-center gap-2"
                    >
                        <ArrowUpTrayIcon className="w-5 h-5" /> Importar múltiples empleados (CSV)
                    </button>
                )}
            </div>
        </div>
    );


    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
            <EmployeeFormModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSave}
                employeeToEdit={employeeToEdit}
                departments={organizationDepartments}
                organizationId={currentUser.organizationId}
            />
            <EmployeeImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
                existingEmployees={employees}
                organizationId={currentUser.organizationId}
            />
            
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-brand-text-primary">Gestión de Empleados</h2>
                {employees.length > 0 && (
                     <div className="flex gap-4">
                        {currentUser.role === 'Admin' && (
                            <button 
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2"
                            >
                                <ArrowUpTrayIcon className="w-5 h-5" /> Importar Empleados
                            </button>
                        )}
                        <button 
                            onClick={handleOpenAddModal}
                            className="px-4 py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" /> Añadir Empleado
                        </button>
                    </div>
                )}
            </div>
            
            {employees.length === 0 ? <WelcomeAssistant /> : (
                 <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
                 <h2 className="text-2xl font-bold mb-4 text-brand-text-primary">Lista de Empleados</h2>
                 
                 {/* Filters */}
                 <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, puesto, código..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full p-3 pl-10 border border-brand-border bg-brand-bg/50 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent-blue transition-all"
                        />
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-brand-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="p-3 border border-brand-border bg-brand-bg rounded-lg shadow-sm w-full md:w-auto h-full"
                        >
                            <option value="all">Todos los Departamentos</option>
                            {organizationDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                    </div>
                </div>

                 <div className="overflow-x-auto">
                    {filteredEmployees.length > 0 ? (
                        <table className="min-w-full divide-y divide-brand-border">
                             <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Puesto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Departamento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Código</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                                {filteredEmployees.map(employee => (
                                    <tr key={employee.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{employee.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{employee.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{employee.department || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{employee.employeeCode || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end items-center gap-4">
                                                <button onClick={() => handleOpenEditModal(employee)} className="text-brand-accent-blue hover:text-brand-accent-cyan p-1">
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => setEmployeeToDelete(employee)} className="text-red-500 hover:text-red-400 p-1">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <p className="text-center py-8 text-brand-text-secondary">
                            No se encontraron empleados que coincidan con los filtros aplicados.
                        </p>
                    )}
                 </div>
            </div>
            )}
           
            
            {employeeToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-brand-card border border-brand-border rounded-xl p-6 w-full max-w-md m-4">
                        <h3 className="text-xl font-bold mb-2">Confirmar Eliminación</h3>
                        <p className="text-brand-text-secondary">¿Estás seguro de que quieres eliminar a <span className="font-bold text-brand-text-primary">{employeeToDelete.name}</span>?</p>
                        <div className="flex justify-end gap-4 pt-6">
                            <button onClick={() => setEmployeeToDelete(null)} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
            
            {feedback && (
                <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-500/80 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300">
                    {feedback}
                </div>
            )}
        </div>
    );
};