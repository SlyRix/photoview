import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PhotoCard = ({ photo }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    // Format date for display
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown date';

        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Unknown date';
        }
    };

    // Handle image load error
    const handleError = () => {
        setError(true);
        setIsLoading(false);
    };

    // Handle image load success
    const handleLoad = () => {
        setIsLoading(false);
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-lg shadow-card overflow-hidden photo-hover"
        >
            <Link to={`/photo/${photo.id || photo.filename}`} className="block h-full">
                <div className="aspect-[4/3] w-full overflow-hidden relative">
                    {/* Loading state */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                            <div className="animate-pulse rounded-full h-12 w-12 border-4 border-t-wedding-love border-r-wedding-love border-b-transparent border-l-transparent"></div>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center p-4 text-center text-gray-500">
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm">Image not available</p>
                            </div>
                        </div>
                    )}

                    {/* Actual image - use thumbnail if available, otherwise full image */}
                    <img
                        src={photo.thumbnailUrl || photo.url}
                        alt={`Wedding photo ${photo.id || photo.filename}`}
                        className={`w-full h-full object-cover transition-transform duration-300 hover:scale-110 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={handleLoad}
                        onError={handleError}
                        loading="lazy"
                    />
                </div>

                <div className="p-3">
                    <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">{formatDate(photo.timestamp)}</div>
                        <motion.div
                            whileHover={{ scale: 1.2 }}
                            className="text-wedding-love"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </motion.div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default PhotoCard;