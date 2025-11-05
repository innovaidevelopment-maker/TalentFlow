import React, { useMemo } from 'react';
import type { Employee, Applicant } from '../types';
import { UsersIcon } from './icons';

interface ProfileComparisonListProps {
  employees: Employee[];
  applicants: Applicant[];
  onCompare: (personIds: string[]) => void;
  departments: string[];
  // Props for state management
  selectedToCompare: Set<string>;
  setSelectedToCompare: React.Dispatch<React.SetStateAction<Set<string>>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  departmentFilter: string;
  setDepartmentFilter: React.Dispatch<React.SetStateAction<string>>;
  typeFilter: 'all' | 'employee' | 'applicant';
  setTypeFilter: React.Dispatch<React.SetStateAction<'all' | 'employee' | 'applicant'>>;
}

export const ProfileComparisonList: React.FC<ProfileComparisonListProps> = ({ 
    employees, applicants, onCompare, departments,
    selectedToCompare, setSelectedToCompare,
    searchTerm, setSearchTerm,
    departmentFilter, setDepartmentFilter,
    typeFilter, setTypeFilter
}) => {
  const allProfiles = useMemo(() => {
    const combined = [
      ...employees.map(e => ({ ...e, type: 'Empleado', position: e.role })),
      ...applicants.map(a => ({ ...a, type: 'Aspirante', position: a.positionApplied }))
    ];
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [employees, applicants]);

  const filteredProfiles = useMemo(() => allProfiles.filter(profile => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = profile.name.toLowerCase().includes(term) || profile.position.toLowerCase().includes(term);
    const matchesDept = departmentFilter === 'all' || profile.department === departmentFilter;
    const matchesType = typeFilter === 'all' || (typeFilter === 'employee' && profile.type === 'Empleado') || (typeFilter === 'applicant' && profile.type === 'Aspirante');
    return matchesSearch && matchesDept && matchesType;
  }), [allProfiles, searchTerm, departmentFilter, typeFilter]);

  const handleToggleCompare = (personId: string) => {
    const newSelection = new Set(selectedToCompare);
    if (newSelection.has(personId)) {
      newSelection.delete(personId);
    } else {
      if (newSelection.size >= 10) {
        alert('Puedes comparar un máximo de 10 perfiles a la vez.');
        return;
      }
      newSelection.add(personId);
    }
    setSelectedToCompare(newSelection);
  };

  const handleCompareClick = () => {
    onCompare(Array.from(selectedToCompare));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold text-brand-text-primary">Seleccionar Perfiles para Comparar</h3>
            <p className="text-sm text-brand-text-secondary">Elige empleados o aspirantes para ver una comparación detallada de sus evaluaciones.</p>
          </div>
          <button
            onClick={handleCompareClick}
            disabled={selectedToCompare.size < 2}
            className="px-4 py-2 bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-brand-accent-indigo/20 transition-all disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
          >
            <UsersIcon className="w-5 h-5" />
            Comparar ({selectedToCompare.size})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <input
                type="text"
                placeholder="Buscar por nombre o puesto..."
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
             <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)} className="p-3 border border-brand-border bg-brand-bg/50 rounded-lg shadow-sm">
                <option value="all">Todos los Departamentos</option>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="p-3 border border-brand-border bg-brand-bg/50 rounded-lg shadow-sm">
                <option value="all">Empleados y Aspirantes</option>
                <option value="employee">Solo Empleados</option>
                <option value="applicant">Solo Aspirantes</option>
            </select>
        </div>
        
        <div className="space-y-3">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map(profile => {
              const isChecked = selectedToCompare.has(profile.id);
              const isLimitReached = selectedToCompare.size >= 10;
              return (
                <div key={profile.id} className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-brand-accent-blue/50">
                   <input 
                        type="checkbox"
                        className="h-5 w-5 rounded bg-brand-bg border-brand-border text-brand-accent-cyan focus:ring-brand-accent-cyan focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
                        checked={isChecked}
                        onChange={() => handleToggleCompare(profile.id)}
                        disabled={isLimitReached && !isChecked}
                    />
                    <div className="flex-grow">
                        <p className="font-bold text-lg text-brand-text-primary">{profile.name}</p>
                        <p className="text-sm text-brand-text-secondary">{profile.position}</p>
                    </div>
                    <div className="text-right">
                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${profile.type === 'Empleado' ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'}`}>
                            {profile.type}
                        </span>
                        {profile.department && <p className="text-xs text-brand-text-secondary/70 mt-1">{profile.department}</p>}
                    </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-brand-text-secondary py-8">No se encontraron perfiles que coincidan con los filtros.</p>
          )}
        </div>
      </div>
    </div>
  );
};