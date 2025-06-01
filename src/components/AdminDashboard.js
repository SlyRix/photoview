// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiChartLine, mdiArrowLeft } from '@mdi/js';
import { Link } from 'react-router-dom';
import WeddingAnalyticsDashboard from './WeddingAnalyticsDashboard';

const AdminDashboard = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Check if already admin authenticated
    useEffect(() => {
        const adminAuth = localStorage.getItem('adminAuth');
        if (adminAuth) {
            try {
                const authData = JSON.parse(atob(adminAuth));
                if (authData.exp > Date.now() / 1000) {
                    setIsAdmin(true);
                } else {
                    localStorage.removeItem('adminAuth');
                }
            } catch (e) {
                localStorage.removeItem('adminAuth');
            }
        }
    }, []);

    const handleAdminLogin = (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Admin password check (in production, this should be server-side)
        setTimeout(() => {
            if (adminPassword === 'Admin2024!') { // Set your admin password here
                // Create admin token
                const token = btoa(JSON.stringify({
                    exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60), // 4 hours
                    role: 'admin'
                }));
                localStorage.setItem('adminAuth', token);
                setIsAdmin(true);
            } else {
                setError('Falsches Admin-Passwort');
            }
            setLoading(false);
        }, 1000);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        setIsAdmin(false);
        setAdminPassword('');
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full bg-white rounded-lg shadow-lg p-8"
                >
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Icon path={mdiChartLine} size={2} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
                        <p className="text-gray-600">Analytics & Photo Management</p>
                    </div>

                    <form onSubmit={handleAdminLogin}>
                        <div className="mb-6">
                            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Passwort
                            </label>
                            <input
                                type="password"
                                id="adminPassword"
                                value={adminPassword}
                                onChange={(e) => setAdminPassword(e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-gray-300'} focus:ring-purple-500 focus:border-purple-500 outline-none transition`}
                                placeholder="Passwort eingeben"
                                required
                            />
                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-semibold transition-all ${
                                loading ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Prüfe Zugangsdaten...
                                </span>
                            ) : (
                                'Zum Dashboard'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/"
                            className="text-sm text-gray-600 hover:text-purple-600 transition-colors"
                        >
                            ← Zurück zur Gallery
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with logout */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                to="/"
                                className="flex items-center text-gray-600 hover:text-purple-600 transition-colors"
                            >
                                <Icon path={mdiArrowLeft} size={1} className="mr-2" />
                                Zur Gallery
                            </Link>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="text-sm text-gray-600 hover:text-red-600 transition-colors"
                        >
                            Admin Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Analytics Dashboard */}
            <WeddingAnalyticsDashboard />
        </div>
    );
};

export default AdminDashboard;

// ---------------------------------------------------
// src/App.js - Updated with Admin Route
// ---------------------------------------------------

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './AuthContext';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Gallery from './components/Gallery';
import PhotoDetail from './components/PhotoDetail';
import Loading from './components/Loading';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard'; // NEW

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <Loading message="Checking authentication..." />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// App Routes component (uses auth context)
const AppRoutes = () => {
    const { login } = useAuth();

    return (
        <AnimatePresence mode="wait">
            <Routes>
                <Route
                    path="/login"
                    element={<LoginScreen onLogin={login} />}
                />

                {/* NEW: Admin Route - No authentication required for admin login */}
                <Route
                    path="/admin"
                    element={<AdminDashboard />}
                />

                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <div className="min-h-screen flex flex-col bg-gradient-to-br from-christian-accent/5 to-hindu-accent/5">
                                <Header />
                                <main className="flex-grow">
                                    <Gallery />
                                </main>
                                <Footer />
                            </div>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/photo/:photoId"
                    element={
                        <ProtectedRoute>
                            <div className="min-h-screen flex flex-col bg-gradient-to-br from-christian-accent/5 to-hindu-accent/5">
                                <Header />
                                <main className="flex-grow">
                                    <PhotoDetail />
                                </main>
                                <Footer />
                            </div>
                        </ProtectedRoute>
                    }
                />
                {/* Redirect to gallery if path not found */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
};

// Main App component
function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
}

export default App;

// ---------------------------------------------------
// Zusätzliche Tailwind Klassen für tailwind.config.js
// ---------------------------------------------------

module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'wedding-love': '#e91e63',
                'christian-accent': '#b08968',
                'hindu-accent': '#d93f0b',
                'wedding-gold': '#ffd700',
                'wedding-background': '#fefefe',
                'christian-text': '#2d3748',
                'gold': {
                    500: '#ffd700'
                }
            },
            fontFamily: {
                'script': ['Tangerine', 'cursive'],
                'display': ['Cormorant Garamond', 'serif'],
                'body': ['Montserrat', 'sans-serif']
            }
        },
    },
    plugins: [],
}