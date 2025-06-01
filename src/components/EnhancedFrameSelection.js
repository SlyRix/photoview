// src/components/EnhancedFrameSelection.js
// Kompakte Version - weniger Höhe, bessere Proportionen

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiImageFrame, mdiCheckCircle, mdiLoading } from '@mdi/js';

const EnhancedFrameSelection = ({
                                    photo,
                                    selectedFrame,
                                    onFrameSelect,
                                    isProcessing
                                }) => {
    // 3 FRAMES - Standard als Default
    const frameOptions = [
        {
            id: 'standard',
            name: 'Standard',
            description: 'Klassisch',
            frameUrl: '/frames/wedding-frame-standard.png',
            preview: '🎭'
        },
        {
            id: 'custom',
            name: 'Gold',
            description: 'Elegant',
            frameUrl: '/frames/wedding-frame-custom.png',
            preview: '✨'
        },
        {
            id: 'insta',
            name: 'Instagram',
            description: 'Social',
            frameUrl: '/frames/wedding-frame-insta.png',
            preview: '📱'
        }
    ];

    const handleFrameSelect = async (frame) => {
        try {
            await fetch('/api/analytics/frame-used', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    photoId: photo.id,
                    frameId: frame.id,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.log('Analytics tracking failed:', error);
        }

        onFrameSelect(frame);
    };

    return (
        <div className="mb-3">
            {/* Header - kompakter */}
            <h3 className="text-sm font-medium text-gray-800 mb-3 text-center flex items-center justify-center">
                <Icon path={mdiImageFrame} size={0.8} className="mr-1 text-wedding-love" />
                Rahmen wählen
            </h3>

            {/* Frame Grid - kompakter */}
            <div className="grid grid-cols-3 gap-2 mb-3">
                {frameOptions.map((frame) => (
                    <motion.button
                        key={frame.id}
                        onClick={() => handleFrameSelect(frame)}
                        disabled={isProcessing}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-2 border-2 rounded-lg transition-all duration-300 ${
                            selectedFrame?.id === frame.id
                                ? 'border-wedding-love bg-pink-50 shadow-md'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {/* Frame Preview - kleiner */}
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-md mb-1.5 flex items-center justify-center text-lg">
                            {frame.preview}
                        </div>

                        {/* Frame Info - kompakter */}
                        <div className="text-center">
                            <p className="text-xs font-semibold text-gray-800 leading-tight">
                                {frame.name}
                            </p>
                            <p className="text-xs text-gray-500">
                                {frame.description}
                            </p>
                        </div>

                        {/* Selected Indicator - kleiner */}
                        {selectedFrame?.id === frame.id && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-1 right-1 bg-wedding-love rounded-full p-0.5"
                            >
                                <Icon path={mdiCheckCircle} size={0.6} className="text-white" />
                            </motion.div>
                        )}

                        {/* Processing Indicator */}
                        {isProcessing && selectedFrame?.id === frame.id && (
                            <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                                <Icon path={mdiLoading} size={0.8} className="text-wedding-love animate-spin" />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Status Messages - kompakter */}
            {selectedFrame && !isProcessing && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-xs text-gray-600 bg-gray-50 rounded-md p-2"
                >
                    <span className="font-medium text-wedding-love">
                        {selectedFrame.name}
                    </span>{' '}
                    angewendet ✨
                </motion.div>
            )}

            {isProcessing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-xs text-wedding-love bg-pink-50 rounded-md p-2"
                >
                    <Icon path={mdiLoading} size={0.6} className="inline mr-1 animate-spin" />
                    Wird angewendet...
                </motion.div>
            )}
        </div>
    );
};

export default EnhancedFrameSelection;