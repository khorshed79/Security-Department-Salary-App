import React, { useState } from 'react';
import AuthLayout from './AuthLayout';
import { Settings } from '../types';

interface SignUpPageProps {
    onSignUp: (username: string, password: string) => Promise<boolean>;
    onSwitchToLogin: () => void;
    settings: Settings;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onSwitchToLogin, settings }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        const success = await onSignUp(username, password);
        setIsLoading(false);

        if (success) {
            setSuccess('Account created successfully! You can now log in.');
            setUsername('');
            setPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                onSwitchToLogin();
            }, 2000);
        } else {
            setError('Username already exists. Please choose another one.');
        }
    };

    return (
        <AuthLayout title="Create a New Account">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-lg">{error}</p>}
                {success && <p className="text-green-600 text-sm text-center bg-green-100 p-2 rounded-lg">{success}</p>}
                
                {!settings.googleSheetsUrl && (
                     <p className="text-yellow-700 text-xs text-center bg-yellow-100 p-2 rounded-lg">
                         Note: Google Sheets URL is not configured in Settings. Sign-up data will be saved locally but not to the sheet.
                    </p>
                )}
                
                <div>
                    <label htmlFor="username-signup" className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                        type="text"
                        id="username-signup"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                <div>
                    <label htmlFor="password-signup" className="block text-sm font-medium text-gray-700">Password</label>
                    <input
                        type="password"
                        id="password-signup"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <input
                        type="password"
                        id="confirm-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
                
                <div className="pt-2">
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400">
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </div>

                <p className="text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin(); }} className="font-medium text-indigo-600 hover:text-indigo-500">
                        Log in
                    </a>
                </p>
            </form>
        </AuthLayout>
    );
};

export default SignUpPage;
