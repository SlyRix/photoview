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

// Protected Route component (only for gallery and admin routes)
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

// Public Photo Detail Layout (no header/footer for cleaner mobile experience)
const PublicPhotoLayout = ({ children }) => (
    <div className="min-h-screen bg-gradient-to-br from-christian-accent/5 to-hindu-accent/5">
        {children}
    </div>
);

// Protected Gallery Layout (with header/footer)
const ProtectedLayout = ({ children }) => (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-christian-accent/5 to-hindu-accent/5">
        <Header />
        <main className="flex-grow">
            {children}
        </main>
        <Footer />
    </div>
);

// App Routes component (uses auth context)
const AppRoutes = () => {
    const { login } = useAuth();

    return (
        <AnimatePresence mode="wait">
            <Routes>
                {/* Public login page */}
                <Route
                    path="/login"
                    element={<LoginScreen onLogin={login} />}
                />

                {/* PUBLIC: Individual photo view - NO LOGIN REQUIRED */}
                <Route
                    path="/photo/:photoId"
                    element={
                        <PublicPhotoLayout>
                            <PhotoDetail />
                        </PublicPhotoLayout>
                    }
                />

                {/* PROTECTED: Gallery - LOGIN REQUIRED */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <Gallery />
                            </ProtectedLayout>
                        </ProtectedRoute>
                    }
                />

                {/* PROTECTED: Gallery alias - LOGIN REQUIRED */}
                <Route
                    path="/gallery"
                    element={
                        <ProtectedRoute>
                            <ProtectedLayout>
                                <Gallery />
                            </ProtectedLayout>
                        </ProtectedRoute>
                    }
                />

                {/* Redirect unknown paths to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
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