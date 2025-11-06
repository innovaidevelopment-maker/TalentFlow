import React, { useState } from 'react';
// @ts-ignore
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip, LineChart, CartesianGrid, XAxis, YAxis, Line } from 'recharts';
import type { Employee, Applicant, EvaluationResult } from '../types';
import { SparklesIcon, ArrowLeftIcon, ArrowDownTrayIcon, DocumentChartBarIcon } from './icons';
import { generateEvaluationPDF } from '../services/pdfService';

interface ResultsDashboardProps {
  result: EvaluationResult;
  person: Employee | Applicant;
  allEvaluations: EvaluationResult[];
  onBack: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, person, allEvaluations, onBack }) => {
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    await generateEvaluationPDF(person, result);
    setIsPdfLoading(false);
  };

  // Prepara los datos para el gráfico de tendencia histórica.
  const trendChartData = allEvaluations
    .sort((a, b) => new Date(a.evaluatedAt).getTime() - new Date(b.evaluatedAt).getTime())
    .map(ev => ({
      date: new Date(ev.evaluatedAt).toLocaleDateString(),
      score: parseFloat(ev.calculatedScores.overall.toFixed(2)),
    }));

  // Prepara los datos para el gráfico de radar.
  const chartData = result.calculatedScores.factors.map(f => ({
      subject: f.factorName,
      score: f.score.toFixed(2),
      fullMark: 10,
  }));
  
  const getScoreColor = (score: number) => {
    if (score < 4) return 'text-red-400';
    if (score < 8) return 'text-yellow-400';
    return 'text-green-400';
  }
  
  const getScoreGradient = (score: number) => {
    if (score < 4) return 'from-red-500 to-orange-400';
    if (score < 8) return 'from-yellow-400 to-amber-300';
    return 'from-green-400 to-cyan-400';
  }

  const getLevelBadgeColor = () => {
      switch(result.level) {
          case 'Bajo': return 'bg-red-900/50 text-red-300 border border-red-500/30';
          case 'Medio': return 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30';
          case 'Alto': return 'bg-green-900/50 text-green-300 border border-green-500/30';
          default: return 'bg-slate-700 text-slate-300';
      }
  }

  // Un renderizador simple de markdown a HTML para el feedback de la IA.
  const renderMarkdown = (text: string) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map((line, index) => {
        if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-bold mt-4 mb-2 text-brand-text-primary">{line.substring(4)}</h3>;
        if (line.startsWith('**')) {
             const parts = line.split('**');
             return <p key={index} className="my-1">{parts.map((p, i) => i % 2 === 1 ? <strong key={i} className="text-brand-text-primary">{p}</strong> : <span key={i}>{p}</span>)}</p>
        }
        if (line.startsWith('- ')) return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
        return <p key={index} className="my-1">{line}</p>;
      });
  };

  const isEmployee = result.personType === 'employee';
  const position = isEmployee ? (person as Employee).role : (person as Applicant).positionApplied;
  const department = isEmployee ? (person as Employee).department : undefined;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
       <div className="flex justify-between items-center mb-2">
         <button onClick={onBack} className="flex items-center gap-2 text-brand-accent-cyan hover:underline font-semibold pdf-hide">
              <ArrowLeftIcon className="w-5 h-5"/>
              Volver
         </button>
         <button onClick={handleDownloadPdf} disabled={isPdfLoading} className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-wait pdf-hide">
              <ArrowDownTrayIcon className="w-5 h-5" />
              {isPdfLoading ? 'Generando...' : 'Descargar PDF'}
         </button>
       </div>
       <div id="evaluation-report">
         <header className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
            <h1 className="text-3xl font-extrabold text-brand-text-primary">Resultados de Evaluación</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 mt-1">
              <p className="text-xl text-brand-text-secondary">
                  <span className="font-bold text-brand-text-primary">{person.name}</span>
              </p>
               <p className="text-lg text-brand-text-secondary">
                 {position}{department && ` - ${department}`}
               </p>
            </div>
             <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getLevelBadgeColor()}`}>
                    Nivel: {result.level}
                </span>
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-slate-500/30">
                    Rigor: {result.mode}
                </span>
              </div>
            <p className="text-sm text-brand-text-secondary/80 mt-2">Evaluado el: {new Date(result.evaluatedAt).toLocaleString()}</p>
         </header>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
           <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6 text-center">
                  <h2 className="text-lg font-semibold text-brand-text-secondary">Puntuación General</h2>
                  <p className={`text-6xl font-bold my-2 bg-clip-text text-transparent bg-gradient-to-r ${getScoreGradient(result.calculatedScores.overall)}`}>
                      {result.calculatedScores.overall.toFixed(2)}
                  </p>
                  <p className="text-brand-text-secondary">/ 10</p>
              </div>
              <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 text-brand-text-primary">Desglose por Factor</h2>
                  <ul className="space-y-3">
                      {result.calculatedScores.factors.map(f => (
                          <li key={f.factorId} className="flex justify-between items-center">
                              <span className="text-brand-text-secondary">{f.factorName}</span>
                              <span className={`font-bold text-lg ${getScoreColor(f.score)}`}>{f.score.toFixed(2)}</span>
                          </li>
                      ))}
                  </ul>
              </div>
           </div>
           <div className="lg:col-span-2 bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6 min-h-[400px]">
               <h2 className="text-lg font-semibold mb-4 text-brand-text-primary">Visualización de Competencias</h2>
                {/* --- NUEVO: Gráfico de Radar --- */}
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="rgba(139, 148, 158, 0.4)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B949E' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#8B949E' }}/>
                    <Radar name={person.name} dataKey="score" stroke="#34D399" fill="#34D399" fillOpacity={0.6} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1C2127', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem' }} 
                      labelStyle={{ color: '#F0F6FC', fontWeight: 'bold' }} 
                      itemStyle={{ color: '#8A94A3' }}
                    />
                    <Legend wrapperStyle={{ color: '#E6EDF3' }}/>
                  </RadarChart>
                </ResponsiveContainer>
           </div>
         </div>

         <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6 mt-6">
              <h2 className="flex items-center gap-3 text-2xl font-bold text-brand-text-primary mb-4">
                  <SparklesIcon className="w-7 h-7 text-brand-accent-purple"/>
                  Feedback Generado por IA
              </h2>
              <div className="prose prose-slate dark:prose-invert max-w-none text-brand-text-secondary">
                  {renderMarkdown(result.feedback)}
              </div>
         </div>

         {/* --- NUEVO: Gráfico de Tendencia --- */}
         {allEvaluations.length > 1 && (
           <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6 mt-6">
             <h2 className="flex items-center gap-3 text-2xl font-bold text-brand-text-primary mb-4">
               <DocumentChartBarIcon className="w-7 h-7 text-brand-accent-cyan" />
               Historial de Rendimiento
             </h2>
             <ResponsiveContainer width="100%" height={300}>
               <LineChart data={trendChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 148, 158, 0.2)" />
                 <XAxis dataKey="date" tick={{ fill: '#8B949E' }} />
                 <YAxis domain={[0, 10]} tick={{ fill: '#8B949E' }} />
                 <Tooltip 
                  contentStyle={{ backgroundColor: '#1C2127', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem' }} 
                  labelStyle={{ color: '#F0F6FC', fontWeight: 'bold' }} 
                  itemStyle={{ color: '#8A94A3' }} 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                />
                 <Legend wrapperStyle={{ color: '#E6EDF3' }} />
                 <Line type="monotone" dataKey="score" name="Puntuación General" stroke="#34D399" strokeWidth={2} activeDot={{ r: 8 }} dot={{ fill: '#34D399' }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
         )}
       </div>
    </div>
  );
};