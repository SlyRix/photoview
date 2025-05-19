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