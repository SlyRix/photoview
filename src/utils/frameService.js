// src/utils/frameService.js
import axios from 'axios';

// Base URL for the server
const BASE_URL = '//photo-view.slyrix.com';

/**
 * Fetch available frame options from the server
 * @returns {Promise<Array>} Array of frame objects
 */
export const getFrameOptions = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/api/frames`);
        return response.data;
    } catch (error) {
        console.error('Error fetching frame options:', error);
        // Return default frames in case of API failure
        return [
            {
                id: 'standard',
                name: 'Standard',
                thumbnailUrl: `${BASE_URL}/frames/standard-thumbnail.png`,
                frameUrl: `${BASE_URL}/frames/wedding-frame-standard.png`
            },
            {
                id: 'custom',
                name: 'Elegant Gold',
                thumbnailUrl: `${BASE_URL}/frames/custom-thumbnail.png`,
                frameUrl: `${BASE_URL}/frames/wedding-frame-custom.png`
            },
            {
                id: 'insta',
                name: 'Instagram',
                thumbnailUrl: `${BASE_URL}/frames/insta-thumbnail.png`,
                frameUrl: `${BASE_URL}/frames/wedding-frame-insta.png`
            },
            {
                id: 'none',
                name: 'No Frame',
                thumbnailUrl: null,
                frameUrl: null
            }
        ];
    }
};

/**
 * Apply a frame to a photo
 * @param {string} photoUrl - URL of the original photo
 * @param {string} frameUrl - URL of the frame to apply
 * @param {Object} options - Additional options for frame application
 * @returns {Promise<string>} URL of the framed photo
 */
export const applyFrameToPhoto = async (photoUrl, frameUrl, options = {}) => {
    try {
        // If no frame is selected, return the original photo
        if (!frameUrl) {
            return photoUrl;
        }

        const response = await axios.post(`${BASE_URL}/api/apply-frame`, {
            photoUrl,
            frameUrl,
            options
        });

        return response.data.framedPhotoUrl;
    } catch (error) {
        console.error('Error applying frame to photo:', error);
        throw error;
    }
};

/**
 * Generate a preview of a photo with a frame applied
 * @param {string} photoUrl - URL of the original photo
 * @param {string} frameUrl - URL of the frame to apply
 * @returns {Promise<string>} URL of the preview image
 */
export const generateFramePreview = async (photoUrl, frameUrl) => {
    try {
        // If no frame is selected, return the original photo
        if (!frameUrl) {
            return photoUrl;
        }

        const response = await axios.post(`${BASE_URL}/api/preview-frame`, {
            photoUrl,
            frameUrl,
            quality: 'low' // Request a lower quality for faster preview generation
        });

        return response.data.previewUrl;
    } catch (error) {
        console.error('Error generating frame preview:', error);
        // In case of error, return the original photo
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
        if (!frameUrl) {
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = photoUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // Request the server to generate a framed photo for download
        const response = await axios.post(
            `${BASE_URL}/api/download-framed-photo`,
            {
                photoUrl,
                frameUrl
            },
            {
                responseType: 'blob' // Important: set responseType to blob
            }
        );

        // Create a blob URL for the downloaded file
        const blobUrl = URL.createObjectURL(response.data);

        // Create a temporary link element and trigger the download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Error downloading framed photo:', error);
        throw error;
    }
};

export default {
    getFrameOptions,
    applyFrameToPhoto,
    generateFramePreview,
    downloadFramedPhoto
};