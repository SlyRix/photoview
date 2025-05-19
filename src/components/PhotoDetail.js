import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@mdi/react';
import Loading from './Loading';
import FrameSelection from './FrameSelection';
import ClientSideFrameProcessor from './ClientSideFrameProcessor';
import {
    mdiArrowLeft,
    mdiDownload,
    mdiShare,
    mdiClose,
    mdiImageOff,
    mdiWhatsapp,
    mdiTwitter,
    mdiFacebook,
    mdiEmailOutline,
    mdiRefresh,
    mdiImageFrame
} from '@mdi/js';
import { downloadFramedPhoto } from '../utils/frameService';
// Import date utility functions
import { formatDate, extractTimestampFromFilename, getBestPhotoTimestamp } from '../utils/dateUtils';

// Base URL for the server
const BASE_URL = '//photo-view.slyrix.com';

const PhotoDetail = () => {
    const { photoId } = useParams();
    const navigate = useNavigate();
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [frameDialogOpen, setFrameDialogOpen] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);
    const [scale, setScale] = useState(1);
    const [lastTap, setLastTap] = useState(0);
    const [selectedFrame, setSelectedFrame] = useState({
        frameId: 'standard', // Default to standard frame instead of 'none'
        frameUrl: '/frames/wedding-frame-standard.png',
        previewUrl: null,
        frameName: 'Standard'
    });
    const [activePreviewUrl, setActivePreviewUrl] = useState(null);
    const [previewError, setPreviewError] = useState(false);
    const [isProcessingFrame, setIsProcessingFrame] = useState(false);
