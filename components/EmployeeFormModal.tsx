import React, { useState, useEffect } from 'react';
import type { Employee } from '../types';

interface EmployeeFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (employee: Employee) => void;
    employeeToEdit: Employee | null;
    departments: string[];
    organizationId: string;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ isOpen, onClose, onSave, employeeToEdit, departments, organizationId }) => {
    // Fix: Add missing organizationId to initial state
    const [formData, setFormData] = useState<Omit<Employee, 'id'>>({
        name: '', role: '', department: '', employeeCode: '',
        email: '', phone: '', address: '', hireDate: '',
        emergencyContactName: '', emergencyContactPhone: '',
        cvFile: null, personalNotes: '', organizationId: organizationId || ''
    });
    const [cvFileName, setCvFileName] = useState<string | null>(null);

    useEffect(() => {
        if (employeeToEdit) {
            setFormData(employeeToEdit);
            setCvFileName(employeeToEdit.cvFile?.name || null);
        } else {
            // Reset form for new entry
            // Fix: Add missing organizationId to state update
            setFormData({
                name: '', role: '', department: '', employeeCode: '',
                email: '', phone: '', address: '', hireDate: '',
                emergencyContactName: '', emergencyContactPhone: '',
                cvFile: null, personalNotes: '', organizationId: organizationId
            });
            setCvFileName(null);
        }
    }, [employeeToEdit, isOpen, organizationId]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({
                    ...prev,
                    cvFile: {
                        name: file.name,
                        type: file.type,
                        data: event.target?.result as string
                    }
                }));
                setCvFileName(file.name);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: employeeToEdit?.id || '' }); // id is managed by parent
    };
    
    const FormField: React.FC<{ name: string, label: string, type?: string, required?: boolean, value?: string, children?: React.ReactNode }> = ({ name, label, type = 'text', required = false, value, children }) => (
         <div>
            <label htmlFor={name} className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
            {children ? children : (
                <input 
                    type={type} 
                    name={name} 
                    id={name} 
                    value={value || ''} 
                    onChange={handleChange} 
                    required={required}
                    className="w-full p-2 bg-brand-bg border border-brand-border rounded-md"
                />
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-brand-card border border-brand-border rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-brand-border">
                    <h3 className="text-xl font-bold">{employeeToEdit ? 'Editar Empleado' : 'Añadir Nuevo Empleado'}</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                    {/* Section: Professional Info */}
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <legend className="text-lg font-semibold text-brand-accent-cyan col-span-full mb-2">Información Profesional</legend>
                        <FormField name="name" label="Nombre Completo" value={formData.name} required />
                        <FormField name="role" label="Puesto" value={formData.role} required />
                        <FormField name="department" label="Departamento">
                             <select name="department" id="department" value={formData.department} onChange={handleChange} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                                <option value="">Seleccionar...</option>
                                {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                            </select>
                        </FormField>
                        <FormField name="employeeCode" label="Código Empleado" value={formData.employeeCode} />
                        <FormField name="hireDate" label="Fecha Contratación" type="date" value={formData.hireDate} />
                    </fieldset>

                    {/* Section: Contact Info */}
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <legend className="text-lg font-semibold text-brand-accent-cyan col-span-full mb-2">Información de Contacto</legend>
                        <FormField name="email" label="Email" type="email" value={formData.email} />
                        <FormField name="phone" label="Teléfono" value={formData.phone} />
                        <FormField name="address" label="Dirección" value={formData.address} />
                    </fieldset>

                    {/* Section: Emergency Contact */}
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <legend className="text-lg font-semibold text-brand-accent-cyan col-span-full mb-2">Contacto de Emergencia</legend>
                        <FormField name="emergencyContactName" label="Nombre Contacto" value={formData.emergencyContactName} />
                        <FormField name="emergencyContactPhone" label="Teléfono Contacto" value={formData.emergencyContactPhone} />
                    </fieldset>
                    
                    {/* Section: Documents & Notes */}
                    <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <legend className="text-lg font-semibold text-brand-accent-cyan col-span-full mb-2">Documentos y Notas</legend>
                        <div>
                             <label className="block text-sm font-medium text-brand-text-secondary mb-1">Adjuntar CV (.pdf, .doc)</label>
                             <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent-cyan/20 file:text-brand-accent-cyan hover:file:bg-brand-accent-cyan/30" />
                             {cvFileName && <p className="text-xs mt-2 text-green-400">Archivo actual: {cvFileName}</p>}
                        </div>
                         <FormField name="personalNotes" label="Notas Adicionales">
                            <textarea name="personalNotes" id="personalNotes" value={formData.personalNotes} onChange={handleChange} rows={3} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md"></textarea>
                        </FormField>
                    </fieldset>

                </form>
                <div className="flex justify-end gap-4 p-6 border-t border-brand-border mt-auto">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-gradient-to-r from-brand-accent-cyan to-brand-accent-blue text-white font-semibold rounded-lg">Guardar</button>
                </div>
            </div>
        </div>
    );
};