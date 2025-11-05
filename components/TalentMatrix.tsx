import React, { useMemo, useState } from 'react';
import type { EvaluationResult, Employee, PotentialLevel, EvaluationLevel } from '../types';
import { Squares2X2Icon } from './icons';

interface TalentMatrixProps {
  evaluations: EvaluationResult[];
  employees: Employee[];
  departments: string[];
}

type GridBox = {
  title: string;
  description: string;
  color: string;
  candidates: (Employee & { score: number })[];
};

type Grid = GridBox[][];

const POTENTIAL_MAP: Record<PotentialLevel, number> = { 'Bajo': 0, 'Medio': 1, 'Alto': 2 };
const PERFORMANCE_MAP: Record<EvaluationLevel, number> = { 'Bajo': 0, 'Medio': 1, 'Alto': 2, 'Indeterminado': -1 };

const BOX_DEFINITIONS = [
    // Potential: Low
    [
        { title: 'Riesgo', description: 'Bajo desempeño y bajo potencial.', color: 'bg-red-900/40 border-red-500/30' },
        { title: 'Profesional Cumplidor', description: 'Desempeño adecuado pero bajo potencial de crecimiento.', color: 'bg-amber-900/40 border-amber-500/30' },
        { title: 'Enigma / Dilema', description: 'Alto desempeño pero bajo potencial para roles futuros.', color: 'bg-yellow-800/40 border-yellow-600/30' }
    ],
    // Potential: Medium
    [
        { title: 'Inconsistente', description: 'Potencial a desarrollar, pero bajo desempeño actual.', color: 'bg-amber-900/40 border-amber-500/30' },
        { title: 'Profesional Sólido', description: 'Pilar del equipo con desempeño y potencial competentes.', color: 'bg-sky-900/40 border-sky-500/30' },
        { title: 'Alto Potencial (a confirmar)', description: 'Alto desempeño actual con potencial para crecer más.', color: 'bg-cyan-800/40 border-cyan-500/30' }
    ],
    // Potential: High
    [
        { title: 'Joya a Pulir', description: 'Muestra gran potencial pero su desempeño actual necesita mejorar.', color: 'bg-yellow-800/40 border-yellow-600/30' },
        { title: 'Potencial Clave', description: 'Buen desempeño y alto potencial, listos para el siguiente nivel.', color: 'bg-cyan-800/40 border-cyan-500/30' },
        { title: 'Futura Estrella', description: 'Máximo desempeño y potencial. Líderes del futuro.', color: 'bg-green-800/40 border-green-500/30' }
    ]
];

