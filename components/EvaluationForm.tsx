import React, { useState } from 'react';
import type { Employee, Applicant, Factor, EvaluationScore, EvaluationMode, CriteriaTemplate, PotentialLevel } from '../types';
import { SparklesIcon } from './icons';

interface EvaluationFormProps {
  person: Employee | Applicant;
  personType: 'employee' | 'applicant';
  criteria: Factor[];
  templates: CriteriaTemplate[];
  onCompleteEvaluation: (scores: EvaluationScore[], mode: EvaluationMode, usedCriteria: Factor[], potential: PotentialLevel) => Promise<void>;
  onCancel: () => void;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({ person, personType, criteria, templates, onCompleteEvaluation, onCancel }) => {
  const [currentCriteria, setCurrentCriteria] = useState<Factor[]>(criteria);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('Medio');
  const [potential, setPotential] = useState<PotentialLevel>('Medio');

  const handleScoreChange = (characteristicId: string, score: number) => {
    setScores(new Map(scores.set(characteristicId, score)));
  };

  const handleTemplateChange = (templateId: string) => {
    if (!templateId) {
        return;
    }
    const template = templates.find(t => t.id === templateId);
    if (template) {
        setCurrentCriteria(template.criteria);
        setScores(new Map());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const evaluationScores: EvaluationScore[] = [];
    
    currentCriteria.forEach(factor => {
        factor.characteristics.forEach(char => {
            evaluationScores.push({ 
                characteristicId: char.id, 
                score: scores.get(char.id) || 5
            });
        });
    });

    await onCompleteEvaluation(evaluationScores, evaluationMode, currentCriteria, potential);
  };
  
  const position = personType === 'employee' ? (person as Employee).role : (person as Applicant).positionApplied;
  const department = personType === 'employee' ? (person as Employee).department : undefined;

  const allCharacteristics = currentCriteria.flatMap(f => f.characteristics);
  const isFormReady = allCharacteristics.length > 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
        <h2 className="text-2xl font-bold text-brand-text-primary">Evaluando a: {person.name}</h2>
        <p className="text-brand-text-secondary mb-2">
            {personType === 'employee' ? 'Puesto' : 'Aspirante a'}: {position}
        </p>
        {department && <p className="text-sm text-brand-text-secondary/80 mb-6">Departamento: {department}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label htmlFor="template-select" className="block text-sm font-medium text-brand-text-secondary mb-1">
                Usar Plantilla de Evaluación
              </label>
              <select
                id="template-select"
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-brand-accent-blue focus:border-brand-accent-blue"
              >
                <option value="">Criterios Actuales</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="evaluation-mode" className="block text-sm font-medium text-brand-text-secondary mb-1">
                Nivel de Rigor de la Evaluación
              </label>
              <select
                id="evaluation-mode"
                value={evaluationMode}
                onChange={(e) => setEvaluationMode(e.target.value as EvaluationMode)}
                className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-brand-accent-blue focus:border-brand-accent-blue"
              >
                <option value="Bajo">Bajo</option>
                <option value="Medio">Medio</option>
                <option value="Riguroso">Riguroso</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label htmlFor="potential-level" className="block text-sm font-medium text-brand-text-secondary mb-1">
                Potencial
              </label>
              <select
                id="potential-level"
                value={potential}
                onChange={(e) => setPotential(e.target.value as PotentialLevel)}
                className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-brand-accent-blue focus:border-brand-accent-blue"
              >
                <option value="Bajo">Bajo Potencial</option>
                <option value="Medio">Potencial Medio</option>
                <option value="Alto">Alto Potencial</option>
              </select>
            </div>
          </div>

          {currentCriteria.map(factor => (
            <div key={factor.id}>
              <h3 className="text-xl font-semibold text-brand-text-primary border-b border-brand-border pb-2 mb-4">{factor.name}</h3>
              <div className="space-y-4">
                {factor.characteristics.map(char => (
                  <div key={char.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <label htmlFor={`score-${char.id}`} className="md:col-span-1 text-brand-text-secondary">
                      {char.name}
                      <span className="text-xs ml-2"> (Peso: {char.weight})</span>
                    </label>
                    <div className="md:col-span-2 flex items-center gap-4">
                      <input
                        id={`score-${char.id}`}
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={scores.get(char.id) || 5}
                        onChange={(e) => handleScoreChange(char.id, parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="font-bold text-lg text-brand-text-primary w-12 text-center">{scores.get(char.id) || 5}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {!isFormReady && (
            <div className="text-center py-8 border-2 border-dashed border-brand-border rounded-lg">
                <p className="text-brand-text-secondary">No hay criterios de evaluación definidos.</p>
                <p className="text-sm text-brand-text-secondary/70">Por favor, selecciona una plantilla o configúralos en la sección de Criterios.</p>
            </div>
          )}

          <div className="flex justify-end items-center gap-4 pt-4 border-t border-brand-border">
            <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-colors"
            >
                Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !isFormReady}
              className="px-6 py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-indigo/50 transition-all flex items-center gap-2 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-5 h-5" />
                  Generar Feedback con IA
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};