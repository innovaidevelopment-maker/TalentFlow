import React, { useState } from 'react';
import type { User } from '../types';

interface LoginProps {
    onLogin: (user: User) => void;
    users: User[];
    onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, users, onNavigateToRegister }) => {
    const [email, setEmail] = useState('admin@talentflow.app'); // Pre-fill for convenience
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            setError('Usuario no encontrado.');
            return;
        }

        if (user.password !== password) {
            setError('Contraseña incorrecta.');
            return;
        }

        onLogin(user);
    };

    return (
        <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-brand-card backdrop-blur-sm border border-brand-border rounded-xl p-8 shadow-2xl shadow-blue-900/20">
                    <h1 className="text-3xl font-bold text-center text-brand-text-primary mb-2">Bienvenido</h1>
                    <p className="text-center text-brand-text-secondary mb-8">Inicia sesión para continuar</p>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full p-3 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-2 focus:ring-brand-accent-blue focus:border-brand-accent-blue transition-all"
                                required
                                autoFocus
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full p-3 border border-brand-border bg-brand-bg rounded-md shadow-sm focus:ring-2 focus:ring-brand-accent-blue focus:border-brand-accent-blue transition-all"
                            />
                        </div>

                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                        <div>
                            <button
                                type="submit"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold bg-gradient-to-r from-brand-accent-blue to-brand-accent-purple hover:shadow-lg hover:shadow-brand-accent-purple/20 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg focus:ring-brand-accent-purple"
                            >
                                Ingresar
                            </button>
                        </div>
                    </form>

                     <p className="text-center text-sm text-brand-text-secondary mt-6">
                        ¿Tu empresa aún no está registrada?{' '}
                        <button onClick={onNavigateToRegister} className="font-semibold text-brand-accent-cyan hover:underline focus:outline-none">
                            Crea una cuenta
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};