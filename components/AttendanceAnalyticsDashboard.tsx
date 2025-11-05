import React, { useState, useMemo, useEffect } from 'react';
// @ts-ignore
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Employee, AttendanceRecord, WorkSchedule } from '../types';
import { ChartBarIcon, ArrowDownTrayIcon } from './icons';

interface AttendanceAnalyticsDashboardProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  workSchedules: WorkSchedule[];
  departments: string[];
}

// Helper function to get all dates in a range
const getDatesInRange = (startDate: Date, endDate: Date) => {
    const dates = [];
    let currentDate = new Date(startDate);
    // Adjust for timezone issues where new Date('YYYY-MM-DD') creates a UTC date
    currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset());
    endDate.setMinutes(endDate.getMinutes() + endDate.getTimezoneOffset());
    
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// Helper to calculate hours between two time strings
const calculateHours = (clockIn: string, clockOut: string | null): number => {
    if (!clockOut) return 0;
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    const inDate = new Date();
    inDate.setHours(inH, inM, 0, 0);
    const outDate = new Date();
    outDate.setHours(outH, outM, 0, 0);
    if (outDate < inDate) { // Handle overnight shifts
        outDate.setDate(outDate.getDate() + 1);
    }
    const diff = (outDate.getTime() - inDate.getTime()) / 1000 / 60 / 60; // difference in hours
    return diff > 0 ? diff : 0;
};

