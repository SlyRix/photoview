// src/components/Welcome.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Icon from '@mdi/react';
import { mdiCamera, mdiHeart, mdiChevronDown } from '@mdi/js';

const Welcome = () => {
    const [showScrollHint, setShowScrollHint] = useState(true);

    // Hide scroll hint when user scrolls
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setShowScrollHint(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="mb-12">
            {/* Hero Section */}
            <div className="relative h-[80vh] min-h-[500px] flex items-center justify-center bg-gradient-to-br from-christian-accent/10 to-hindu-accent/10 overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {/* Optional background pattern or image */}
                    <div className="absolute inset-0 bg-opacity-20 bg-black"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="text-center z-10 px-4 max-w-2xl"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                    >
                        <Icon path={mdiCamera} size={3} className="text-wedding-love" />
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-script mb-4 gradient-text"
                    >
                        Rushel & Sivani
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center items-center mb-6"
                    >
                        <div className="h-px bg-wedding-gold/50 w-16"></div>
                        <Icon path={mdiHeart} size={1} className="mx-3 text-wedding-love" />
                        <div className="h-px bg-wedding-gold/50 w-16"></div>
                    </motion.div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-lg md:text-xl mb-8 text-gray-700"
                    >
                        Welcome to our wedding photo collection
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                    >
                        <Link
                            to="/"
                            className="btn btn-primary btn-christian inline-block"
                        >
                            View Photos
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Scroll indicator */}
                {showScrollHint && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2, duration: 1 }}
                        className="absolute bottom-10 left-0 right-0 flex justify-center"
                    >
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
                            className="text-gray-500 flex flex-col items-center"
                        >
                            <p className="text-sm mb-2">Scroll to see more</p>
                            <Icon path={mdiChevronDown} size={1} />
                        </motion.div>
                    </motion.div>
                )}
            </div>

            {/* Photo Booth Info Section */}
            <div className="container mx-auto py-16 px-4">
                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-elegant p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-display mb-2">Photo Booth</h2>
                        <div className="flex justify-center items-center mb-4">
                            <div className="h-px bg-wedding-gold/30 w-12"></div>
                            <Icon path={mdiCamera} size={1} className="mx-3 text-christian-accent" />
                            <div className="h-px bg-wedding-gold/30 w-12"></div>
                        </div>
                        <p className="text-gray-600">
                            Capture your memories and instantly view them here
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-xl font-display mb-4 text-christian-accent">How It Works</h3>
                            <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                                <li>Visit our photo booth at the venue</li>
                                <li>Strike a pose and capture your moment</li>
                                <li>Scan the QR code that appears after your photo</li>
                                <li>View, download and share your photos instantly</li>
                            </ol>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-lg">
                            <h3 className="text-xl font-display mb-4 text-hindu-accent">Photo Tips</h3>
                            <ul className="list-disc pl-5 space-y-2 text-gray-700">
                                <li>Group photos work best with 2-6 people</li>
                                <li>Feel free to use the props provided</li>
                                <li>The booth takes multiple shots - have fun with it!</li>
                                <li>Photos appear here within seconds</li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <Link
                            to="/"
                            className="btn btn-outline btn-christian-outline"
                        >
                            Browse All Photos
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Welcome;