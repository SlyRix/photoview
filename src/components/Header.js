// Updated src/components/Header.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiImage, mdiHeart, mdiHome, mdiCamera } from '@mdi/js';

const Header = () => {
    const location = useLocation();

    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto py-4 px-4 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2">
                    <motion.div
                        initial={{ rotate: -5 }}
                        animate={{ rotate: 5 }}
                        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        className="text-wedding-love"
                    >
                        <Icon path={mdiHeart} size={1.2} />
                    </motion.div>

                    <div>
                        <h1 className="text-2xl md:text-3xl font-script gradient-text">
                            Rushel & Sivani
                        </h1>
                        <p className="text-xs text-gray-500">Wedding Memories</p>
                    </div>
                </Link>

                <div className="flex items-center space-x-4">
                    <Link
                        to="/"
                        className={`flex items-center space-x-1 transition-colors ${
                            location.pathname === '/'
                                ? 'text-christian-accent'
                                : 'text-gray-500 hover:text-christian-accent'
                        }`}
                    >
                        <Icon path={mdiHome} size={0.9} />
                        <span className="hidden md:inline text-sm">Home</span>
                    </Link>

                    <Link
                        to="/gallery"
                        className={`flex items-center space-x-1 transition-colors ${
                            location.pathname === '/gallery'
                                ? 'text-christian-accent'
                                : 'text-gray-500 hover:text-christian-accent'
                        }`}
                    >
                        <Icon path={mdiImage} size={0.9} />
                        <span className="hidden md:inline text-sm">Gallery</span>
                    </Link>
                </div>
            </div>

            {/* Decorative element */}
            <div className="h-1 w-full bg-gradient-to-r from-christian-accent via-wedding-love to-hindu-accent"></div>
        </header>
    );
};

export default Header;