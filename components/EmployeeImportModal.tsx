import React, { useState } from 'react';
import type { Employee } from '../types';
import { ArrowDownTrayIcon, ArrowUpTrayIcon, XMarkIcon, CheckCircleIcon } from './icons';

type CSVError = {
    line: number;
    message: string;
    row: string;
};

type ParsedResult = {
    validEmployees: Omit<Employee, 'id'>[];
    errors: CSVError[];
    newDepartments: Set<string>;
};

const REQUIRED_HEADERS = ['name', 'role', 'department', 'employeeCode', 'email'];

const CSV_TEMPLATE_HEADERS = "name,role,department,employeeCode,email,phone,hireDate,address,emergencyContactName,emergencyContactPhone\n";
const CSV_TEMPLATE_EXAMPLE = "Juan Pérez,Desarrollador,Tecnología,EMP001,juan.perez@example.com,555-1234,2023-01-15,Calle Falsa 123,Ana Pérez,555-4321\n";

export const EmployeeImportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onImport: (employees: Omit<Employee, 'id'>[], newDepartments: string[]) => void;
    existingEmployees: Employee[];
    organizationId: string;
}> = ({ isOpen, onClose, onImport, existingEmployees, organizationId }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [parsedResult, setParsedResult] = useState<ParsedResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const resetState = () => {
        setStep(1);
        setFile(null);
        setParsedResult(null);
        setIsProcessing(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
        }
    };

    const parseAndValidateCSV = (csvText: string): ParsedResult => {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) {
            return { validEmployees: [], newDepartments: new Set(), errors: [{ line: 1, message: 'El archivo CSV está vacío o solo contiene cabeceras.', row: '' }] };
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
            return { validEmployees: [], newDepartments: new Set(), errors: [{ line: 1, message: `Faltan las siguientes cabeceras obligatorias: ${missingHeaders.join(', ')}`, row: lines[0] }] };
        }

        const validEmployees: Omit<Employee, 'id'>[] = [];
        const errors: CSVError[] = [];
        const newDepartments = new Set<string>();
        const existingEmails = new Set(existingEmployees.map(e => e.email));
        const existingCodes = new Set(existingEmployees.map(e => e.employeeCode));
        const fileEmails = new Set<string>();
        const fileCodes = new Set<string>();

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const values = line.split(',');
            const rowData: any = headers.reduce((obj, header, index) => {
                obj[header] = values[index]?.trim() || '';
                return obj;
            }, {} as any);

            // Validation
            if (!rowData.name || !rowData.role || !rowData.department || !rowData.employeeCode || !rowData.email) {
                errors.push({ line: i + 1, message: 'Faltan uno o más campos obligatorios (name, role, department, employeeCode, email).', row: line });
                continue;
            }
            if (existingEmails.has(rowData.email) || fileEmails.has(rowData.email)) {
                errors.push({ line: i + 1, message: `El email '${rowData.email}' ya existe.`, row: line });
                continue;
            }
            if (existingCodes.has(rowData.employeeCode) || fileCodes.has(rowData.employeeCode)) {
                 errors.push({ line: i + 1, message: `El código de empleado '${rowData.employeeCode}' ya existe.`, row: line });
                continue;
            }

            fileEmails.add(rowData.email);
            fileCodes.add(rowData.employeeCode);
            newDepartments.add(rowData.department);
            
            validEmployees.push({
                name: rowData.name,
                role: rowData.role,
                department: rowData.department,
                employeeCode: rowData.employeeCode,
                email: rowData.email,
                phone: rowData.phone || '',
                hireDate: rowData.hireDate || '',
                address: rowData.address || '',
                emergencyContactName: rowData.emergencyContactName || '',
                emergencyContactPhone: rowData.emergencyContactPhone || '',
                cvFile: null,
                personalNotes: '',
                organizationId: organizationId,
            });
        }
        
        return { validEmployees, errors, newDepartments };
    };

    const handleProcessFile = () => {
        if (!file) return;
        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = parseAndValidateCSV(event.target?.result as string);
            setParsedResult(result);
            setStep(2);
            setIsProcessing(false);
        };
        reader.readAsText(file);
    };

    const handleConfirmImport = () => {
        if (parsedResult && parsedResult.validEmployees.length > 0) {
            const depts = Array.from(parsedResult.newDepartments);
            onImport(parsedResult.validEmployees, depts);
            setStep(3);
        }
    };
    
    const downloadFile = (content: string, fileName: string, mimeType: string) => {
         const blob = new Blob([content], { type: mimeType });
         const link = document.createElement('a');
         link.href = URL.createObjectURL(blob);
         link.download = fileName;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-brand-card border border-brand-border rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-brand-border flex justify-between items-center">
                    <h3 className="text-xl font-bold">Importar Empleados desde CSV</h3>
                    <button onClick={handleClose}><XMarkIcon className="w-6 h-6"/></button>
                </div>
                
                {/* Step 1: Upload */}
                {step === 1 && (
                    <div className="p-6 space-y-4 text-center">
                        <h4 className="text-lg font-semibold">Paso 1: Sube tu archivo CSV</h4>
                        <p className="text-sm text-brand-text-secondary">Asegúrate de que tu archivo tenga las cabeceras requeridas: <code className="text-xs bg-brand-bg p-1 rounded">name, role, department, employeeCode, email</code>.</p>
                        <button onClick={() => downloadFile(CSV_TEMPLATE_HEADERS + CSV_TEMPLATE_EXAMPLE, 'plantilla_empleados.csv', 'text/csv')} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg">
                            <ArrowDownTrayIcon className="w-5 h-5"/> Descargar Plantilla
                        </button>
                        <div className="border-2 border-dashed border-brand-border p-8 rounded-lg">
                            <ArrowUpTrayIcon className="w-12 h-12 mx-auto text-brand-text-secondary"/>
                            <input type="file" accept=".csv" onChange={handleFileChange} className="mt-4 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-accent-cyan/20 file:text-brand-accent-cyan hover:file:bg-brand-accent-cyan/30"/>
                        </div>
                        <div className="flex justify-end pt-4">
                            <button onClick={handleProcessFile} disabled={!file || isProcessing} className="px-6 py-2 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-semibold rounded-lg disabled:opacity-50">
                                {isProcessing ? 'Procesando...' : 'Siguiente'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Preview & Confirm */}
                {step === 2 && parsedResult && (
                    <div className="p-6 flex flex-col flex-grow min-h-0">
                        <h4 className="text-lg font-semibold">Paso 2: Vista Previa y Confirmación</h4>
                        
                        <div className="my-4 p-4 bg-green-900/50 border border-green-500/30 rounded-lg">
                            <p>Se importarán <strong className="text-green-300">{parsedResult.validEmployees.length}</strong> nuevos empleados.</p>
                            {parsedResult.newDepartments.size > 0 && <p>Se crearán <strong className="text-green-300">{parsedResult.newDepartments.size}</strong> nuevos departamentos.</p>}
                        </div>

                        {parsedResult.errors.length > 0 && (
                            <div className="my-4 p-4 bg-red-900/50 border border-red-500/30 rounded-lg">
                                <p><strong className="text-red-300">{parsedResult.errors.length}</strong> filas tienen errores y no se importarán.</p>
                                <button onClick={() => downloadFile(
                                    "line,message,row_content\n" + parsedResult.errors.map(e => `${e.line},"${e.message.replace(/"/g, '""')}",${e.row}`).join('\n'),
                                    'reporte_de_errores.csv', 'text/csv'
                                )} className="text-xs text-red-300 underline mt-1">Descargar reporte de errores</button>
                            </div>
                        )}
                        
                        <div className="flex-grow overflow-y-auto border border-brand-border rounded-lg">
                             <table className="min-w-full text-sm">
                                <thead className="bg-white/5"><tr className="text-left text-brand-text-secondary">{REQUIRED_HEADERS.map(h => <th key={h} className="p-2 font-medium">{h}</th>)}</tr></thead>
                                <tbody className="divide-y divide-brand-border">
                                    {parsedResult.validEmployees.slice(0, 10).map((emp, i) => (
                                        <tr key={i}><td className="p-2">{emp.name}</td><td className="p-2">{emp.role}</td><td className="p-2">{emp.department}</td><td className="p-2">{emp.employeeCode}</td><td className="p-2">{emp.email}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                             {parsedResult.validEmployees.length > 10 && <p className="text-center text-xs p-2 text-brand-text-secondary">Mostrando 10 de {parsedResult.validEmployees.length} registros válidos.</p>}
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 mt-auto">
                            <button onClick={() => setStep(1)} className="px-6 py-2 bg-slate-700 rounded-lg">Volver</button>
                            <button onClick={handleConfirmImport} disabled={parsedResult.validEmployees.length === 0} className="px-6 py-2 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-semibold rounded-lg disabled:opacity-50">Confirmar Importación</button>
                        </div>
                    </div>
                )}

                {/* Step 3: Result */}
                {step === 3 && parsedResult && (
                    <div className="p-8 text-center flex-grow flex flex-col justify-center">
                        <CheckCircleIcon className="w-16 h-16 mx-auto text-green-400"/>
                        <h4 className="text-2xl font-bold mt-4">¡Importación Exitosa!</h4>
                        <p className="mt-2 text-brand-text-secondary">{parsedResult.validEmployees.length} nuevos empleados han sido añadidos a tu sistema.</p>
                        <button onClick={handleClose} className="mt-6 px-6 py-2 bg-slate-700 rounded-lg mx-auto">Cerrar</button>
                    </div>
                )}
            </div>
        </div>
    );
};