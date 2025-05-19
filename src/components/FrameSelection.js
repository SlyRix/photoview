import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiCheckCircle, mdiImageFrame, mdiLoading, mdiImageOff } from '@mdi/js';
import { getFrameOptions, generateFramePreview } from '../utils/frameService';
import ClientSideFrameProcessor from './ClientSideFrameProcessor';

const FrameSelection = ({
                            photoUrl,
                            onSelectFrame,
                            onPreviewReady,
                            isOpen,
                            onClose
                        }) => {
    const [frames, setFrames] = useState([]);
    const [selectedFrame, setSelectedFrame] = useState('standard'); // Default to standard frame
    const [previewUrls, setPreviewUrls] = useState({});
    const [loading, setLoading] = useState({});
    const [error, setError] = useState(null);
    const [processingFrames, setProcessingFrames] = useState([]);

    // Fetch available frames when component mounts
    useEffect(() => {
        async function fetchFrames() {
            try {
                const frameOptions = await getFrameOptions();
                setFrames(frameOptions);

                // Set default selected frame if none has been selected yet
                if (!selectedFrame && frameOptions.length > 0) {
                    setSelectedFrame(frameOptions[0].id);
                }
            } catch (err) {
                console.error('Error fetching frames:', err);
                setError('Failed to load frames. Please try again.');
            }
        }

        fetchFrames();
    }, [selectedFrame]);

    // Handle frame selection
    const handleSelectFrame = (frameId) => {
        setSelectedFrame(frameId);

        // Find the selected frame
        const frame = frames.find(f => f.id === frameId);

        if (frame) {
            // If we already have a preview, use it
            if (previewUrls[frameId]) {
                // Notify parent component about frame selection
                onSelectFrame({
                    frameId: frameId,
                    frameUrl: frame?.frameUrl || null,
                    previewUrl: previewUrls[frameId] || photoUrl,
                    frameName: frame?.name || 'Custom Frame'
                });

                // Also inform parent that preview is ready
                onPreviewReady(previewUrls[frameId]);
            } else {
                // Otherwise start processing this frame
                if (!processingFrames.includes(frameId)) {
                    setProcessingFrames(prev => [...prev, frameId]);
                    setLoading(prev => ({ ...prev, [frameId]: true }));
                }
            }
        }
    };

    // Handle frame preview processing completion
    const handlePreviewProcessed = (frameId, previewUrl) => {
        // Update preview URLs
        setPreviewUrls(prev => ({
            ...prev,
            [frameId]: previewUrl
        }));

        // Update loading state
        setLoading(prev => ({ ...prev, [frameId]: false }));

        // Remove from processing list
        setProcessingFrames(prev => prev.filter(id => id !== frameId));

        // If this is the selected frame, notify parent
        if (frameId === selectedFrame) {
            const frame = frames.find(f => f.id === frameId);

            onSelectFrame({
                frameId: frameId,
                frameUrl: frame?.frameUrl || null,
                previewUrl: previewUrl || photoUrl,
                frameName: frame?.name || 'Custom Frame'
            });

            onPreviewReady(previewUrl);
        }
    };

    // Handle processing error
    const handleProcessingError = (frameId, errorMsg) => {
        console.error(`Error processing frame ${frameId}:`, errorMsg);

        // Update loading state
        setLoading(prev => ({ ...prev, [frameId]: false }));

        // Remove from processing list
        setProcessingFrames(prev => prev.filter(id => id !== frameId));
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Choose a Frame</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {error ? (
                    <div className="text-center py-8">
                        <p className="text-red-500 mb-4">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-primary btn-christian"
                        >
                            Reload Page
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                            {frames.map((frame) => (
                                <div
                                    key={frame.id}
                                    className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                                        selectedFrame === frame.id
                                            ? 'ring-2 ring-christian-accent scale-105'
                                            : 'hover:shadow-md'
                                    }`}
                                    onClick={() => handleSelectFrame(frame.id)}
                                >
                                    {/* Frame preview */}
                                    <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                                        {loading[frame.id] ? (
                                            <Icon path={mdiLoading} size={2} className="animate-spin text-gray-400" />
                                        ) : previewUrls[frame.id] ? (
                                            <img
                                                src={previewUrls[frame.id]}
                                                alt={`${frame.name} frame preview`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Icon path={mdiImageOff} size={2} className="text-gray-300" />
                                        )}

                                        {/* Client-side frame processor */}
                                        {processingFrames.includes(frame.id) && (
                                            <ClientSideFrameProcessor
                                                photoUrl={photoUrl}
                                                frameUrl={frame.frameUrl}
                                                onProcessed={(previewUrl) => handlePreviewProcessed(frame.id, previewUrl)}
                                                onError={(errorMsg) => handleProcessingError(frame.id, errorMsg)}
                                                showLoader={false}
                                                quality={75} // Lower quality for previews
                                            />
                                        )}
                                    </div>

                                    {/* Frame name */}
                                    <div className="p-2 text-center">
                                        <p className="text-sm font-medium text-gray-700">{frame.name}</p>
                                    </div>

                                    {/* Selected indicator */}
                                    {selectedFrame === frame.id && (
                                        <div className="absolute top-2 right-2">
                                            <div className="bg-christian-accent rounded-full p-1">
                                                <Icon path={mdiCheckCircle} size={0.8} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="btn btn-primary btn-christian"
                            >
                                Apply Frame
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </motion.div>
    );
};

export default FrameSelection;