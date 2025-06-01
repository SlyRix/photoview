// src/components/PhotoDetail.js
// Enhanced version with react-swipeable for professional swipe gestures

import React, {useState, useEffect, useRef} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import { useSwipeable } from 'react-swipeable'; // ✅ PROFESSIONAL SWIPE LIBRARY
import Icon from '@mdi/react';
import {
    mdiArrowLeft,
    mdiDownload,
    mdiImageOff,
    mdiRefresh,
    mdiHeart,
    mdiCheckCircle,
    mdiPalette,
    mdiMagicStaff,
    mdiGestureTap,
    mdiSwipeHorizontal,
    mdiGestureSwipeHorizontal
} from '@mdi/js';

// Components
import ClientSideFrameProcessor from './ClientSideFrameProcessor';
import Loading from './Loading';

// Utilities
import {formatDate, extractTimestampFromFilename} from '../utils/dateUtils';

const BASE_URL = '//photo-view.slyrix.com';

const PhotoDetail = () => {
    const {photoId} = useParams();
    const navigate = useNavigate();
    const imageRef = useRef(null);

    // States
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // Enhanced Frame States
    const [selectedFrameIndex, setSelectedFrameIndex] = useState(0);
    const [activePreviewUrl, setActivePreviewUrl] = useState(null);
    const [isProcessingFrame, setIsProcessingFrame] = useState(false);
    const [previewError, setPreviewError] = useState(false);
    const [framePreloadComplete, setFramePreloadComplete] = useState(false);

    // UI States
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [downloadCount, setDownloadCount] = useState(0);
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    const [retryAttempts, setRetryAttempts] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState(null); // For visual feedback

    // Enhanced Frame Options with previews
    const frameOptions = [
        {
            id: 'standard',
            name: 'Standard',
            description: 'Klassisch & elegant',
            frameUrl: '/frames/wedding-frame-standard.png',
            preview: '🎭',
            gradient: 'from-blue-400 to-blue-600'
        },
        {
            id: 'custom',
            name: 'Gold',
            description: 'Luxuriös & glamourös',
            frameUrl: '/frames/wedding-frame-custom.png',
            preview: '✨',
            gradient: 'from-yellow-400 to-yellow-600'
        },
        {
            id: 'insta',
            name: 'Instagram',
            description: 'Modern & trendig',
            frameUrl: '/frames/wedding-frame-insta.png',
            preview: '📱',
            gradient: 'from-pink-400 to-pink-600'
        }
    ];

    const currentFrame = frameOptions[selectedFrameIndex];

    // ✅ PROFESSIONAL SWIPE HANDLERS using react-swipeable
    const swipeHandlers = useSwipeable({
        onSwipedLeft: (eventData) => {
            if (framePreloadComplete && !isProcessingFrame) {
                console.log('Swiped left - next frame');
                setSwipeDirection('left');
                setSelectedFrameIndex(prev => (prev + 1) % frameOptions.length);

                // Enhanced haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate([50, 25, 50]); // Short pattern
                }

                // Clear swipe direction after animation
                setTimeout(() => setSwipeDirection(null), 300);
            }
        },
        onSwipedRight: (eventData) => {
            if (framePreloadComplete && !isProcessingFrame) {
                console.log('Swiped right - previous frame');
                setSwipeDirection('right');
                setSelectedFrameIndex(prev => prev === 0 ? frameOptions.length - 1 : prev - 1);

                // Enhanced haptic feedback
                if (navigator.vibrate) {
                    navigator.vibrate([50, 25, 50]); // Short pattern
                }

                // Clear swipe direction after animation
                setTimeout(() => setSwipeDirection(null), 300);
            }
        },
        onSwiping: (eventData) => {
            // Optional: Add visual feedback while swiping
            const { deltaX } = eventData;
            if (Math.abs(deltaX) > 20) {
                setSwipeDirection(deltaX > 0 ? 'right' : 'left');
            }
        },
        onSwiped: () => {
            // Clear visual feedback when swipe ends
            setTimeout(() => setSwipeDirection(null), 100);
        },
        // Configuration options
        trackMouse: false, // Don't track mouse on desktop
        trackTouch: true, // Track touch events
        preventScrollOnSwipe: false, // Allow vertical scrolling
        delta: 50, // Minimum swipe distance in pixels
        swipeDuration: 500, // Maximum swipe duration in ms
        touchEventOptions: { passive: false }, // For better performance
        rotationAngle: 0 // No rotation needed
    });

    // Network status detection
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Preload frames for faster switching
    useEffect(() => {
        const preloadFrames = async () => {
            try {
                console.log('Preloading frames...');
                await Promise.all(
                    frameOptions.map(frame => {
                        return new Promise((resolve, reject) => {
                            const img = new Image();
                            img.onload = () => {
                                console.log(`Frame loaded: ${frame.name}`);
                                resolve();
                            };
                            img.onerror = reject;
                            img.src = frame.frameUrl;
                        });
                    })
                );
                setFramePreloadComplete(true);
                console.log('All frames preloaded successfully');
            } catch (error) {
                console.warn('Frame preloading failed:', error);
                setFramePreloadComplete(true); // Continue anyway
            }
        };

        preloadFrames();
    }, []);

    // Enhanced photo fetching with retry logic
    useEffect(() => {
        async function fetchPhoto() {
            if (!photoId) return;

            setLoading(true);
            setError(null);

            try {
                const photoTimestampFromId = extractTimestampFromFilename(photoId);

                // Try API first with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                try {
                    const res = await fetch(`${BASE_URL}/api/photos`, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (res.ok) {
                        const allPhotos = await res.json();
                        const found = allPhotos.find(p => p.photoId === photoId || p.filename === photoId);

                        if (found) {
                            const photoData = {
                                ...found,
                                id: photoId,
                                url: `${BASE_URL}${found.url}`,
                                thumbnailUrl: `${BASE_URL}${found.thumbnailUrl}`,
                                timestamp: photoTimestampFromId || found.timestamp || Date.now()
                            };

                            setPhoto(photoData);
                            setActivePreviewUrl(photoData.url);
                            setLoading(false);

                            // Start processing with first frame once preloading is done
                            if (framePreloadComplete) {
                                setIsProcessingFrame(true);
                            }

                            trackPhotoView(photoId);
                            return;
                        }
                    }
                } catch (fetchError) {
                    clearTimeout(timeoutId);
                    console.warn('API fetch failed:', fetchError.message);
                }

                // Fallback to direct image test
                const photoData = {
                    id: photoId,
                    filename: photoId,
                    url: `${BASE_URL}/photos/${photoId}`,
                    thumbnailUrl: `${BASE_URL}/thumbnails/thumb_${photoId}`,
                    timestamp: photoTimestampFromId || Date.now()
                };

                // Test if image exists
                await new Promise((resolve, reject) => {
                    const testImg = new Image();
                    testImg.onload = resolve;
                    testImg.onerror = reject;
                    testImg.src = photoData.url;
                });

                setPhoto(photoData);
                setActivePreviewUrl(photoData.url);
                setLoading(false);

                if (framePreloadComplete) {
                    setIsProcessingFrame(true);
                }

                trackPhotoView(photoId);

            } catch (err) {
                console.error('Photo fetch failed:', err);
                setError('Photo not found. It may not have been uploaded yet.');
                setLoading(false);
                setRetryAttempts(prev => prev + 1);
            }
        }

        fetchPhoto();
    }, [photoId, retryCount, framePreloadComplete]);

    // Auto-process frame when selection changes
    useEffect(() => {
        if (photo && framePreloadComplete && !loading) {
            console.log(`Processing frame: ${currentFrame.name}`);
            setIsProcessingFrame(true);
            setPreviewError(false);
        }
    }, [selectedFrameIndex, photo, framePreloadComplete, loading, currentFrame.name]);

    // Analytics
    const trackPhotoView = async (photoId) => {
        try {
            await fetch('/api/analytics/view', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    photoId,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    referrer: document.referrer
                })
            });
        } catch (error) {
            console.log('Analytics tracking failed:', error);
        }
    };

    // Frame processing handlers
    const handlePreviewReady = (previewUrl) => {
        if (previewUrl) {
            console.log('Frame preview ready');
            setActivePreviewUrl(previewUrl);
            setPreviewError(false);
            setIsProcessingFrame(false);
        }
    };

    const handleProcessingError = (errorMsg) => {
        console.error('Error processing frame:', errorMsg);
        setPreviewError(true);
        setIsProcessingFrame(false);
        setActivePreviewUrl(photo?.url);
    };

    // Manual frame selection (for buttons)
    const selectFrame = (index) => {
        if (framePreloadComplete && !isProcessingFrame && index !== selectedFrameIndex) {
            setSelectedFrameIndex(index);

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(30);
            }
        }
    };

    // Enhanced download with better UX
    const handleDownload = async () => {
        if (!photo) return;

        try {
            // Show immediate feedback
            setDownloadSuccess(true);

            // Add haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }

            const downloadUrl = activePreviewUrl || photo.url;
            const filename = `rushel-sivani-wedding-${currentFrame.id}-${Date.now()}.jpg`;

            if (downloadUrl.startsWith('data:')) {
                const response = await fetch(downloadUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);
            } else {
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = filename;
                link.click();
            }

            // Analytics
            await fetch('/api/analytics/download', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    photoId: photo.id,
                    frameId: currentFrame.id,
                    timestamp: Date.now()
                })
            });

            setDownloadCount(prev => prev + 1);
            setShowSuccessAnimation(true);

            // Reset success state
            setTimeout(() => {
                setDownloadSuccess(false);
                setShowSuccessAnimation(false);
            }, 3000);

        } catch (err) {
            console.error('Download failed:', err);
            setDownloadSuccess(false);

            // Show user-friendly error
            alert('Download failed. Please check your connection and try again.');
        }
    };

    // Enhanced sharing
    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Unser Hochzeitsfoto - Rushel & Sivani',
                    text: 'Schaut euch unser wunderschönes Foto von der Hochzeit an! 💕',
                    url: window.location.href
                });

                // Track sharing
                await fetch('/api/analytics/share', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        photoId: photo.id,
                        platform: 'native',
                        timestamp: Date.now()
                    })
                });
            } else {
                // Fallback for browsers without native sharing
                await navigator.clipboard.writeText(window.location.href);
                alert('📋 Link copied to clipboard!');
            }
        } catch (error) {
            console.log('Sharing failed:', error);
        }
    };

    // Navigation
    const handleBack = () => {
        navigate('/');
    };

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setError(null);
        setPreviewError(false);
    };

    // Loading State with skeleton
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
                <div className="max-w-md mx-auto">
                    {/* Skeleton Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="text-center">
                            <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-1"></div>
                            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="w-12"></div>
                    </div>

                    {/* Skeleton Card */}
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="h-80 bg-gray-200 animate-pulse"></div>
                        <div className="p-4 space-y-3">
                            <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                            <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                            <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Error State with better UX
    if (error || !photo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, type: "spring" }}
                        className="text-6xl mb-4"
                    >
                        <Icon path={mdiImageOff} size={3} className="mx-auto text-gray-300"/>
                    </motion.div>

                    <h2 className="text-xl font-bold mb-2">Photo Not Found</h2>

                    <p className="text-gray-600 mb-6 text-sm">
                        {error || "We couldn't find the requested photo."}
                    </p>

                    {retryAttempts > 2 && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                💡 <strong>Tip:</strong> The photo might still be processing. Try again in a few seconds.
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <button
                            onClick={handleRetry}
                            className="w-full bg-wedding-love text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center"
                        >
                            <Icon path={mdiRefresh} size={1} className="mr-2"/>
                            Try Again
                        </button>
                        <button
                            onClick={handleBack}
                            className="w-full border-2 border-wedding-love text-wedding-love py-3 px-4 rounded-xl font-semibold flex items-center justify-center"
                        >
                            <Icon path={mdiArrowLeft} size={1} className="mr-2"/>
                            Go to Gallery
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-2 px-3">
            {/* Success Animation Overlay */}
            <AnimatePresence>
                {showSuccessAnimation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.2, 1] }}
                            transition={{ duration: 0.6 }}
                            className="bg-green-500 text-white rounded-full p-6 shadow-2xl"
                        >
                            <Icon path={mdiCheckCircle} size={3}/>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Network Status Indicator */}


            {/* ClientSideFrameProcessor */}
            {(isProcessingFrame || photo) && currentFrame.frameUrl && (
                <div className="hidden">
                    <ClientSideFrameProcessor
                        photoUrl={photo?.url}
                        frameUrl={currentFrame.frameUrl}
                        onProcessed={handlePreviewReady}
                        onError={handleProcessingError}
                        showLoader={false}
                        quality={90}
                        options={{scaleFactor: 0.95}}
                    />
                </div>
            )}

            <div className="max-w-md mx-auto">
                {/* Enhanced Header */}
                <motion.div
                    initial={{opacity: 0, y: -10}}
                    animate={{opacity: 1, y: 0}}
                    className="flex items-center justify-between mb-3"
                >
                    <button
                        onClick={handleBack}
                        className="flex items-center text-gray-600 hover:text-wedding-love transition-colors text-sm bg-white/80 backdrop-blur-sm rounded-full px-3 py-2"
                    >
                        <Icon path={mdiArrowLeft} size={0.8} className="mr-1"/>
                        Gallery
                    </button>

                    <div className="text-center">
                        <h1 className="text-base font-script text-wedding-love">Rushel & Sivani</h1>
                        <p className="text-xs text-gray-500">{formatDate(photo.timestamp, 'short')}</p>
                    </div>

                    <div className="w-12"></div> {/* Spacer for center alignment */}
                </motion.div>

                {/* ✅ MAIN PHOTO CARD WITH PROFESSIONAL SWIPE SUPPORT */}
                <motion.div
                    {...swipeHandlers} // Apply swipe handlers here
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    className={`bg-white rounded-2xl shadow-xl overflow-hidden select-none transition-transform duration-300 ${
                        swipeDirection ? (swipeDirection === 'left' ? '-translate-x-1' : 'translate-x-1') : ''
                    }`}
                >
                    {/* Photo Container */}
                    <div
                        className="relative bg-gray-100 flex items-center justify-center overflow-hidden"
                        style={{height: '280px'}}
                    >
                        {/* Loading/Processing Overlay */}
                        {(!imageLoaded || isProcessingFrame) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100/90 z-10">
                                <div className="text-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="w-8 h-8 border-4 border-t-wedding-love border-r-wedding-love border-b-transparent border-l-transparent rounded-full mb-2 mx-auto"
                                    />
                                    <p className="text-xs text-gray-600">
                                        {isProcessingFrame ? `${currentFrame.name} wird angewendet...` : 'Lädt...'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Frame processing error */}
                        {previewError && (
                            <div className="absolute top-2 left-2 right-2 z-20">
                                <motion.div
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-yellow-100 border border-yellow-200 text-yellow-700 px-2 py-1 rounded-lg shadow-md text-xs text-center"
                                >
                                    Rahmen-Fehler, verwende Original...
                                </motion.div>
                            </div>
                        )}

                        {/* Photo */}
                        <motion.img
                            ref={imageRef}
                            src={activePreviewUrl || photo.url}
                            alt="Wedding photo"
                            className="max-w-full max-h-full object-contain"
                            onLoad={() => setImageLoaded(true)}
                            onError={(e) => {
                                console.error('Image failed to load:', e.target.src);
                                setImageLoaded(true);
                                if (e.target.src !== photo.url && !previewError) {
                                    handleProcessingError('Image load failed');
                                }
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: imageLoaded ? 1 : 0 }}
                            transition={{ duration: 0.3 }}
                        />

                        {/* Enhanced Swipe Hint */}
                        {framePreloadComplete && !isProcessingFrame && (
                            <div className="absolute bottom-2 left-0 right-0 text-center">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 0.8, 0] }}
                                    transition={{ duration: 3, delay: 1, repeat: 2 }}
                                    className="bg-black/60 text-white text-xs px-4 py-2 rounded-full inline-flex items-center backdrop-blur-sm"
                                >
                                    <Icon path={mdiGestureSwipeHorizontal } size={0.6} className="mr-1"/>
                                    Swipe for frames
                                </motion.div>
                            </div>
                        )}

                        {/* Swipe Direction Indicator */}
                        {swipeDirection && (
                            <div className={`absolute top-1/2 -translate-y-1/2 z-30 ${
                                swipeDirection === 'left' ? 'right-4' : 'left-4'
                            }`}>
                                <motion.div
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="bg-wedding-love text-white rounded-full p-2"
                                >
                                    <Icon
                                        path={mdiArrowLeft}
                                        size={1}
                                        className={swipeDirection === 'left' ? '' : 'rotate-180'}
                                    />
                                </motion.div>
                            </div>
                        )}
                    </div>

                    {/* Enhanced Content */}
                    <div className="p-4 space-y-3">
                        {/* Frame Selection with Swipe Indicators and Manual Buttons */}
                        <div className="mb-2">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-medium text-gray-700 flex items-center">
                                    <Icon path={mdiPalette} size={0.7} className="mr-1 text-wedding-love"/>
                                    Rahmen wählen
                                </h3>
                                <div className="flex space-x-1">
                                    {frameOptions.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => selectFrame(index)}
                                            className={`w-3 h-3 rounded-full transition-all ${
                                                index === selectedFrameIndex ? 'bg-wedding-love scale-110' : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Current Frame Display */}
                            <motion.div
                                key={selectedFrameIndex}
                                initial={{ x: swipeDirection === 'left' ? 20 : swipeDirection === 'right' ? -20 : 0, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="border-2 border-wedding-love bg-pink-50 rounded-lg p-3 text-center"
                            >
                                <div className="text-2xl mb-1">{currentFrame.preview}</div>
                                <p className="text-sm font-semibold text-gray-800">{currentFrame.name}</p>
                                <p className="text-xs text-gray-600">{currentFrame.description}</p>

                                {!framePreloadComplete && (
                                    <div className="mt-2 flex items-center justify-center text-xs text-gray-500">
                                        <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full mr-1"></div>
                                        Rahmen werden geladen...
                                    </div>
                                )}
                            </motion.div>

                            {/* Manual Frame Selection Buttons */}
                            <div className="grid grid-cols-3 gap-1 mt-2">
                                {frameOptions.map((frame, index) => (
                                    <button
                                        key={frame.id}
                                        onClick={() => selectFrame(index)}
                                        className={`p-2 rounded-md text-xs font-medium transition-all ${
                                            index === selectedFrameIndex
                                                ? 'bg-wedding-love text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {frame.preview} {frame.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Enhanced Action Buttons */}
                        <div className="grid grid-cols-1 gap-2">
                            {/* Enhanced Share Button */}
                            <button
                                onClick={handleShare}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                            >
                                <Icon path={mdiMagicStaff} size={0.9} className="mr-2"/>
                                Foto teilen
                            </button>

                            {/* Enhanced Download Button */}
                            <motion.button
                                onClick={handleDownload}
                                className="w-full border-2 border-wedding-love text-wedding-love py-3 px-4 rounded-xl font-semibold flex items-center justify-center hover:bg-wedding-love hover:text-white transition-all text-sm"
                                disabled={isProcessingFrame}
                                whileTap={{ scale: 0.95 }}
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
                                            <Icon path={mdiCheckCircle} size={0.9}/>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="download"
                                            initial={{scale: 0.5, opacity: 0}}
                                            animate={{scale: 1, opacity: 1}}
                                            exit={{scale: 0.5, opacity: 0}}
                                            className="mr-2"
                                        >
                                            <Icon path={mdiDownload} size={0.9}/>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <span>
                                    {downloadSuccess ? "Heruntergeladen! 🎉" : `Download${downloadCount > 0 ? ` (${downloadCount})` : ''}`}
                                </span>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Enhanced Thank You Message */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.6}}
                    className="bg-white rounded-xl shadow-lg p-3 text-center mt-3"
                >
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Icon path={mdiHeart} size={1.2} className="text-wedding-love mx-auto mb-1"/>
                    </motion.div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1">
                        Vielen Dank! 💕
                    </h3>
                    <p className="text-gray-600 text-xs">
                        Ihr habt unseren Tag noch schöner gemacht!
                    </p>
                    {downloadCount > 0 && (
                        <p className="text-xs text-wedding-love mt-1">
                            {downloadCount} Download{downloadCount > 1 ? 's' : ''}
                        </p>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default PhotoDetail;