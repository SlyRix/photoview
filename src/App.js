import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Gallery from './components/Gallery';
import PhotoDetail from './components/PhotoDetail';
import Loading from './components/Loading';

function App() {
  return (
      <Router>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-christian-accent/5 to-hindu-accent/5">
          <Header />

          <main className="flex-grow">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Gallery />} />
                <Route path="/photo/:photoId" element={<PhotoDetail />} />
                {/* Redirect to gallery if path not found */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AnimatePresence>
          </main>

          <Footer />
        </div>
      </Router>
  );
}

export default App;