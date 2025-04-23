import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PhotoCard from './PhotoCard';
import Loading from './Loading';
import { getPhotos } from '../utils/api';
import Icon from '@mdi/react';
import { mdiHeartOutline, mdiImageMultiple } from '@mdi/js';

const Gallery = () => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const photosPerPage = 12;

    // Fetch photos when component mounts
    useEffect(() => {
        const fetchPhotoData = async () => {
            try {
                setLoading(true);
                const photoData = await getPhotos();
                setPhotos(photoData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching photos:', err);
                setError('Failed to load photos. Please try again later.');
                setLoading(false);
            }
        };

        fetchPhotoData();
    }, []);

    // Calculate pagination
    const indexOfLastPhoto = currentPage * photosPerPage;
    const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
    const currentPhotos = photos.slice(indexOfFirstPhoto, indexOfLastPhoto);
    const totalPages = Math.ceil(photos.length / photosPerPage);

    // Handle page changes
    const goToPage = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Scroll to top when changing pages
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Animation variants for staggered entrance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5
            }
        }
    };

    // If loading, show loading component
    if (loading) {
        return <Loading message="Loading wedding photos..." />;
    }

    // If error, show error message
    if (error) {
        return (
            <div className="container mx-auto py-16 px-4 text-center">
                <Icon path={mdiHeartOutline} size={3} className="text-wedding-love/50 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
                <p className="text-gray-600 mb-8">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="btn btn-primary btn-christian"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // If no photos, show empty state
    if (photos.length === 0) {
        return (
            <div className="container mx-auto py-16 px-4 text-center">
                <Icon path={mdiImageMultiple} size={3} className="text-christian-accent/40 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">No Photos Yet</h2>
                <p className="text-gray-600">Check back soon for wedding memories!</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Gallery header */}
            <div className="text-center mb-10">
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-3xl md:text-4xl font-display mb-2"
                >
                    Wedding Memories
                </motion.h2>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex justify-center items-center mb-3"
                >
                    <div className="h-px bg-wedding-gold/30 w-16"></div>
                    <Icon path={mdiHeartOutline} size={1} className="mx-3 text-wedding-love" />
                    <div className="h-px bg-wedding-gold/30 w-16"></div>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-gray-600"
                >
                    Browse photos from Rushel & Sivani's special day
                </motion.p>
            </div>

            {/* Photo grid */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
                {currentPhotos.map((photo, index) => (
                    <motion.div key={photo.id || index} variants={itemVariants}>
                        <PhotoCard photo={photo} />
                    </motion.div>
                ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                    <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {/* Previous page button */}
                        <button
                            onClick={() => goToPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === 1
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        {/* Page numbers */}
                        {[...Array(totalPages)].map((_, i) => {
                            const pageNumber = i + 1;
                            const isWithinRange = Math.abs(pageNumber - currentPage) <= 1;
                            const isEndPage = pageNumber === 1 || pageNumber === totalPages;

                            // Only show current page, adjacent pages, and first/last pages
                            if (isWithinRange || isEndPage) {
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => goToPage(pageNumber)}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                            currentPage === pageNumber
                                                ? 'z-10 bg-christian-accent border-christian-accent text-white'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            } else if (
                                (pageNumber === currentPage - 2 && currentPage > 3) ||
                                (pageNumber === currentPage + 2 && currentPage < totalPages - 2)
                            ) {
                                // Show ellipsis for gaps
                                return (
                                    <span
                                        key={`ellipsis-${pageNumber}`}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                    >
                    ...
                  </span>
                                );
                            }

                            return null;
                        })}

                        {/* Next page button */}
                        <button
                            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                                currentPage === totalPages
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default Gallery;