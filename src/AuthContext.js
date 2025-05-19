import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom'; // Import Navigate and useLocation
import Icon from '@mdi/react';
import { mdiLogout } from '@mdi/js';

const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation(); // Get current location

    // Check authentication status on initial load
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('wedAuth');
            if (token) {
                try {
                    // Simple token validation (in a real app, you'd verify with the server)
                    const tokenData = JSON.parse(atob(token.split('.')[1]));
                    if (tokenData.exp > Date.now() / 1000) {
                        setIsAuthenticated(true);
                    } else {
                        // Token expired
                        localStorage.removeItem('wedAuth');
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('Error parsing token:', error);
                    localStorage.removeItem('wedAuth');
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Login function
    const login = (value) => {
        setIsAuthenticated(value);
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('wedAuth');
        setIsAuthenticated(false);
    };

    // Auth context value
    const value = {
        isAuthenticated,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for using auth context
export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Enhanced Protected Route component that handles redirection
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    // Show a loader while checking auth state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-christian-accent border-r-christian-accent border-b-transparent border-l-transparent"></div>
            </div>
        );
    }

    // If not authenticated, redirect to login page and remember the intended destination
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If authenticated, show the protected content
    return children;
};

// Reusable Logout Button component
export const LogoutButton = () => {
    const { logout } = useAuth();

    return (
        <button
            onClick={logout}
            className="flex items-center text-gray-500 hover:text-christian-accent transition-colors"
            title="Logout"
        >
            <Icon path={mdiLogout} size={1} className="mr-1" />
            <span className="text-sm">Logout</span>
        </button>
    );
};

export default AuthContext;