import React, { useState, useMemo } from 'react';
// @ts-ignore
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { EvaluationResult, Employee, ScheduledEvaluation, User } from '../types';
import { CalendarDaysIcon, XMarkIcon } from './icons';

interface GlobalDashboardProps {
  evaluations: EvaluationResult[];
  employees: Employee[];
  scheduledEvals: ScheduledEvaluation[];
  currentUser: User;
  users: User[];
}

const COLORS = {
  'Bajo': '#ef4444', // red-500
  'Medio': '#f59e0b', // amber-500
  'Alto': '#10b981', // emerald-500
  'Indeterminado': '#64748b' // slate-500
};

export const GlobalDashboard: React.FC<GlobalDashboardProps> = ({ evaluations, employees, scheduledEvals, currentUser, users }) => {
  const [filter, setFilter] = useState<{ type: 'department' | 'level' | null; value: string | null }>({ type: null, value: null });

  const employeeEvaluations = useMemo(() => evaluations.filter(e => e.personType === 'employee'), [evaluations]);

  // DERIVE LATEST EVALUATION FOR EACH EMPLOYEE - THIS IS THE CORE FIX
  const latestEvaluations = useMemo(() => {
    const latestEvalsMap = new Map<string, EvaluationResult>();
    employeeEvaluations.forEach(ev => {
        const existing = latestEvalsMap.get(ev.personId);
        if (!existing || new Date(ev.evaluatedAt) > new Date(existing.evaluatedAt)) {
            latestEvalsMap.set(ev.personId, ev);
        }
    });
    return Array.from(latestEvalsMap.values());
  }, [employeeEvaluations]);

  // FILTERED LATEST EVALUATIONS (for KPIs, Pie Chart)
  const filteredLatestEvaluations = useMemo(() => {
    if (!filter.type || !filter.value) {
        return latestEvaluations;
    }
    if (filter.type === 'department') {
        const departmentEmployeeIds = new Set(employees.filter(e => e.department === filter.value).map(e => e.id));
        return latestEvaluations.filter(ev => departmentEmployeeIds.has(ev.personId));
    }
    if (filter.type === 'level') {
        return latestEvaluations.filter(ev => ev.level === filter.value);
    }
    return latestEvaluations;
  }, [latestEvaluations, employees, filter]);

  // FILTERED ALL EVALUATIONS (for Trend Chart)
  const filteredAllEvaluations = useMemo(() => {
    if (!filter.type || !filter.value) {
        return employeeEvaluations; // All evals when no filter
    }
    if (filter.type === 'department') {
        const departmentEmployeeIds = new Set(employees.filter(e => e.department === filter.value).map(e => e.id));
        return employeeEvaluations.filter(ev => departmentEmployeeIds.has(ev.personId));
    }
    if (filter.type === 'level') {
        const employeeIdsInLevel = new Set(latestEvaluations.filter(ev => ev.level === filter.value).map(ev => ev.personId));
        return employeeEvaluations.filter(ev => employeeIdsInLevel.has(ev.personId));
    }
    return employeeEvaluations;
  }, [employeeEvaluations, latestEvaluations, employees, filter]);

  // KPIs based on filtered LATEST evaluations
  const kpis = useMemo(() => {
    const totalEvaluations = filteredLatestEvaluations.length;
    const evaluatedEmployeeCount = totalEvaluations;
    const averageScore = totalEvaluations > 0 ? filteredLatestEvaluations.reduce((acc, ev) => acc + ev.calculatedScores.overall, 0) / totalEvaluations : 0;
    const averagePotentialNum = totalEvaluations > 0 ? filteredLatestEvaluations.reduce((acc, ev) => {
        const potentialMap = { 'Bajo': 1, 'Medio': 2, 'Alto': 3 };
        return acc + (potentialMap[ev.potential] || 2);
    }, 0) / totalEvaluations : 0;
    const potentialLevels = ['Bajo', 'Medio', 'Alto'];
    const averagePotentialLabel = potentialLevels[Math.round(averagePotentialNum) - 1] || 'N/A';
    
    return { totalEvaluations, evaluatedEmployeeCount, averageScore, averagePotentialLabel };
  }, [filteredLatestEvaluations]);

  // Level Distribution based on filtered LATEST evaluations
  const levelDistribution = useMemo(() => {
    const dist = filteredLatestEvaluations.reduce((acc, ev) => {
      acc[ev.level] = (acc[ev.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [filteredLatestEvaluations]);

  // Department Chart data based on LATEST evaluations (unfiltered)
  const departmentChartData = useMemo(() => {
    const departmentScores: { [key: string]: { totalScore: number; count: number } } = {};
    latestEvaluations.forEach(ev => {
      const employee = employees.find(c => c.id === ev.personId);
      if (employee?.department) {
        if (!departmentScores[employee.department]) {
          departmentScores[employee.department] = { totalScore: 0, count: 0 };
        }
        departmentScores[employee.department].totalScore += ev.calculatedScores.overall;
        departmentScores[employee.department].count++;
      }
    });

    return Object.entries(departmentScores).map(([name, data]) => ({
      name,
      'Puntuación Promedio': parseFloat((data.totalScore / data.count).toFixed(2)),
    }));
  }, [latestEvaluations, employees]);
  
  // Trend chart based on ALL historical evaluations, but filtered
  const trendChartData = useMemo(() => {
      const monthlyData: { [key: string]: { totalScore: number; count: number } } = {};
      filteredAllEvaluations.forEach(ev => {
          const date = new Date(ev.evaluatedAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // "YYYY-MM"
          if(!monthlyData[monthKey]) monthlyData[monthKey] = { totalScore: 0, count: 0};
          monthlyData[monthKey].totalScore += ev.calculatedScores.overall;
          monthlyData[monthKey].count++;
      });
      
      const sortedMonthKeys = Object.keys(monthlyData).sort();
      
      return sortedMonthKeys.map(monthKey => {
          const [year, month] = monthKey.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          const monthName = date.toLocaleString('es-ES', { month: 'short' });
          const shortYear = date.toLocaleString('es-ES', { year: '2-digit' });
          return {
              month: `${monthName}. ${shortYear}`,
              "Puntuación Media": parseFloat((monthlyData[monthKey].totalScore / monthlyData[monthKey].count).toFixed(2))
          };
      });
  }, [filteredAllEvaluations]);


  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return scheduledEvals
      .filter(event => new Date(event.start) >= now && new Date(event.start) <= oneWeekFromNow)
      .filter(event => 
          event.participantIds.includes(currentUser.id) || 
          event.targetType === 'general' ||
          (event.targetType === 'department' && event.targetId === currentUser.department)
      )
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [scheduledEvals, currentUser]);

  const handleBarClick = (data: any) => {
      if (data && data.activePayload && data.activePayload[0]) {
          const deptName = data.activePayload[0].payload.name;
          if (filter.type === 'department' && filter.value === deptName) {
            setFilter({ type: null, value: null }); // Un-filter if clicked again
          } else {
            setFilter({ type: 'department', value: deptName });
          }
      }
  };

  const handlePieClick = (data: any) => {
      if (data && data.name) {
          if (filter.type === 'level' && filter.value === data.name) {
            setFilter({ type: null, value: null }); // Un-filter if clicked again
          } else {
            setFilter({ type: 'level', value: data.name });
          }
      }
  };
  
  const activePieIndex = useMemo(() => {
      if(filter.type !== 'level') return -1;
      return levelDistribution.findIndex(d => d.name === filter.value);
  }, [filter, levelDistribution]);
  
  if (employeeEvaluations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-6 text-center">
        <h2 className="text-2xl font-bold text-brand-text-primary">Panel General</h2>
        <p className="mt-4 text-brand-text-secondary">Bienvenido. Aún no hay datos para mostrar en el panel.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-brand-text-primary">Panel General</h2>
          {filter.type && (
            <p className="text-brand-text-secondary mt-1">{`Filtrando por: ${filter.type === 'department' ? `Departamento de ${filter.value}` : `Nivel ${filter.value}`}`}</p>
          )}
        </div>
        {filter.type && (
            <button onClick={() => setFilter({type: null, value: null})} className="flex items-center gap-2 px-3 py-1 bg-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-600">
                <XMarkIcon className="w-4 h-4" />
                Limpiar Filtro
            </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h3 className="text-sm font-semibold text-brand-text-secondary">Evaluaciones</h3><p className="text-4xl font-bold mt-2 text-brand-text-primary">{kpis.totalEvaluations}</p></div>
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h3 className="text-sm font-semibold text-brand-text-secondary">Empleados</h3><p className="text-4xl font-bold mt-2 text-brand-text-primary">{kpis.evaluatedEmployeeCount}</p></div>
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h3 className="text-sm font-semibold text-brand-text-secondary">Puntuación Media</h3><p className="text-4xl font-bold mt-2 text-brand-accent-cyan">{kpis.averageScore.toFixed(2)}</p></div>
        <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h3 className="text-sm font-semibold text-brand-text-secondary">Potencial Medio</h3><p className="text-4xl font-bold mt-2 text-brand-accent-purple">{kpis.averagePotentialLabel}</p></div>
        <div className="bg-brand-card border border-brand-border rounded-xl p-4">
           <h3 className="text-sm font-semibold text-brand-text-secondary text-center mb-2">Próximos Eventos</h3>
           {upcomingEvents.length > 0 ? (
             <div className="space-y-1 max-h-[60px] overflow-y-auto pr-1">
              {upcomingEvents.map(event => (
                <div key={event.id} className="text-xs bg-brand-bg/50 p-1.5 rounded-md truncate" title={event.title}><p className="font-bold text-brand-text-primary truncate">{event.title}</p><p className="text-brand-text-secondary">{new Date(event.start).toLocaleDateString()}</p></div>
              ))}
             </div>
           ) : ( <div className="flex items-center justify-center h-full text-center text-brand-text-secondary/60"><CalendarDaysIcon className="w-6 h-6"/></div> )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Distribución por Nivel</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={levelDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" onClick={handlePieClick} activeIndex={activePieIndex} activeShape={(props: any) => { const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props; return <g><text x={cx} y={cy} dy={8} textAnchor="middle" fill="#fff" fontSize="16">{payload.name}</text><path d={`M${cx},${cy}L${Math.cos(-startAngle*(Math.PI/180)) * (outerRadius+5) + cx},${Math.sin(-startAngle*(Math.PI/180)) * (outerRadius+5) + cy}A${outerRadius+5},${outerRadius+5},0,${endAngle - startAngle > 180 ? 1 : 0},1,${Math.cos(-endAngle*(Math.PI/180)) * (outerRadius+5) + cx},${Math.sin(-endAngle*(Math.PI/180)) * (outerRadius+5) + cy}Z`} stroke={fill} fill={fill} opacity={0.3} /></g> }} labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} className="cursor-pointer">
                    {levelDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #8B949E' }} />
                <Legend formatter={(value, entry) => <span style={{ color: '#E6EDF3' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="lg:col-span-3 bg-brand-card border border-brand-border rounded-xl p-6">
            <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Tendencia de Rendimiento</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 148, 158, 0.2)" />
                <XAxis dataKey="month" tick={{ fill: '#8B949E' }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#8B949E' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #8B949E' }} />
                <Legend formatter={(value, entry) => <span style={{ color: '#E6EDF3' }}>{value}</span>} />
                <Line type="monotone" dataKey="Puntuación Media" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
      </div>

       <div className="bg-brand-card border border-brand-border rounded-xl p-6">
        <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Rendimiento por Departamento</h3>
         <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentChartData} onClick={handleBarClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 148, 158, 0.2)" />
              <XAxis dataKey="name" tick={{ fill: '#8B949E' }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#8B949E' }} />
              <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #8B949E' }} />
              <Legend formatter={(value, entry) => <span style={{ color: '#E6EDF3' }}>{value}</span>} />
              <Bar dataKey="Puntuación Promedio" className="cursor-pointer">
                  {departmentChartData.map((entry) => (
                      <Cell key={entry.name} fill={filter.type === 'department' && filter.value === entry.name ? '#22d3ee' : '#8b5cf6'} />
                  ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
       </div>
    </div>
  );
};
