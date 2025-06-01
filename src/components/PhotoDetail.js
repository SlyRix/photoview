// src/components/PhotoDetail.js
// Kompakte Version - alles in einem Blick sichtbar

import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {motion, AnimatePresence} from 'framer-motion';
import Icon from '@mdi/react';
import {
    mdiArrowLeft,
    mdiDownload,
    mdiImageOff,
    mdiRefresh,
    mdiHeart,
    mdiCheckCircle
} from '@mdi/js';

// Komponenten importieren
import EnhancedFrameSelection from './EnhancedFrameSelection';
import AdvancedImageSharing from './AdvancedImageSharing';
import ClientSideFrameProcessor from './ClientSideFrameProcessor';
import Loading from './Loading';

// Utilities
import {formatDate, extractTimestampFromFilename} from '../utils/dateUtils';

const BASE_URL = '//photo-view.slyrix.com';

const PhotoDetail = () => {
    const {photoId} = useParams();
    const navigate = useNavigate();

    // States
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Frame States
    const [selectedFrame, setSelectedFrame] = useState({
        id: 'standard',
        frameUrl: '/frames/wedding-frame-standard.png',
        frameName: 'Standard'
    });
    const [activePreviewUrl, setActivePreviewUrl] = useState(null);
    const [isProcessingFrame, setIsProcessingFrame] = useState(false);
    const [previewError, setPreviewError] = useState(false);

    // Download States
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [downloadCount, setDownloadCount] = useState(0);

    // Photo-Fetch Logic
    useEffect(() => {
        async function fetchPhoto() {
            if (!photoId) return;

            setLoading(true);
            setError(null);

            try {
                console.log(`Looking for metadata for: ${photoId}`);

                const photoTimestampFromId = extractTimestampFromFilename(photoId);
                console.log('Timestamp extracted from photoId:', photoTimestampFromId ?
                    new Date(photoTimestampFromId).toISOString() : 'None found');

                const res = await fetch(`${BASE_URL}/api/photos`);
                const allPhotos = await res.json();
                const found = allPhotos.find(p => p.photoId === photoId || p.filename === photoId);

                if (found) {
                    console.log('Found photo in API results:', found);

                    let bestTimestamp = photoTimestampFromId;
                    if (!bestTimestamp && found.timestamp) {
                        bestTimestamp = found.timestamp;
                    }

                    const photoData = {
                        ...found,
                        id: photoId,
                        url: `${BASE_URL}${found.url}`,
                        thumbnailUrl: `${BASE_URL}${found.thumbnailUrl}`,
                        timestamp: bestTimestamp || Date.now()
                    };

                    setPhoto(photoData);
                    setActivePreviewUrl(photoData.url);
                    setLoading(false);
                    setIsProcessingFrame(true);

                    trackPhotoView(photoId);
                } else {
                    throw new Error('Photo metadata not found');
                }
            } catch (err) {
                console.warn('API failed, falling back to image test:', err.message);

                const testImg = new Image();
                testImg.onload = async () => {
                    const photoTimestamp = extractTimestampFromFilename(photoId);

                    const photoData = {
                        id: photoId,
                        filename: photoId,
                        url: `${BASE_URL}/photos/${photoId}`,
                        thumbnailUrl: `${BASE_URL}/thumbnails/thumb_${photoId}`,
                        timestamp: photoTimestamp || Date.now()
                    };
                    setPhoto(photoData);
                    setActivePreviewUrl(photoData.url);
                    setLoading(false);
                    setIsProcessingFrame(true);

                    trackPhotoView(photoId);
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

    // Analytics Functions
    const trackPhotoView = async (photoId) => {
        try {
            await fetch('/api/analytics/view', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    photoId,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent
                })
            });
        } catch (error) {
            console.log('Analytics tracking failed:', error);
        }
    };

    // Frame Selection Handler
    const handleFrameSelect = (frameData) => {
        console.log('Frame selected:', frameData);
        setSelectedFrame(frameData);
        setIsProcessingFrame(true);
        setPreviewError(false);
    };

    // Frame Preview Logic
    const handlePreviewReady = (previewUrl) => {
        if (previewUrl) {
            console.log('Frame preview ready:', previewUrl);
            setActivePreviewUrl(previewUrl);
            setPreviewError(false);
            setIsProcessingFrame(false);
        }
    };

    const handleProcessingError = (errorMsg) => {
        console.error('Error processing frame:', errorMsg);
        setPreviewError(true);
        setIsProcessingFrame(false);

        if (selectedFrame.id !== 'standard') {
            console.log('Falling back to standard frame');
            setSelectedFrame({
                id: 'standard',
                frameUrl: '/frames/wedding-frame-standard.png',
                frameName: 'Standard'
            });
            setIsProcessingFrame(true);
        } else {
            setActivePreviewUrl(photo?.url);
        }
    };

    // Download Handler
    const handleDownload = async () => {
        if (!photo) return;

        try {
            const downloadUrl = activePreviewUrl || photo.url;

            if (downloadUrl.startsWith('data:')) {
                const response = await fetch(downloadUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `rushel-sivani-wedding-${selectedFrame.id}-frame.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);
            } else {
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `rushel-sivani-wedding-${selectedFrame.id}-frame.jpg`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            await fetch('/api/analytics/download', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    photoId: photo.id,
                    frameId: selectedFrame.id,
                    timestamp: Date.now()
                })
            });

            const newCount = downloadCount + 1;
            setDownloadCount(newCount);
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);

        } catch (err) {
            console.error('Download failed:', err);
            alert('Download failed. Please try again.');
        }
    };

    // Navigation Handler
    const handleBack = () => {
        navigate('/');
    };

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        setPreviewError(false);
        if (previewError && photo) {
            setActivePreviewUrl(photo.url);
            setImageLoaded(false);
        }
    };

    // Loading State
    if (loading) {
        return <Loading message="Loading photo..."/>;
    }

    // Error State
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
        <div className="min-h-screen bg-gradient-to-br from-christian-accent/10 to-hindu-accent/10 py-4 px-4">
            {/* ClientSideFrameProcessor */}
            {(isProcessingFrame || photo) && selectedFrame.frameUrl && (
                <div className="hidden">
                    <ClientSideFrameProcessor
                        photoUrl={photo?.url}
                        frameUrl={selectedFrame.frameUrl}
                        onProcessed={handlePreviewReady}
                        onError={handleProcessingError}
                        showLoader={false}
                        quality={90}
                        options={{scaleFactor: 0.95}}
                    />
                </div>
            )}

            <div className="container mx-auto max-w-lg">
                {/* Back Button - kompakter */}
                <motion.button
                    initial={{opacity: 0, x: -20}}
                    animate={{opacity: 1, x: 0}}
                    transition={{duration: 0.5}}
                    onClick={handleBack}
                    className="flex items-center text-gray-600 hover:text-christian-accent mb-3 transition-colors text-sm"
                >
                    <Icon path={mdiArrowLeft} size={0.8} className="mr-1"/>
                    <span>Zurück zur Galerie</span>
                </motion.button>

                {/* Hauptkarte - kompakter */}
                <motion.div
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{duration: 0.5}}
                    className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                    {/* Header - kompakter */}
                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-3 text-center border-b">
                        <h1 className="text-lg font-script text-wedding-love">Rushel & Sivani</h1>
                        <p className="text-xs text-gray-600">{formatDate(photo.timestamp, 'medium')}</p>
                        {selectedFrame.id && !isProcessingFrame && !previewError && (
                            <p className="text-xs text-wedding-love mt-1">
                                {selectedFrame.frameName} Rahmen ✨
                            </p>
                        )}
                    </div>

                    {/* Photo Container - angepasste Höhe */}
                    <div
                        className="relative bg-gray-100 flex items-center justify-center overflow-hidden"
                        style={{height: '300px'}}
                    >
                        {/* Loading placeholder */}
                        {(!imageLoaded || isProcessingFrame) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <div className="text-center">
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-4 border-t-wedding-love border-r-wedding-love border-b-transparent border-l-transparent mb-2"></div>
                                    <p className="text-xs text-gray-600">
                                        {isProcessingFrame ? `${selectedFrame.frameName} wird angewendet...` : 'Lädt...'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Frame preview error message */}
                        {previewError && (
                            <div className="absolute top-2 left-2 right-2 z-10">
                                <div
                                    className="bg-yellow-100 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-lg shadow-md text-xs text-center">
                                    Rahmen-Fehler, versuche anderen...
                                </div>
                            </div>
                        )}

                        {/* Photo */}
                        <img
                            src={activePreviewUrl || photo.url}
                            alt="Wedding photo"
                            className="max-w-full max-h-full object-contain"
                            onLoad={() => setImageLoaded(true)}
                            onError={(e) => {
                                console.error('Image failed to load:', e.target.src);
                                setImageLoaded(true);
                                if (e.target.src !== photo.url && !previewError) {
                                    console.log('Falling back to original photo');
                                    handleProcessingError('Image load failed');
                                }
                            }}
                        />
                    </div>

                    {/* Content - kompakter */}
                    <div className="p-4 space-y-4">
                        {/* Frame Selection - kompakter */}
                        <EnhancedFrameSelection
                            photo={photo}
                            selectedFrame={selectedFrame}
                            onFrameSelect={handleFrameSelect}
                            isProcessing={isProcessingFrame}
                        />

                        {/* Action Buttons - nebeneinander statt untereinander */}
                        <div className="grid grid-cols-1 gap-3">
                            {/* Share Button */}
                            <AdvancedImageSharing
                                photo={photo}
                                activePreviewUrl={activePreviewUrl}
                                selectedFrame={selectedFrame}
                            />

                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                className="w-full border-2 border-wedding-love text-wedding-love py-2.5 px-4 rounded-xl font-semibold flex items-center justify-center hover:bg-wedding-love hover:text-white transition-all text-sm"
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
                                    {downloadSuccess ? "Heruntergeladen! 🎉" : `Foto herunterladen${downloadCount > 0 ? ` (${downloadCount})` : ''}`}
                                </span>
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Thank You Message - deutlich kompakter */}
                <motion.div
                    initial={{opacity: 0}}
                    animate={{opacity: 1}}
                    transition={{delay: 0.6}}
                    className="bg-white rounded-xl shadow-lg p-4 text-center mt-4"
                >
                    <Icon path={mdiHeart} size={1.5} className="text-wedding-love mx-auto mb-2"/>
                    <h3 className="text-base font-semibold text-gray-800 mb-1">
                        Vielen Dank! 💕
                    </h3>
                    <p className="text-gray-600 text-xs">
                        Ihr habt unseren Tag noch schöner gemacht!
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default PhotoDetail;