// Set up automatic frame processing when photo loads
    useEffect(() => {
        // When photo is loaded, process it with the standard frame
        if (photo && !previewError && selectedFrame.frameId === 'standard') {
            setIsProcessingFrame(true);
        }
    }, [photo]);
    // Fetch photo metadata when component mounts or photoId changes
    useEffect(() => {
        async function fetchPhoto() {
            if (!photoId) return;

            setLoading(true);
            setError(null);

            try {
                console.log(`Looking for metadata for: ${photoId}`);

                // CRITICAL FIX: Check for timestamp in photoId before making API call
                const photoTimestampFromId = extractTimestampFromFilename(photoId);
                console.log('Timestamp extracted from photoId:', photoTimestampFromId ?
                    new Date(photoTimestampFromId).toISOString() : 'None found');

                const res = await fetch(`${BASE_URL}/api/photos`);
                const allPhotos = await res.json();

                const found = allPhotos.find(p => p.photoId === photoId || p.filename === photoId);

                if (found) {
                    console.log('Found photo in API results:', found);
                    console.log('Original timestamp from API:', found.timestamp);

                    // CRITICAL FIX: Prioritize timestamp from filename if available
                    let bestTimestamp = photoTimestampFromId;

                    // Only use metadata timestamp if we couldn't extract from filename
                    if (!bestTimestamp && found.timestamp) {
                        bestTimestamp = found.timestamp;
                    }

                    console.log('Using best timestamp:', bestTimestamp ?
                        new Date(bestTimestamp).toISOString() : 'falling back to current time');

                    const photoData = {
                        ...found,
                        id: photoId,
                        url: `${BASE_URL}${found.url}`,
                        thumbnailUrl: `${BASE_URL}${found.thumbnailUrl}`,
                        // CRITICAL FIX: Use best timestamp source, prioritizing filename
                        timestamp: bestTimestamp || Date.now()
                    };

                    setPhoto(photoData);

                    // Instead of showing original photo, immediately start processing with the standard frame
                    // We'll still set the active preview URL to the original photo as a fallback
                    setActivePreviewUrl(photoData.url);
                    setLoading(false);

                    // Begin processing the standard frame
                    setIsProcessingFrame(true);
                } else {
                    throw new Error('Photo metadata not found');
                }
            } catch (err) {
                console.warn('API failed, falling back to image test:', err.message);

                const testImg = new Image();
                testImg.onload = async () => {
                    // CRITICAL FIX: Priority on timestamp from filename
                    const photoTimestamp = extractTimestampFromFilename(photoId);
                    console.log('Extracted timestamp from filename (fallback):',
                        photoTimestamp ? new Date(photoTimestamp).toISOString() : 'None found');

                    const photoData = {
                        id: photoId,
                        filename: photoId,
                        url: `${BASE_URL}/photos/${photoId}`,
                        thumbnailUrl: `${BASE_URL}/thumbnails/thumb_${photoId}`,
                        timestamp: photoTimestamp || Date.now() // Use extracted timestamp or current time
                    };
                    setPhoto(photoData);

                    // Instead of showing original photo, prepare for framing
                    setActivePreviewUrl(photoData.url);
                    setLoading(false);

                    // Begin processing the standard frame
                    setIsProcessingFrame(true);
                };

                testImg.onerror = () => {
                    console.error('Image load failed');
                    setError('Photo not found. It may not have been uploaded yet.');
                    setLoading(false);
                };

                testImg.src = `${BASE_URL}/photos/${photoId}`;
            }
        }

        fetchPhoto();
    }, [photoId, retryCount]);

    // Handle manual retry
    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setPreviewError(false);

        // If we have a frame selected but preview failed, try falling back to original photo
        if (previewError && photo) {
            setActivePreviewUrl(photo.url);
            setImageLoaded(false);
        }
    };

    // Reset to original photo
    const resetToOriginalPhoto = () => {
        if (photo) {
            // Instead of setting frame to 'none', revert to standard frame
            setActivePreviewUrl(photo.url);
            setPreviewError(false);
            setImageLoaded(false);
            setSelectedFrame({
                frameId: 'standard',
                frameUrl: '/frames/wedding-frame-standard.png',
                previewUrl: null,
                frameName: 'Standard'
            });
            setIsProcessingFrame(true);
        }
    };

    // Handle going back to gallery
    const handleBack = () => {
        navigate('/');
    };

    // Handle opening frame selection dialog
    const handleOpenFrameSelection = () => {
        setFrameDialogOpen(true);
    };

    // Handle frame selection
    const handleSelectFrame = (frameData) => {
        setSelectedFrame(frameData);
        setIsProcessingFrame(true);

        // If this is the "none" option, just use the original photo
        if (frameData.frameId === 'none') {
            setActivePreviewUrl(photo.url);
            setIsProcessingFrame(false);
            setImageLoaded(true);
            return;
        }

        // For other frames, we'll let the ClientSideFrameProcessor handle it
        // The actual update will happen in handlePreviewReady
    };

    // Handle frame preview ready
    const handlePreviewReady = (previewUrl) => {
        if (previewUrl) {
            setActivePreviewUrl(previewUrl);
            setPreviewError(false);
            setIsProcessingFrame(false);
        }
    };

    // Handle frame processing error
    const handleProcessingError = (errorMsg) => {
        console.error('Error processing frame:', errorMsg);
        setPreviewError(true);
        setIsProcessingFrame(false);

        // Fall back to original photo
        setActivePreviewUrl(photo?.url);
    };

    // Handle image download
    const handleDownload = async () => {
        if (!photo) return;

        try {
            await downloadFramedPhoto(
                photo.url,
                selectedFrame.frameUrl,
                `rushel-sivani-wedding-${photoId}.jpg`
            );

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
        return <Loading message="Loading photo..."/>;
    }

    // If error, show error message with retry button
    if (error || !photo) {
        return (
            <div className="container mx-auto py-16 px-4 text-center">
                <div className="text-6xl text-gray-300 mb-6">
                    <Icon path={mdiImageOff} size={4} className="mx-auto"/>
                </div>
                <h2 className="text-2xl font-bold mb-4">Photo Not Found</h2>
                <p className="text-gray-600 mb-8">{error || "We couldn't find the requested photo."}</p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <button
                        onClick={handleRetry}
                        className="btn btn-primary btn-christian flex items-center"
                    >
                        <Icon path={mdiRefresh} size={1} className="mr-2"/>
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
            {/* Client-side frame processor (hidden) */}
            {(isProcessingFrame || photo) && selectedFrame.frameId !== 'none' && (
                <div className="hidden">
                    <ClientSideFrameProcessor
                        photoUrl={photo?.url}
                        frameUrl={selectedFrame.frameUrl}
                        onProcessed={handlePreviewReady}
                        onError={handleProcessingError}
                        showLoader={false}
                        quality={90}
                    />
                </div>
            )}

            <div className="container mx-auto max-w-5xl">
                {/* Back button */}
                <motion.button
                    initial={{opacity: 0, x: -20}}
                    animate={{opacity: 1, x: 0}}
                    transition={{duration: 0.5}}
                    onClick={handleBack}
                    className="flex items-center text-gray-600 hover:text-christian-accent mb-6 transition-colors"
                >
                    <Icon path={mdiArrowLeft} size={1} className="mr-2"/>
                    <span>Back to Gallery</span>
                </motion.button>

                {/* Main content */}
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.5, delay: 0.2}}
                    className="bg-white rounded-lg shadow-elegant overflow-hidden"
                >
                    {/* Photo container */}
                    <div
                        className="relative bg-gray-100 flex items-center justify-center overflow-hidden"
                        style={{minHeight: '300px'}}
                        onClick={handleDoubleTap}
                        onDoubleClick={resetZoom}
                    >
                        {/* Loading placeholder */}
                        {(!imageLoaded || isProcessingFrame) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-4 border-t-wedding-love border-r-wedding-love border-b-transparent border-l-transparent"></div>
                            </div>
                        )}

                        {/* Frame preview error message */}
                        {previewError && (
                            <div className="absolute top-4 left-0 right-0 flex justify-center">
                                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-md text-sm">
                                    Frame preview failed to load.
                                    <button
                                        onClick={resetToOriginalPhoto}
                                        className="ml-2 underline hover:text-red-800"
                                    >
                                        View original photo
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Photo with zoom effect */}
                        <motion.img
                            src={activePreviewUrl || photo.url}
                            alt="Wedding photo"
                            className="max-w-full max-h-[70vh] object-contain"
                            animate={{scale}}
                            transition={{type: 'spring', stiffness: 300, damping: 30}}
                            onLoad={() => setImageLoaded(true)}
                            onError={(e) => {
                                console.error('Image failed to load:', e.target.src);
                                setImageLoaded(true);

                                // If it's a preview that failed, attempt to show original photo
                                if (e.target.src !== photo.url) {
                                    console.log('Falling back to original photo');
                                    setActivePreviewUrl(photo.url);
                                    setPreviewError(true);
                                } else {
                                    setError('Failed to load image. Try refreshing the page.');
                                }
                            }}
                        />

                        {/* Mobile zoom indicator - only show briefly */}
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            transition={{delay: 1, duration: 4}}
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
                                    {/* Using the updated formatDate utility */}
                                    {formatDate(photo.timestamp, 'medium')}
                                </p>
                                {/* Debug info during testing - remove for production */}
                                <p className="text-xs text-gray-400">
                                    Photo ID: {photoId ? photoId.substring(0, 20) + '...' : 'Unknown'}
                                </p>

                                {/* Selected frame indicator */}
                                {selectedFrame.frameId !== 'none' && !isProcessingFrame && (
                                    <p className="text-xs text-wedding-love mt-1">
                                        {previewError ?
                                            "Frame preview unavailable" :
                                            `${selectedFrame.frameName || 'Custom'} frame applied`
                                        }
                                    </p>
                                )}

                                {/* Processing indicator */}
                                {isProcessingFrame && (
                                    <p className="text-xs text-christian-accent mt-1 flex items-center">
                                        <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Applying frame...
                                    </p>
                                )}
                            </div>

                            {/* Action buttons - Modified to remove "Take More Photos" button */}
                            <div className="flex flex-wrap gap-3">
                                {/* Frame Selection Button */}
                                <motion.button
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                    onClick={handleOpenFrameSelection}
                                    className="btn btn-outline flex items-center text-sm px-4 py-2 rounded-full border border-hindu-accent text-hindu-accent hover:bg-hindu-accent hover:text-white"
                                    disabled={isProcessingFrame}
                                >
                                    <Icon path={mdiImageFrame} size={0.8} className="mr-2"/>
                                    <span>Change Frame</span>
                                </motion.button>

                                {/* Share button */}
                                <motion.button
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                    onClick={handleShare}
                                    className="btn btn-primary btn-hindu flex items-center"
                                >
                                    <AnimatePresence mode="wait">
                                        {shareSuccess ? (
                                            <motion.div
                                                key="success"
                                                initial={{scale: 0.5, opacity: 0}}
                                                animate={{scale: 1, opacity: 1}}
                                                exit={{scale: 0.5, opacity: 0}}
                                                className="mr-2"
                                            >
                                                <Icon path={mdiClose} size={1}/>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="share"
                                                initial={{scale: 0.5, opacity: 0}}
                                                animate={{scale: 1, opacity: 1}}
                                                exit={{scale: 0.5, opacity: 0}}
                                                className="mr-2"
                                            >
                                                <Icon path={mdiShare} size={1}/>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <span>{shareSuccess ? "Shared!" : "Share"}</span>
                                </motion.button>

                                {/* Download button */}
                                <motion.button
                                    whileHover={{scale: 1.05}}
                                    whileTap={{scale: 0.95}}
                                    onClick={handleDownload}
                                    className="btn btn-outline btn-christian-outline flex items-center"
                                    disabled={isProcessingFrame}
                                >
                                    <AnimatePresence mode="wait">
                                        {downloadSuccess ? (
                                            <motion.div
                                                key="success"
                                                initial={{scale: 0.5, opacity: 0}}
                                                animate={{scale: 1, opacity: 1}}
                                                exit={{scale: 0.5, opacity: 0}}
                                                className="mr-2 text-green-500"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5"
                                                     viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd"
                                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                          clipRule="evenodd"/>
                                                </svg>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="download"
                                                initial={{scale: 0.5, opacity: 0}}
                                                animate={{scale: 1, opacity: 1}}
                                                exit={{scale: 0.5, opacity: 0}}
                                                className="mr-2"
                                            >
                                                <Icon path={mdiDownload} size={1}/>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <span>{downloadSuccess ? "Downloaded!" : "Download"}</span>
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Dialogs remain unchanged */}
                {/* Frame Selection Dialog */}
                <AnimatePresence>
                    {frameDialogOpen && (
                        <FrameSelection
                            photoUrl={photo.url}
                            onSelectFrame={handleSelectFrame}
                            onPreviewReady={handlePreviewReady}
                            isOpen={frameDialogOpen}
                            onClose={() => setFrameDialogOpen(false)}
                        />
                    )}
                </AnimatePresence>

                {/* Share modal */}
                <AnimatePresence>
                    {shareOpen && (
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                            onClick={() => setShareOpen(false)}
                        >
                            <motion.div
                                initial={{opacity: 0, scale: 0.9, y: 20}}
                                animate={{opacity: 1, scale: 1, y: 0}}
                                exit={{opacity: 0, scale: 0.9, y: 20}}
                                className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <h3 className="text-xl font-bold mb-4">Share this photo</h3>

                                <div className="grid grid-cols-4 gap-4 mb-6">
                                    {/* WhatsApp */}
                                    <a
                                        href={`https://wa.me/?text=Check%20out%20this%20photo%20from%20Rushel%20%26%20Sivani%27s%20wedding!%20${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center text-center"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white mb-2">
                                            <Icon path={mdiWhatsapp} size={1.3} />
                                        </div>
                                        <span className="text-xs">WhatsApp</span>
                                    </a>

                                    {/* Facebook */}
                                    <a
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center text-center"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white mb-2">
                                            <Icon path={mdiFacebook} size={1.3} />
                                        </div>
                                        <span className="text-xs">Facebook</span>
                                    </a>

                                    {/* Twitter */}
                                    <a
                                        href={`https://twitter.com/intent/tweet?text=Check%20out%20this%20photo%20from%20Rushel%20%26%20Sivani%27s%20wedding!&url=${encodeURIComponent(window.location.href)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center text-center"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-blue-400 flex items-center justify-center text-white mb-2">
                                            <Icon path={mdiTwitter} size={1.3} />
                                        </div>
                                        <span className="text-xs">Twitter</span>
                                    </a>

                                    {/* Email */}
                                    <a
                                        href={`mailto:?subject=Wedding%20Photo%20from%20Rushel%20%26%20Sivani&body=Check%20out%20this%20photo%20from%20the%20wedding:%20${encodeURIComponent(window.location.href)}`}
                                        className="flex flex-col items-center text-center"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white mb-2">
                                            <Icon path={mdiEmailOutline} size={1.3} />
                                        </div>
                                        <span className="text-xs">Email</span>
                                    </a>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <p className="text-sm text-gray-600 mb-3">Or copy the link:</p>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            readOnly
                                            value={window.location.href}
                                            className="flex-grow px-3 py-2 text-sm border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-christian-accent"
                                            onClick={(e) => e.target.select()}
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert('Link copied to clipboard!');
                                            }}
                                            className="px-4 py-2 bg-christian-accent text-white text-sm font-medium rounded-r-md"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShareOpen(false)}
                                    className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-800 text-sm font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PhotoDetail;