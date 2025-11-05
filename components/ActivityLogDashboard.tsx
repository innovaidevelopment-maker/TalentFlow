import React, { useState, useMemo } from 'react';
import type { ActivityLogEntry, User } from '../types';

interface ActivityLogDashboardProps {
    logs: ActivityLogEntry[];
    users: User[];
}

export const ActivityLogDashboard: React.FC<ActivityLogDashboardProps> = ({ logs, users }) => {
    const [userFilter, setUserFilter] = useState('all');
    const [dateFromFilter, setDateFromFilter] = useState('');
    const [dateToFilter, setDateToFilter] = useState('');

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            if (userFilter !== 'all' && log.userId !== userFilter) {
                return false;
            }
            const logDate = new Date(log.timestamp);
            if (dateFromFilter) {
                const fromDate = new Date(dateFromFilter + 'T00:00:00');
                if (logDate < fromDate) return false;
            }
            if (dateToFilter) {
                const toDate = new Date(dateToFilter + 'T23:59:59');
                if (logDate > toDate) return false;
            }
            return true;
        });
    }, [logs, userFilter, dateFromFilter, dateToFilter]);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <h2 className="text-3xl font-bold text-brand-text-primary mb-6">Registro de Actividad</h2>

            <div className="bg-brand-card/50 border border-brand-border/50 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="text-sm font-medium text-brand-text-secondary mb-1 block">Filtrar por Usuario</label>
                    <select value={userFilter} onChange={e => setUserFilter(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md">
                        <option value="all">Todos los Usuarios</option>
                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium text-brand-text-secondary mb-1 block">Desde</label>
                    <input type="date" value={dateFromFilter} onChange={e => setDateFromFilter(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-secondary" />
                </div>
                <div>
                    <label className="text-sm font-medium text-brand-text-secondary mb-1 block">Hasta</label>
                    <input type="date" value={dateToFilter} onChange={e => setDateToFilter(e.target.value)} className="w-full p-2 bg-brand-bg border border-brand-border rounded-md text-brand-text-secondary" />
                </div>
            </div>

            <div className="bg-brand-card border border-brand-border rounded-xl p-6">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-brand-border">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Fecha y Hora</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Usuario</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Acción</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-border">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-brand-text-primary">{log.userName}</td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{log.action}</td>
                                    <td className="px-4 py-4 text-sm text-brand-text-secondary">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredLogs.length === 0 && <p className="text-center py-8 text-brand-text-secondary">No hay registros que coincidan con los filtros.</p>}
                </div>
            </div>
        </div>
    );
};