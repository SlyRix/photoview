// src/components/Gallery.js
// Updated with sorting functionality and removed "Take More Photos" button

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import PhotoCard from './PhotoCard';
import Loading from './Loading';
import Icon from '@mdi/react';
import { mdiHeartOutline, mdiImageMultiple, mdiRefresh, mdiAlert, mdiSort, mdiSortCalendarDescending, mdiSortCalendarAscending } from '@mdi/js';
// Import date utility functions
import { formatDate } from '../utils/dateUtils';

// Base URL for the server
const BASE_URL = '//photo-view.slyrix.com';

const Gallery = () => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const photosPerPage = 8; // Reduced for mobile
    const [lastUpdated, setLastUpdated] = useState(null);
    // Add sort state
    const [sortOption, setSortOption] = useState('newest');
    const [showSortOptions, setShowSortOptions] = useState(false);

    // Fetch photos function with improved error handling
    const fetchPhotos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log(`Fetching photos from ${BASE_URL}/photos - Attempt ${retryCount + 1}`);

            const response = await fetch(`${BASE_URL}/api/photos`);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Photos response:', data);

            if (data && Array.isArray(data)) {

                // Process photos to ensure they have full URLs and valid timestamps
                const processedPhotos = data.map(photo => {
                    // Get or extract timestamp from the photo
                    let photoTimestamp;

                    // Try extracting from filename first
                    if (photo.filename && photo.filename.includes('202')) {
                        const match = photo.filename.match(/(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
                        if (match && match[1]) {
                            const dateStr = match[1].replace(/-(\d{2})-(\d{2})$/, ':$1:$2');
                            photoTimestamp = new Date(dateStr).getTime();
                        }
                    }

                    // If no timestamp from filename, try the provided timestamp
                    if (!photoTimestamp && photo.timestamp) {
                        try {
                            photoTimestamp = typeof photo.timestamp === 'number'
                                ? photo.timestamp
                                : new Date(photo.timestamp).getTime();
                        } catch (e) {
                            console.warn("Invalid timestamp format:", photo.timestamp);
                        }
                    }

                    // If still no timestamp, use server timestamp or current time
                    if (!photoTimestamp || isNaN(photoTimestamp)) {
                        photoTimestamp = photo.serverTimestamp || Date.now();
                    }

                    return {
                        ...photo,
                        id: photo.filename || photo.photoId,
                        url: photo.url
                            ? (photo.url.startsWith('http') ? photo.url : `${BASE_URL}${photo.url}`)
                            : `${BASE_URL}/photos/${photo.filename || photo.photoId}`,
                        thumbnailUrl: (() => {
                            let url = photo.thumbnailUrl;

                            if (url) {
                                // Remove all occurrences of "original_" no matter what
                                url = url.replace(/original_/g, '');
                                // If it's a relative path, prepend BASE_URL
                                return url.startsWith('http') ? url : `${BASE_URL}${url}`;
                            }

                            // Fallback if no thumbnailUrl is provided
                            const rawName = photo.filename || photo.photoId;
                            const sanitizedName = rawName.replace(/original_/g, '');
                            return `${BASE_URL}/thumbnails/thumb_${sanitizedName}`;
                        })(),
                        // Use the extracted/processed timestamp
                        timestamp: photoTimestamp
                    };
                });

                console.log("Processed photos with timestamps:",
                    processedPhotos.map(p => ({
                        name: p.filename,
                        timestamp: p.timestamp,
                        date: new Date(p.timestamp).toISOString()
                    }))
                );

                setPhotos(processedPhotos);
                setLastUpdated(new Date());
            } else {
                // Handle unexpected response format
                console.warn('Unexpected response format:', data);
                setError('Received unexpected data format from server');
            }
        } catch (err) {
            console.error('Error fetching photos:', err);
            setError(`Could not load photos: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [retryCount]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos, retryCount]);

    // Auto-refresh photos every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchPhotos();
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchPhotos]);

    // Handle retry button click
    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
    };

    // Sort the photos based on the selected option
    const sortPhotos = useCallback((photosToSort) => {
        if (!photosToSort || !photosToSort.length) return [];

        const sorted = [...photosToSort];

        switch (sortOption) {
            case 'newest':
                return sorted.sort((a, b) => {
                    // More robust timestamp handling
                    let timeA, timeB;

                    try {
                        // Try to get valid timestamps, handling different formats
                        timeA = a.timestamp ? (typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime()) : 0;
                        if (isNaN(timeA)) timeA = 0;

                        timeB = b.timestamp ? (typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime()) : 0;
                        if (isNaN(timeB)) timeB = 0;

                        // If both timestamps are invalid or equal, try using filenames as fallback
                        if ((timeA === 0 && timeB === 0) || timeA === timeB) {
                            // Extract dates from filenames as fallback
                            const filenameA = a.filename || a.id || '';
                            const filenameB = b.filename || b.id || '';

                            // Look for date patterns in filenames
                            const dateMatchA = filenameA.match(/(\d{4}-\d{2}-\d{2})/);
                            const dateMatchB = filenameB.match(/(\d{4}-\d{2}-\d{2})/);

                            if (dateMatchA && dateMatchB) {
                                return new Date(dateMatchB[0]).getTime() - new Date(dateMatchA[0]).getTime();
                            }

                            // If still no valid comparison, sort by filename
                            return filenameB.localeCompare(filenameA);
                        }
                    } catch (err) {
                        console.error("Sorting error:", err);
                        return 0;
                    }

                    // Sort newest first (higher timestamp value = more recent)
                    return timeB - timeA;
                });

            case 'oldest':
                return sorted.sort((a, b) => {
                    // More robust timestamp handling
                    let timeA, timeB;

                    try {
                        // Try to get valid timestamps, handling different formats
                        timeA = a.timestamp ? (typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime()) : 0;
                        if (isNaN(timeA)) timeA = 0;

                        timeB = b.timestamp ? (typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime()) : 0;
                        if (isNaN(timeB)) timeB = 0;

                        // If both timestamps are invalid or equal, try using filenames as fallback
                        if ((timeA === 0 && timeB === 0) || timeA === timeB) {
                            // Extract dates from filenames as fallback
                            const filenameA = a.filename || a.id || '';
                            const filenameB = b.filename || b.id || '';

                            // Look for date patterns in filenames
                            const dateMatchA = filenameA.match(/(\d{4}-\d{2}-\d{2})/);
                            const dateMatchB = filenameB.match(/(\d{4}-\d{2}-\d{2})/);

                            if (dateMatchA && dateMatchB) {
                                return new Date(dateMatchA[0]).getTime() - new Date(dateMatchB[0]).getTime();
                            }

                            // If still no valid comparison, sort by filename
                            return filenameA.localeCompare(filenameB);
                        }
                    } catch (err) {
                        console.error("Sorting error:", err);
                        return 0;
                    }

                    // Sort oldest first (lower timestamp value = older)
                    return timeA - timeB;
                });

            case 'nameAsc':
                return sorted.sort((a, b) => {
                    // Sort by filename A-Z
                    const nameA = (a.filename || a.id || '').toLowerCase();
                    const nameB = (b.filename || b.id || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });

            case 'nameDesc':
                return sorted.sort((a, b) => {
                    // Sort by filename Z-A
                    const nameA = (a.filename || a.id || '').toLowerCase();
                    const nameB = (b.filename || b.id || '').toLowerCase();
                    return nameB.localeCompare(nameA);
                });

            default:
                return sorted;
        }
    }, [sortOption]);

    // Use effect to re-sort photos when sortOption changes
    useEffect(() => {
        setCurrentPage(1); // Reset to first page when sort option changes
    }, [sortOption]);

    // Sort the photos
    const sortedPhotos = useMemo(() => sortPhotos(photos), [photos, sortPhotos]);

    // Calculate pagination
    const indexOfLastPhoto = currentPage * photosPerPage;
    const indexOfFirstPhoto = indexOfLastPhoto - photosPerPage;
    const currentPhotos = sortedPhotos.slice(indexOfFirstPhoto, indexOfLastPhoto);
    const totalPages = Math.ceil(sortedPhotos.length / photosPerPage);

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
    if (loading && photos.length === 0) {
        return <Loading message="Loading wedding photos..." />;
    }

    // If error, show error message with retry button
    if (error && photos.length === 0) {
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
        <div className="container mx-auto py-6 px-4">
            {/* Gallery header */}
            <div className="text-center mb-8">
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

            {/* Photo count and Sort dropdown */}
            <div className="mb-4 flex flex-wrap justify-between items-center">
                <p className="text-sm text-gray-500">
                    Showing {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
                    {lastUpdated && ` • Last updated ${formatDate(lastUpdated, 'time')}`}
                </p>

                {/* Sort dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowSortOptions(!showSortOptions)}
                        className="flex items-center text-sm text-gray-700 hover:text-christian-accent bg-white border border-gray-200 rounded-md px-3 py-1.5 shadow-sm"
                    >
                        <Icon path={mdiSort} size={0.7} className="mr-2" />
                        <span>Sort: {
                            sortOption === 'newest' ? 'Newest First' :
                                sortOption === 'oldest' ? 'Oldest First' :
                                    sortOption === 'nameAsc' ? 'Name (A-Z)' :
                                        'Name (Z-A)'
                        }</span>
                    </button>

                    {/* Sort options dropdown */}
                    {showSortOptions && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-100">
                            <ul className="py-1">
                                <li
                                    className={`px-4 py-2 text-sm cursor-pointer flex items-center ${sortOption === 'newest' ? 'bg-gray-100 text-christian-accent font-medium' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setSortOption('newest');
                                        setShowSortOptions(false);
                                        setCurrentPage(1); // Reset to first page when sorting changes
                                    }}
                                >
                                    <Icon path={mdiSortCalendarDescending} size={0.7} className="mr-2" />
                                    Newest First
                                </li>
                                <li
                                    className={`px-4 py-2 text-sm cursor-pointer flex items-center ${sortOption === 'oldest' ? 'bg-gray-100 text-christian-accent font-medium' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setSortOption('oldest');
                                        setShowSortOptions(false);
                                        setCurrentPage(1); // Reset to first page when sorting changes
                                    }}
                                >
                                    <Icon path={mdiSortCalendarAscending} size={0.7} className="mr-2" />
                                    Oldest First
                                </li>
                                <li
                                    className={`px-4 py-2 text-sm cursor-pointer flex items-center ${sortOption === 'nameAsc' ? 'bg-gray-100 text-christian-accent font-medium' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setSortOption('nameAsc');
                                        setShowSortOptions(false);
                                        setCurrentPage(1); // Reset to first page when sorting changes
                                    }}
                                >
                                    <Icon path={mdiSort} size={0.7} className="mr-2" />
                                    Name (A-Z)
                                </li>
                                <li
                                    className={`px-4 py-2 text-sm cursor-pointer flex items-center ${sortOption === 'nameDesc' ? 'bg-gray-100 text-christian-accent font-medium' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setSortOption('nameDesc');
                                        setShowSortOptions(false);
                                        setCurrentPage(1); // Reset to first page when sorting changes
                                    }}
                                >
                                    <Icon path={mdiSort} size={0.7} className="mr-2" />
                                    Name (Z-A)
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Loading indicator and refresh button */}
            <div className="text-center mb-6">
                {loading && photos.length > 0 && (
                    <p className="text-xs text-christian-accent">
                        <span className="inline-block animate-spin mr-1">⟳</span> Refreshing...
                    </p>
                )}

                <button
                    onClick={handleRetry}
                    className="text-sm text-christian-accent hover:underline flex items-center justify-center mx-auto"
                >
                    <Icon path={mdiRefresh} size={0.6} className="mr-1" />
                    Refresh
                </button>
            </div>

            {/* Photo grid - Optimized for mobile with 2 columns */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6"
            >
                {currentPhotos.map((photo, index) => (
                    <motion.div key={photo.id || index} variants={itemVariants}>
                        <PhotoCard photo={photo} />
                    </motion.div>
                ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
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
                        {(() => {
                            const pages = [];
                            const maxVisiblePages = 3; // Show max 3 pages on mobile

                            // Calculate which pages to show
                            let startPage = Math.max(1, currentPage - 1);
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                            // Adjust if we're at the end
                            if (endPage - startPage < maxVisiblePages - 1) {
                                startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }

                            // Always show first page
                            if (startPage > 1) {
                                pages.push(
                                    <button
                                        key={1}
                                        onClick={() => goToPage(1)}
                                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                    >
                                        1
                                    </button>
                                );

                                // Show ellipsis if needed
                                if (startPage > 2) {
                                    pages.push(
                                        <span
                                            key="ellipsis-start"
                                            className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                        >
                                            ...
                                        </span>
                                    );
                                }
                            }

                            // Add visible page numbers
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => goToPage(i)}
                                        className={`relative inline-flex items-center px-3 py-2 border text-sm font-medium ${
                                            currentPage === i
                                                ? 'z-10 bg-christian-accent border-christian-accent text-white'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            // Always show last page
                            if (endPage < totalPages) {
                                // Show ellipsis if needed
                                if (endPage < totalPages - 1) {
                                    pages.push(
                                        <span
                                            key="ellipsis-end"
                                            className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                                        >
                                            ...
                                        </span>
                                    );
                                }

                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => goToPage(totalPages)}
                                        className="relative inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()}

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