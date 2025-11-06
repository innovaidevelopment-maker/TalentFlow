import React, { useState, useMemo } from 'react';
import type { Employee, EvaluationResult } from '../types';
import { ViewColumnsIcon, ListBulletIcon, ClockIcon } from './icons';

interface EmployeeListProps {
  employees: Employee[];
  onSelectEmployee: (employeeId: string, type: 'employee' | 'applicant') => void;
  departments: string[];
  evaluations: EvaluationResult[];
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onSelectEmployee, departments, evaluations }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [evaluationStatusFilter, setEvaluationStatusFilter] = useState<'all' | 'recent' | 'not_recent'>('all');

  const employeeEvalInfo = useMemo(() => {
    const infoMap = new Map<string, { lastEvaluationDate: Date | null; isRecent: boolean, evaluationCount: number }>();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    employees.forEach(employee => {
        const employeeEvals = evaluations
            .filter(e => e.personId === employee.id && e.personType === 'employee')
            .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());

        if (employeeEvals.length > 0) {
            const lastEvalDate = new Date(employeeEvals[0].evaluatedAt);
            infoMap.set(employee.id, {
                lastEvaluationDate: lastEvalDate,
                isRecent: lastEvalDate > ninetyDaysAgo,
                evaluationCount: employeeEvals.length,
            });
        } else {
            infoMap.set(employee.id, {
                lastEvaluationDate: null,
                isRecent: false,
                evaluationCount: 0,
            });
        }
    });
    return infoMap;
  }, [employees, evaluations]);
  
  const filteredEmployees = useMemo(() => employees.filter(employee => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = employee.name.toLowerCase().includes(term) ||
      employee.role.toLowerCase().includes(term) ||
      (employee.department && employee.department.toLowerCase().includes(term));
      
    if (!matchesSearch) return false;

    if (departmentFilter !== 'all' && employee.department !== departmentFilter) {
        return false;
    }

    const evalInfo = employeeEvalInfo.get(employee.id);
    if (evaluationStatusFilter === 'recent' && !evalInfo?.isRecent) {
        return false;
    }
    if (evaluationStatusFilter === 'not_recent' && evalInfo?.isRecent) {
        return false;
    }

    return true;
  }), [employees, searchTerm, departmentFilter, evaluationStatusFilter, employeeEvalInfo]);

  // Kanban-specific lists
  const employeesWithoutRecentEval = useMemo(() => filteredEmployees.filter(e => !employeeEvalInfo.get(e.id)?.isRecent), [filteredEmployees, employeeEvalInfo]);
  const employeesWithRecentEval = useMemo(() => filteredEmployees.filter(e => employeeEvalInfo.get(e.id)?.isRecent), [filteredEmployees, employeeEvalInfo]);


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
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-brand-text-primary">Seleccionar Empleado para Evaluar</h3>
          <p className="text-sm text-brand-text-secondary">Elige un empleado para iniciar una nueva evaluación de desempeño.</p>
        </div>

        <div className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center flex-wrap">
          <div className="relative flex-grow w-full md:w-auto">
              <input
                  type="text"
                  placeholder="Buscar por nombre, puesto o departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 pl-10 border border-brand-border bg-brand-bg/50 rounded-lg shadow-sm focus:ring-2 focus:ring-brand-accent-blue transition-all"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-brand-text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto flex-wrap">
              <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="p-3 border border-brand-border bg-brand-bg rounded-lg shadow-sm text-sm text-brand-text-primary focus:ring-brand-accent-blue focus:border-brand-accent-blue flex-grow">
                  <option value="all">Todos los Departamentos</option>
                  {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
              </select>
              <select value={evaluationStatusFilter} onChange={(e) => setEvaluationStatusFilter(e.target.value as any)} className="p-3 border border-brand-border bg-brand-bg rounded-lg shadow-sm text-sm text-brand-text-primary focus:ring-brand-accent-blue focus:border-brand-accent-blue flex-grow">
                  <option value="all">Todos los Estados</option>
                  <option value="recent">Evaluados Recientemente</option>
                  <option value="not_recent">Sin Evaluación Reciente</option>
              </select>
          </div>
          <ViewSwitcher />
        </div>
        
        {view === 'list' && (
          <div className="space-y-4">
          {employees.length > 0 ? (
            filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => {
                  const evalInfo = employeeEvalInfo.get(employee.id);
                  const hasBeenEvaluated = !!evalInfo?.lastEvaluationDate;
                  const isRecent = evalInfo?.isRecent ?? false;

                  return (
                      <div key={employee.id} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-4 flex justify-between items-center transition-all duration-300 hover:border-brand-accent-blue/50">
                        <div className="flex items-center gap-4">
                          <span className={`h-3 w-3 rounded-full flex-shrink-0 ${isRecent ? 'bg-green-400' : 'bg-slate-500'}`} title={isRecent ? 'Evaluado en los últimos 90 días' : 'Sin evaluación reciente'}></span>
                          <div>
                              <p className="font-bold text-lg text-brand-text-primary">{employee.name}</p>
                              <p className="text-sm text-brand-text-secondary">{employee.role} {employee.department && ` - ${employee.department}`}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-brand-text-secondary/80">
                                  <ClockIcon className="w-3 h-3" />
                                  <span>{hasBeenEvaluated ? `Última eval: ${evalInfo.lastEvaluationDate.toLocaleDateString()}` : 'Sin evaluar'}</span>
                              </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onSelectEmployee(employee.id, 'employee')}
                          className="px-4 py-2 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-cyan/20 transition-all flex-shrink-0"
                        >
                          {hasBeenEvaluated ? 'Re-evaluar' : 'Evaluar'}
                        </button>
                      </div>
                  )
              })
            ) : (
              <p className="text-center text-brand-text-secondary py-8">No se encontraron empleados que coincidan con los filtros.</p>
            )
          ) : (
            <p className="text-center text-brand-text-secondary py-8">No hay empleados. Añade uno para empezar.</p>
          )}
          </div>
        )}

        {view === 'kanban' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4">
                  <h4 className="font-bold text-lg text-brand-text-primary mb-4 pb-2 border-b border-brand-border">
                    Sin Evaluación Reciente <span className="text-sm font-normal text-brand-text-secondary">({employeesWithoutRecentEval.length})</span>
                  </h4>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {employeesWithoutRecentEval.map(employee => {
                       const evalInfo = employeeEvalInfo.get(employee.id);
                       const hasBeenEvaluated = !!evalInfo?.lastEvaluationDate;
                      return (
                      <div key={employee.id} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-4 transition-all duration-300 hover:border-brand-accent-cyan/50">
                         <div>
                            <p className="font-bold text-md text-brand-text-primary">{employee.name}</p>
                            <p className="text-sm text-brand-text-secondary">{employee.role}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-brand-text-secondary/80">
                                <ClockIcon className="w-3 h-3" />
                                <span>{hasBeenEvaluated ? `Última eval: ${evalInfo.lastEvaluationDate.toLocaleDateString()}` : 'Sin evaluar'}</span>
                            </div>
                        </div>
                        <button
                          onClick={() => onSelectEmployee(employee.id, 'employee')}
                          className="w-full mt-3 px-4 py-2 text-sm bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-cyan/20 transition-all"
                        >
                          {hasBeenEvaluated ? 'Re-evaluar' : 'Evaluar'}
                        </button>
                      </div>
                    )})}
                    {employeesWithoutRecentEval.length === 0 && <p className="text-sm text-center text-brand-text-secondary py-4">No hay empleados por evaluar en esta vista.</p>}
                  </div>
              </div>
              <div className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4">
                  <h4 className="font-bold text-lg text-brand-text-primary mb-4 pb-2 border-b border-brand-border">
                    Evaluados Recientemente <span className="text-sm font-normal text-brand-text-secondary">({employeesWithRecentEval.length})</span>
                  </h4>
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {employeesWithRecentEval.map(employee => {
                      const evalInfo = employeeEvalInfo.get(employee.id);
                      return (
                      <div key={employee.id} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-4 transition-all duration-300 hover:border-brand-accent-purple/50">
                         <div>
                            <p className="font-bold text-md text-brand-text-primary">{employee.name}</p>
                            <p className="text-sm text-brand-text-secondary">{employee.role}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-brand-text-secondary/80">
                                <ClockIcon className="w-3 h-3" />
                                <span>{evalInfo?.lastEvaluationDate ? `Última eval: ${evalInfo.lastEvaluationDate.toLocaleDateString()}` : 'Sin evaluar'}</span>
                            </div>
                        </div>
                        <button
                          onClick={() => onSelectEmployee(employee.id, 'employee')}
                          className="w-full mt-3 px-4 py-2 text-sm bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-bold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-purple/20 transition-all"
                        >
                          Re-evaluar
                        </button>
                      </div>
                    )})}
                     {employeesWithRecentEval.length === 0 && <p className="text-sm text-center text-brand-text-secondary py-4">Ningún empleado evaluado recientemente en esta vista.</p>}
                  </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};