// src/utils/frameService.js - Client-side version
/**
 * Frame service utility for processing photos with frames
 * This version uses client-side Canvas processing instead of server API calls
 */

// Cache for loaded images
const imageCache = new Map();

/**
 * Load an image with caching and CORS support
 * @param {string} url - URL of the image to load
 * @returns {Promise<HTMLImageElement>} - Promise resolving to the loaded image
 */
const loadImage = (url) => {
    // Check cache first
    if (imageCache.has(url)) {
        return Promise.resolve(imageCache.get(url));
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Handle CORS

        const timeout = setTimeout(() => {
            reject(new Error(`Timeout loading image: ${url}`));
        }, 15000); // 15 second timeout

        img.onload = () => {
            clearTimeout(timeout);
            imageCache.set(url, img); // Cache the loaded image
            resolve(img);
        };

        img.onerror = () => {
            clearTimeout(timeout);
            reject(new Error(`Failed to load image: ${url}`));
        };

        img.src = url;
    });
};

/**
 * Clear image cache to free memory
 */
export const clearImageCache = () => {
    imageCache.clear();
};

/**
 * Fetch available frame options
 * @returns {Promise<Array>} Array of frame objects
 */
export const getFrameOptions = async () => {
    try {
        // Default frames (hardcoded since we're not using server API)
        return [
            {
                id: 'standard',
                name: 'Standard',
                thumbnailUrl: '/frames/standard-thumbnail.png',
                frameUrl: '/frames/wedding-frame-standard.png'
            },
            {
                id: 'custom',
                name: 'Elegant Gold',
                thumbnailUrl: '/frames/custom-thumbnail.png',
                frameUrl: '/frames/wedding-frame-custom.png'
            },
            {
                id: 'insta',
                name: 'Instagram',
                thumbnailUrl: '/frames/insta-thumbnail.png',
                frameUrl: '/frames/wedding-frame-insta.png'
            },
            {
                id: 'none',
                name: 'No Frame',
                thumbnailUrl: null,
                frameUrl: null
            }
        ];
    } catch (error) {
        console.error('Error fetching frame options:', error);
        throw error;
    }
};

/**
 * Apply a frame to a photo using client-side Canvas
 * @param {string} photoUrl - URL of the original photo
 * @param {string} frameUrl - URL of the frame to apply
 * @param {Object} options - Additional options for frame application
 * @returns {Promise<string>} Promise resolving to a data URL of the framed photo
 */
export const applyFrameToPhoto = async (photoUrl, frameUrl, options = {}) => {
    try {
        // If no frame is selected, return the original photo
        if (!frameUrl) {
            return photoUrl;
        }

        const {
            quality = 90,
            // ENHANCED: Increased scale factor from 0.85 to 0.95 to fill more of the frame
            scaleFactor = 0.95,
            background = { r: 255, g: 255, b: 255 }
        } = options;

        // Load both images
        const [photo, frame] = await Promise.all([
            loadImage(photoUrl),
            loadImage(frameUrl)
        ]);

        // Create a canvas element
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to match the frame
        canvas.width = frame.width;
        canvas.height = frame.height;

        // Calculate the scaled dimensions for the photo
        const photoWidth = frame.width * scaleFactor;
        const photoHeight = frame.height * scaleFactor;

        // Calculate position to center the photo
        const x = (frame.width - photoWidth) / 2;
        const y = (frame.height - photoHeight) / 2;

        // Draw background
        ctx.fillStyle = `rgb(${background.r}, ${background.g}, ${background.b})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the photo (scaled and centered)
        ctx.drawImage(photo, x, y, photoWidth, photoHeight);

        // Draw the frame on top
        ctx.drawImage(frame, 0, 0, frame.width, frame.height);

        // Convert canvas to data URL with specified quality
        const qualityFactor = quality / 100;
        return canvas.toDataURL('image/jpeg', qualityFactor);

    } catch (error) {
        console.error('Error applying frame to photo:', error);
        // Return original photo on error
        return photoUrl;
    }
};

/**
 * Generate a preview of a photo with a frame applied
 * @param {string} photoUrl - URL of the original photo
 * @param {string} frameUrl - URL of the frame to apply
 * @returns {Promise<string>} Promise resolving to a data URL of the preview
 */
export const generateFramePreview = async (photoUrl, frameUrl) => {
    try {
        // For previews, use lower quality for faster generation
        return await applyFrameToPhoto(photoUrl, frameUrl, {
            quality: 75,
            scaleFactor: 0.95 // ENHANCED: Increased from 0.85 to make photo fill more of the frame
        });
    } catch (error) {
        console.error('Error generating frame preview:', error);
        // Return original photo on error
        return photoUrl;
    }
};

/**
 * Download a photo with a frame applied
 * @param {string} photoUrl - URL of the original photo
 * @param {string} frameUrl - URL of the frame to apply
 * @param {string} filename - Desired filename for the download
 * @returns {Promise<void>}
 */
export const downloadFramedPhoto = async (photoUrl, frameUrl, filename = 'wedding-photo.jpg') => {
    try {
        // If no frame is selected, download the original photo
        let downloadUrl;

        if (!frameUrl) {
            // Use the original photo URL
            downloadUrl = photoUrl;
        } else {
            // Generate high-quality framed photo
            downloadUrl = await applyFrameToPhoto(photoUrl, frameUrl, {
                quality: 95,  // High quality for downloads
                scaleFactor: 0.97 // ENHANCED: Increased from 0.92 to nearly fill the entire frame
            });
        }

        // Create a temporary link element and trigger the download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // If we created a blob URL, revoke it to free memory
        if (downloadUrl.startsWith('blob:')) {
            URL.revokeObjectURL(downloadUrl);
        }

    } catch (error) {
        console.error('Error downloading framed photo:', error);
        throw error;
    }
};

export default {
    getFrameOptions,
    applyFrameToPhoto,
    generateFramePreview,
    downloadFramedPhoto,
    clearImageCache
};