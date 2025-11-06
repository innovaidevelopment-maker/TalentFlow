import React, { useState, useMemo } from 'react';
import type { EvaluationResult, Employee, Applicant } from '../types';
import { DocumentChartBarIcon } from './icons';

interface EvaluationHistoryProps {
  evaluations: EvaluationResult[];
  employees: Employee[];
  applicants: Applicant[];
  onViewDetails: (evaluationId: string) => void;
  departments: string[];
}

export const EvaluationHistory: React.FC<EvaluationHistoryProps> = ({ evaluations, employees, applicants, onViewDetails, departments }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const getPerson = (personId: string, personType: 'employee' | 'applicant'): Employee | Applicant | undefined => {
      const source = personType === 'employee' ? employees : applicants;
      return source.find(p => p.id === personId);
  };

  const getPersonName = (personId: string, personType: 'employee' | 'applicant') => {
    return getPerson(personId, personType)?.name || 'Desconocido';
  };
  
  const filteredEvaluations = useMemo(() => {
    const sorted = [...evaluations].sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
    
    return sorted.filter(evaluation => {
      const person = getPerson(evaluation.personId, evaluation.personType);
      if (!person) return false;

      // Department filter
      if (departmentFilter !== 'all') {
          if (!('department' in person) || person.department !== departmentFilter) {
              return false;
          }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const lowercasedFilter = searchTerm.toLowerCase();
        const personName = person.name.toLowerCase();
        const personType = (evaluation.personType === 'employee' ? 'empleado' : 'aspirante').toLowerCase();
        const date = new Date(evaluation.evaluatedAt).toLocaleDateString();
        const level = evaluation.level.toLowerCase();
        const score = evaluation.calculatedScores.overall.toFixed(2);
        
        return (
          personName.includes(lowercasedFilter) ||
          personType.includes(lowercasedFilter) ||
          date.includes(lowercasedFilter) ||
          level.includes(lowercasedFilter) ||
          score.includes(lowercasedFilter)
        );
      }
      
      return true;
    });
  }, [evaluations, searchTerm, departmentFilter, employees, applicants]);

  // Pagination logic
  const pageCount = Math.ceil(filteredEvaluations.length / ITEMS_PER_PAGE);
  const paginatedEvaluations = useMemo(() => 
      filteredEvaluations.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
      ), 
  [filteredEvaluations, currentPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1);
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setDepartmentFilter(e.target.value);
      setCurrentPage(1);
  };

  const getScoreColor = (score: number) => {
    if (score < 4) return 'text-red-400';
    if (score < 8) return 'text-yellow-400';
    return 'text-green-400';
  }
  
  const getLevelBadgeColor = (level: string) => {
      switch(level) {
          case 'Bajo': return 'bg-red-900/50 text-red-300 border-red-500/30';
          case 'Medio': return 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30';
          case 'Alto': return 'bg-green-900/50 text-green-300 border-green-500/30';
          default: return 'bg-slate-700 text-slate-300';
      }
  }

  const Pagination = () => (
      <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-brand-text-secondary">
              Mostrando {paginatedEvaluations.length} de {filteredEvaluations.length} resultados
          </span>
          <div className="flex gap-2">
              <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                  Anterior
              </button>
              <span className="px-4 py-2 text-sm bg-brand-bg rounded-lg">
                  {currentPage} / {pageCount || 1}
              </span>
              <button 
                  onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} 
                  disabled={currentPage === pageCount || pageCount === 0}
                  className="px-4 py-2 text-sm bg-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
              >
                  Siguiente
              </button>
          </div>
      </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl">
      <h2 className="text-2xl font-bold text-brand-text-primary mb-6">Historial de Evaluaciones</h2>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, tipo, fecha, nivel o puntuación..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full md:flex-grow p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-2 focus:ring-brand-accent-blue focus:border-brand-accent-blue transition-colors"
        />
        <select
          value={departmentFilter}
          onChange={handleDepartmentChange}
          className="w-full md:w-auto p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-2 focus:ring-brand-accent-blue focus:border-brand-accent-blue transition-colors"
        >
          <option value="all">Todos los Departamentos</option>
          {departments.map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>
      </div>

      {filteredEvaluations.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-brand-border">
              <thead className="bg-white/5">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Tipo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Nivel</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Puntuación</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ver</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {paginatedEvaluations.map(evaluation => (
                  <tr key={evaluation.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{getPersonName(evaluation.personId, evaluation.personType)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{evaluation.personType === 'employee' ? 'Empleado' : 'Aspirante'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{new Date(evaluation.evaluatedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getLevelBadgeColor(evaluation.level)}`}>
                        {evaluation.level}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getScoreColor(evaluation.calculatedScores.overall)}`}>
                      {evaluation.calculatedScores.overall.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => onViewDetails(evaluation.id)} className="text-brand-accent-cyan hover:underline">
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination />
        </>
      ) : (
        <div className="text-center py-12">
            <DocumentChartBarIcon className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-2 text-sm font-medium text-brand-text-primary">
              {evaluations.length > 0 ? 'No se encontraron resultados' : 'No hay evaluaciones'}
            </h3>
            <p className="mt-1 text-sm text-brand-text-secondary">
              {evaluations.length > 0 ? 'Intenta con otros filtros o términos de búsqueda.' : 'Empieza por evaluar a un empleado o aspirante.'}
            </p>
        </div>
      )}
    </div>
  );
};