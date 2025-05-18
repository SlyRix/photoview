import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiCheckCircle, mdiImageFrame, mdiLoading, mdiImageOff } from '@mdi/js';
import { getFrameOptions, generateFramePreview } from '../utils/frameService';

const FrameSelection = ({
                            photoUrl,
                            onSelectFrame,
                            onPreviewReady,
                            isOpen,
                            onClose
                        }) => {
    const [frames, setFrames] = useState([]);
    const [selectedFrame, setSelectedFrame] = useState('standard');
    const [previewUrls, setPreviewUrls] = useState({});
    const [loading, setLoading] = useState({});
    const [error, setError] = useState(null);

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

    // Generate frame previews when frames are loaded or photoUrl changes
    useEffect(() => {
        if (!photoUrl || !frames.length) return;

        // Generate previews for each frame
        async function generatePreviews() {
            for (const frame of frames) {
                if (frame.id === 'none') {
                    // For "No Frame" option, just use the original photo
                    setPreviewUrls(prev => ({
                        ...prev,
                        [frame.id]: photoUrl
                    }));
                    continue;
                }

                setLoading(prev => ({ ...prev, [frame.id]: true }));

                try {
                    // Generate preview using the API
                    const previewUrl = await generateFramePreview(photoUrl, frame.frameUrl);

                    setPreviewUrls(prev => ({
                        ...prev,
                        [frame.id]: previewUrl
                    }));

                    // Notify parent that preview is ready if this is the selected frame
                    if (frame.id === selectedFrame) {
                        onPreviewReady(previewUrl);
                    }
                } catch (err) {
                    console.error(`Error generating preview for frame ${frame.id}:`, err);
                } finally {
                    setLoading(prev => ({ ...prev, [frame.id]: false }));
                }
            }
        }

        generatePreviews();
    }, [photoUrl, frames, selectedFrame, onPreviewReady]);

    // Handle frame selection
    const handleSelectFrame = (frameId) => {
        setSelectedFrame(frameId);

        // Find the selected frame
        const frame = frames.find(f => f.id === frameId);

        // Notify parent component about frame selection
        onSelectFrame({
            frameId: frameId,
            frameUrl: frame?.frameUrl || null,
            previewUrl: previewUrls[frameId] || photoUrl,
            frameName: frame?.name || (frameId === 'none' ? 'No Frame' : 'Custom Frame') // Add frame name
        });
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                                        ) : frame.id === 'none' ? (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <p className="text-sm text-gray-500">Original Photo</p>
                                            </div>
                                        ) : (
                                            <Icon path={mdiImageOff} size={2} className="text-gray-300" />
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