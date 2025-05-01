// src/utils/photoProcessor.js
import sharp from 'sharp';

/**
 * Apply a frame overlay to a photo
 * @param {File|Blob|Buffer|string} originalPhoto - The original photo to process
 * @param {string} frameUrl - URL of the frame overlay image
 * @param {Object} options - Additional options
 * @returns {Promise<Blob>} - Processed photo as a Blob
 */
export async function applyFrameToPhoto(originalPhoto, frameUrl, options = {}) {
    try {
        // Default options
        const defaultOptions = {
            quality: 90,
            fit: 'contain',
            position: 'center',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
        };

        const settings = { ...defaultOptions, ...options };

        // Fetch the frame image
        const frameResponse = await fetch(frameUrl);
        if (!frameResponse.ok) {
            throw new Error(`Failed to fetch frame image: ${frameResponse.status}`);
        }
        const frameBuffer = await frameResponse.arrayBuffer();

        // Get input as buffer
        let inputBuffer;
        if (typeof originalPhoto === 'string') {
            // If input is URL or path
            const photoResponse = await fetch(originalPhoto);
            if (!photoResponse.ok) {
                throw new Error(`Failed to fetch original photo: ${photoResponse.status}`);
            }
            inputBuffer = await photoResponse.arrayBuffer();
        } else if (originalPhoto instanceof File || originalPhoto instanceof Blob) {
            // If input is File or Blob
            inputBuffer = await originalPhoto.arrayBuffer();
        } else {
            // Assume it's already a buffer
            inputBuffer = originalPhoto;
        }

        // Get metadata from source photo
        const metadata = await sharp(Buffer.from(inputBuffer)).metadata();
        console.log('Original image dimensions:', metadata.width, 'x', metadata.height);

        // Get frame metadata
        const frameMetadata = await sharp(Buffer.from(frameBuffer)).metadata();
        console.log('Frame dimensions:', frameMetadata.width, 'x', frameMetadata.height);

        // Calculate target dimensions
        // Typically we want to match the frame dimensions
        const targetWidth = frameMetadata.width;
        const targetHeight = frameMetadata.height;

        // Create a white background canvas
        const baseCanvas = await sharp({
            create: {
                width: targetWidth,
                height: targetHeight,
                channels: 4,
                background: settings.background
            }
        }).png().toBuffer();

        // Calculate scaling to fit the photo within the frame
        // Usually we want to scale the photo to 80-90% of the frame size
        // to ensure it fits inside the transparent area
        const scaleFactor = 0.85; // Adjust this value as needed
        const photoWidth = Math.round(targetWidth * scaleFactor);
        const photoHeight = Math.round(targetHeight * scaleFactor);

        // Resize the original photo
        const resizedPhoto = await sharp(Buffer.from(inputBuffer))
            .resize({
                width: photoWidth,
                height: photoHeight,
                fit: settings.fit,
                position: settings.position,
                background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
            })
            .toBuffer();

        // Calculate position to center the photo
        const left = Math.floor((targetWidth - photoWidth) / 2);
        const top = Math.floor((targetHeight - photoHeight) / 2);

        // Add the photo to the white canvas
        const canvasWithPhoto = await sharp(baseCanvas)
            .composite([{ input: resizedPhoto, left, top }])
            .toBuffer();

        // Apply the frame overlay
        const processedImageBuffer = await sharp(canvasWithPhoto)
            .composite([{ input: Buffer.from(frameBuffer), left: 0, top: 0 }])
            .jpeg({ quality: settings.quality })
            .toBuffer();

        // Convert the buffer to a Blob
        return new Blob([processedImageBuffer], { type: 'image/jpeg' });
    } catch (error) {
        console.error('Error applying frame to photo:', error);
        throw error;
    }
}

/**
 * Apply frame overlay and create a URL for the processed image
 * @param {string} originalPhotoUrl - URL of the original photo
 * @param {string} frameUrl - URL of the frame overlay
 * @param {Object} options - Processing options
 * @returns {Promise<string>} - Object URL for the processed image
 */
export async function createFramedPhotoUrl(originalPhotoUrl, frameUrl, options = {}) {
    try {
        const framedBlob = await applyFrameToPhoto(originalPhotoUrl, frameUrl, options);
        return URL.createObjectURL(framedBlob);
    } catch (error) {
        console.error('Error creating framed photo URL:', error);
        throw error;
    }
}

/**
 * Clean up object URLs to prevent memory leaks
 * @param {string} url - Object URL to revoke
 */
export function revokePhotoUrl(url) {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
    }
}