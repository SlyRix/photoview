import React, { useState, useEffect } from 'react';
import ClientSideFrameProcessor from './ClientSideFrameProcessor';
import { motion } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiImageFrame, mdiCheckCircle, mdiImageOff, mdiLoading } from '@mdi/js';

const FrameExample = () => {
    const [selectedFrame, setSelectedFrame] = useState(null);
    const [processedImageUrl, setProcessedImageUrl] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Example frames - you can modify these URLs to match your actual frame locations
    const frames = [
        { id: 'standard', name: 'Standard', url: '/frames/wedding-frame-standard.png' },
        { id: 'custom', name: 'Elegant Gold', url: '/frames/wedding-frame-custom.png' },
        { id: 'insta', name: 'Instagram', url: '/frames/wedding-frame-insta.png' },
        { id: 'none', name: 'No Frame', url: null }
    ];

    // Example photo URL - replace with your actual photo
    const photoUrl = '/photos/example-photo.jpg';

    const handleFrameSelect = (frame) => {
        setSelectedFrame(frame);
        setIsProcessing(true);
    };

    const handleProcessed = (url) => {
        setProcessedImageUrl(url);
        setIsProcessing(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Frame Example</h2>

            {/* Photo display area */}
            <div className="bg-gray-100 rounded-lg overflow-hidden mb-6 aspect-[4/3] relative">
                {isProcessing ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Icon path={mdiLoading} size={3} className="animate-spin text-gray-400" />
                    </div>
                ) : processedImageUrl ? (
                    <img
                        src={processedImageUrl}
                        alt="Framed photo"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <img
                        src={photoUrl}
                        alt="Original photo"
                        className="w-full h-full object-contain"
                    />
                )}

                {/* Hidden frame processor component */}
                {selectedFrame && (
                    <ClientSideFrameProcessor
                        photoUrl={photoUrl}
                        frameUrl={selectedFrame.url}
                        onProcessed={handleProcessed}
                    />
                )}
            </div>

            {/* Frame selection */}
            <div>
                <h3 className="text-lg font-bold mb-4">Select a Frame</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {frames.map((frame) => (
                        <div
                            key={frame.id}
                            className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${
                                selectedFrame?.id === frame.id
                                    ? 'ring-2 ring-blue-500 scale-105'
                                    : 'hover:shadow-md'
                            }`}
                            onClick={() => handleFrameSelect(frame)}
                        >
                            <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center">
                                {frame.id === 'none' ? (
                                    <div className="text-center p-4">
                                        <p className="text-sm text-gray-500">No Frame</p>
                                    </div>
                                ) : (
                                    <img
                                        src={frame.url}
                                        alt={`${frame.name} frame`}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                )}
                            </div>

                            <div className="p-2 text-center">
                                <p className="text-sm font-medium">{frame.name}</p>
                            </div>

                            {/* Selected indicator */}
                            {selectedFrame?.id === frame.id && (
                                <div className="absolute top-2 right-2">
                                    <div className="bg-blue-500 rounded-full p-1">
                                        <Icon path={mdiCheckCircle} size={0.8} className="text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FrameExample;