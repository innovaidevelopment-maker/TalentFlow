import React, { useState, useMemo } from 'react';
// @ts-ignore
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Employee, Applicant, EvaluationResult } from '../types';
import { UsersIcon, ArrowLeftIcon, ArrowDownTrayIcon } from './icons';
import { generateComparisonPDF } from '../services/pdfService';

interface ComparisonDashboardProps {
  personIds: string[];
  employees: Employee[];
  applicants: Applicant[];
  evaluations: EvaluationResult[];
  onBack: () => void;
}

const COLORS = ['#22d3ee', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899', '#f43f5e', '#d946ef', '#84cc16'];

export const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({ personIds, employees, applicants, evaluations, onBack }) => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  
  const { chartData, tableCriteria, latestEvaluations, selectedPersons } = useMemo(() => {
    const allPersons = [...employees, ...applicants];
    const selectedPersons = allPersons.filter(p => personIds.includes(p.id));

    const latestEvaluations = selectedPersons.map(person => {
      return [...evaluations]
        .filter(e => e.personId === person.id)
        .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime())
      [0];
    }).filter(Boolean);

    if (latestEvaluations.length === 0) {
      return { chartData: [], tableCriteria: [], latestEvaluations: [], selectedPersons: [] };
    }

    // 1. Get all unique factors from the evaluations being compared
    const uniqueFactors = new Map<string, { id: string; name: string }>();
    latestEvaluations.forEach(ev => {
        ev.calculatedScores.factors.forEach(factorScore => {
            if (!uniqueFactors.has(factorScore.factorId)) {
                uniqueFactors.set(factorScore.factorId, { id: factorScore.factorId, name: factorScore.factorName });
            }
        });
    });

    const criteriaForTable = Array.from(uniqueFactors.values());

    // 2. Build chartData based on these unique factors
    const dataForChart = criteriaForTable.map(factor => {
        const factorScores: { [key: string]: string | number } = { subject: factor.name };
        
        latestEvaluations.forEach(ev => {
            const person = allPersons.find(p => p.id === ev.personId);
            if (person) {
                const score = ev.calculatedScores.factors.find(f => f.factorId === factor.id)?.score || 0;
                factorScores[person.name] = score.toFixed(2);
            }
        });
        return factorScores;
    });

    return { chartData: dataForChart, tableCriteria: criteriaForTable, latestEvaluations, selectedPersons };
  }, [personIds, employees, applicants, evaluations]);

  const getScoreColor = (score: number) => {
    if (score < 4) return 'text-red-400';
    if (score < 8) return 'text-yellow-400';
    return 'text-green-400';
  }

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    // El nombre del archivo ahora está fijo en el servicio.
    await generateComparisonPDF("Comparacion de perfiles");
    setIsPdfLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
       <div className="flex justify-between items-center mb-2">
         <button onClick={onBack} className="flex items-center gap-2 text-brand-accent-cyan hover:underline font-semibold pdf-hide">
              <ArrowLeftIcon className="w-5 h-5"/>
              Volver a la Lista
         </button>
         {latestEvaluations.length >= 2 && (
            <button onClick={handleDownloadPdf} disabled={isPdfLoading} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-wait pdf-hide">
                <ArrowDownTrayIcon className="w-5 h-5" />
                {isPdfLoading ? 'Generando...' : 'Descargar PDF (A3)'}
            </button>
         )}
       </div>
       <div id="comparison-report">
         <header className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
            <h1 className="text-3xl font-extrabold text-brand-text-primary">Comparación de Perfiles</h1>
            <p className="text-xl text-brand-text-secondary mt-1">
               Comparando {latestEvaluations.length} de {selectedPersons.length} perfiles seleccionados (con evaluación).
            </p>
         </header>

         {latestEvaluations.length >= 2 ? (
          <>
              <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6 min-h-[400px] mt-6">
                  <h2 className="text-lg font-semibold mb-4 text-brand-text-primary">Visualización de Competencias</h2>
                  <ResponsiveContainer width="100%" height={400}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                      <PolarGrid stroke="rgba(139, 148, 158, 0.4)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#8B949E' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #8B949E' }} />
                      <Legend wrapperStyle={{ color: '#E6EDF3' }}/>
                      {latestEvaluations.map((ev, index) => {
                          const person = selectedPersons.find(p => p.id === ev.personId);
                          const color = COLORS[index % COLORS.length];
                          return person ? <Radar key={person.id} name={person.name} dataKey={person.name} stroke={color} fill={color} fillOpacity={0.5} /> : null;
                      })}
                      </RadarChart>
                  </ResponsiveContainer>
              </div>
              
              <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6 overflow-x-auto mt-6">
                  <h2 className="text-lg font-semibold mb-4 text-brand-text-primary">Tabla Comparativa de Puntuaciones</h2>
                  <table className="min-w-full divide-y divide-brand-border">
                      <thead className="bg-white/5">
                          <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Criterio</th>
                               {latestEvaluations.map(ev => {
                                  const person = selectedPersons.find(p => p.id === ev.personId);
                                  return <th key={ev.id} scope="col" className="px-6 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase tracking-wider">{person?.name}</th>
                               })}
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                          <tr className="bg-white/10">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-brand-text-primary">Puntuación General</td>
                               {latestEvaluations.map(ev => (
                                  <td key={ev.id} className={`px-6 py-4 whitespace-nowrap text-center text-sm font-bold ${getScoreColor(ev.calculatedScores.overall)}`}>{ev.calculatedScores.overall.toFixed(2)}</td>
                               ))}
                          </tr>
                           {tableCriteria.map(factor => (
                              <tr key={factor.id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text-secondary">{factor.name}</td>
                                   {latestEvaluations.map(ev => {
                                      const factorScore = ev.calculatedScores.factors.find(f => f.factorId === factor.id)?.score || 0;
                                      return <td key={`${ev.id}-${factor.id}`} className={`px-6 py-4 whitespace-nowrap text-center text-sm ${getScoreColor(factorScore)}`}>{factorScore.toFixed(2)}</td>
                                   })}
                              </tr>
                           ))}
                      </tbody>
                  </table>
              </div>
          </>
         ) : (
          <div className="text-center py-12 bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl mt-6">
              <UsersIcon className="mx-auto h-12 w-12 text-slate-600" />
              <h3 className="mt-2 text-sm font-medium text-brand-text-primary">Datos Insuficientes para Comparar</h3>
              <p className="mt-1 text-sm text-brand-text-secondary">Por favor, selecciona al menos dos perfiles que ya hayan sido evaluados.</p>
          </div>
         )}
       </div>
    </div>
  );
};