export const AttendanceAnalyticsDashboard: React.FC<AttendanceAnalyticsDashboardProps> = ({
  employees,
  attendanceRecords,
  workSchedules,
  departments,
}) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  const handleDateRangePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    setDateRange({
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    });
  };

  const employeesForFilter = useMemo(() => {
    if (departmentFilter === 'all') return employees;
    return employees.filter(c => c.department === departmentFilter);
  }, [employees, departmentFilter]);

  useEffect(() => {
    if (employeeFilter !== 'all' && !employeesForFilter.some(c => c.id === employeeFilter)) {
        setEmployeeFilter('all');
    }
  }, [departmentFilter, employeesForFilter, employeeFilter]);


  const filteredEmployees = useMemo(() => {
    let result = employees;
    if (departmentFilter !== 'all') {
      result = result.filter(c => c.department === departmentFilter);
    }
    if (employeeFilter !== 'all') {
      result = result.filter(c => c.id === employeeFilter);
    }
    return result;
  }, [employees, departmentFilter, employeeFilter]);

  const employeeStats = useMemo(() => {
    const stats: Record<string, { presentDays: number; absentDays: number; lateDays: number; workedHours: number; }> = {};
    
    if (!dateRange.start || !dateRange.end) return stats;

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const dateList = getDatesInRange(startDate, endDate);

    const candsForDeptChart = (departmentFilter === 'all') ? employees : employees.filter(c => c.department === departmentFilter);
    const allRelevantEmployees = new Set([...filteredEmployees, ...candsForDeptChart]);

    allRelevantEmployees.forEach(c => {
        stats[c.id] = { presentDays: 0, absentDays: 0, lateDays: 0, workedHours: 0 };
        
        dateList.forEach(date => {
            const dateStr = date.toISOString().split('T')[0];
            const record = attendanceRecords.find(r => r.employeeId === c.id && r.date === dateStr);
            const schedule = workSchedules.find(ws => ws.employeeId === c.id && ws.date === dateStr);
            
            if (schedule) {
                if (record && (record.status === 'Presente' || record.status === 'Atrasado')) {
                    stats[c.id].presentDays++;
                    if (record.status === 'Atrasado' || (record.clockIn && record.clockIn > schedule.startTime)) {
                        stats[c.id].lateDays++;
                    }
                    stats[c.id].workedHours += calculateHours(record.clockIn, record.clockOut);
                } else if (!record || record.status === 'Ausente') {
                    stats[c.id].absentDays++;
                }
            }
        });
    });

    return stats;
  }, [dateRange, filteredEmployees, employees, departmentFilter, attendanceRecords, workSchedules]);
  
  const kpis = useMemo(() => {
      const relevantStats = filteredEmployees.map(c => employeeStats[c.id]).filter(Boolean);
      const totalScheduledDays = relevantStats.reduce((acc, curr) => acc + curr.presentDays + curr.absentDays, 0);
      const totalPresent = relevantStats.reduce((acc, curr) => acc + curr.presentDays, 0);
      const totalLate = relevantStats.reduce((acc, curr) => acc + curr.lateDays, 0);
      const totalAbsent = relevantStats.reduce((acc, curr) => acc + curr.absentDays, 0);
      const totalWorkedHours = relevantStats.reduce((acc, curr) => acc + curr.workedHours, 0);

      const attendanceRate = totalScheduledDays > 0 ? (totalPresent / totalScheduledDays) * 100 : 0;
      const punctualityRate = totalPresent > 0 ? ((totalPresent - totalLate) / totalPresent) * 100 : 0;

      return {
          attendanceRate,
          punctualityRate,
          totalLate,
          totalAbsent,
          totalWorkedHours
      };
  }, [employeeStats, filteredEmployees]);

  const trendChartData = useMemo(() => {
      if (!dateRange.start || !dateRange.end) return [];
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      const dateList = getDatesInRange(startDate, endDate);
      
      return dateList.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          let present = 0;
          let late = 0;
          let absent = 0;

          filteredEmployees.forEach(c => {
              const record = attendanceRecords.find(r => r.employeeId === c.id && r.date === dateStr);
              const schedule = workSchedules.find(ws => ws.employeeId === c.id && ws.date === dateStr);
              if (schedule) {
                  if (record && (record.status === 'Presente' || record.status === 'Atrasado')) {
                      present++;
                      if (record.status === 'Atrasado' || (record.clockIn && record.clockIn > schedule.startTime)) late++;
                  } else if (!record || record.status === 'Ausente') {
                      absent++;
                  }
              }
          });
          return { date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric'}), Presente: present, Atrasado: late, Ausente: absent };
      });

  }, [dateRange, filteredEmployees, attendanceRecords, workSchedules]);

  const departmentComparisonData = useMemo(() => {
      return departments.map(dept => {
          const deptCands = employees.filter(c => c.department === dept);
          const deptStats = deptCands.map(c => employeeStats[c.id]).filter(Boolean);
          const totalScheduled = deptStats.reduce((acc, s) => acc + s.presentDays + s.absentDays, 0);
          const totalPresent = deptStats.reduce((acc, s) => acc + s.presentDays, 0);
          const attendanceRate = totalScheduled > 0 ? (totalPresent / totalScheduled) * 100 : 0;
          return { name: dept, 'Tasa de Asistencia': attendanceRate };
      });
  }, [departments, employees, employeeStats]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Empleado,Departamento,Días Presentes,Días Ausentes,Total de Atrasos,Horas Trabajadas\n";
    
    const employeesToExport = (employeeFilter !== 'all') 
        ? employees.filter(c => c.id === employeeFilter)
        : (departmentFilter !== 'all' ? employees.filter(c => c.department === departmentFilter) : employees);

    employeesToExport.forEach(c => {
        const stats = employeeStats[c.id];
        if (stats) {
            const row = [c.name, c.department, stats.presentDays, stats.absentDays, stats.lateDays, stats.workedHours.toFixed(2)].join(',');
            csvContent += row + "\n";
        }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "analisis_asistencia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const selectedEmployeeName = useMemo(() => {
    if (employeeFilter === 'all') return null;
    return employees.find(c => c.id === employeeFilter)?.name;
  }, [employeeFilter, employees]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-text-primary">
            {selectedEmployeeName ? `Análisis de: ${selectedEmployeeName}` : 'Análisis de Asistencia'}
          </h2>
          <p className="text-brand-text-secondary">Métricas y tendencias sobre la asistencia del personal.</p>
        </div>
        <button onClick={handleExportCSV} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-all flex items-center gap-2">
            <ArrowDownTrayIcon className="w-5 h-5" />
            Descargar CSV
        </button>
      </div>

      <div className="bg-brand-card border border-brand-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
            <label className="text-sm font-medium">Rango:</label>
            <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="p-2 border border-brand-border bg-brand-bg rounded-md text-sm text-brand-text-secondary" />
            <span>-</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="p-2 border border-brand-border bg-brand-bg rounded-md text-sm text-brand-text-secondary" />
             <button onClick={() => handleDateRangePreset(7)} className="px-3 py-1 text-xs bg-slate-700 rounded-md">7d</button>
            <button onClick={() => handleDateRangePreset(30)} className="px-3 py-1 text-xs bg-slate-700 rounded-md">30d</button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
            <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="p-2 border border-brand-border bg-brand-bg rounded-md text-sm min-w-[180px]">
                <option value="all">Todos los Departamentos</option>
                {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
            </select>
             <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} className="p-2 border border-brand-border bg-brand-bg rounded-md text-sm min-w-[180px]">
                <option value="all">Todos los Empleados</option>
                {employeesForFilter.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h4 className="text-sm font-semibold text-brand-text-secondary">Tasa de Asistencia</h4><p className="text-3xl font-bold mt-1 text-green-400">{kpis.attendanceRate.toFixed(1)}%</p></div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h4 className="text-sm font-semibold text-brand-text-secondary">Tasa de Puntualidad</h4><p className="text-3xl font-bold mt-1 text-cyan-400">{kpis.punctualityRate.toFixed(1)}%</p></div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h4 className="text-sm font-semibold text-brand-text-secondary">Total de Atrasos</h4><p className="text-3xl font-bold mt-1 text-yellow-400">{kpis.totalLate}</p></div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h4 className="text-sm font-semibold text-brand-text-secondary">Total de Ausencias</h4><p className="text-3xl font-bold mt-1 text-red-400">{kpis.totalAbsent}</p></div>
          <div className="bg-brand-card border border-brand-border rounded-xl p-4 text-center"><h4 className="text-sm font-semibold text-brand-text-secondary">Horas Trabajadas</h4><p className="text-3xl font-bold mt-1 text-blue-400">{kpis.totalWorkedHours.toFixed(1)}</p></div>
      </div>

      <div className={`grid grid-cols-1 ${employeeFilter === 'all' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
          <div className="bg-brand-card border border-brand-border rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Tendencia de Asistencia</h3>
              <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 148, 158, 0.2)" />
                      <XAxis dataKey="date" tick={{ fill: '#8B949E' }} />
                      <YAxis tick={{ fill: '#8B949E' }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #8B949E' }} />
                      <Legend wrapperStyle={{ color: '#E6EDF3' }}/>
                      <Line type="monotone" dataKey="Presente" stroke="#10b981" />
                      <Line type="monotone" dataKey="Atrasado" stroke="#f59e0b" />
                      <Line type="monotone" dataKey="Ausente" stroke="#ef4444" />
                  </LineChart>
              </ResponsiveContainer>
          </div>
          {employeeFilter === 'all' && (
            <div className="bg-brand-card border border-brand-border rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4">Comparativa por Departamento</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={departmentComparisonData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 148, 158, 0.2)" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#8B949E' }} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#8B949E' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0D1117', border: '1px solid #8B949E' }} formatter={(value) => `${Number(value).toFixed(1)}%`} />
                        <Bar dataKey="Tasa de Asistencia" fill="#8b5cf6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          )}
      </div>
      
      {employeeFilter === 'all' && (
       <div className="bg-brand-card border border-brand-border rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Resumen por Empleado</h3>
           <div className="overflow-x-auto max-h-[400px]">
              <table className="min-w-full divide-y divide-brand-border">
                  <thead className="bg-white/5 sticky top-0">
                      <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Empleado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Departamento</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase">Días Presentes</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase">Días Ausentes</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase">Total Atrasos</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-brand-text-secondary uppercase">Horas Trabajadas</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                      {filteredEmployees.map(c => {
                          const stats = employeeStats[c.id];
                          return (
                              <tr key={c.id} className="hover:bg-white/5 cursor-pointer" onClick={() => setEmployeeFilter(c.id)}>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-brand-text-primary">{c.name}</td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-brand-text-secondary">{c.department}</td>
                                  <td className="px-4 py-3 text-center text-sm text-green-400">{stats?.presentDays || 0}</td>
                                  <td className="px-4 py-3 text-center text-sm text-red-400">{stats?.absentDays || 0}</td>
                                  <td className="px-4 py-3 text-center text-sm text-yellow-400">{stats?.lateDays || 0}</td>
                                  <td className="px-4 py-3 text-center text-sm text-blue-400">{stats?.workedHours.toFixed(1) || '0.0'}</td>
                              </tr>
                          )
                      })}
                  </tbody>
              </table>
          </div>
       </div>
      )}

    </div>
  );
};