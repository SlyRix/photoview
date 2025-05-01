import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@mdi/react';
import Loading from './Loading';
import {
    mdiArrowLeft,
    mdiDownload,
    mdiShare,
    mdiClose,
    mdiChevronLeft,
    mdiChevronRight,
    mdiImageOff,
    mdiWhatsapp,
    mdiTwitter,
    mdiFacebook,
    mdiEmailOutline,
    mdiRefresh
} from '@mdi/js';

// Improved API import
import axios from 'axios';

// Base URL for the server - make sure this is correct
const BASE_URL = 'https://photo-view.slyrix.com';

const PhotoDetail = () => {
    const { photoId } = useParams();
    const navigate = useNavigate();
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);
    const [scale, setScale] = useState(1);
    const [lastTap, setLastTap] = useState(0);

    // Function to fetch photo details
    const fetchPhoto = useCallback(async () => {
        if (!photoId) return;

        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching photo: ${photoId}`);

            // First try the API endpoint
            const response = await axios.get(`${BASE_URL}/photos/${photoId}`);

            if (response.data) {
                console.log('Photo data received:', response.data);
                const photoData = {
                    ...response.data,
                    id: photoId,
                    url: `${BASE_URL}/photos/${photoId}`,
                    thumbnailUrl: response.data.thumbnailUrl
                        ? `${BASE_URL}${response.data.thumbnailUrl}`
                        : `${BASE_URL}/thumbnails/thumb_${photoId}`
                };

                setPhoto(photoData);
                setLoading(false);
                return;
            }
        } catch (apiError) {
            console.error('API error:', apiError);

            // If API fails, try to access the image directly
            try {
                // Test if the image exists by creating a dummy image element
                const testImg = new Image();
                testImg.onload = () => {
                    // Image exists, construct basic photo object
                    setPhoto({
                        id: photoId,
                        filename: photoId,
                        url: `${BASE_URL}/photos/${photoId}`,
                        thumbnailUrl: `${BASE_URL}/thumbnails/thumb_${photoId}`,
                        timestamp: new Date().toISOString()
                    });
                    setLoading(false);
                };

                testImg.onerror = () => {
                    throw new Error('Image not found');
                };

                testImg.src = `${BASE_URL}/photos/${photoId}`;
            } catch (directError) {
                console.error('Direct access error:', directError);
                setError('Photo not found. It may not have been uploaded yet.');
                setLoading(false);
            }
        }
    }, [photoId]);

    // Fetch the photo data when component mounts or photoId changes
    useEffect(() => {
        fetchPhoto();
    }, [fetchPhoto, photoId, retryCount]);

    // Format date for display
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown date';

        try {
            const date = new Date(timestamp);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return 'Unknown date';
        }
    };

    // Handle manual retry
    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
    };

    // Handle going back to gallery
    const handleBack = () => {
        navigate('/');
    };

    // Handle image download
    const handleDownload = async () => {
        if (!photo) return;

        try {
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = photo.url;
            link.download = photo.id || 'wedding-photo.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success indicator
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
        } catch (err) {
            console.error('Download failed:', err);
            alert('Download failed. Please try again.');
        }
    };

    // Handle sharing
    const handleShare = async () => {
        // Check if Web Share API is available
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Wedding Photo',
                    text: 'Check out this photo from Rushel & Sivani\'s wedding! 💕',
                    url: window.location.href
                });
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 3000);
            } catch (err) {
                console.error('Error sharing:', err);
                // If sharing fails, open our custom share dialog as fallback
                setShareOpen(true);
            }
        } else {
            // If Web Share API is not available, open our custom share dialog
            setShareOpen(true);
        }
    };

    // Handle double tap to zoom on mobile devices
    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_THRESHOLD = 300; // ms

        if (now - lastTap < DOUBLE_TAP_THRESHOLD) {
            // Double tap detected
            setScale(scale === 1 ? 1.5 : 1);
        }

        setLastTap(now);
    };

    // Reset zoom level
    const resetZoom = () => {
        setScale(1);
    };

    // If loading, show loading component
    if (loading) {
        return <Loading message="Loading photo..." />;
    }

    // If error, show error message with retry button
    if (error || !photo) {
        return (
            <div className="container mx-auto py-16 px-4 text-center">
                <div className="text-6xl text-gray-300 mb-6">
                    <Icon path={mdiImageOff} size={4} className="mx-auto" />
                </div>
                <h2 className="text-2xl font-bold mb-4">Photo Not Found</h2>
                <p className="text-gray-600 mb-8">{error || "We couldn't find the requested photo."}</p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <button
                        onClick={handleRetry}
                        className="btn btn-primary btn-christian flex items-center"
                    >
                        <Icon path={mdiRefresh} size={1} className="mr-2" />
                        Retry Loading
                    </button>
                    <button
                        onClick={handleBack}
                        className="btn btn-outline btn-christian-outline"
                    >
                        Back to Gallery
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-christian-accent/10 to-hindu-accent/10 py-6 px-4">
            <div className="container mx-auto max-w-5xl">
                {/* Back button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    onClick={handleBack}
                    className="flex items-center text-gray-600 hover:text-christian-accent mb-6 transition-colors"
                >
                    <Icon path={mdiArrowLeft} size={1} className="mr-2" />
                    <span>Back to Gallery</span>
                </motion.button>

                {/* Main content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="bg-white rounded-lg shadow-elegant overflow-hidden"
                >
                    {/* Photo container */}
                    <div
                        className="relative bg-gray-100 flex items-center justify-center overflow-hidden"
                        style={{ minHeight: '300px' }}
                        onClick={handleDoubleTap}
                        onDoubleClick={resetZoom}
                    >
                        {/* Loading placeholder */}
                        {!imageLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-wedding-love border-r-wedding-love border-b-transparent border-l-transparent"></div>
                            </div>
                        )}

                        {/* Photo with zoom effect */}
                        <motion.img
                            src={photo.url}
                            alt="Wedding photo"
                            className="max-w-full max-h-[70vh] object-contain"
                            animate={{ scale }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => {
                                setImageLoaded(true);
                                setError('Failed to load image. Try refreshing the page.');
                            }}
                        />

                        {/* Mobile zoom indicator - only show briefly */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 1, duration: 4 }}
                            className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-500 pointer-events-none"
                        >
                            Double-tap to zoom
                        </motion.div>
                    </div>

                    {/* Action buttons */}
                    <div className="p-6 border-t border-gray-100">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            {/* Photo info */}
                            <div className="flex-grow">
                                <p className="text-gray-700 font-medium">
                                    Rushel & Sivani's Wedding
                                </p>
                                <p className="text-sm text-gray-500">
                                    {formatDate(photo.timestamp)}
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex space-x-3">
                                {/* Share button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleShare}
                                    className="btn btn-primary btn-hindu flex items-center"
                                >
                                    <AnimatePresence mode="wait">
                                        {shareSuccess ? (
                                            <motion.div
                                                key="success"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                className="mr-2"
                                            >
                                                <Icon path={mdiClose} size={1} />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="share"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                className="mr-2"
                                            >
                                                <Icon path={mdiShare} size={1} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <span>{shareSuccess ? "Shared!" : "Share"}</span>
                                </motion.button>

                                {/* Download button */}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleDownload}
                                    className="btn btn-outline btn-christian-outline flex items-center"
                                >
                                    <AnimatePresence mode="wait">
                                        {downloadSuccess ? (
                                            <motion.div
                                                key="success"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                className="mr-2 text-green-500"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="download"
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                className="mr-2"
                                            >
                                                <Icon path={mdiDownload} size={1} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <span>{downloadSuccess ? "Downloaded!" : "Download"}</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Share modal */}
                <AnimatePresence>
                    {shareOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                            onClick={() => setShareOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold">Share Photo</h3>
                                    <button
                                        onClick={() => setShareOpen(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <Icon path={mdiClose} size={1} />
                                    </button>
                                </div>

                                <div className="flex justify-around mb-6">
                                    {/* WhatsApp */}
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent('Check out this photo from Rushel & Sivani\'s wedding! ' + window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center text-gray-700 hover:text-green-600"
                                        onClick={() => {
                                            setShareSuccess(true);
                                            setShareOpen(false);
                                        }}
                                    >
                                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                                            <Icon path={mdiWhatsapp} size={1.2} />
                                        </div>
                                        <span className="text-xs">WhatsApp</span>
                                    </a>

                                    {/* Facebook */}
                                    <a
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center text-gray-700 hover:text-blue-600"
                                        onClick={() => {
                                            setShareSuccess(true);
                                            setShareOpen(false);
                                        }}
                                    >
                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                            <Icon path={mdiFacebook} size={1.2} />
                                        </div>
                                        <span className="text-xs">Facebook</span>
                                    </a>

                                    {/* Twitter/X */}
                                    <a
                                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out this photo from Rushel & Sivani\'s wedding! ' + window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center text-gray-700 hover:text-sky-600"
                                        onClick={() => {
                                            setShareSuccess(true);
                                            setShareOpen(false);
                                        }}
                                    >
                                        <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center mb-2">
                                            <Icon path={mdiTwitter} size={1.2} />
                                        </div>
                                        <span className="text-xs">Twitter</span>
                                    </a>

                                    {/* Email */}
                                    <a
                                        href={`mailto:?subject=Wedding Photo&body=${encodeURIComponent('Check out this photo from Rushel & Sivani\'s wedding!\n\n' + window.location.href)}`}
                                        className="flex flex-col items-center text-gray-700 hover:text-gray-900"
                                        onClick={() => {
                                            setShareSuccess(true);
                                            setShareOpen(false);
                                        }}
                                    >
                                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                                            <Icon path={mdiEmailOutline} size={1.2} />
                                        </div>
                                        <span className="text-xs">Email</span>
                                    </a>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <p className="text-sm text-gray-600 mb-2">Or copy the link:</p>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            readOnly
                                            value={window.location.href}
                                            className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-1 focus:ring-christian-accent"
                                            onClick={(e) => e.target.select()}
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.href);
                                                setShareSuccess(true);
                                                setShareOpen(false);
                                            }}
                                            className="px-4 py-2 bg-christian-accent text-white rounded-r-md text-sm"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PhotoDetail;