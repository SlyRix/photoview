import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiImage, mdiHeart } from '@mdi/js';

const Header = () => {
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

                <Link
                    to="/"
                    className="flex items-center space-x-1 text-christian-accent hover:text-hindu-accent transition-colors"
                >
                    <Icon path={mdiImage} size={1} />
                    <span className="hidden md:inline">Photo Gallery</span>
                </Link>
            </div>

            {/* Decorative element */}
            <div className="h-1 w-full bg-gradient-to-r from-christian-accent via-wedding-love to-hindu-accent"></div>
        </header>
    );
};

export default Header;