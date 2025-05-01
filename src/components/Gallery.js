import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import PhotoCard from './PhotoCard';
import Loading from './Loading';
import axios from 'axios';
import Icon from '@mdi/react';
import { mdiHeartOutline, mdiImageMultiple, mdiRefresh, mdiAlert } from '@mdi/js';

// Base URL for the server
const BASE_URL = 'https://photo-view.slyrix.com';

const Gallery = () => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const photosPerPage = 12;

    // Fetch photos function with improved error handling
    const fetchPhotos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log(`Fetching photos from ${BASE_URL}/photos`);

            const response = await axios.get(`${BASE_URL}/photos`, {
                timeout: 15000 // Increased timeout for slower connections
            });

            console.log('Photos response:', response.data);

            if (response.data && Array.isArray(response.data)) {
                // Process photos to ensure they have full URLs
                const processedPhotos = response.data.map(photo => ({
                    ...photo,
                    id: photo.filename || photo.photoId,
                    url: photo.url
                        ? (photo.url.startsWith('http') ? photo.url : `${BASE_URL}${photo.url}`)
                        : `${BASE_URL}/photos/${photo.filename || photo.photoId}`,
                    thumbnailUrl: photo.thumbnailUrl
                        ? (photo.thumbnailUrl.startsWith('http') ? photo.thumbnailUrl : `${BASE_URL}${photo.thumbnailUrl}`)
                        : `${BASE_URL}/thumbnails/thumb_${photo.filename || photo.photoId}`
                }));

                setPhotos(processedPhotos);
            } else {
                // Handle unexpected response format
                console.warn('Unexpected response format:', response.data);
                setError('Received unexpected data format from server');
            }
        } catch (err) {
            console.error('Error fetching photos:', err);

            // More detailed error message based on the error type
            if (err.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
            } else if (err.request) {
                // The request was made but no response was received
                setError('No response from server. Please check your internet connection.');
            } else {
                // Something happened in setting up the request that triggered an Error
                setError(`Error: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch photos when component mounts or when retry is triggered
    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos, retryCount]);

    // Handle retry button click
    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
    };

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

    // If error, show error message with retry button
    if (error) {
        return (
            <div className="container mx-auto py-16 px-4 text-center">
                <div className="text-6xl text-red-500/50 mb-6">
                    <Icon path={mdiAlert} size={4} className="mx-auto" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
                <p className="text-gray-600 mb-8">{error}</p>
                <button
                    onClick={handleRetry}
                    className="btn btn-primary btn-christian flex items-center mx-auto"
                >
                    <Icon path={mdiRefresh} size={1} className="mr-2" />
                    Retry
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
                <p className="text-gray-600 mb-6">Photos will appear here once they've been uploaded.</p>
                <button
                    onClick={handleRetry}
                    className="btn btn-outline btn-christian-outline flex items-center mx-auto"
                >
                    <Icon path={mdiRefresh} size={1} className="mr-2" />
                    Check Again
                </button>
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

            {/* Photo count */}
            <div className="mb-4 text-center">
                <p className="text-sm text-gray-500">
                    Showing {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                </p>
                <button
                    onClick={handleRetry}
                    className="text-sm text-christian-accent hover:underline flex items-center justify-center mx-auto mt-1"
                >
                    <Icon path={mdiRefresh} size={0.6} className="mr-1" />
                    Refresh
                </button>
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