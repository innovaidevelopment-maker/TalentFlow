import React, { useState } from 'react';
import type { User, Organization } from '../types';

interface RegisterProps {
    // Fix: Update prop type to expect a Promise
    onRegister: (orgName: string, userName: string, userEmail: string, userPassword: string) => Promise<boolean>;
    onNavigateToLogin: () => void;
    users: User[];
    organizations: Organization[];
}

export const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin, users, organizations }) => {
    const [orgName, setOrgName] = useState('');
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    // Fix: Make function async to handle promise from onRegister
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        if (organizations.some(o => o.name.toLowerCase() === orgName.toLowerCase())) {
            setError('El nombre de la empresa ya está en uso.');
            return;
        }

        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            setError('Este correo electrónico ya está registrado.');
            return;
        }
        
        const success = await onRegister(orgName.trim(), userName.trim(), email.trim(), password);

        if (!success) {
            setError('Ocurrió un error inesperado durante el registro.');
        }
    };

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-8 shadow-2xl shadow-blue-900/20">
                    <h1 className="text-3xl font-bold text-center text-brand-text-primary mb-2">Crear Cuenta de Empresa</h1>
                    <p className="text-center text-brand-text-secondary mb-8">Regístrate para empezar a gestionar tu equipo.</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Nombre de la Empresa</label>
                            <input
                                type="text"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                className="mt-1 block w-full p-3 border border-brand-border bg-brand-bg rounded-md shadow-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Tu Nombre Completo</label>
                            <input
                                type="text"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="mt-1 block w-full p-3 border border-brand-border bg-brand-bg rounded-md shadow-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Tu Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full p-3 border border-brand-border bg-brand-bg rounded-md shadow-sm"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Contraseña</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full p-3 border border-brand-border bg-brand-bg rounded-md shadow-sm"
                                required
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-brand-text-secondary">Confirmar Contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full p-3 border border-brand-border bg-brand-bg rounded-md shadow-sm"
                                required
                            />
                        </div>

                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center mt-2 py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold bg-gradient-to-r from-brand-accent-purple to-brand-accent-indigo hover:shadow-lg hover:shadow-brand-accent-indigo/20 transition-all"
                            >
                                Registrar Empresa
                            </button>
                        </div>
                    </form>

                     <p className="text-center text-sm text-brand-text-secondary mt-6">
                        ¿Ya tienes una cuenta?{' '}
                        <button onClick={onNavigateToLogin} className="font-semibold text-brand-accent-cyan hover:underline focus:outline-none">
                            Inicia sesión
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};