export const TalentMatrix: React.FC<TalentMatrixProps> = ({ evaluations, employees, departments }) => {
  const [selectedDepartment, setSelectedDepartment] = useState<string>('Todos');

  const filteredEvaluations = useMemo(() => {
      const employeeEvaluations = evaluations.filter(e => e.personType === 'employee');
      if (selectedDepartment === 'Todos') {
          return employeeEvaluations;
      }
      const departmentEmployeeIds = new Set(
          employees.filter(c => c.department === selectedDepartment).map(c => c.id)
      );
      return employeeEvaluations.filter(ev => departmentEmployeeIds.has(ev.personId));
  }, [evaluations, employees, selectedDepartment]);


  const gridData = useMemo<Grid>(() => {
    // Initialize the grid structure
    const newGrid: Grid = BOX_DEFINITIONS.map(row => 
        row.map(box => ({ ...box, candidates: [] }))
    );

    const latestEvaluations = new Map<string, EvaluationResult>();
    filteredEvaluations.forEach(ev => {
        const existing = latestEvaluations.get(ev.personId);
        if (!existing || new Date(ev.evaluatedAt) > new Date(existing.evaluatedAt)) {
            latestEvaluations.set(ev.personId, ev);
        }
    });

    latestEvaluations.forEach(ev => {
      const employee = employees.find(c => c.id === ev.personId);
      if (!employee) return;

      const potentialIndex = POTENTIAL_MAP[ev.potential];
      const performanceIndex = PERFORMANCE_MAP[ev.level];

      if (performanceIndex >= 0 && potentialIndex >= 0) {
        newGrid[potentialIndex][performanceIndex].candidates.push({
          ...employee,
          score: ev.calculatedScores.overall
        });
      }
    });

    return newGrid;
  }, [filteredEvaluations, employees]);
  
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  const totalEvaluated = Array.from(new Set(filteredEvaluations.map(e => e.personId))).length;

  if (totalEvaluated === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 text-center">
        <h2 className="text-3xl font-bold text-brand-text-primary mb-4">Matriz de Talento 9-Box</h2>
        <div className="bg-brand-card border border-brand-border rounded-xl p-12 mt-6">
            <Squares2X2Icon className="mx-auto h-16 w-16 text-slate-600" />
            <p className="mt-4 text-brand-text-secondary">No hay datos de evaluación para mostrar la matriz.</p>
            <p className="text-sm text-brand-text-secondary/70">Realiza evaluaciones y asegúrate de calificar el potencial de cada empleado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
        <div>
            <h2 className="text-3xl font-bold text-brand-text-primary mb-2">Matriz de Talento 9-Box</h2>
            <p className="text-brand-text-secondary">Visualiza el talento de tu organización basado en su última evaluación de desempeño y potencial.</p>
        </div>
        <div className="flex-shrink-0">
            <label htmlFor="talent-dept-filter" className="text-sm font-medium text-brand-text-secondary mr-2">Filtrar por Departamento:</label>
            <select
                id="talent-dept-filter"
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

      <div className="text-center mb-2 md:hidden">
          <span className="text-sm font-bold text-brand-text-secondary uppercase tracking-widest">↑ Potencial</span>
      </div>
      <div className="flex">
        {/* Y-axis Label */}
        <div className="hidden md:flex items-center justify-center -rotate-180 md:w-12" style={{ writingMode: 'vertical-rl' }}>
            <span className="text-sm font-bold text-brand-text-secondary uppercase tracking-widest">Potencial</span>
        </div>
      
        <div className="flex-1">
            <div className="grid grid-cols-3 gap-1">
                 {/* Top Row: Potential High */}
                {gridData[2].slice().reverse().map((box, index) => (
                    <div key={`high-${index}`} className={`border rounded-lg p-2 md:p-4 min-h-[160px] flex flex-col ${box.color}`}>
                       <h4 className="font-bold text-sm md:text-base text-brand-text-primary">{box.title}</h4>
                       <p className="text-xs text-brand-text-secondary flex-grow">{box.description}</p>
                       <div className="flex flex-wrap gap-1 md:gap-2 mt-2">
                           {box.candidates.map(c => (
                               <div key={c.id} title={`${c.name} (${c.score.toFixed(2)})`} className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-brand-accent-indigo flex items-center justify-center text-xs font-bold cursor-pointer">
                                  {getInitials(c.name)}
                               </div>
                           ))}
                       </div>
                    </div>
                ))}
                
                {/* Middle Row: Potential Medium */}
                {gridData[1].slice().reverse().map((box, index) => (
                    <div key={`medium-${index}`} className={`border rounded-lg p-2 md:p-4 min-h-[160px] flex flex-col ${box.color}`}>
                       <h4 className="font-bold text-sm md:text-base text-brand-text-primary">{box.title}</h4>
                       <p className="text-xs text-brand-text-secondary flex-grow">{box.description}</p>
                        <div className="flex flex-wrap gap-1 md:gap-2 mt-2">
                           {box.candidates.map(c => (
                               <div key={c.id} title={`${c.name} (${c.score.toFixed(2)})`} className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-brand-accent-blue flex items-center justify-center text-xs font-bold cursor-pointer">
                                  {getInitials(c.name)}
                               </div>
                           ))}
                       </div>
                    </div>
                ))}

                {/* Bottom Row: Potential Low */}
                {gridData[0].slice().reverse().map((box, index) => (
                    <div key={`low-${index}`} className={`border rounded-lg p-2 md:p-4 min-h-[160px] flex flex-col ${box.color}`}>
                       <h4 className="font-bold text-sm md:text-base text-brand-text-primary">{box.title}</h4>
                       <p className="text-xs text-brand-text-secondary flex-grow">{box.description}</p>
                        <div className="flex flex-wrap gap-1 md:gap-2 mt-2">
                           {box.candidates.map(c => (
                               <div key={c.id} title={`${c.name} (${c.score.toFixed(2)})`} className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-brand-accent-purple flex items-center justify-center text-xs font-bold cursor-pointer">
                                  {getInitials(c.name)}
                               </div>
                           ))}
                       </div>
                    </div>
                ))}
            </div>
             {/* X-axis Labels */}
            <div className="grid grid-cols-3 gap-1 mt-1 text-center text-xs md:text-sm font-bold text-brand-text-secondary uppercase tracking-widest">
                <span>Alto</span>
                <span>Medio</span>
                <span>Bajo</span>
            </div>
             <div className="text-center mt-2 text-sm font-bold text-brand-text-secondary uppercase tracking-widest">Desempeño →</div>
        </div>
      </div>
    </div>
  );
};