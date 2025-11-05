import React, { useState, useEffect, useMemo } from 'react';
import type { Employee, EvaluationResult, AttendanceRecord, FlightRiskResult, FlightRiskLevel } from '../types';
import { analyzeFlightRisk } from '../services/geminiService';
import { ChartPieIcon } from './icons';

interface FlightRiskDashboardProps {
  employees: Employee[];
  evaluations: EvaluationResult[];
  attendanceRecords: AttendanceRecord[];
  departments: string[];
}

// Function to get dates in a range
const getDatesInRange = (startDate: Date, endDate: Date) => {
    const dates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

export const FlightRiskDashboard: React.FC<FlightRiskDashboardProps> = ({ employees, evaluations, attendanceRecords, departments }) => {
    const [riskData, setRiskData] = useState<FlightRiskResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [departmentFilter, setDepartmentFilter] = useState('all');

    useEffect(() => {
        const performAnalysis = async () => {
            setIsLoading(true);

            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            const analysisPromises = employees.map(async (employee) => {
                const employeeEvaluations = evaluations
                    .filter(e => e.personId === employee.id)
                    .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());

                // Require at least 2 evaluations to establish a trend
                if (employeeEvaluations.length < 2) {
                    return null;
                }

                const employeeAttendance = attendanceRecords.filter(r =>
                    r.employeeId === employee.id && new Date(r.date) >= ninetyDaysAgo
                );

                const absencesLast90Days = employeeAttendance.filter(r => r.status === 'Ausente').length;
                const latesLast90Days = employeeAttendance.filter(r => r.status === 'Atrasado').length;
                
                const tenureMonths = employee.hireDate ? Math.floor((new Date().getTime() - new Date(employee.hireDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : 0;
                
                const evaluationScores = employeeEvaluations.slice(0, 3).map(e => e.calculatedScores.overall);
                
                const aiResult = await analyzeFlightRisk({
                    tenureMonths,
                    evaluationScores,
                    absencesLast90Days,
                    latesLast90Days
                });
                
                if (aiResult.riskScore === -1) return null; // API error

                let riskLevel: FlightRiskLevel = 'Bajo';
                if (aiResult.riskScore > 70) riskLevel = 'Alto';
                else if (aiResult.riskScore > 40) riskLevel = 'Medio';

                let evaluationTrend: 'ascendente' | 'descendente' | 'estable' = 'estable';
                if (evaluationScores.length > 1) {
                    if (evaluationScores[0] < evaluationScores[1]) evaluationTrend = 'descendente';
                    else if (evaluationScores[0] > evaluationScores[1]) evaluationTrend = 'ascendente';
                }

                return {
                    employeeId: employee.id,
                    riskScore: aiResult.riskScore,
                    riskLevel,
                    summary: aiResult.summary,
                    factors: {
                        evaluationTrend,
                        absencesLast90Days,
                        latesLast90Days,
                        tenureMonths
                    }
                };
            });

            const results = (await Promise.all(analysisPromises)).filter(Boolean) as FlightRiskResult[];
            setRiskData(results);
            setIsLoading(false);
        };

        performAnalysis();
    }, [employees, evaluations, attendanceRecords]);

    const filteredRiskData = useMemo(() => {
        if (departmentFilter === 'all') return riskData;
        const departmentEmployeeIds = new Set(employees.filter(c => c.department === departmentFilter).map(c => c.id));
        return riskData.filter(r => departmentEmployeeIds.has(r.employeeId));
    }, [riskData, departmentFilter, employees]);

    const categorizedEmployees = useMemo(() => {
        const high: FlightRiskResult[] = [];
        const medium: FlightRiskResult[] = [];
        const low: FlightRiskResult[] = [];

        filteredRiskData.forEach(data => {
            if (data.riskLevel === 'Alto') high.push(data);
            else if (data.riskLevel === 'Medio') medium.push(data);
            else low.push(data);
        });

        const sortByScore = (a: FlightRiskResult, b: FlightRiskResult) => b.riskScore - a.riskScore;
        
        return {
            high: high.sort(sortByScore),
            medium: medium.sort(sortByScore),
            low: low.sort(sortByScore)
        };
    }, [filteredRiskData]);

    const getRiskColor = (level: FlightRiskLevel) => {
        switch(level) {
            case 'Alto': return 'border-red-500';
            case 'Medio': return 'border-yellow-500';
            case 'Bajo': return 'border-green-500';
        }
    };

    const RiskColumn: React.FC<{ title: string; level: FlightRiskLevel; data: FlightRiskResult[] }> = ({ title, level, data }) => (
        <div className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4">
            <h3 className={`font-bold text-lg mb-4 pb-2 border-b ${getRiskColor(level)}`}>
                {title} <span className="text-sm font-normal text-brand-text-secondary">({data.length})</span>
            </h3>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {data.map(item => {
                    const employee = employees.find(c => c.id === item.employeeId);
                    if (!employee) return null;
                    return (
                        <div key={item.employeeId} className={`bg-brand-card border-l-4 ${getRiskColor(level)} rounded-r-lg p-3 shadow-md`}>
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-brand-text-primary">{employee.name}</p>
                                <span className={`font-bold text-xl ${getRiskColor(level).replace('border', 'text')}`}>{item.riskScore}</span>
                            </div>
                            <p className="text-sm text-brand-text-secondary">{employee.role}</p>
                            <p className="text-xs text-brand-text-secondary/80 mt-2">{item.summary}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><p>Analizando datos, por favor espera...</p></div>;
    }

    if (riskData.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-4 md:p-6 text-center">
                <ChartPieIcon className="mx-auto h-16 w-16 text-slate-600"/>
                <h2 className="text-2xl font-bold text-brand-text-primary mt-4">Análisis de Riesgo de Fuga</h2>
                <p className="mt-2 text-brand-text-secondary">No hay suficientes datos para realizar un análisis predictivo. Se requieren al menos dos evaluaciones por empleado para empezar a generar predicciones.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
             <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-brand-text-primary">Análisis Predictivo: Riesgo de Fuga</h2>
                    <p className="text-brand-text-secondary">Identifica proactivamente a los empleados en riesgo de dejar la organización.</p>
                </div>
                <select value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="p-2 border border-brand-border bg-brand-bg rounded-md shadow-sm text-sm min-w-[200px]">
                    <option value="all">Todos los Departamentos</option>
                    {departments.map(dept => (<option key={dept} value={dept}>{dept}</option>))}
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <RiskColumn title="Riesgo Alto" level="Alto" data={categorizedEmployees.high} />
                <RiskColumn title="Riesgo Medio" level="Medio" data={categorizedEmployees.medium} />
                <RiskColumn title="Riesgo Bajo" level="Bajo" data={categorizedEmployees.low} />
            </div>
        </div>
    );
};
