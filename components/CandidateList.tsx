import React, { useState, useMemo } from 'react';
import type { Employee, EvaluationResult } from '../types';
import { ViewColumnsIcon, ListBulletIcon } from './icons';

interface EmployeeListProps {
  employees: Employee[];
  onSelectEmployee: (employeeId: string, type: 'employee' | 'applicant') => void;
  departments: string[];
  evaluations: EvaluationResult[];
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onSelectEmployee, departments, evaluations }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [kanbanDepartment, setKanbanDepartment] = useState('all');
  
  const filteredEmployees = useMemo(() => employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  ), [employees, searchTerm]);

  const evaluatedEmployeeIds = useMemo(() => new Set(evaluations.filter(e => e.personType === 'employee').map(e => e.personId)), [evaluations]);
  
  const kanbanEmployees = useMemo(() => {
    if (kanbanDepartment === 'all') {
        return filteredEmployees;
    }
    return filteredEmployees.filter(c => c.department === kanbanDepartment);
  }, [filteredEmployees, kanbanDepartment]);
  
  const notEvaluatedEmployees = kanbanEmployees.filter(c => !evaluatedEmployeeIds.has(c.id));
  const evaluatedEmployees = kanbanEmployees.filter(c => evaluatedEmployeeIds.has(c.id));


  const ViewSwitcher = () => (
    <div className="flex items-center gap-1 p-1 bg-brand-bg rounded-lg border border-brand-border">
      <button
        onClick={() => setView('list')}
        className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${view === 'list' ? 'bg-brand-accent-blue/20 text-brand-accent-cyan' : 'text-brand-text-secondary hover:bg-slate-700'}`}
      >
        <ListBulletIcon className="w-5 h-5" />
        Lista
      </button>
      <button
        onClick={() => setView('kanban')}
        className={`px-3 py-1 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${view === 'kanban' ? 'bg-brand-accent-blue/20 text-brand-accent-cyan' : 'text-brand-text-secondary hover:bg-slate-700'}`}
      >
        <ViewColumnsIcon className="w-5 h-5" />
        Kanban
      </button>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-brand-text-primary">Seleccionar Empleado para Evaluar</h3>
              <p className="text-sm text-brand-text-secondary">Elige un empleado para iniciar una nueva evaluación de desempeño.</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <ViewSwitcher />
              {view === 'kanban' && (
                <div className="relative">
                    <select
                        value={kanbanDepartment}
                        onChange={(e) => setKanbanDepartment(e.target.value)}
                        className="appearance-none p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm text-sm text-brand-text-primary focus:ring-brand-accent-blue focus:border-brand-accent-blue pr-8"
                    >
                        <option value="all">Todos los Departamentos</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-brand-text-secondary">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>
              )}
            </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, puesto o departamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-brand-border bg-brand-bg/50 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent-blue focus:border-brand-accent-blue transition-all"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-brand-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {view === 'list' && (
          <div className="space-y-4">
          {employees.length > 0 ? (
            filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => (
                  <div key={employee.id} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-4 flex justify-between items-center transition-all duration-300 hover:border-brand-accent-blue/50">
                    <div className="flex items-center gap-4">
                      <div>
                          <p className="font-bold text-lg text-brand-text-primary">{employee.name}</p>
                          <p className="text-sm text-brand-text-secondary">{employee.role}</p>
                          {employee.department && <p className="text-xs text-brand-text-secondary/70">{employee.department}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => onSelectEmployee(employee.id, 'employee')}
                      className="px-4 py-2 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-cyan/20 transition-all"
                    >
                      Evaluar
                    </button>
                  </div>
                ))
            ) : (
              <p className="text-center text-brand-text-secondary py-8">No se encontraron empleados que coincidan con la búsqueda.</p>
            )
          ) : (
            <p className="text-center text-brand-text-secondary py-8">No hay empleados. Añade uno para empezar.</p>
          )}
          </div>
        )}

        {view === 'kanban' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Kanban Column: Not Evaluated */}
              <div className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4">
                  <h4 className="font-bold text-lg text-brand-text-primary mb-4 pb-2 border-b border-brand-border">
                    Sin Evaluar <span className="text-sm font-normal text-brand-text-secondary">({notEvaluatedEmployees.length})</span>
                  </h4>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {notEvaluatedEmployees.map(employee => (
                      <div key={employee.id} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-4 transition-all duration-300 hover:border-brand-accent-cyan/50">
                         <div>
                            <p className="font-bold text-md text-brand-text-primary">{employee.name}</p>
                            <p className="text-sm text-brand-text-secondary">{employee.role}</p>
                            {employee.department && <p className="text-xs text-brand-text-secondary/70">{employee.department}</p>}
                        </div>
                        <button
                          onClick={() => onSelectEmployee(employee.id, 'employee')}
                          className="w-full mt-3 px-4 py-2 text-sm bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-cyan/20 transition-all"
                        >
                          Evaluar
                        </button>
                      </div>
                    ))}
                    {notEvaluatedEmployees.length === 0 && <p className="text-sm text-center text-brand-text-secondary py-4">No hay empleados por evaluar en esta vista.</p>}
                  </div>
              </div>
              {/* Kanban Column: Evaluated */}
              <div className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4">
                  <h4 className="font-bold text-lg text-brand-text-primary mb-4 pb-2 border-b border-brand-border">
                    Evaluados <span className="text-sm font-normal text-brand-text-secondary">({evaluatedEmployees.length})</span>
                  </h4>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {evaluatedEmployees.map(employee => (
                      <div key={employee.id} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-4 transition-all duration-300 hover:border-brand-accent-purple/50">
                         <div>
                            <p className="font-bold text-md text-brand-text-primary">{employee.name}</p>
                            <p className="text-sm text-brand-text-secondary">{employee.role}</p>
                            {employee.department && <p className="text-xs text-brand-text-secondary/70">{employee.department}</p>}
                        </div>
                        <button
                          onClick={() => onSelectEmployee(employee.id, 'employee')}
                          className="w-full mt-3 px-4 py-2 text-sm bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-purple/20 transition-all"
                        >
                          Re-evaluar
                        </button>
                      </div>
                    ))}
                     {evaluatedEmployees.length === 0 && <p className="text-sm text-center text-brand-text-secondary py-4">Ningún empleado evaluado en esta vista.</p>}
                  </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};