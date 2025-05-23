// Updated src/utils/frameService.js - Removed the "none" option
/**
 * Frame service utility for processing photos with frames
 * Enhanced to always use frames - no "none" option available
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
 * Fetch available frame options - MODIFIED: removed "none" option
 * @returns {Promise<Array>} Array of frame objects
 */
export const getFrameOptions = async () => {
    try {
        // Default frames - "none" option removed
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
            }
            // "none" option removed per requirement
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
        // If for some reason no frame is selected, ensure we have a default
        if (!frameUrl) {
            console.warn('No frame specified, using standard frame');
            // Use standard frame as fallback
            frameUrl = '/frames/wedding-frame-standard.png';
        }

        const {
            quality = 90,
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
            scaleFactor: 0.95
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
        // Generate high-quality framed photo
        // If frameUrl is not provided, the applyFrameToPhoto function will use the standard frame
        const downloadUrl = await applyFrameToPhoto(photoUrl, frameUrl, {
            quality: 95,  // High quality for downloads
            scaleFactor: 0.97 // Fill nearly the entire frame
        });

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