// src/components/EnhancedFrameSelection.js
// Angepasst für deine 3 Frames - OHNE "Kein Frame" Option

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
    // DEINE 3 FRAMES - Standard als Default
    const frameOptions = [
        {
            id: 'standard',
            name: 'Standard',
            description: 'Klassischer Hochzeitsrahmen',
            frameUrl: '/frames/wedding-frame-standard.png',
            preview: '🎭'
        },
        {
            id: 'custom',
            name: 'Elegant Gold',
            description: 'Eleganter goldener Rahmen',
            frameUrl: '/frames/wedding-frame-custom.png',
            preview: '✨'
        },
        {
            id: 'insta',
            name: 'Instagram',
            description: 'Perfekt für Social Media',
            frameUrl: '/frames/wedding-frame-insta.png',
            preview: '📱'
        }
        // KEIN "none" / "Kein Frame" - Gäste müssen immer einen Frame haben!
    ];

    const handleFrameSelect = async (frame) => {
        // Analytics Call - tracking welcher Frame gewählt wurde
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
            // Nicht schlimm, Frame funktioniert trotzdem
        }

        // Deine bestehende Frame-Funktion aufrufen
        onFrameSelect(frame);
    };

    return (
        <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4 text-center">
                <Icon path={mdiImageFrame} size={1} className="inline mr-2 text-wedding-love" />
                Wählt euren Rahmen
            </h3>

            {/* Frame Grid - 3 Frames in einer Reihe */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                {frameOptions.map((frame) => (
                    <motion.button
                        key={frame.id}
                        onClick={() => handleFrameSelect(frame)}
                        disabled={isProcessing}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative p-3 border-2 rounded-xl transition-all duration-300 ${
                            selectedFrame?.id === frame.id
                                ? 'border-wedding-love bg-pink-50 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                        } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {/* Frame Preview */}
                        <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-2 flex items-center justify-center text-xl">
                            {frame.preview}
                        </div>

                        {/* Frame Info */}
                        <div className="text-center">
                            <p className="text-xs font-semibold text-gray-800 leading-tight">
                                {frame.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {frame.description}
                            </p>
                        </div>

                        {/* Selected Indicator */}
                        {selectedFrame?.id === frame.id && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute top-2 right-2 bg-wedding-love rounded-full p-1"
                            >
                                <Icon path={mdiCheckCircle} size={0.7} className="text-white" />
                            </motion.div>
                        )}

                        {/* Processing Indicator */}
                        {isProcessing && selectedFrame?.id === frame.id && (
                            <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                                <Icon path={mdiLoading} size={1} className="text-wedding-love animate-spin" />
                            </div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Current Selection Info */}
            {selectedFrame && !isProcessing && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3"
                >
          <span className="font-medium text-wedding-love">
            {selectedFrame.name}
          </span>{' '}
                    Rahmen wird verwendet ✨
                </motion.div>
            )}

            {/* Processing Message */}
            {isProcessing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-wedding-love bg-pink-50 rounded-lg p-3"
                >
                    <Icon path={mdiLoading} size={0.8} className="inline mr-2 animate-spin" />
                    Rahmen wird angewendet...
                </motion.div>
            )}

            {/* Info Text */}
            <div className="mt-3 text-center text-xs text-gray-500">
                Alle Fotos werden automatisch mit einem Rahmen versehen 💕
            </div>
        </div>
    );
};

export default EnhancedFrameSelection;