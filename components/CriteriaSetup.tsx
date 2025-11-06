import React, { useState } from 'react';
import type { Factor, Characteristic, CriteriaTemplate, User } from '../types';
import { PlusIcon, TrashIcon, ChevronDownIcon, SparklesIcon } from './icons';

interface CriteriaSetupProps {
  criteria: Factor[];
  setCriteria: React.Dispatch<React.SetStateAction<Factor[]>>;
  templates: CriteriaTemplate[];
  currentUser: User;
  onSelectTemplate: (templateId: string) => void;
  onSaveNewTemplate: (name: string, criteria: Factor[]) => void;
  onDeleteTemplate: (templateId: string) => void;
  onRenameTemplate: (templateId: string, newName: string) => void;
  onUpdateTemplate: (templateId: string, criteria: Factor[]) => void;
}

export const CriteriaSetup: React.FC<CriteriaSetupProps> = ({ criteria, setCriteria, templates, currentUser, onSelectTemplate, onSaveNewTemplate, onDeleteTemplate, onRenameTemplate, onUpdateTemplate }) => {
  const [newFactorName, setNewFactorName] = useState('');
  const [newCharData, setNewCharData] = useState<{ [factorId: string]: { name: string; weight: number } }>({});
  const [expandedFactors, setExpandedFactors] = useState<Set<string>>(new Set());
  const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');

  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleAddFactor = () => {
    if (newFactorName.trim()) {
      const newFactor: Factor = {
        id: `factor-${Date.now()}`,
        name: newFactorName.trim(),
        characteristics: [],
      };
      setCriteria([...criteria, newFactor]);
      setNewFactorName('');
    }
  };

  const handleDeleteFactor = (factorId: string) => {
    setCriteria(criteria.filter(f => f.id !== factorId));
  };

  const handleAddCharacteristic = (factorId: string) => {
    const charData = newCharData[factorId];
    if (charData && charData.name.trim()) {
      const newCharacteristic: Characteristic = {
        id: `char-${Date.now()}`,
        name: charData.name.trim(),
        weight: charData.weight,
      };
      const updatedCriteria = criteria.map(factor => {
        if (factor.id === factorId) {
          return { ...factor, characteristics: [...factor.characteristics, newCharacteristic] };
        }
        return factor;
      });
      setCriteria(updatedCriteria);
      setNewCharData({ ...newCharData, [factorId]: { name: '', weight: 0.5 } });
    }
  };

  const handleDeleteCharacteristic = (factorId: string, charId: string) => {
    setCriteria(criteria.map(factor => {
      if (factor.id === factorId) {
        return { ...factor, characteristics: factor.characteristics.filter(c => c.id !== charId) };
      }
      return factor;
    }));
  };
  
  const handleCharDataChange = (factorId: string, field: 'name' | 'weight', value: string | number) => {
    setNewCharData(prev => ({ ...prev, [factorId]: { ...prev[factorId] || { name: '', weight: 0.5 }, [field]: value } }));
  };

  const toggleFactorExpansion = (factorId: string) => {
    setExpandedFactors(prev => {
      const newSet = new Set(prev);
      newSet.has(factorId) ? newSet.delete(factorId) : newSet.add(factorId);
      return newSet;
    });
  };

  const handleInitiateSave = () => {
    setShowSaveInput(true);
  };

  const handleConfirmSave = () => {
    if (saveTemplateName.trim()) {
        onSaveNewTemplate(saveTemplateName.trim(), criteria);
        setShowSaveInput(false);
        setSaveTemplateName('');
        setLoadedTemplateId(null);
        showFeedback('¡Nueva plantilla guardada!');
    }
  };

  const handleCancelSave = () => {
      setShowSaveInput(false);
      setSaveTemplateName('');
  };

  const handleRenameClick = (template: CriteriaTemplate) => {
    setRenamingTemplateId(template.id);
    setNewTemplateName(template.name);
  };

  const handleRenameSave = (templateId: string) => {
    if (newTemplateName.trim()) {
        onRenameTemplate(templateId, newTemplateName.trim());
        setRenamingTemplateId(null);
        setNewTemplateName('');
    }
  };
  
  const handleLoadTemplate = (templateId: string) => {
      onSelectTemplate(templateId);
      setLoadedTemplateId(templateId);
      setShowSaveInput(false);
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setExpandedFactors(new Set(template.criteria.map(f => f.id)));
      }
  };

  const handleClearCriteria = () => {
      setCriteria([]);
      setLoadedTemplateId(null);
  };

  const handleUpdateClick = () => {
      if (loadedTemplateId) {
          onUpdateTemplate(loadedTemplateId, criteria);
          showFeedback('¡Plantilla actualizada con éxito!');
      }
  };

  const loadedTemplateName = templates.find(t => t.id === loadedTemplateId)?.name;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto p-4 md:p-6">
      {/* Columna de gestión de plantillas */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-brand-text-primary mb-4">Gestión de Plantillas</h2>
             {feedbackMessage && <div className="bg-green-500/20 text-green-300 text-sm p-3 rounded-lg mb-4 text-center transition-opacity duration-300">{feedbackMessage}</div>}
            <div className="space-y-3">
                <button
                    onClick={handleClearCriteria}
                    className="w-full text-center px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-colors"
                >
                    Crear plantilla desde cero
                </button>
                
                {loadedTemplateId && (
                     <button
                        onClick={handleUpdateClick}
                        disabled={criteria.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-cyan/20 transition-all disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed"
                     >
                        <SparklesIcon className="w-5 h-5" />
                        Actualizar plantilla "{loadedTemplateName}"
                    </button>
                )}
                
                {showSaveInput ? (
                    <div className="p-3 bg-brand-bg/50 rounded-lg space-y-2 border border-brand-accent-purple/50">
                        <input
                            type="text"
                            placeholder="Nombre de la nueva plantilla"
                            value={saveTemplateName}
                            onChange={(e) => setSaveTemplateName(e.target.value)}
                            className="w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button onClick={handleConfirmSave} className="flex-grow px-2 py-1 bg-green-600 text-white text-sm rounded disabled:bg-slate-700 disabled:cursor-not-allowed" disabled={!saveTemplateName.trim()}>Guardar</button>
                            <button onClick={handleCancelSave} className="flex-grow px-2 py-1 bg-slate-600 text-white text-sm rounded">Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleInitiateSave}
                        disabled={criteria.length === 0}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-purple/20 transition-all disabled:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        {loadedTemplateId ? 'Guardar como nueva plantilla' : 'Guardar criterios actuales'}
                    </button>
                )}
            </div>
        </div>
        <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-brand-text-secondary mb-3">Plantillas Existentes</h3>
            <div className="space-y-2">
                {templates.map(template => (
                    <div key={template.id} className="bg-brand-bg/50 p-3 rounded-lg">
                       {renamingTemplateId === template.id ? (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    className="flex-grow p-1 border border-brand-border bg-brand-bg rounded-md shadow-sm text-sm"
                                    autoFocus
                                />
                                <button onClick={() => handleRenameSave(template.id)} className="px-2 py-1 bg-green-600 text-white text-xs rounded">Guardar</button>
                                <button onClick={() => setRenamingTemplateId(null)} className="px-2 py-1 bg-slate-600 text-white text-xs rounded">Cancelar</button>
                            </div>
                       ) : (
                         <>
                            <p className="font-semibold text-brand-text-primary">{template.name}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <button onClick={() => handleLoadTemplate(template.id)} className="text-xs font-semibold text-brand-accent-cyan hover:underline">Cargar</button>
                                <span className="text-brand-border">|</span>
                                <button onClick={() => handleRenameClick(template)} className="text-xs font-semibold text-brand-accent-blue hover:underline">Renombrar</button>
                                {currentUser.role === 'Admin' && (
                                    <>
                                        <span className="text-brand-border">|</span>
                                        <button onClick={() => onDeleteTemplate(template.id)} className="text-xs font-semibold text-red-500 hover:underline">Eliminar</button>
                                    </>
                                )}
                            </div>
                         </>
                       )}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Columna de edición de criterios */}
      <div className="lg:col-span-2 bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-6">
        <h2 className="text-2xl font-bold text-brand-text-primary mb-4">
           {loadedTemplateName ? `Editando: ${loadedTemplateName}` : 'Editor de Criterios'}
        </h2>
        
        <div className="space-y-4 mb-6">
          {criteria.map(factor => (
            <div key={factor.id} className="border border-brand-border/50 rounded-lg">
              <div className="p-4 bg-white/5 flex justify-between items-center cursor-pointer" onClick={() => toggleFactorExpansion(factor.id)}>
                <h3 className="text-lg font-semibold text-brand-text-primary">{factor.name}</h3>
                <div className="flex items-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteFactor(factor.id); }} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                  <ChevronDownIcon className={`w-6 h-6 transition-transform ${expandedFactors.has(factor.id) ? 'rotate-180' : ''}`}/>
                </div>
              </div>
              {expandedFactors.has(factor.id) && (
                <div className="p-4 border-t border-brand-border/50 space-y-3">
                  {factor.characteristics.map(char => (
                    <div key={char.id} className="flex justify-between items-center bg-brand-bg/50 p-2 rounded">
                      <span>{char.name} <span className="text-sm text-brand-text-secondary">(Peso: {char.weight.toFixed(1)})</span></span>
                      <button onClick={() => handleDeleteCharacteristic(factor.id, char.id)} className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-red-500/10">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {factor.characteristics.length === 0 && <p className="text-sm text-center text-brand-text-secondary py-2">Añade una característica para empezar.</p>}
                  <div className="flex gap-2 items-end pt-2 border-t border-brand-border/20">
                    <div className="flex-grow">
                       <label className="text-xs text-brand-text-secondary">Nueva Característica</label>
                       <input
                        type="text"
                        placeholder="Ej: Comunicación efectiva"
                        value={newCharData[factor.id]?.name || ''}
                        onChange={(e) => handleCharDataChange(factor.id, 'name', e.target.value)}
                        className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-brand-text-secondary">Peso (0-1)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        value={newCharData[factor.id]?.weight || 0.5}
                        onChange={(e) => handleCharDataChange(factor.id, 'weight', parseFloat(e.target.value))}
                        className="mt-1 block w-full p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm w-24"
                      />
                    </div>
                    <button onClick={() => handleAddCharacteristic(factor.id)} className="px-3 py-2 bg-brand-accent-cyan text-white rounded-lg">
                      <PlusIcon className="w-5 h-5"/>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
           {criteria.length === 0 && <p className="text-center text-brand-text-secondary py-8">No hay factores definidos. Añade uno para empezar o carga una plantilla.</p>}
        </div>

        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={newFactorName}
            onChange={(e) => setNewFactorName(e.target.value)}
            placeholder="Nombre del nuevo factor (Ej: Habilidades Blandas)"
            className="flex-grow p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm"
          />
          <button onClick={handleAddFactor} className="px-4 py-2 bg-gradient-to-r from-brand-accent-green to-brand-accent-cyan text-white font-semibold rounded-lg shadow-md flex items-center gap-2">
            <PlusIcon className="w-5 h-5"/> Añadir Factor
          </button>
        </div>
      </div>
    </div>
  );
};