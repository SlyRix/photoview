import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@mdi/react';
import { mdiLoading, mdiAlert } from '@mdi/js';

/**
 * ClientSideFrameProcessor - Process frames entirely in the browser using Canvas
 *
 * @param {string} photoUrl - URL of the original photo to process
 * @param {string} frameUrl - URL of the frame overlay to apply (or null for no frame)
 * @param {function} onProcessed - Callback function that receives the processed image URL
 * @param {function} onError - Callback function that receives any errors
 * @param {object} options - Additional processing options
 * @param {number} options.scaleFactor - Scale factor for the photo (0-1), default 0.85
 * @param {number} options.quality - JPEG quality (0-1), default 0.9
 * @param {boolean} options.useOriginalIfNoFrame - Whether to use original photo when no frame, default true
 */
const ClientSideFrameProcessor = ({
                                      photoUrl,
                                      frameUrl,
                                      onProcessed,
                                      onError,
                                      options = {}
                                  }) => {
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    // Default options
    const defaultOptions = {
        scaleFactor: 0.85,
        quality: 0.9,
        useOriginalIfNoFrame: true
    };

    // Merge default options with provided options
    const processingOptions = { ...defaultOptions, ...options };

    useEffect(() => {
        // Reset state when URLs change
        setStatus('loading');
        setErrorMessage('');

        // Validate inputs
        if (!photoUrl) {
            setStatus('error');
            setErrorMessage('No photo URL provided');
            if (onError) onError('No photo URL provided');
            return;
        }

        // If no frame and we're configured to use original photo
        if (!frameUrl && processingOptions.useOriginalIfNoFrame) {
            onProcessed(photoUrl);
            setStatus('success');
            return;
        }

        // Create a canvas for processing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Load the original photo
        const photo = new Image();
        photo.crossOrigin = 'anonymous'; // Handle CORS issues

        // Function to handle successful photo load
        photo.onload = () => {
            // If no frame, just resize the photo and return it
            if (!frameUrl) {
                try {
                    // Set canvas to photo dimensions
                    canvas.width = photo.width;
                    canvas.height = photo.height;

                    // Draw the photo
                    ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);

                    // Convert to data URL
                    const dataUrl = canvas.toDataURL('image/jpeg', processingOptions.quality);
                    onProcessed(dataUrl);
                    setStatus('success');
                } catch (err) {
                    console.error('Error processing photo:', err);
                    setStatus('error');
                    setErrorMessage('Failed to process photo');
                    if (onError) onError(err.message || 'Failed to process photo');
                    onProcessed(photoUrl); // Fall back to original
                }
                return;
            }

            // Load the frame overlay
            const frame = new Image();
            frame.crossOrigin = 'anonymous';

            // Handle successful frame load
            frame.onload = () => {
                try {
                    // Set canvas size to match the frame
                    canvas.width = frame.width;
                    canvas.height = frame.height;

                    // Calculate scaled dimensions for the photo
                    const scaleFactor = processingOptions.scaleFactor;
                    const photoWidth = Math.round(frame.width * scaleFactor);
                    const photoHeight = Math.round(frame.height * scaleFactor);

                    // Calculate position to center the photo
                    const x = Math.floor((frame.width - photoWidth) / 2);
                    const y = Math.floor((frame.height - photoHeight) / 2);

                    // Create white background
                    ctx.fillStyle = 'white';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // Draw the photo (scaled and centered)
                    ctx.drawImage(photo, x, y, photoWidth, photoHeight);

                    // Draw the frame overlay
                    ctx.drawImage(frame, 0, 0, frame.width, frame.height);

                    // Convert to data URL
                    const dataUrl = canvas.toDataURL('image/jpeg', processingOptions.quality);

                    // Return the processed image URL
                    onProcessed(dataUrl);
                    setStatus('success');
                } catch (err) {
                    console.error('Error processing frame:', err);
                    setStatus('error');
                    setErrorMessage('Failed to process frame');
                    if (onError) onError(err.message || 'Failed to process frame');
                    onProcessed(photoUrl); // Fall back to original
                }
            };

            // Handle frame load error
            frame.onerror = (err) => {
                console.error('Failed to load frame:', frameUrl, err);
                setStatus('error');
                setErrorMessage('Failed to load frame');
                if (onError) onError('Failed to load frame');
                onProcessed(photoUrl); // Fall back to original
            };

            // Start loading the frame
            frame.src = frameUrl;
        };

        // Handle photo load error
        photo.onerror = (err) => {
            console.error('Failed to load photo:', photoUrl, err);
            setStatus('error');
            setErrorMessage('Failed to load photo');
            if (onError) onError('Failed to load photo');
        };

        // Start loading the photo
        photo.src = photoUrl;

        // Cleanup
        return () => {
            photo.onload = null;
            photo.onerror = null;
        };
    }, [photoUrl, frameUrl, onProcessed, onError, processingOptions]);

    // Show loading state if requested
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center p-3 bg-gray-50 rounded-md text-wedding-love">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                >
                    <Icon path={mdiLoading} size={1.2} />
                </motion.div>
                <span className="ml-2 text-sm text-gray-600">Processing frame...</span>
            </div>
        );
    }

    // Show error state if requested
    if (status === 'error') {
        return (
            <div className="flex items-center justify-center p-3 bg-red-50 rounded-md text-red-500">
                <Icon path={mdiAlert} size={1} />
                <span className="ml-2 text-sm">{errorMessage || 'Frame processing failed'}</span>
            </div>
        );
    }

    // Don't render anything in success state
    return null;
};

export default ClientSideFrameProcessor;
