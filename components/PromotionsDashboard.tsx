import React, { useMemo, useState } from 'react';
// @ts-ignore
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import type { EvaluationResult, Employee } from '../types';
import { ArrowTrendingUpIcon } from './icons';

interface PromotionsDashboardProps {
  evaluations: EvaluationResult[];
  employees: Employee[];
  departments: string[];
}

type PerformanceData = {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  averageScore: number;
  latestScore: number;
  evaluationCount: number;
  trendData: { date: number; score: number }[];
};

export const PromotionsDashboard: React.FC<PromotionsDashboardProps> = ({ evaluations, employees, departments }) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Todos');

  const performanceByDepartment = useMemo(() => {
    const employeePerformance: { [key: string]: PerformanceData } = {};

    const employeeEvaluations = evaluations.filter(e => e.personType === 'employee');

    // Group evaluations by employee
    const evaluationsByEmployee = employeeEvaluations.reduce((acc, ev) => {
      if (!acc[ev.personId]) {
        acc[ev.personId] = [];
      }
      acc[ev.personId].push(ev);
      return acc;
    }, {} as Record<string, EvaluationResult[]>);

    // Calculate performance metrics for each employee
    for (const employeeId in evaluationsByEmployee) {
      const employee = employees.find(c => c.id === employeeId);
      if (!employee || !employee.department) continue;

      const evals = evaluationsByEmployee[employeeId].sort((a, b) => new Date(a.evaluatedAt).getTime() - new Date(b.evaluatedAt).getTime());
      const totalScore = evals.reduce((sum, ev) => sum + ev.calculatedScores.overall, 0);
      const evaluationCount = evals.length;
      
      employeePerformance[employeeId] = {
        employeeId,
        name: employee.name,
        role: employee.role,
        department: employee.department,
        averageScore: totalScore / evaluationCount,
        latestScore: evals[evaluationCount - 1].calculatedScores.overall,
        evaluationCount,
        trendData: evals.map(ev => ({
          date: new Date(ev.evaluatedAt).getTime(),
          score: ev.calculatedScores.overall,
        })),
      };
    }

    // Group employees by department and sort them
    const byDepartment: { [key: string]: PerformanceData[] } = {};
    for (const dept of departments) {
      byDepartment[dept] = [];
    }

    for (const perfData of Object.values(employeePerformance)) {
      if (byDepartment[perfData.department]) {
        byDepartment[perfData.department].push(perfData);
      }
    }
    
    for (const dept in byDepartment) {
      byDepartment[dept].sort((a, b) => b.averageScore - a.averageScore);
    }
    
    return byDepartment;

  }, [evaluations, employees, departments]);

  if (evaluations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 text-center">
        <h2 className="text-3xl font-bold text-brand-text-primary mb-4">Panel de Promociones y Desempeño</h2>
        <div className="bg-brand-card border border-brand-border rounded-xl p-12 mt-6">
            <ArrowTrendingUpIcon className="mx-auto h-16 w-16 text-slate-600" />
            <p className="mt-4 text-brand-text-secondary">No hay datos de evaluación disponibles para generar el ranking.</p>
            <p className="text-sm text-brand-text-secondary/70">Realiza algunas evaluaciones para empezar a ver el desempeño por departamento.</p>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score < 4) return 'text-red-400';
    if (score < 8) return 'text-yellow-400';
    return 'text-green-400';
  }

  const departmentsToDisplay = useMemo(() => {
    return selectedDepartment === 'Todos'
      ? departments
      : departments.filter(d => d === selectedDepartment);
  }, [selectedDepartment, departments]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
       <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-3xl font-bold text-brand-text-primary">Panel de Promociones y Desempeño</h2>
        <div className="flex-shrink-0">
            <label htmlFor="promo-dept-filter" className="text-sm font-medium text-brand-text-secondary mr-2">Filtrar por Departamento:</label>
            <select
                id="promo-dept-filter"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm min-w-[200px]"
            >
                <option value="Todos">Todos los Departamentos</option>
                {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                ))}
            </select>
        </div>
      </div>

      {departmentsToDisplay.map(department => {
        const departmentPerformers = performanceByDepartment[department];
        if (!departmentPerformers || departmentPerformers.length === 0) {
             if (selectedDepartment !== 'Todos') {
                 return (
                    <div key={department} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6 text-center">
                         <h3 className="text-2xl font-semibold text-brand-text-primary mb-4">{department}</h3>
                         <p className="text-brand-text-secondary py-8">No hay datos de evaluación para este departamento.</p>
                    </div>
                 )
            }
            return null;
        }

        return (
            <div key={department} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
                <h3 className="text-2xl font-semibold text-brand-text-primary mb-4">{department}</h3>
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-brand-border">
                    <thead className="bg-white/5">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider w-16">Ranking</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Nombre</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Puesto</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Promedio</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Última Punt.</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Nº Evals</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase tracking-wider w-40">Tendencia</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                    {departmentPerformers.map((perf, index) => (
                        <tr key={perf.employeeId} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap text-center">
                                <span className={`flex items-center justify-center h-8 w-8 rounded-full font-bold ${index < 3 ? 'bg-brand-accent-blue/20 text-brand-accent-cyan' : 'bg-slate-700'}`}>{index + 1}</span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap font-medium text-brand-text-primary">{perf.name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{perf.role}</td>
                            <td className={`px-4 py-4 whitespace-nowrap text-center text-lg font-bold ${getScoreColor(perf.averageScore)}`}>{perf.averageScore.toFixed(2)}</td>
                            <td className={`px-4 py-4 whitespace-nowrap text-center text-sm font-semibold ${getScoreColor(perf.latestScore)}`}>{perf.latestScore.toFixed(2)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-brand-text-secondary">{perf.evaluationCount}</td>
                            <td className="px-4 py-4 whitespace-nowrap">
                                <div className="h-10 w-full">
                                    <ResponsiveContainer>
                                        <LineChart data={perf.trendData}>
                                            <Line type="monotone" dataKey="score" stroke={perf.latestScore >= perf.trendData[0]?.score ? '#10b981' : '#ef4444'} strokeWidth={2} dot={false} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
                 {departmentPerformers.length === 0 && (
                     <p className="text-center text-brand-text-secondary py-8">No hay datos de evaluación para este departamento.</p>
                 )}
            </div>
        );
      })}
    </div>
  );
};