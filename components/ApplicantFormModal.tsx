import React, { useState, useEffect } from 'react';
import type { Applicant } from '../types';

interface ApplicantFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (applicant: Applicant) => void;
    applicantToEdit: Applicant | null;
    departments: string[];
}

export const ApplicantFormModal: React.FC<ApplicantFormModalProps> = ({ isOpen, onClose, onSave, applicantToEdit, departments }) => {
    const [formData, setFormData] = useState<Omit<Applicant, 'id'>>({
        name: '',
        positionApplied: '',
        status: 'Nuevo',
        applicationDate: new Date().toISOString().split('T')[0],
        email: '',
        phone: '',
        department: '',
        cvFile: null,
        personalNotes: '',
        organizationId: '' // Will be set by parent, but needs to be in state
    });
    const [cvFileName, setCvFileName] = useState<string | null>(null);

    useEffect(() => {
        if (applicantToEdit) {
            setFormData(applicantToEdit);
            setCvFileName(applicantToEdit.cvFile?.name || null);
        } else {
            setFormData({
                name: '',
                positionApplied: '',
                status: 'Nuevo',
                applicationDate: new Date().toISOString().split('T')[0],
                email: '',
                phone: '',
                department: '',
                cvFile: null,
                personalNotes: '',
                organizationId: '' // Will be set by parent, but needs to be in state
            });
            setCvFileName(null);
        }
    }, [applicantToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        onSave({ ...formData, id: applicantToEdit?.id || '' }); // id is managed by parent
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
            <div className="bg-brand-card border border-brand-border rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-brand-border">
                    <h3 className="text-xl font-bold">{applicantToEdit ? 'Editar Aspirante' : 'Añadir Nuevo Aspirante'}</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField name="name" label="Nombre Completo" value={formData.name} required />
                        <FormField name="positionApplied" label="Puesto Solicitado" value={formData.positionApplied} required />
                         <FormField name="department" label="Departamento">
                           <select name="department" id="department" value={formData.department || ''} onChange={handleChange} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                               <option value="">Seleccionar departamento...</option>
                               {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                           </select>
                       </FormField>
                        <FormField name="email" label="Email" type="email" value={formData.email} />
                        <FormField name="phone" label="Teléfono" value={formData.phone} />
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-brand-text-secondary mb-1">Adjuntar CV (.pdf, .doc)</label>
                         <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent-cyan/20 file:text-brand-accent-cyan hover:file:bg-brand-accent-cyan/30" />
                         {cvFileName && <p className="text-xs mt-2 text-green-400">Archivo actual: {cvFileName}</p>}
                    </div>
                     <FormField name="personalNotes" label="Notas Adicionales">
                        <textarea name="personalNotes" id="personalNotes" value={formData.personalNotes} onChange={handleChange} rows={4} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md"></textarea>
                    </FormField>
                </form>
                 <div className="flex justify-end gap-4 p-6 border-t border-brand-border mt-auto">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600">Cancelar</button>
                    <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-gradient-to-r from-brand-accent-cyan to-brand-accent-blue text-white font-semibold rounded-lg">Guardar</button>
                </div>
            </div>
        </div>
    );
};