import React, { useState, useMemo } from 'react';
import type { EvaluationResult, Employee, Applicant } from '../types';
import { DocumentChartBarIcon } from './icons';

interface EvaluationHistoryProps {
  evaluations: EvaluationResult[];
  employees: Employee[];
  applicants: Applicant[];
  onViewDetails: (evaluationId: string) => void;
}

export const EvaluationHistory: React.FC<EvaluationHistoryProps> = ({ evaluations, employees, applicants, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getPersonName = (personId: string, personType: 'employee' | 'applicant') => {
    const source = personType === 'employee' ? employees : applicants;
    return source.find(p => p.id === personId)?.name || 'Desconocido';
  };
  
  const filteredEvaluations = useMemo(() => {
    const sorted = [...evaluations].sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
    
    if (!searchTerm.trim()) {
      return sorted;
    }

    const lowercasedFilter = searchTerm.toLowerCase();

    return sorted.filter(evaluation => {
      const personName = getPersonName(evaluation.personId, evaluation.personType).toLowerCase();
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
    });
  }, [evaluations, searchTerm, employees, applicants]);

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

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl">
      <h2 className="text-2xl font-bold text-brand-text-primary mb-6">Historial de Evaluaciones</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, tipo, fecha, nivel o puntuación..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-2 focus:ring-brand-accent-blue focus:border-brand-accent-blue transition-colors"
        />
      </div>

      {filteredEvaluations.length > 0 ? (
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
              {filteredEvaluations.map(evaluation => (
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
      ) : (
        <div className="text-center py-12">
            <DocumentChartBarIcon className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-2 text-sm font-medium text-brand-text-primary">
              {searchTerm ? 'No se encontraron resultados' : 'No hay evaluaciones'}
            </h3>
            <p className="mt-1 text-sm text-brand-text-secondary">
              {searchTerm ? 'Intenta con otro término de búsqueda.' : 'Empieza por evaluar a un empleado o aspirante.'}
            </p>
        </div>
      )}
    </div>
  );
};