import React, { useState } from 'react';
import AuthLayout from './AuthLayout';

interface LoginPageProps {
    onLogin: (username: string, password: string) => boolean;
    onSwitchToSignUp: () => void;
    loginError: string;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSwitchToSignUp, loginError }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };
    
    const handleDemoLogin = () => {
        setUsername('admin');
        setPassword('password');
        onLogin('admin', 'password');
    }

    return (
        <AuthLayout title="Login to Your Account">
            <form onSubmit={handleSubmit} className="space-y-6">
                {loginError && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-lg">{loginError}</p>}
                
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., admin"
                    />
                </div>
                
                <div>
                    <label htmlFor="password-login" className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        id="password-login"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="••••••••"
                    />
                </div>
                
                <div className="flex flex-col gap-4">
                     <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Login
                    </button>
                    <button type="button" onClick={handleDemoLogin} className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Use Demo Account
                    </button>
                </div>

                <p className="text-sm text-center text-gray-600">
                    Don't have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToSignUp(); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                        Sign up
                    </a>
                </p>
            </form>
        </AuthLayout>
    );
};

export default LoginPage;
