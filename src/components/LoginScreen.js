import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import { motion } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiLock, mdiEye, mdiEyeOff } from '@mdi/js';

const LoginScreen = ({ onLogin }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate(); // Use the navigate hook for redirection

    // Check if there's a stored authentication token
    useEffect(() => {
        const token = localStorage.getItem('wedAuth');
        if (token) {
            try {
                // Validate token (simple version - in a real app we'd verify with the server)
                const tokenData = JSON.parse(atob(token.split('.')[1]));
                if (tokenData.exp > Date.now() / 1000) {
                    onLogin(true);
                    // Redirect to home page after successful authentication
                    navigate('/');
                } else {
                    // Token expired
                    localStorage.removeItem('wedAuth');
                }
            } catch (e) {
                console.error("Error parsing auth token:", e);
                localStorage.removeItem('wedAuth');
            }
        }
    }, [onLogin, navigate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Simple validation
        if (!password) {
            setError('Please enter the password');
            setIsLoading(false);
            return;
        }

        // Check password (in a real app, this would be a server request)
        setTimeout(() => {
            if (password === 'Wed123') { // This is the password you'd set
                // Create a simple JWT-like token (for demonstration)
                const token = createToken();
                localStorage.setItem('wedAuth', token);
                onLogin(true);
                // Important: Redirect to home page after successful login
                navigate('/');
            } else {
                setError('Incorrect password. Please try again.');
            }
            setIsLoading(false);
        }, 1000); // Simulate server delay
    };

    // Create a simple token with expiration
    const createToken = () => {
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payload = btoa(JSON.stringify({
            exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hour expiration
            iat: Math.floor(Date.now() / 1000)
        }));
        const signature = btoa('signature'); // In a real app, this would be cryptographically secure

        return `${header}.${payload}.${signature}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-christian-accent/20 to-hindu-accent/20 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden"
            >
                <div className="p-6 md:p-8">
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-6">
                            <div className="w-20 h-20 bg-christian-accent/10 rounded-full flex items-center justify-center">
                                <Icon path={mdiLock} size={2} className="text-christian-accent" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Private Gallery</h1>
                        <p className="text-gray-600">Enter the password to access the photo gallery</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-christian-accent focus:border-christian-accent outline-none transition`}
                                    placeholder="Enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                >
                                    <Icon path={showPassword ? mdiEyeOff : mdiEye} size={1} />
                                </button>
                            </div>
                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full btn btn-primary btn-christian ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </span>
                            ) : (
                                'Access Gallery'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have the password? Please contact the wedding couple.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginScreen;
